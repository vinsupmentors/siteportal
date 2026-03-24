const pool = require('../config/db');

// Issuing a new certificate (Course Completion or Internship)
exports.issueCertificate = async (req, res) => {
    try {
        const { student_id, course_id, type, certificate_url } = req.body;

        if (!student_id || !course_id || !type || !certificate_url) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const issued_by = req.user.id; // Super Admin ID from token
        const issued_date = new Date().toISOString().split('T')[0];

        // Insert or update certificate record
        const [result] = await pool.query(
            'INSERT INTO Certificates (student_id, course_id, type, certificate_url, issued_date, issued_by) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, course_id, type, certificate_url, issued_date, issued_by]
        );

        // Map to student phase if it's the final certificate
        if (type === 'course_completion') {
            await pool.query(`UPDATE Users SET student_phase = 'Completed' WHERE id = ?`, [student_id]);
        } else if (type === 'internship') {
            await pool.query(`UPDATE Users SET student_phase = 'Certificate' WHERE id = ?`, [student_id]);
        }

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [issued_by, `ISSUE_CERTIFICATE_${type.toUpperCase()}`, 'Certificates', result.insertId]);

        res.status(201).json({
            message: `${type === 'internship' ? 'Internship' : 'Course Completion'} certificate issued successfully`,
            certificateId: result.insertId
        });

    } catch (error) {
        console.error('Issue Certificate Error:', error);
        res.status(500).json({ message: 'Error issuing certificate', error: error.message });
    }
};

// Getting certificates for a student
exports.getStudentCertificates = async (req, res) => {
    try {
        const { student_id } = req.params;
        const [certificates] = await pool.query(`
            SELECT c.*, cr.name as course_name, 
                   CONCAT(u.first_name, ' ', u.last_name) as issuer_name
            FROM Certificates c
            JOIN Courses cr ON c.course_id = cr.id
            LEFT JOIN Users u ON c.issued_by = u.id
            WHERE c.student_id = ?
            ORDER BY c.issued_date DESC
        `, [student_id]);

        res.json({ certificates });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching certificates', error: error.message });
    }
};

// Global list of issued certificates for Super Admin
exports.getAllCertificates = async (req, res) => {
    try {
        const [certificates] = await pool.query(`
            SELECT c.id, c.student_id, c.cert_type, c.type, c.generated_at, c.issued_date,
                   c.reset_by_admin, c.certificate_url,
                   COALESCE(cr.name, 'N/A') as course_name,
                   CONCAT(s.first_name, ' ', s.last_name) as student_name,
                   s.email as student_email,
                   bs.roll_number,
                   b.batch_name,
                   CONCAT(u.first_name, ' ', u.last_name) as issuer_name,
                   CASE WHEN c.cert_data IS NOT NULL AND LENGTH(c.cert_data) > 0 THEN 1 ELSE 0 END as has_preview
            FROM Certificates c
            LEFT JOIN Courses cr ON c.course_id = cr.id
            JOIN Users s ON c.student_id = s.id
            LEFT JOIN BatchStudents bs ON bs.student_id = s.id
            LEFT JOIN Batches b ON bs.batch_id = b.id
            LEFT JOIN Users u ON c.issued_by = u.id
            ORDER BY COALESCE(c.generated_at, c.issued_date) DESC
        `);
        res.json({ certificates });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all certificates', error: error.message });
    }
};

// Preview a certificate HTML (SA/Admin only)
exports.previewCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            'SELECT cert_data, cert_type FROM Certificates WHERE id = ?', [id]
        );
        if (!rows.length || !rows[0].cert_data) {
            return res.status(404).json({ message: 'Certificate HTML not found — this certificate was issued manually without generated HTML.' });
        }
        const html = rows[0].cert_data.toString('utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        res.status(500).json({ message: 'Error previewing certificate', error: error.message });
    }
};

// Delete a certificate
exports.deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Certificates WHERE id = ?', [id]);
        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting certificate', error: error.message });
    }
};
