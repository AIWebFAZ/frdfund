import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import auditLog from '../middleware/auditLog.js';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// สร้างโฟลเดอร์สำหรับเก็บไฟล์
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only documents and images are allowed'));
    }
  }
});

// Upload document to project
router.post('/:projectId/upload', authMiddleware, upload.single('file'), auditLog('CREATE', 'project_documents'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { document_type, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await pool.query(
      `INSERT INTO project_documents (project_id, document_type, file_name, file_path, file_size, uploaded_by, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        projectId,
        document_type || 'other',
        req.file.originalname,
        req.file.filename,
        req.file.size,
        req.user.id,
        description || ''
      ]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get documents for a project
router.get('/:projectId/documents', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(
      `SELECT 
        pd.*,
        u.full_name as uploader_name
       FROM project_documents pd
       LEFT JOIN users u ON pd.uploaded_by = u.id
       WHERE pd.project_id = $1
       ORDER BY pd.uploaded_at DESC`,
      [projectId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Download/View document
router.get('/download/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Get file info from database
    const result = await pool.query(
      'SELECT * FROM project_documents WHERE file_path = $1',
      [filename]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found in database' });
    }

    const doc = result.rows[0];
    res.download(filePath, doc.file_name);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// View document (for PDF preview)
router.get('/view/:filename', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const result = await pool.query(
      'SELECT * FROM project_documents WHERE file_path = $1',
      [filename]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('View document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete document
router.delete('/:documentId', authMiddleware, auditLog('DELETE', 'project_documents'), async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document info
    const doc = await pool.query(
      'SELECT * FROM project_documents WHERE id = $1',
      [documentId]
    );

    if (doc.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(uploadDir, doc.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query('DELETE FROM project_documents WHERE id = $1', [documentId]);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
