import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { role, province } = req.user;

    let projectFilter = '';
    let params = [];

    // Filter by province for provincial directors
    if (role === 'provincial_director' && province) {
      projectFilter = 'WHERE province = $1';
      params = [province];
    }

    // Total projects
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total FROM projects ${projectFilter}`,
      params
    );

    // Pending approval
    const pendingResult = await pool.query(
      `SELECT COUNT(*) as count FROM projects ${projectFilter} ${projectFilter ? 'AND' : 'WHERE'} status IN ('pending_provincial', 'pending_secretary', 'pending_board')`,
      params
    );

    // Approved
    const approvedResult = await pool.query(
      `SELECT COUNT(*) as count FROM projects ${projectFilter} ${projectFilter ? 'AND' : 'WHERE'} status = 'approved'`,
      params
    );

    // Total budget
    const budgetResult = await pool.query(
      `SELECT COALESCE(SUM(total_budget), 0) as total FROM projects ${projectFilter} ${projectFilter ? 'AND' : 'WHERE'} status = 'approved'`,
      params
    );

    res.json({
      success: true,
      data: {
        total_projects: parseInt(totalResult.rows[0].total),
        pending: parseInt(pendingResult.rows[0].count),
        approved: parseInt(approvedResult.rows[0].count),
        total_budget: parseFloat(budgetResult.rows[0].total)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get recent projects
router.get('/recent-projects', authMiddleware, async (req, res) => {
  try {
    const { role, province } = req.user;

    let query = `
      SELECT p.*, u.full_name as creator_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
    `;
    let params = [];

    if (role === 'provincial_director' && province) {
      query += ' WHERE p.province = $1';
      params = [province];
    }

    query += ' ORDER BY p.created_at DESC LIMIT 10';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Recent projects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
