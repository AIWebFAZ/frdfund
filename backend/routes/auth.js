import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { logAudit } from '../middleware/auditLog.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, authType = 'password' } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // For now, only password auth (ThaiID and LDAP can be added later)
    if (authType !== 'password') {
      return res.status(400).json({ success: false, message: 'Auth type not implemented yet' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // ใช้ role จากตาราง users โดยตรง
    const primaryRole = user.role;
    const primaryProvince = user.province;
    const roles = [user.role]; // array ที่มี role เดียว

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: primaryRole, // primary role สำหรับ backward compatibility
        roles: roles, // array ของ roles ทั้งหมด
        province: primaryProvince,
        provinces: provinces
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Log successful login
    await logAudit(user.id, user.username, 'LOGIN', 'users', user.id, null, { authType, roles: roles.join(',') }, ipAddress, userAgent);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: primaryRole,
        roles: roles,
        province: primaryProvince,
        provinces: provinces
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register (for testing)
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, email, role, province } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, full_name, email, role, province) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, full_name, role',
      [username, hashedPassword, full_name, email, role || 'staff', province]
    );

    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Request OTP for password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, phone } = req.body;

    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, phone, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, otp, phone, expiresAt]
    );

    // TODO: Send SMS with OTP (mock for now)
    console.log(`[SMS] Send OTP ${otp} to ${phone}`);

    res.json({
      success: true,
      message: 'OTP sent to your phone',
      // For development only - remove in production
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { username, otp, newPassword } = req.body;

    if (!username || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify OTP
    const tokenResult = await pool.query(
      `SELECT * FROM password_reset_tokens 
       WHERE user_id = $1 AND token = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, otp]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user.id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [tokenResult.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Change password (for logged-in users)
router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
