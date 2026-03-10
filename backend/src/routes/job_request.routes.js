const express = require('express');
const router = express.Router();
const jobRequestController = require('../controllers/job_request.controller');
const { verifyToken, requireRole } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');

// Multer config for Google Review screenshots
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/job_requests/');
    },
    filename: (req, file, cb) => {
        cb(null, `job_request_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Student endpoints
router.get('/eligibility', verifyToken, requireRole([4]), jobRequestController.getEligibility);
router.post('/submit', verifyToken, requireRole([4]), upload.single('google_review_img'), jobRequestController.submitRequest);

// SuperAdmin endpoints
router.get('/all', verifyToken, requireRole([1]), jobRequestController.getRequests);
router.put('/:id/status', verifyToken, requireRole([1]), jobRequestController.updateRequestStatus);

module.exports = router;
