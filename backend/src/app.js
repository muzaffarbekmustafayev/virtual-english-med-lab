const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded audio, docs)
app.use('/uploads', express.static('uploads'));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin',   adminRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route topilmadi' });
});

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server xatosi:', err.stack);
  res.status(500).json({ error: err.message || 'Server xatosi' });
});

module.exports = app;
