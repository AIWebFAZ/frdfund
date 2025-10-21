import express from 'express';
import pool from '../config/database.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

// Get user roles (Admin only)
router.get('/:userId/roles', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT ur.*, u.username, u.full_name
       FROM user_roles ur
       JOIN users u ON ur.user_id = u.id
       WHERE ur.user_id = $1
       ORDER BY ur.role`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add role to user (Admin only)
router.post('/:userId/roles', authMiddleware, roleMiddleware('admin'), auditLog('CREATE', 'user_roles'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, province } = req.body;

    // Validate role
    const validRoles = ['admin', 'staff', 'provincial_director', 'secretary_general', 'board'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if role already exists for this user (with same province)
    const existingRole = await pool.query(
      'SELECT * FROM user_roles WHERE user_id = $1 AND role = $2 AND (province = $3 OR (province IS NULL AND $3 IS NULL))',
      [userId, role, province || null]
    );

    if (existingRole.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Role already exists for this user' });
    }

    const result = await pool.query(
      `INSERT INTO user_roles (user_id, role, province, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [userId, role, province || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add user role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user role (Admin only)
router.put('/:userId/roles/:roleId', authMiddleware, roleMiddleware('admin'), auditLog('UPDATE', 'user_roles'), async (req, res) => {
  try {
    const { userId, roleId } = req.params;
    const { province, is_active } = req.body;

    const result = await pool.query(
      `UPDATE user_roles 
       SET province = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [province || null, is_active !== undefined ? is_active : true, roleId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User role not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user role (Admin only)
router.delete('/:userId/roles/:roleId', authMiddleware, roleMiddleware('admin'), auditLog('DELETE', 'user_roles'), async (req, res) => {
  try {
    const { userId, roleId } = req.params;

    // Check if this is the last role
    const rolesCount = await pool.query(
      'SELECT COUNT(*) FROM user_roles WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (parseInt(rolesCount.rows[0].count) <= 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the last role. User must have at least one role.' 
      });
    }

    const result = await pool.query(
      'DELETE FROM user_roles WHERE id = $1 AND user_id = $2 RETURNING *',
      [roleId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User role not found' });
    }

    res.json({
      success: true,
      message: 'User role deleted successfully'
    });
  } catch (error) {
    console.error('Delete user role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users with their roles (Admin only)
router.get('/all-with-roles', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.is_active,
        u.created_at,
        json_agg(
          json_build_object(
            'role_id', ur.id,
            'role', ur.role,
            'province', ur.province,
            'is_active', ur.is_active
          ) ORDER BY ur.role
        ) FILTER (WHERE ur.id IS NOT NULL) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id, u.username, u.full_name, u.email, u.is_active, u.created_at
      ORDER BY u.id`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all users with roles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
