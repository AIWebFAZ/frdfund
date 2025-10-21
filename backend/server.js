import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import userRoleRoutes from './routes/userRoles.js';
import groupRoutes from './routes/groups.js';
import projectRoutes from './routes/projects.js';
import approvalRoutes from './routes/approvals.js';
import dashboardRoutes from './routes/dashboard.js';
import auditLogRoutes from './routes/auditLogs.js';
import documentRoutes from './routes/documents.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true }));

// Set charset for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'FRD Fund API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
