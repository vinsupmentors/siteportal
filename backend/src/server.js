require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const runMigrations = require('./config/migrate');

const app = express();
app.use(cors({
    origin: function (origin, callback) {
        const allowed = (process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean);
        // Allow if no FRONTEND_URL set (dev), or origin matches, or request has no origin (curl/mobile)
        if (!allowed.length || !origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS: origin not allowed'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const authRoutes = require('./routes/auth.routes');
const superAdminRoutes = require('./routes/superadmin.routes');
const adminRoutes = require('./routes/admin.routes');
const trainerRoutes = require('./routes/trainer.routes');
const studentRoutes = require('./routes/student.routes');
const enterpriseRoutes = require('./routes/enterprise.routes');
const certificateRoutes = require('./routes/certificate.routes');
const jobRoutes = require('./routes/job.routes');
const jobRequestRoutes = require('./routes/job_request.routes');
const userRoutes = require('./routes/user.routes');
const recruiterRoutes = require('./routes/recruiter.routes');
const path = require('path');

// Serve uploaded content files statically
app.use('/uploads/content', express.static(path.join(__dirname, '../uploads/content')));
app.use('/uploads/job_requests', express.static(path.join(__dirname, '../uploads/job_requests')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// ── Serve files from DB by ID ─────────────────────────────────────────────────
const pool = require('./config/db');
app.get('/api/files/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT original_name, mime_type, file_data FROM ContentFiles WHERE id = ?',
            [req.params.id]
        );
        if (!rows.length || !rows[0].file_data) {
            return res.status(404).json({ message: 'File not found' });
        }
        const file = rows[0];
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
        res.send(file.file_data);
    } catch (err) {
        res.status(500).json({ message: 'Error serving file', error: err.message });
    }
});
// Main App API Routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-requests', jobRequestRoutes);
app.use('/api/user', userRoutes);
app.use('/api/recruiter', recruiterRoutes);


// ==========================================
// Systemic Enterprise Cron Routine Jobs 
// ==========================================

// Automated Absenteeism Tracker Email Job (2 & 3 day limits)
cron.schedule('0 18 * * *', async () => {
    console.log('[System Cron]: Initiating Student Absenteeism Checker...');
    try {
        const crudController = require('./controllers/superadmin.crud.controller');
        const results = await crudController.triggerAbsenceEmails();
        console.log(`[System Cron]: Absenteeism check complete. Alerts sent: ${results.count}`);
    } catch (err) {
        console.error('[System Cron]: Absenteeism checker error:', err.message);
    }
});

// Trainer CL (Casual Leave) auto-increment — 1st of every month at midnight
cron.schedule('0 0 1 * *', async () => {
    console.log('[System Cron]: Monthly CL increment for non-probation trainers...');
    try {
        const pool = require('./config/db');
        await pool.query('UPDATE Users SET casual_leave_count = casual_leave_count + 1 WHERE role_id = 3 AND is_probation = 0 AND status = ?', ['active']);
        console.log('[System Cron]: CL incremented successfully');
    } catch (err) { console.error('[System Cron]: CL increment error', err.message); }
});

const PORT = process.env.PORT || 5000;
runMigrations().then(() => {
    app.listen(PORT, () => {
        console.log(`Enterprise LMS server operating safely on port ${PORT}`);
    });
});
