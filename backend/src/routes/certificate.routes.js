const express = require('express');
const router = express.Router();
const certController = require('../controllers/certificate.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');

// All routes are protected and restricted to Super Admin (Role ID 1)
router.use(verifyToken);
router.use(requireRole([1]));

router.post('/issue', certController.issueCertificate);
router.get('/all', certController.getAllCertificates);
router.get('/student/:student_id', certController.getStudentCertificates);
router.delete('/:id', certController.deleteCertificate);

module.exports = router;
