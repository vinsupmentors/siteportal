const express = require('express');
const router  = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const rc = require('../controllers/reports.controller');

// batch filter list (SA, Admin, Trainer)
router.get('/batches', requireAuth, requireRole([1, 2, 3]), rc.getBatchesForReport);

// certificate + eligibility report
router.get('/certificates', requireAuth, requireRole([1, 2]),  rc.getCertificateReport);
router.get('/trainer/certificates', requireAuth, requireRole([3]), rc.getCertificateReport);

// student work / projects report
router.get('/student-work', requireAuth, requireRole([1, 2]),  rc.getStudentWorkReport);
router.get('/trainer/student-work', requireAuth, requireRole([3]), rc.getStudentWorkReport);

module.exports = router;
