const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const rc = require('../controllers/reports.controller');

// batch filter list (SA, Admin, Trainer)
router.get('/batches', verifyToken, requireRole([1, 2, 3]), rc.getBatchesForReport);

// certificate + eligibility report
router.get('/certificates', verifyToken, requireRole([1, 2]),  rc.getCertificateReport);
router.get('/trainer/certificates', verifyToken, requireRole([3]), rc.getCertificateReport);

// student work / projects report
router.get('/student-work', verifyToken, requireRole([1, 2]),  rc.getStudentWorkReport);
router.get('/trainer/student-work', verifyToken, requireRole([3]), rc.getStudentWorkReport);

module.exports = router;
