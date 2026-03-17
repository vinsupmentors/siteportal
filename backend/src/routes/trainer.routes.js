const express = require('express');
const router = express.Router();
const releaseCtrl = require('../controllers/release.controller');
const trainerController = require('../controllers/trainer.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);
router.use(requireRole([3]));

// Dashboard
router.get('/dashboard', trainerController.getTrainerDashboard);
router.get('/calendar', trainerController.getMyCalendar);

// Batches & Students
router.get('/batches/:id/students', trainerController.getBatchStudents);

// Attendance
router.post('/attendance', trainerController.markStudentAttendance);
router.get('/attendance/:batchId', trainerController.getBatchAttendance);

// Tasks
router.get('/tasks', trainerController.getMyTasks);
router.patch('/tasks/:taskId', trainerController.updateTaskStatus);
router.post('/tasks/:taskId/review', trainerController.submitTaskForReview);

// KRA (Daily Class Coverage & Other Works)
router.post('/kra', trainerController.submitKRA);
router.get('/kra', trainerController.getMyKRA);
router.post('/other-work', trainerController.submitOtherWork);

// Doubts
router.get('/doubts', trainerController.getStudentDoubts);
router.patch('/doubts/:doubtId/resolve', trainerController.resolveDoubt);

// Announcements (Trainer specific)
router.get('/announcements', trainerController.getAnnouncements);
router.post('/announcements', trainerController.broadcastAnnouncement);

// Dynamic Feedback System (Trainer)
router.post('/release-feedback', trainerController.releaseFeedback);

// Content Unlock Management (Batch-Level)
router.get('/batches/:batchId/curriculum', trainerController.getBatchCurriculum);
router.post('/batches/:batchId/unlock', trainerController.unlockModule);
router.delete('/batches/:batchId/unlock/:moduleId', trainerController.lockModule);

// Submissions & Grading
router.get('/batches/:batchId/submissions', trainerController.getBatchSubmissions);
router.post('/submissions/:id/grade', trainerController.gradeSubmission);

// Student Remarks & Performance
router.get('/batches/:batchId/students/:studentId/performance', trainerController.getStudentPerformance);
router.get('/batches/:batchId/students/:studentId/remarks', trainerController.getStudentRemarks);
router.post('/batches/:batchId/students/:studentId/remarks', trainerController.addStudentRemark);
router.put('/students/:studentId/status', trainerController.updateStudentStatus);
router.delete('/remarks/:remarkId', trainerController.deleteStudentRemark);

// Trainer Leaves
router.post('/leaves', trainerController.requestLeave);
router.get('/leaves', trainerController.getMyLeaves);
// ── Release Manager ──────────────────────────────────────────────────────────
router.get('/batches/:batchId/release-status', releaseCtrl.getReleaseStatus);
router.post('/batches/:batchId/release/day', releaseCtrl.releaseDay);
router.post('/batches/:batchId/release/item', releaseCtrl.releaseItem);
router.delete('/batches/:batchId/release/:releaseId', releaseCtrl.unreleaseItem);
router.get('/batches/:batchId/release-submissions', releaseCtrl.getBatchReleaseSubmissions);
router.put('/release-submissions/:submissionId/grade', releaseCtrl.gradeReleaseSubmission);

module.exports = router;
