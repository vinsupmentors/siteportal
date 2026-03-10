const pool = require('../config/db');

// ==========================================
// ENTERPRISE & NOTIFICATION OPERATIONS
// ==========================================

// Pushing a master notification across the system (Super Admin)
exports.broadcastNotification = async (req, res) => {
    try {
        const { title, message, target_role_id } = req.body;

        // Fetches targets if scoped to a role, otherwise broadcasts universally
        let usersQuery = 'SELECT id FROM Users';
        let queryParams = [];

        if (target_role_id) {
            usersQuery += ' WHERE role_id = ?';
            queryParams.push(target_role_id);
        }

        const [users] = await pool.query(usersQuery, queryParams);

        if (users.length === 0) return res.status(404).json({ message: 'No targets found for broadcast.' });

        // Map bulk inserts for the notification queue
        const insertValues = users.map(user => [user.id, title, message]);
        await pool.query('INSERT INTO Notifications (user_id, title, message) VALUES ?', [insertValues]);

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name) VALUES (?, ?, ?)',
            [req.user.id, 'BROADCAST_NOTIFICATION', 'Notifications']
        );

        res.status(201).json({ message: `Broadcast successfully pushed to ${users.length} targets.` });

    } catch (error) {
        res.status(500).json({ message: 'Server fault processing broadcast.', error: error.message });
    }
};

// Logging an Interview Slot for the Placement Assurance Program (PAP)
exports.scheduleInterview = async (req, res) => {
    try {
        const { student_id, company_name, job_role, interview_date } = req.body;

        // Ensure student has PAP/IOP metrics eligible 
        const [studentInfo] = await pool.query(`
            SELECT p.assured_interviews 
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            JOIN Batches b ON bs.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            JOIN Programs p ON c.program_id = p.id
            WHERE u.id = ?
        `, [student_id]);

        if (studentInfo.length === 0 || studentInfo[0].assured_interviews === 0) {
            return res.status(400).json({ message: 'Student is not mapped to an interview-eligible program (PAP/IOP_EXT).' });
        }

        const [result] = await pool.query(
            'INSERT INTO JobInterviews (student_id, company_name, job_role, interview_date) VALUES (?, ?, ?, ?)',
            [student_id, company_name, job_role, interview_date]
        );

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'SCHEDULE_INTERVIEW', 'JobInterviews', result.insertId]
        );

        res.status(201).json({ message: 'Interview pipeline instance secured and logged.' });

    } catch (error) {
        res.status(500).json({ message: 'Server fault scheduling interview map.', error: error.message });
    }
};
