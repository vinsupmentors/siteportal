const pool = require('../config/db');

// Calculate Student Eligibility
exports.getEligibility = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Check if already unlocked
        const [user] = await pool.query('SELECT job_portal_unlocked FROM Users WHERE id = ?', [studentId]);
        if (user[0] && user[0].job_portal_unlocked) {
            return res.json({ status: 'unlocked' });
        }

        // 2. Check for active batch
        const [batchRows] = await pool.query(`
            SELECT bs.batch_id, b.course_id
            FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            WHERE bs.student_id = ? AND b.status = "active"
            LIMIT 1
        `, [studentId]);

        if (!batchRows.length) {
            return res.json({ status: 'locked', reason: 'No active batch found.' });
        }
        const { batch_id, course_id } = batchRows[0];

        // 3. Attendance >= 80%
        const [att] = await pool.query(`
            SELECT COUNT(*) as total, SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present
            FROM StudentAttendance WHERE student_id = ? AND batch_id = ?
        `, [studentId, batch_id]);
        const attendancePct = att[0].total > 0 ? (att[0].present / att[0].total) * 100 : 0;

        // 4. Module Projects completion >= 75%
        const [modules] = await pool.query('SELECT id FROM Modules WHERE course_id = ?', [course_id]);
        let projectPct = 0;
        if (modules.length > 0) {
            const [projSub] = await pool.query(`
                SELECT COUNT(DISTINCT module_id) as count FROM Submissions
                WHERE student_id = ? AND submission_type = "module_project" AND marks IS NOT NULL
            `, [studentId]);
            projectPct = (projSub[0].count / modules.length) * 100;
        }

        // 5. Capstone Project (min 1)
        const [capstone] = await pool.query(`
            SELECT COUNT(*) as count FROM Submissions
            WHERE student_id = ? AND submission_type = "capstone" AND marks IS NOT NULL
        `, [studentId]);

        // 6. Portfolio Approved
        const [portfolio] = await pool.query(`
            SELECT status FROM PortfolioRequests WHERE student_id = ? AND status = "approved"
        `, [studentId]);

        // 7. Check for existing request
        const [request] = await pool.query(`
            SELECT status, admin_notes FROM JobPortalRequests WHERE student_id = ? ORDER BY created_at DESC LIMIT 1
        `, [studentId]);

        const criteria = {
            attendance: { value: Math.round(attendancePct), target: 80, met: attendancePct >= 80 },
            projects: { value: Math.round(projectPct), target: 75, met: projectPct >= 75 },
            capstone: { value: capstone[0].count, target: 1, met: capstone[0].count >= 1 },
            portfolio: { met: portfolio.length > 0 && portfolio[0].status === 'approved' }
        };

        const canRequest = criteria.attendance.met && criteria.projects.met && criteria.capstone.met && criteria.portfolio.met;

        res.json({
            status: request.length > 0 ? request[0].status : 'locked',
            criteria,
            canRequest,
            request: request[0] || null
        });

    } catch (error) {
        res.status(500).json({ message: 'Error checking eligibility', error: error.message });
    }
};

// Submit Access Request
exports.submitRequest = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { portfolio_link } = req.body;
        const google_review_img = req.file ? req.file.filename : null;

        if (!google_review_img) {
            return res.status(400).json({ message: 'Google review screenshot is required.' });
        }

        await pool.query(
            'INSERT INTO JobPortalRequests (student_id, google_review_img, portfolio_link) VALUES (?, ?, ?)',
            [studentId, google_review_img, portfolio_link]
        );

        res.status(201).json({ message: 'Request submitted for SuperAdmin approval.' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting request', error: error.message });
    }
};

// Get all requests (SuperAdmin only)
exports.getRequests = async (req, res) => {
    try {
        const [requests] = await pool.query(`
            SELECT r.*, u.first_name, u.last_name, u.email, c.name as course_name
            FROM JobPortalRequests r
            JOIN Users u ON r.student_id = u.id
            JOIN BatchStudents bs ON u.id = bs.student_id
            JOIN Batches b ON bs.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE b.status = 'active'
            ORDER BY r.created_at DESC
        `);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};

// Approve/Reject Request (SuperAdmin only)
exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;

        const [request] = await pool.query('SELECT student_id FROM JobPortalRequests WHERE id = ?', [id]);
        if (!request[0]) return res.status(404).json({ message: 'Request not found' });

        await pool.query('UPDATE JobPortalRequests SET status = ?, admin_notes = ? WHERE id = ?', [status, admin_notes, id]);

        if (status === 'Approved') {
            await pool.query('UPDATE Users SET job_portal_unlocked = TRUE WHERE id = ?', [request[0].student_id]);
        } else {
            await pool.query('UPDATE Users SET job_portal_unlocked = FALSE WHERE id = ?', [request[0].student_id]);
        }

        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating request', error: error.message });
    }
};
