const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/iop_trainer.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(requireRole([6]));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Groups
router.get('/groups', ctrl.getMyGroups);
router.get('/groups/:groupId', ctrl.getGroupDetails);

// Curriculum & unlock
router.get('/groups/:groupId/curriculum', ctrl.getGroupCurriculum);
router.post('/groups/:groupId/unlock', ctrl.unlockGroupModule);

// Students
router.get('/groups/:groupId/students', ctrl.getGroupStudents);

// Attendance
router.post('/groups/:groupId/attendance', ctrl.markGroupAttendance);
router.get('/groups/:groupId/attendance', ctrl.getGroupAttendance);

// File download
router.get('/iop-module-files/:fileId/download', ctrl.downloadIOPModuleFile);

module.exports = router;
