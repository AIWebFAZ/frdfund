import express from 'express';
import pool from '../config/database.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs (admin only)
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { 
      user_id, 
      action, 
      table_name, 
      start_date, 
      end_date, 
      page = 1, 
      limit = 50 
    } = req.query;

    let query = `
      SELECT 
        al.*,
        u.full_name as user_full_name,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (user_id) {
      params.push(user_id);
      query += ` AND al.user_id = $${++paramCount}`;
    }

    if (action) {
      params.push(action);
      query += ` AND al.action = $${++paramCount}`;
    }

    if (table_name) {
      params.push(table_name);
      query += ` AND al.table_name = $${++paramCount}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND al.created_at >= $${++paramCount}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND al.created_at <= $${++paramCount}`;
    }

    query += ' ORDER BY al.created_at DESC';

    const offset = (page - 1) * limit;
    params.push(limit, offset);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM audit_logs WHERE 1=1';
    const countParams = params.slice(0, -2); // Remove limit and offset
    
    if (user_id) countQuery += ' AND user_id = $1';
    if (action) countQuery += ` AND action = $${user_id ? 2 : 1}`;
    if (table_name) countQuery += ` AND table_name = $${(user_id ? 1 : 0) + (action ? 1 : 0) + 1}`;
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: result.rows,
      total,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get audit logs for specific record
router.get('/record/:table/:id', authMiddleware, async (req, res) => {
  try {
    const { table, id } = req.params;

    const result = await pool.query(
      `SELECT 
        al.*,
        u.full_name as user_full_name,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.table_name = $1 AND al.record_id = $2
      ORDER BY al.created_at DESC`,
      [table, id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get record audit logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user activity summary
router.get('/user/:userId/summary', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const result = await pool.query(
      `SELECT 
        action,
        COUNT(*) as count,
        MAX(created_at) as last_action
      FROM audit_logs
      WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY action
      ORDER BY count DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
