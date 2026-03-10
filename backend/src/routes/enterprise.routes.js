const express = require('express');
const router = express.Router();
const enterpriseController = require('../controllers/enterprise.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Apply Security Firewalls universally to this router branch
router.use(verifyToken);

// Role 1 is explicitly 'Super Admin' 
router.post('/broadcast', requireRole([1]), enterpriseController.broadcastNotification);

// Roles 1 and 2 ('SuperAdmin' and 'Admin') can schedule interviews
router.post('/interviews/schedule', requireRole([1, 2]), enterpriseController.scheduleInterview);

module.exports = router;
