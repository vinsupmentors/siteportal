const pool = require('../config/db');
const fs = require('fs');

// Handle student's complex binary uploads mapping to `Days` or `Modules`
exports.uploadSubmission = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { submission_type, day_id, module_id } = req.body;
        // type: 'worksheet', 'module_test', 'module_project', 'capstone'

        if (!req.file) {
            return res.status(400).json({ message: 'No valid binary attached or format disallowed.' });
        }

        const fileUrl = `/uploads/temp/${req.file.filename}`;

        // Structure JSON mapping for the DB field
        const filePaths = JSON.stringify([fileUrl]);

        const [result] = await pool.query(
            'INSERT INTO Submissions (student_id, day_id, module_id, file_paths, submission_type) VALUES (?, ?, ?, ?, ?)',
            [studentId, day_id || null, module_id || null, filePaths, submission_type]
        );

        // Log to Master Audit Schema
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [studentId, `SUBMIT_${submission_type.toUpperCase()}`, 'Submissions', result.insertId]
        );

        res.status(201).json({
            message: `Successfully uploaded ${submission_type}. Wait for Trainer review.`,
            url: fileUrl
        });

    } catch (error) {
        console.error("Student File Upload Integrity Fault:", error);
        res.status(500).json({ message: 'Server fault processing specific submission upload.', error: error.message });
    }
};
