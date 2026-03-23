const express = require('express');
const router = express.Router();
const courseController = require('../controllers/superadmin.course.controller');
const crudController = require('../controllers/superadmin.crud.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const releaseCtrl = require('../controllers/release.controller');
const uploadHandling = require('../middlewares/upload.middleware');

// ==========================================
// PUBLIC ROUTES (No Auth Required)
// ==========================================
router.get('/portfolios/:id/download', crudController.downloadPortfolioHTML);

// Apply Security Firewalls universally to this router branch
// Note: We allow Role 2 (Admin) for GET (read-only) reporting routes selectively below
router.use(verifyToken);

// ==========================================
// DASHBOARD & OVERVIEW (Roles 1 & 2)
// ==========================================
router.get('/dashboard-stats', requireRole([1, 2]), crudController.getDashboardStats);
router.get('/notification-counts', requireRole([1, 2]), crudController.getNotificationCounts);

// ==========================================
// COURSES
// ==========================================
router.get('/courses', requireRole([1, 2, 5]), crudController.getCourses);
router.post('/courses', requireRole([1]), crudController.createCourse);
router.get('/courses/:id/full', crudController.getFullCourseTree);
router.put('/courses/:id', crudController.updateCourse);
router.delete('/courses/:id', crudController.deleteCourse);

// ==========================================
// MODULES
// ==========================================
router.get('/courses/:courseId/modules', crudController.getModules);
router.post('/modules', crudController.createModule);
router.put('/modules/:id', crudController.updateModule);
router.delete('/modules/:id', crudController.deleteModule);

// ==========================================
// DAYS
// ==========================================
router.get('/modules/:moduleId/days', crudController.getDays);
router.post('/days', crudController.createDay);
router.put('/days/:id', crudController.updateDay);
router.delete('/days/:id', crudController.deleteDay);

// ==========================================
// PROJECTS
// ==========================================
router.get('/modules/:moduleId/projects', crudController.getProjects);
router.post('/projects', crudController.createProject);
router.put('/projects/:id', crudController.updateProject);
router.delete('/projects/:id', crudController.deleteProject);

// ==========================================
// CONTENT FILES (Multi-File Upload)
// ==========================================
router.post('/content-files/upload', uploadHandling.array('files', 20), crudController.uploadContentFiles);
router.get('/content-files/:entityType/:entityId', crudController.getContentFiles);
router.delete('/content-files/:id', crudController.deleteContentFile);

// ==========================================
// BATCHES
// ==========================================
router.get('/batches', requireRole([1, 2, 5]), crudController.getBatches);
router.post('/batches', requireRole([1]), crudController.createBatch);
router.put('/batches/:id', crudController.updateBatch);
router.delete('/batches/:id', crudController.deleteBatch);

// ==========================================
// STUDENTS
// ==========================================
router.get('/students', requireRole([1, 2]), crudController.getStudents);
router.post('/students', requireRole([1]), crudController.createStudent);
router.post('/students/bulk', crudController.bulkCreateStudents);
router.post('/students/bulk-assign-batch', crudController.bulkAssignBatch);
router.get('/students/program-overview', requireRole([1, 2]), crudController.getStudentsWithProgramType);
router.get('/students/template', crudController.downloadStudentTemplate);
router.post('/students/:id/transfer-batch', requireRole([1]), crudController.transferStudentBatch);
router.put('/students/:id', crudController.updateStudent);
router.delete('/students/:id', crudController.deleteStudent);
router.put('/students/:studentId/program-type', requireRole([1]), crudController.updateStudentProgramType);
router.post('/students/:studentId/certificates/reset', requireRole([1]), crudController.resetStudentCertificate);

// ==========================================
// TRAINERS
// ==========================================
router.get('/trainers', requireRole([1, 2]), crudController.getTrainers);
router.post('/trainers', requireRole([1]), crudController.createTrainer);
router.put('/trainers/:id', crudController.updateTrainer);
router.delete('/trainers/:id', crudController.deleteTrainer);

// ==========================================
// TRAINER TASKS
// ==========================================
router.get('/trainer-tasks', crudController.getTrainerTasks);
router.post('/trainer-tasks', crudController.createTrainerTask);
router.put('/trainer-tasks/:id', crudController.updateTrainerTask);

// ==========================================
// TRAINER ATTENDANCE
// ==========================================
router.get('/trainer-attendance', requireRole([1, 2]), crudController.getTrainerAttendance);
router.post('/trainer-attendance', requireRole([1]), crudController.markTrainerAttendance);
router.get('/trainer-attendance/monthly-report', requireRole([1, 2]), crudController.getMonthlyAttendanceReport);
router.put('/trainer-attendance/casual-leave/:id', requireRole([1]), crudController.updateCasualLeaveCount);

// ==========================================
// PORTFOLIOS
// ==========================================
router.get('/portfolios', crudController.getPortfolios);
router.put('/portfolios/:id', crudController.updatePortfolio);
router.delete('/portfolios/:id', crudController.deletePortfolio);

// ==========================================
// ANNOUNCEMENTS
// ==========================================
router.get('/announcements', crudController.getAnnouncements);
router.post('/announcements', crudController.broadcastAnnouncement);

// ==========================================
// MEETING LINKS
// ==========================================
router.get('/meeting-links', crudController.getMeetingLinks);
router.put('/meeting-links/:batchId', crudController.updateMeetingLink);

// ==========================================
// REPORTS & ANALYTICS (Advanced)
// ==========================================
router.get('/reports/attendance-analytics', requireRole([1, 2]), crudController.getAttendanceAnalytics);
router.get('/reports/attendance/groups', requireRole([1, 2]), crudController.getAttendanceBatchGroups);
router.get('/reports/attendance/sub-batches', requireRole([1, 2]), crudController.getAttendanceSubBatches);
router.get('/reports/attendance/detailed/:id', requireRole([1, 2]), crudController.getDetailedBatchAttendance);
router.get('/reports/batch-hub', requireRole([1, 2]), crudController.getBatchReportHub);
router.get('/reports/batch-details/:id', requireRole([1, 2]), crudController.getBatchDetailsFlow);
router.get('/reports/student-detailed/:id', requireRole([1, 2]), crudController.getDetailedStudentReport);
router.get('/reports/trainer-detailed/:id', requireRole([1, 2]), crudController.getDetailedTrainerReport);
router.get('/reports/trainer/:id/download-kra', requireRole([1, 2]), crudController.downloadTrainerKRA);
router.get('/reports/trainer/:id/download-full-report', requireRole([1, 2]), crudController.downloadTrainerFullReport);

router.get('/reports/trainers', requireRole([1, 2]), crudController.getTrainerReport);
router.get('/reports/batches', requireRole([1, 2]), crudController.getBatchReport);
router.get('/reports/students', requireRole([1, 2]), crudController.getStudentReport);
router.get('/reports/courses', requireRole([1, 2]), crudController.getCourseReport);

// ==========================================
// OPERATIONS: TRAINERS DAILY KRA
// ==========================================
router.get('/daily-kra', requireRole([1, 2]), crudController.getDailyKRA);

// ==========================================
// STUDENT QUERIES & ESCALATIONS
// ==========================================
router.get('/student-issues', requireRole([1, 2]), crudController.getStudentIssues);
router.put('/student-issues/:id', requireRole([1, 2]), crudController.updateStudentIssue);
router.get('/student-doubts', requireRole([1, 2]), crudController.getStudentDoubts);

// ==========================================
// DYNAMIC FEEDBACK SYSTEM (ADMIN)
// ==========================================
router.post('/feedback-forms', requireRole([1]), crudController.createFeedbackForm);
router.get('/feedback-forms', requireRole([1, 2]), crudController.getFeedbackForms);
router.get('/reports/feedback', requireRole([1, 2]), crudController.getFeedbackReports);

// ==========================================
// TRAINER LEAVE MANAGEMENT (Roles 1 & 2 read, 1 write)
// ==========================================
router.get('/trainer-leaves', requireRole([1, 2]), crudController.getAllTrainerLeaves);
router.patch('/trainer-leaves/:id', requireRole([1]), crudController.updateTrainerLeaveStatus);

// ── Capstone Management ──────────────────────────────────────────────────────
router.get('/courses/:courseId/capstones', releaseCtrl.getCourseCapstones);
router.post('/courses/:courseId/capstones', releaseCtrl.createCapstone);
router.put('/capstones/:id', releaseCtrl.updateCapstone);
router.delete('/capstones/:id', releaseCtrl.deleteCapstone);
router.post('/capstones/:id/files',
    releaseCtrl.uploadCapstoneFiles,
    releaseCtrl.uploadCapstoneFilesHandler
);
router.delete('/capstone-files/:fileId', releaseCtrl.deleteCapstoneFile);

// ── IOP Curriculum Management (SA only, role 1) ───────────────────────────────
const iopCtrl = require('../controllers/iop.controller');
router.get('/iop-modules',                  requireRole([1, 2]), iopCtrl.getIOPModules);
router.post('/iop-modules',                 requireRole([1]), iopCtrl.createIOPModule);
router.put('/iop-modules/:id',              requireRole([1]), iopCtrl.updateIOPModule);
router.delete('/iop-modules/:id',           requireRole([1]), iopCtrl.deleteIOPModule);
router.get('/iop-modules/:moduleId/topics', requireRole([1, 2]), iopCtrl.getIOPTopics);
router.post('/iop-topics',                  requireRole([1]), iopCtrl.createIOPTopic);
router.put('/iop-topics/:id',               requireRole([1]), iopCtrl.updateIOPTopic);
router.delete('/iop-topics/:id',            requireRole([1]), iopCtrl.deleteIOPTopic);

// IOP Module Files (SA upload/delete; BLOB stored in Aiven MySQL)
router.post('/iop-modules/:moduleId/files', requireRole([1]), uploadHandling.single('file'), iopCtrl.uploadIOPModuleFile);
router.delete('/iop-module-files/:fileId',  requireRole([1]), iopCtrl.deleteIOPModuleFile);

// Progress Report Emails (SA sends personalized emails to active students)
router.post('/reports/send-progress-emails', requireRole([1, 2]), crudController.sendProgressEmails);

// ── IOP Groups (SA creates/manages merged batch groups for IOP trainer) ────────
router.get('/iop-trainers', requireRole([1]), crudController.getIOPTrainers);
router.post('/iop-trainers', requireRole([1]), crudController.createIOPTrainer);
router.get('/iop-groups', requireRole([1, 2]), crudController.getIOPGroups);
router.post('/iop-groups', requireRole([1]), crudController.createIOPGroup);
router.put('/iop-groups/:id', requireRole([1]), crudController.updateIOPGroup);
router.delete('/iop-groups/:id', requireRole([1]), crudController.deleteIOPGroup);

module.exports = router;
