const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const uploadController = require('../controllers/student.upload.controller');
const releaseCtrl = require('../controllers/release.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const uploadHandling = require('../middlewares/upload.middleware');

// Apply Security Firewalls universally to this router branch
// Role 4 is explicitly 'Student' in schema
router.use(verifyToken);
router.use(requireRole([4]));

// General Endpoints
router.get('/dashboard', studentController.getStudentDashboard);
router.get('/progress', studentController.getStudentProgress);
router.get('/calendar', studentController.getStudentCalendar);
router.get('/curriculum', studentController.getStudentCurriculum);
router.get('/tests', studentController.getStudentTests);
router.post('/doubts', studentController.raiseDoubt);
router.get('/doubts', studentController.getDoubts);
router.post('/issues', studentController.raiseIssue);
router.get('/issues', studentController.getIssues);
router.get('/leaves', studentController.getLeaves);
router.post('/leaves', studentController.applyForLeave);
router.get('/portfolio', studentController.getPortfolio);
router.post('/portfolio', studentController.submitPortfolio);

// Submission Uploads leveraging specific Multer block constraints
router.post('/submit', uploadHandling.single('file'), uploadController.uploadSubmission);

// Dynamic Feedback System (Student)
router.get('/released-feedback', studentController.getReleasedFeedback);
router.post('/submit-feedback', studentController.submitFeedback);

// ── Career Readiness & Certificates ─────────────────────────────────────────
router.get('/internship-eligibility', studentController.checkInternshipEligibility);
router.post('/ready-for-interview', studentController.markReadyForInterview);
router.post('/certificates/generate', studentController.generateCertificate);
router.get('/certificates', studentController.getCertificates);
router.get('/certificates/:id/download', studentController.downloadCertificate);

// ── Student Released Content & Submissions ───────────────────────────────────
router.get('/releases', releaseCtrl.getStudentReleases);
router.post('/releases/:releaseId/submit',
    releaseCtrl.uploadSubmission,
    releaseCtrl.submitReleaseWork
);
router.get('/releases/submission/:submissionId/file', releaseCtrl.getSubmissionFile);

// ── IOP Curriculum (IOP students only) ───────────────────────────────────────
const iopCtrl = require('../controllers/iop.controller');
router.get('/iop-curriculum',                    iopCtrl.getStudentIOPCurriculum);
router.get('/iop-module-files/:fileId/download', iopCtrl.downloadIOPModuleFile);

module.exports = router;
