const express = require('express');
const router = express.Router();
const jobRequestController = require('../controllers/job_request.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const multer = require('multer');

// Use memory storage — files stored as BLOB in Aiven MySQL (no ephemeral disk on Render)
const upload = multer({ storage: multer.memoryStorage() });

// Student endpoints
router.get('/eligibility', verifyToken, requireRole([4]), jobRequestController.getEligibility);
router.post('/submit', verifyToken, requireRole([4]), upload.single('google_review_img'), jobRequestController.submitRequest);
router.get('/certificate', verifyToken, requireRole([4]), jobRequestController.downloadInternshipCertificate);

// SuperAdmin endpoints
router.get('/all', verifyToken, requireRole([1]), jobRequestController.getRequests);
router.get('/:id/review-image', verifyToken, requireRole([1]), jobRequestController.getReviewImage);
router.put('/bulk', verifyToken, requireRole([1]), jobRequestController.bulkUpdateRequestStatus);
router.put('/:id/status', verifyToken, requireRole([1]), jobRequestController.updateRequestStatus);

module.exports = router;
