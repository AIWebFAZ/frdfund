import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all farmer groups (ใช้ข้อมูลจริงจาก database)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, province } = req.query;
    
    let query = `
      SELECT 
        id,
        group_code as code,
        group_name as name,
        group_type as type,
        province,
        district,
        subdistrict,
        member_count as total_members,
        registration_date
      FROM farmer_groups
      WHERE is_active = true
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (search) {
      query += ` AND (group_name ILIKE $${paramCount} OR group_code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (province) {
      query += ` AND province = $${paramCount}`;
      params.push(province);
      paramCount++;
    }
    
    query += ' ORDER BY group_name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get group by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        id,
        group_code as code,
        group_name as name,
        group_type as type,
        registration_number,
        registration_date,
        province,
        district,
        subdistrict,
        address,
        phone,
        email,
        contact_person,
        member_count as total_members
      FROM farmer_groups
      WHERE id = $1 AND is_active = true`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get group members
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        id,
        citizen_id as id_card,
        CONCAT(title, first_name, ' ', last_name) as name,
        phone,
        province,
        district,
        farm_size,
        farm_type
      FROM farmer_members
      WHERE group_id = $1 AND is_active = true
      ORDER BY first_name, last_name`,
      [id]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
