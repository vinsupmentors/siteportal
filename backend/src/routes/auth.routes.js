const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Handing login entry
router.post('/login', authController.login);

// Self-service password change (requires auth)
router.post('/change-password', verifyToken, authController.changePassword);

// Global Announcement Popups
router.get('/announcements/unacknowledged', verifyToken, authController.getUnacknowledged);
router.post('/announcements/:id/acknowledge', verifyToken, authController.acknowledgeAnnouncement);

module.exports = router;
