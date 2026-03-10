const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Apply Security Firewalls universally to this router branch
// Role 2 is explicitly 'Admin' in schema (Read-Only)
router.use(verifyToken);
router.use(requireRole([2]));

// Reporting Routes
router.get('/overview', adminController.getSystemOverview);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/trainer-performance', adminController.getTrainerPerformance);

module.exports = router;
