import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

// Get all users
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, email, role, province, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new user
router.post('/', authMiddleware, roleMiddleware('admin'), auditLog('CREATE', 'users'), async (req, res) => {
  try {
    const { username, password, full_name, email, role, province } = req.body;

    // Check if username exists
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role, province, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, username, full_name, email, role, province, is_active, created_at`,
      [username, password_hash, full_name, email, role, province]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, username, full_name, email, role, province, is_active, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  // Capture old data before update
  try {
    const { id } = req.params;
    const oldDataResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (oldDataResult.rows.length > 0) {
      req.oldData = oldDataResult.rows[0];
    }
  } catch (error) {
    console.error('Capture old data error:', error);
  }
  next();
}, auditLog('UPDATE', 'users'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, province, is_active, phone } = req.body;

    // Get current user to preserve role if not provided
    const currentUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (currentUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updateRole = role || currentUser.rows[0].role;
    const updateProvince = province !== undefined ? province : currentUser.rows[0].province;
    const updatePhone = phone !== undefined ? phone : currentUser.rows[0].phone;
    const updateEmail = email !== undefined ? email : currentUser.rows[0].email;
    const updateFullName = full_name !== undefined ? full_name : currentUser.rows[0].full_name;
    const updateIsActive = is_active !== undefined ? is_active : currentUser.rows[0].is_active;

    const result = await pool.query(
      'UPDATE users SET full_name = $1, email = $2, role = $3, province = $4, is_active = $5, phone = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING id, username, full_name, email, role, province, is_active, phone',
      [updateFullName, updateEmail, updateRole, updateProvince, updateIsActive, updatePhone, id]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', authMiddleware, roleMiddleware('admin'), auditLog('DELETE', 'users'), async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
