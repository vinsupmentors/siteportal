const pool = require('../config/db');

// ── Recruiter Dashboard ──────────────────────────────────────────────────────

exports.getRecruiterDashboard = async (req, res) => {
    try {
        const [batches] = await pool.query(`
            SELECT
                b.id as batch_id, b.batch_name, c.name as course_name,
                COUNT(DISTINCT bs.student_id) as total_students,
                SUM(CASE WHEN u.program_type = 'JRP' THEN 1 ELSE 0 END) as jrp_count,
                SUM(CASE WHEN u.program_type = 'IOP' THEN 1 ELSE 0 END) as iop_count,
                SUM(CASE WHEN u.program_type = 'IOP' AND bs.ready_for_interview = 1 THEN 1 ELSE 0 END) as iop_ready
            FROM Batches b
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Users u ON bs.student_id = u.id
            JOIN Courses c ON b.course_id = c.id
            WHERE u.role_id = 4 AND u.status = 'active'
            GROUP BY b.id, b.batch_name, c.name
            ORDER BY b.id DESC
        `);

        // Interview funnel counts per batch
        const batchesWithFunnel = await Promise.all(batches.map(async (batch) => {
            const [interviewCounts] = await pool.query(`
                SELECT
                    SUM(CASE WHEN interview_count = 0 THEN 1 ELSE 0 END) as interviews_0,
                    SUM(CASE WHEN interview_count = 1 THEN 1 ELSE 0 END) as interviews_1,
                    SUM(CASE WHEN interview_count = 2 THEN 1 ELSE 0 END) as interviews_2,
                    SUM(CASE WHEN interview_count = 3 THEN 1 ELSE 0 END) as interviews_3,
                    SUM(CASE WHEN is_placed = 1 THEN 1 ELSE 0 END) as placed_count
                FROM (
                    SELECT
                        bs.student_id,
                        COUNT(si.id) as interview_count,
                        MAX(CASE WHEN si.status = 'placed' THEN 1 ELSE 0 END) as is_placed
                    FROM BatchStudents bs
                    JOIN Users u ON bs.student_id = u.id
                    LEFT JOIN StudentInterviews si ON si.student_id = bs.student_id AND si.batch_id = bs.batch_id
                    WHERE bs.batch_id = ? AND u.program_type = 'IOP' AND u.role_id = 4 AND u.status = 'active'
                    GROUP BY bs.student_id
                ) t
            `, [batch.batch_id]);

            return { ...batch, ...interviewCounts[0] };
        }));

        const [overall] = await pool.query(`
            SELECT
                COUNT(DISTINCT CASE WHEN u.program_type = 'IOP' THEN u.id END) as total_iop,
                COUNT(DISTINCT CASE WHEN u.program_type = 'IOP' AND bs.ready_for_interview = 1 THEN u.id END) as total_ready,
                COUNT(DISTINCT CASE WHEN si.status = 'placed' THEN si.student_id END) as total_placed
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            LEFT JOIN StudentInterviews si ON si.student_id = u.id
            WHERE u.role_id = 4 AND u.status = 'active'
        `);

        res.json({ batches: batchesWithFunnel, overall: overall[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recruiter dashboard', error: error.message });
    }
};

// ── IOP Students List ─────────────────────────────────────────────────────────

exports.getIopStudents = async (req, res) => {
    try {
        const { batch_id, status } = req.query;

        let query = `
            SELECT
                u.id, u.first_name, u.last_name, u.email, u.phone, u.program_type,
                bs.batch_id, bs.course_completion_date, bs.ready_for_interview,
                b.batch_name, c.name as course_name,
                COUNT(si.id) as interview_count,
                MAX(CASE WHEN si.status = 'placed' THEN 1 ELSE 0 END) as is_placed
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            JOIN Batches b ON bs.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            LEFT JOIN StudentInterviews si ON si.student_id = u.id AND si.batch_id = bs.batch_id
            WHERE u.role_id = 4 AND u.status = 'active' AND u.program_type = 'IOP'
        `;
        const params = [];
        if (batch_id) { query += ' AND bs.batch_id = ?'; params.push(batch_id); }
        query += ' GROUP BY u.id, bs.batch_id ORDER BY bs.ready_for_interview DESC, u.first_name';

        const [students] = await pool.query(query, params);

        // Calculate 90-day window remaining
        const today = new Date();
        const enriched = students.map(s => {
            let daysRemaining = null;
            if (s.course_completion_date) {
                const completionDate = new Date(s.course_completion_date);
                const deadline = new Date(completionDate);
                deadline.setDate(deadline.getDate() + 90);
                daysRemaining = Math.max(0, Math.round((deadline - today) / (1000 * 60 * 60 * 24)));
            }
            return { ...s, days_remaining: daysRemaining };
        });

        // Filter by status if requested
        let filtered = enriched;
        if (status === 'ready') filtered = enriched.filter(s => s.ready_for_interview);
        if (status === 'placed') filtered = enriched.filter(s => s.is_placed);
        if (status === 'not_started') filtered = enriched.filter(s => s.ready_for_interview && s.interview_count === 0);

        res.json({ students: filtered });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP students', error: error.message });
    }
};

// ── Student Interviews ────────────────────────────────────────────────────────

exports.scheduleInterview = async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const { student_id, batch_id, interview_number, company_name, scheduled_date, notes } = req.body;

        if (![1, 2, 3].includes(Number(interview_number))) {
            return res.status(400).json({ message: 'interview_number must be 1, 2, or 3' });
        }

        // Check student is IOP
        const [studentRows] = await pool.query('SELECT program_type FROM Users WHERE id = ? AND role_id = 4', [student_id]);
        if (!studentRows.length) return res.status(404).json({ message: 'Student not found' });
        if (studentRows[0].program_type !== 'IOP') return res.status(400).json({ message: 'Only IOP students can have interviews scheduled' });

        // Check this interview_number doesn't already exist
        const [existing] = await pool.query(
            'SELECT id FROM StudentInterviews WHERE student_id = ? AND batch_id = ? AND interview_number = ?',
            [student_id, batch_id, interview_number]
        );
        if (existing.length) return res.status(400).json({ message: `Interview ${interview_number} already scheduled for this student` });

        const [result] = await pool.query(
            'INSERT INTO StudentInterviews (student_id, batch_id, recruiter_id, interview_number, company_name, scheduled_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [student_id, batch_id, recruiterId, interview_number, company_name || null, scheduled_date || null, notes || null]
        );

        const [interview] = await pool.query('SELECT * FROM StudentInterviews WHERE id = ?', [result.insertId]);
        res.status(201).json({ message: 'Interview scheduled', interview: interview[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error scheduling interview', error: error.message });
    }
};

exports.updateInterviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, company_name, scheduled_date } = req.body;
        const validStatuses = ['scheduled', 'in_progress', 'placed', 'rejected'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updates = [];
        const params = [];
        if (status) { updates.push('status = ?'); params.push(status); }
        if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
        if (company_name !== undefined) { updates.push('company_name = ?'); params.push(company_name); }
        if (scheduled_date !== undefined) { updates.push('scheduled_date = ?'); params.push(scheduled_date); }
        if (!updates.length) return res.status(400).json({ message: 'No fields to update' });

        params.push(id);
        await pool.query(`UPDATE StudentInterviews SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ message: 'Interview updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating interview', error: error.message });
    }
};

exports.getStudentInterviews = async (req, res) => {
    try {
        const { studentId } = req.params;

        const [rows] = await pool.query(`
            SELECT si.*, CONCAT(u.first_name, ' ', u.last_name) as student_name,
                   b.batch_name
            FROM StudentInterviews si
            JOIN Users u ON si.student_id = u.id
            JOIN Batches b ON si.batch_id = b.id
            WHERE si.student_id = ?
            ORDER BY si.interview_number
        `, [studentId]);

        // Return slots 1-3, null for not yet scheduled
        const slots = [1, 2, 3].map(n => rows.find(r => r.interview_number === n) || null);
        res.json({ interviews: slots, student_id: studentId });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching interviews', error: error.message });
    }
};
