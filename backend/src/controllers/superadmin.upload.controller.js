const pool = require('../config/db');
const fs = require('fs');
// const csv = require('csv-parser'); // Would require installing csv-parser

// Handle the complex day patching uploading via Multer
exports.uploadDayMaterial = async (req, res) => {
    try {
        const { day_id } = req.params;
        const uploadType = req.body.type; // 'material' or 'worksheet'

        if (!req.file) {
            return res.status(400).json({ message: 'No valid file attached or format disallowed.' });
        }

        // Logic routing based on the uploaded explicitly defined binary
        const fileUrl = `/uploads/temp/${req.file.filename}`; // Mocked S3/Local routing

        let updateQuery = '';
        if (uploadType === 'material') {
            updateQuery = 'UPDATE Days SET material_url = ? WHERE id = ?';
        } else if (uploadType === 'worksheet') {
            updateQuery = 'UPDATE Days SET worksheet_url = ? WHERE id = ?';
        } else {
            // Cleanup temp file if type is explicitly malformed
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Invalid upload assignment type.' });
        }

        await pool.query(updateQuery, [fileUrl, day_id]);

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, `UPLOAD_${uploadType.toUpperCase()}`, 'Days', day_id]
        );

        res.status(200).json({
            message: `Successfully mapped ${uploadType} to day boundary.`,
            url: fileUrl
        });

    } catch (error) {
        console.error("Super Admin System Fault - Upload Handler:", error);
        res.status(500).json({ message: 'Server fault processing file upload.', error: error.message });
    }
};
