import express from 'express';
import pool from '../config/database.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import auditLog, { logAudit } from '../middleware/auditLog.js';

const router = express.Router();

// Get pending approvals for current user (รองรับ multiple roles)
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const { roles, role, provinces, province } = req.user;
    
    // ใช้ roles array ถ้ามี, ไม่งั้นใช้ role เดียว (backward compatibility)
    const userRoles = roles || (role ? [role] : []);
    const userProvinces = provinces || (province ? [province] : []);

    let query = `
      SELECT p.*, pa.*, u.full_name as creator_name
      FROM projects p
      INNER JOIN project_approvals pa ON p.id = pa.project_id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE pa.status = 'pending'
    `;
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // ถ้ามี role provincial_director
    if (userRoles.includes('provincial_director') && userProvinces.length > 0) {
      conditions.push(`(pa.approval_level = 'provincial' AND p.province = ANY($${paramIndex}))`);
      params.push(userProvinces);
      paramIndex++;
    }

    // ถ้ามี role secretary_general
    if (userRoles.includes('secretary_general')) {
      conditions.push(`pa.approval_level = 'secretary'`);
    }

    // ถ้ามี role board
    if (userRoles.includes('board')) {
      conditions.push(`pa.approval_level = 'board'`);
    }

    // ถ้าไม่มี role ที่สามารถอนุมัติได้
    if (conditions.length === 0) {
      return res.json({ success: true, data: [] });
    }

    query += ` AND (${conditions.join(' OR ')})`;
    query += ' ORDER BY p.submitted_at ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Approve/Reject project
router.post('/:projectId', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { projectId } = req.params;
    const { action, comments } = req.body; // action: 'approve' or 'reject'
    const { role, id: userId, username } = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Get current project and approval
    const projectResult = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    
    if (projectResult.rows.length === 0) {
      throw new Error('Project not found');
    }

    const project = projectResult.rows[0];
    let approvalLevel = '';
    let nextStatus = '';

    if (role === 'provincial_director') {
      approvalLevel = 'provincial';
      if (action === 'approve') {
        nextStatus = 'pending_secretary';
      } else {
        nextStatus = 'rejected';
      }
    } else if (role === 'secretary_general') {
      approvalLevel = 'secretary';
      if (action === 'approve') {
        // Check budget
        if (parseFloat(project.total_budget) > 500000) {
          nextStatus = 'pending_board';
        } else {
          nextStatus = 'approved';
        }
      } else {
        nextStatus = 'rejected';
      }
    } else if (role === 'board') {
      approvalLevel = 'board';
      nextStatus = action === 'approve' ? 'approved' : 'rejected';
    } else {
      throw new Error('Unauthorized');
    }

    // Update approval record
    await client.query(
      `UPDATE project_approvals 
       SET status = $1, approver_id = $2, comments = $3, approved_at = CURRENT_TIMESTAMP 
       WHERE project_id = $4 AND approval_level = $5`,
      [action === 'approve' ? 'approved' : 'rejected', userId, comments, projectId, approvalLevel]
    );

    // Update project status
    const updateFields = ['status = $1'];
    const updateValues = [nextStatus, projectId];
    
    if (nextStatus === 'approved') {
      updateFields.push('approved_at = CURRENT_TIMESTAMP');
    }

    await client.query(
      `UPDATE projects SET ${updateFields.join(', ')} WHERE id = $2`,
      updateValues
    );

    // Create next approval record if needed
    if (nextStatus === 'pending_secretary') {
      await client.query(
        'INSERT INTO project_approvals (project_id, approval_level, status) VALUES ($1, $2, $3)',
        [projectId, 'secretary', 'pending']
      );
    } else if (nextStatus === 'pending_board') {
      await client.query(
        'INSERT INTO project_approvals (project_id, approval_level, status) VALUES ($1, $2, $3)',
        [projectId, 'board', 'pending']
      );
    }

    await client.query('COMMIT');

    // Log approval action
    await logAudit(
      userId, 
      username, 
      action === 'approve' ? 'APPROVE' : 'REJECT', 
      'projects', 
      projectId, 
      { old_status: project.status }, 
      { new_status: nextStatus, comments }, 
      ipAddress, 
      userAgent
    );

    res.json({
      success: true,
      message: `Project ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      nextStatus
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approval action error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  } finally {
    client.release();
  }
});

// Get approval history for a project
router.get('/history/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(
      `SELECT pa.*, u.full_name as approver_name, u.role as approver_role
       FROM project_approvals pa
       LEFT JOIN users u ON pa.approver_id = u.id
       WHERE pa.project_id = $1
       ORDER BY pa.created_at ASC`,
      [projectId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get approval history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
