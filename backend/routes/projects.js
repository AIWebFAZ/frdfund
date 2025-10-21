import express from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import auditLog, { logAudit } from '../middleware/auditLog.js';

const router = express.Router();

// Get all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, province } = req.user;
    const { status, page = 1, limit = 10 } = req.query;

    let query = 'SELECT p.*, u.full_name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id';
    let conditions = [];
    let params = [];
    let paramCount = 0;

    if (role === 'provincial_director' && province) {
      conditions.push(`p.province = $${++paramCount}`);
      params.push(province);
    }

    if (status) {
      conditions.push(`p.status = $${++paramCount}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';
    
    const offset = (page - 1) * limit;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get project members
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM project_members WHERE project_id = $1',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get project budget
router.get('/:id/budget', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM project_budget_items WHERE project_id = $1 ORDER BY item_no',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get project plans
router.get('/:id/plans', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM project_plans WHERE project_id = $1 ORDER BY plan_number',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get project by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await pool.query(
      'SELECT p.*, u.full_name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Get members
    const membersResult = await pool.query(
      'SELECT * FROM project_members WHERE project_id = $1',
      [id]
    );

    // Get budget items
    const budgetResult = await pool.query(
      'SELECT * FROM project_budget_items WHERE project_id = $1 ORDER BY item_no',
      [id]
    );

    // Get plans
    const plansResult = await pool.query(
      'SELECT * FROM project_plans WHERE project_id = $1 ORDER BY plan_number',
      [id]
    );

    // Get documents
    const docsResult = await pool.query(
      'SELECT * FROM project_documents WHERE project_id = $1',
      [id]
    );

    // Get approvals
    const approvalsResult = await pool.query(
      'SELECT a.*, u.full_name as approver_name FROM project_approvals a LEFT JOIN users u ON a.approver_id = u.id WHERE a.project_id = $1 ORDER BY a.created_at',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...project,
        members: membersResult.rows,
        budget_items: budgetResult.rows,
        plans: plansResult.rows,
        documents: docsResult.rows,
        approvals: approvalsResult.rows
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create project (draft)
router.post('/', authMiddleware, auditLog('CREATE', 'projects'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      project_name,
      project_description,
      organization_id,
      organization_name,
      organization_type,
      province,
      total_budget,
      objectives,
      expected_results,
      start_date,
      end_date,
      duration_months,
      members,
      budget_items,
      plans
    } = req.body;

    // ถ้าบันทึกร่างแล้วยังไม่มีชื่อโครงการ ใส่ชื่อชั่วคราว
    const finalProjectName = project_name || `โครงการร่าง - ${organization_name || 'ไม่ระบุ'}`;
    const finalTotalBudget = total_budget || 0;

    // Insert project
    const projectResult = await client.query(
      `INSERT INTO projects (
        project_name, project_description, organization_id, organization_name,
        organization_type, province, total_budget, objectives, expected_results,
        start_date, end_date, duration_months, created_by, status, current_step
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', 1)
      RETURNING *`,
      [
        finalProjectName, project_description, organization_id, organization_name,
        organization_type, province, finalTotalBudget, objectives, expected_results,
        start_date, end_date, duration_months, req.user.id
      ]
    );

    const project = projectResult.rows[0];

    // Insert members if provided
    if (members && members.length > 0) {
      for (const member of members) {
        await client.query(
          'INSERT INTO project_members (project_id, member_id, member_name, id_card, position) VALUES ($1, $2, $3, $4, $5)',
          [project.id, member.member_id, member.member_name, member.id_card, member.position]
        );
      }
    }

    // Insert budget items if provided
    if (budget_items && budget_items.length > 0) {
      for (const item of budget_items) {
        await client.query(
          'INSERT INTO project_budget_items (project_id, item_no, item_name, quantity, unit_price, total_price, note) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [project.id, item.item_no, item.item_name, item.quantity, item.unit_price, item.total_price, item.note]
        );
      }
    }

    // Insert plans if provided
    if (plans && plans.length > 0) {
      for (const plan of plans) {
        await client.query(
          'INSERT INTO project_plans (project_id, plan_number, plan_name, objectives, activities, budget, expected_results) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [project.id, plan.plan_number, plan.plan_name, plan.objectives, plan.activities, plan.budget, plan.expected_results]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// Update project
router.put('/:id', authMiddleware, auditLog('UPDATE', 'projects'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 0;

    const allowedFields = [
      'project_name', 'project_description', 'total_budget', 'objectives',
      'expected_results', 'start_date', 'end_date', 'duration_months', 'current_step'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${++paramCount}`);
        values.push(updateData[field]);
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE projects SET ${fields.join(', ')} WHERE id = $${++paramCount} RETURNING *`;
    const result = await client.query(query, values);

    // Update members if provided
    if (updateData.members) {
      await client.query('DELETE FROM project_members WHERE project_id = $1', [id]);
      for (const member of updateData.members) {
        await client.query(
          'INSERT INTO project_members (project_id, member_id, member_name, id_card, position) VALUES ($1, $2, $3, $4, $5)',
          [id, member.member_id, member.member_name, member.id_card, member.position]
        );
      }
    }

    // Update budget items if provided
    if (updateData.budget_items) {
      await client.query('DELETE FROM project_budget_items WHERE project_id = $1', [id]);
      for (const item of updateData.budget_items) {
        await client.query(
          'INSERT INTO project_budget_items (project_id, item_no, item_name, quantity, unit_price, total_price, note) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [id, item.item_no, item.item_name, item.quantity, item.unit_price, item.total_price, item.note]
        );
      }
    }

    // Update plans if provided
    if (updateData.plans) {
      await client.query('DELETE FROM project_plans WHERE project_id = $1', [id]);
      for (const plan of updateData.plans) {
        await client.query(
          'INSERT INTO project_plans (project_id, plan_number, plan_name, objectives, activities, budget, expected_results) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [id, plan.plan_number, plan.plan_name, plan.objectives, plan.activities, plan.budget, plan.expected_results]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// Submit project for approval
router.post('/:id/submit', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Update project status
    await client.query(
      'UPDATE projects SET status = $1, submitted_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['pending_provincial', id]
    );

    // Create approval record for provincial director
    await client.query(
      'INSERT INTO project_approvals (project_id, approval_level, status) VALUES ($1, $2, $3)',
      [id, 'provincial', 'pending']
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Project submitted for approval'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM projects WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
