const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// Recruiter / Admin / SA Jobs
router.get('/', verifyToken, requireRole([1, 2, 5]), jobController.getJobs);
router.get('/analytics', verifyToken, requireRole([1, 2, 5]), jobController.getJobAnalytics);
router.post('/', verifyToken, requireRole([1, 5]), jobController.createJob);
router.put('/:id', verifyToken, requireRole([1, 5]), jobController.updateJob);
router.get('/:id/applicants', verifyToken, requireRole([1, 2, 5]), jobController.getJobApplicants);

// Student Specific Jobs
router.get('/student', verifyToken, requireRole([4]), jobController.getStudentJobs);
router.post('/apply', verifyToken, requireRole([4]), jobController.applyToJob);

module.exports = router;
