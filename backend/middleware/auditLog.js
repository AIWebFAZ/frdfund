import pool from '../config/database.js';

/**
 * Middleware to log all actions to audit trail
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT, etc.)
 * @param {string} tableName - Table name being modified
 */
export const auditLog = (action, tableName = null) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override res.json to capture response
    res.json = function(data) {
      // Only log if request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Extract user info from request
        const userId = req.user?.id || null;
        const username = req.user?.username || 'anonymous';
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        
        // Extract record ID from various sources
        let recordId = null;
        if (req.params.id) recordId = req.params.id;
        else if (req.params.projectId) recordId = req.params.projectId;
        else if (data?.id) recordId = data.id;
        else if (data?.project?.id) recordId = data.project.id;
        
        // Determine old and new values
        let oldValues = null;
        let newValues = null;
        
        if (action === 'CREATE') {
          newValues = sanitizeData(req.body);
        } else if (action === 'UPDATE') {
          oldValues = req.oldData ? sanitizeData(req.oldData) : null;
          newValues = sanitizeData(req.body);
        } else if (action === 'DELETE') {
          oldValues = req.oldData ? sanitizeData(req.oldData) : null;
        } else if (action.includes('APPROVE') || action.includes('REJECT')) {
          newValues = { status: action, comment: req.body?.comment };
        }
        
        // Insert audit log
        pool.query(
          `INSERT INTO audit_logs (user_id, username, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [userId, username, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent]
        ).catch(err => {
          console.error('Audit log error:', err);
          // Don't fail the request if audit logging fails
        });
      }
      
      // Call original json method
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Middleware to capture old data before UPDATE/DELETE
 */
export const captureOldData = (tableName, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const id = req.params[idParam];
      if (!id) {
        return next();
      }

      const result = await pool.query(
        `SELECT * FROM ${tableName} WHERE id = $1`,
        [id]
      );

      if (result.rows.length > 0) {
        req.oldData = result.rows[0];
      }
    } catch (error) {
      console.error('Capture old data error:', error);
      // Continue anyway
    }
    next();
  };
};

/**
 * Sanitize data by removing sensitive fields
 */
function sanitizeData(data) {
  if (!data) return null;
  
  const sanitized = { ...data };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.password_hash;
  delete sanitized.token;
  
  return sanitized;
}

/**
 * Helper to manually log audit trail
 */
export async function logAudit(userId, username, action, tableName, recordId, oldValues = null, newValues = null, ipAddress = null, userAgent = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, username, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, username, action, tableName, recordId, oldValues, newValues, ipAddress, userAgent]
    );
  } catch (err) {
    console.error('Manual audit log error:', err);
  }
}

export default auditLog;
