const express = require('express');
const router = express.Router();
const recruiterController = require('../controllers/recruiter.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);
// Allow SuperAdmin (1), Admin (2), and Recruiter (5) to access all recruiter endpoints
router.use(requireRole([1, 2, 5]));

router.get('/dashboard', recruiterController.getRecruiterDashboard);
router.get('/iop-students', recruiterController.getIopStudents);
router.get('/students/:studentId/full-report', recruiterController.getStudentIopReport);
router.get('/students/:studentId/interviews', recruiterController.getStudentInterviews);
router.post('/interviews', recruiterController.scheduleInterview);
router.put('/interviews/:id', recruiterController.updateInterviewStatus);

module.exports = router;
