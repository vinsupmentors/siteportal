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
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);

        if (!batchRows.length) {
            return res.json({ status: 'locked', reason: 'No active batch found.' });
        }
        const { batch_id, course_id } = batchRows[0];

        // 3. Attendance >= 80%
        const [att] = await pool.query(`
            SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
            FROM StudentAttendance WHERE student_id = ? AND batch_id = ?
        `, [studentId, batch_id]);
        const attendancePct = att[0].total > 0 ? (att[0].present / att[0].total) * 100 : 0;

        // 4. Module Projects completion >= 75%
        const [modules] = await pool.query('SELECT id FROM Modules WHERE course_id = ?', [course_id]);
        let projectPct = 0;
        if (modules.length > 0) {
            const [projSub] = await pool.query(`
                SELECT COUNT(DISTINCT module_id) as count FROM Submissions
                WHERE student_id = ? AND submission_type = 'module_project' AND marks IS NOT NULL
            `, [studentId]);
            projectPct = (projSub[0].count / modules.length) * 100;
        }

        // 5. Capstone Project (min 1)
        const [capstone] = await pool.query(`
            SELECT COUNT(*) as count FROM Submissions
            WHERE student_id = ? AND submission_type = 'capstone' AND marks IS NOT NULL
        `, [studentId]);

        // 6. Portfolio Approved
        const [portfolio] = await pool.query(`
            SELECT status FROM PortfolioRequests WHERE student_id = ? AND status = 'approved'
        `, [studentId]);

        // 7. Tests Attendance — table may not exist, default to 100%
        let testPct = 100;
        try {
            const [tests] = await pool.query(`SELECT COUNT(*) as total_tests FROM Tests WHERE batch_id = ?`, [batch_id]);
            if (tests[0].total_tests > 0) {
                const [testSub] = await pool.query(`SELECT COUNT(DISTINCT test_id) as attended_tests FROM TestSubmissions WHERE student_id = ?`, [studentId]);
                testPct = (testSub[0].attended_tests / tests[0].total_tests) * 100;
            }
        } catch (e) { testPct = 100; }

        // 8. Feedback Form — table may not exist, default to 100%
        let feedbackPct = 100;
        try {
            const [completedModules] = await pool.query(`
                SELECT DISTINCT module_id FROM Submissions
                WHERE student_id = ? AND submission_type = 'module_project' AND marks IS NOT NULL
            `, [studentId]);
            if (completedModules.length > 0) {
                const moduleIds = completedModules.map(m => m.module_id);
                const [feedbacks] = await pool.query(`
                    SELECT COUNT(DISTINCT module_id) as count FROM ModuleFeedbacks WHERE student_id = ? AND module_id IN (?)
                `, [studentId, moduleIds]);
                feedbackPct = (feedbacks[0].count / completedModules.length) * 100;
            }
        } catch (e) { feedbackPct = 100; }

        // 9. Check for existing request
        const [request] = await pool.query(`
            SELECT status, admin_notes, bypass_reason FROM JobPortalRequests WHERE student_id = ? ORDER BY created_at DESC LIMIT 1
        `, [studentId]);

        const criteria = {
            attendance: { value: Math.round(attendancePct), target: 80, met: attendancePct >= 80 },
            projects: { value: Math.round(projectPct), target: 75, met: projectPct >= 75 },
            capstone: { value: capstone[0].count, target: 1, met: capstone[0].count >= 1 },
            tests: { value: Math.round(testPct), target: 100, met: testPct >= 100 },
            feedback: { value: Math.round(feedbackPct), target: 100, met: feedbackPct >= 100 },
            portfolio: { met: portfolio.length > 0 && portfolio[0].status === 'approved' }
        };

        const canRequest = criteria.attendance.met && criteria.projects.met && criteria.capstone.met && 
                           criteria.tests.met && criteria.feedback.met && criteria.portfolio.met;

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

// Submit Access Request (Standard or Bypass)
exports.submitRequest = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { portfolio_link, bypass_reason } = req.body;
        const google_review_img = req.file ? req.file.filename : null;

        if (!google_review_img) {
            return res.status(400).json({ message: 'Google review screenshot is required.' });
        }

        await pool.query(
            'INSERT INTO JobPortalRequests (student_id, google_review_img, portfolio_link, bypass_reason) VALUES (?, ?, ?, ?)',
            [studentId, google_review_img, portfolio_link, bypass_reason || null]
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

        if (status === 'approved') {
            await pool.query('UPDATE Users SET job_portal_unlocked = TRUE WHERE id = ?', [request[0].student_id]);
        } else {
            // Only lock if we explicitly reject, some places might want them to stay unlocked until reviewed resubmission
            await pool.query('UPDATE Users SET job_portal_unlocked = FALSE WHERE id = ?', [request[0].student_id]);
        }

        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating request', error: error.message });
    }
};

// Bulk Approve/Reject Requests (SuperAdmin only)
exports.bulkUpdateRequestStatus = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { requestIds, status, admin_notes } = req.body;
        
        if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
            return res.status(400).json({ message: 'No requests provided for bulk update.' });
        }

        await connection.beginTransaction();

        for (const id of requestIds) {
            const [request] = await connection.query('SELECT student_id FROM JobPortalRequests WHERE id = ?', [id]);
            if (request[0]) {
                await connection.query('UPDATE JobPortalRequests SET status = ?, admin_notes = ? WHERE id = ?', [status, admin_notes, id]);
                
                if (status === 'approved') {
                    await connection.query('UPDATE Users SET job_portal_unlocked = TRUE WHERE id = ?', [request[0].student_id]);
                } else if (status === 'rejected') {
                    await connection.query('UPDATE Users SET job_portal_unlocked = FALSE WHERE id = ?', [request[0].student_id]);
                }
            }
        }

        await connection.commit();
        res.json({ message: `Successfully bulk updated ${requestIds.length} requests.` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Error updating requests', error: error.message });
    } finally {
        connection.release();
    }
};

// Download Internship Certificate (Student only)
const pdfGenerator = require('../utils/pdfGenerator');

exports.downloadInternshipCertificate = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Verify if student is approved
        const [user] = await pool.query('SELECT job_portal_unlocked, first_name, last_name FROM Users WHERE id = ?', [studentId]);
        
        if (!user[0] || !user[0].job_portal_unlocked) {
            return res.status(403).json({ message: 'You are not approved for the Job Portal yet.' });
        }

        // Get Course Name
        const [courseInfo] = await pool.query(`
            SELECT c.name as course_name 
            FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE bs.student_id = ?
            LIMIT 1
        `, [studentId]);

        const studentName = `${user[0].first_name} ${user[0].last_name}`;
        const courseName = courseInfo[0] ? courseInfo[0].course_name : 'Advanced Software Engineering';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Internship_Certificate_${user[0].first_name}.pdf`);

        await pdfGenerator.generateInternshipCertificate(studentName, courseName, res);

    } catch (error) {
        console.error("Certificate Generation Error:", error);
        res.status(500).json({ message: 'Error generating certificate', error: error.message });
    }
};
