const pool           = require('../config/db');
const { uploadToS3 } = require('../utils/s3');

// Handle student's binary submissions — saves to S3, stores URL in DB
exports.uploadSubmission = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { submission_type, day_id, module_id } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No valid binary attached or format disallowed.' });
        }

        // Upload to S3 → get persistent public URL
        const fileUrl = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'submissions'
        );

        const filePaths = JSON.stringify([fileUrl]);

        const [result] = await pool.query(
            'INSERT INTO Submissions (student_id, day_id, module_id, file_paths, submission_type) VALUES (?, ?, ?, ?, ?)',
            [studentId, day_id || null, module_id || null, filePaths, submission_type]
        );

        await pool.query(
            'INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [studentId, `SUBMIT_${submission_type.toUpperCase()}`, 'Submissions', result.insertId]
        );

        res.status(201).json({
            message: `Successfully uploaded ${submission_type}. Wait for Trainer review.`,
            url: fileUrl,
        });

    } catch (error) {
        console.error('[Upload] Student submission error:', error.message);
        res.status(500).json({ message: 'Server fault processing submission upload.', error: error.message });
    }
};
