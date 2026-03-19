const express = require('express');
const router = express.Router();
const recruiterController = require('../controllers/recruiter.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(requireRole([5]));

router.get('/dashboard', recruiterController.getRecruiterDashboard);
router.get('/iop-students', recruiterController.getIopStudents);
router.post('/interviews', recruiterController.scheduleInterview);
router.put('/interviews/:id', recruiterController.updateInterviewStatus);
router.get('/students/:studentId/interviews', recruiterController.getStudentInterviews);

module.exports = router;
