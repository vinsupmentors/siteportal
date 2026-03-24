const express = require('express');
const router = express.Router();
const certController = require('../controllers/certificate.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// All routes are protected and restricted to Super Admin + Admin (Role ID 1, 2)
router.use(verifyToken);
router.use(requireRole([1, 2]));

router.post('/issue', requireRole([1]), certController.issueCertificate);
router.get('/all', certController.getAllCertificates);
router.get('/:id/preview', certController.previewCertificate);
router.get('/student/:student_id', certController.getStudentCertificates);
router.delete('/:id', requireRole([1]), certController.deleteCertificate);

module.exports = router;
