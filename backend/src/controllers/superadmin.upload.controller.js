const pool        = require('../config/db');
const { uploadToS3 } = require('../utils/s3');

// Handle day material / worksheet uploads — saves file to S3, stores URL in DB
exports.uploadDayMaterial = async (req, res) => {
    try {
        const { day_id }    = req.params;
        const uploadType    = req.body.type; // 'material' or 'worksheet'

        if (!req.file) {
            return res.status(400).json({ message: 'No valid file attached or format disallowed.' });
        }

        if (!['material', 'worksheet'].includes(uploadType)) {
            return res.status(400).json({ message: 'Invalid upload assignment type.' });
        }

        // Upload buffer → S3, get back a persistent public URL
        const fileUrl = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'day-materials'
        );

        const updateQuery = uploadType === 'material'
            ? 'UPDATE Days SET material_url = ? WHERE id = ?'
            : 'UPDATE Days SET worksheet_url = ? WHERE id = ?';

        await pool.query(updateQuery, [fileUrl, day_id]);

        await pool.query(
            'INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, `UPLOAD_${uploadType.toUpperCase()}`, 'Days', day_id]
        );

        res.status(200).json({ message: `Successfully uploaded ${uploadType}.`, url: fileUrl });

    } catch (error) {
        console.error('[Upload] Day material upload error:', error.message);
        res.status(500).json({ message: 'Server fault processing file upload.', error: error.message });
    }
};
