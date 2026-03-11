const pool = require('../config/db');

// Create a new job (Recruiter only)
exports.createJob = async (req, res) => {
    try {
        const { title, company_name, description, course_id, ctc, experience_level, apply_link, deadline_date } = req.body;
        const recruiterId = req.user.id;

        const [result] = await pool.query(
            'INSERT INTO Jobs (title, company_name, description, course_id, created_by, ctc, experience_level, apply_link, deadline_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, company_name, description, course_id, recruiterId, ctc, experience_level, apply_link, deadline_date]
        );

        res.status(201).json({ message: 'Job posted successfully', jobId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating job', error: error.message });
    }
};

// Get all jobs (Recruiter/Admin/SA)
exports.getJobs = async (req, res) => {
    try {
        const { course_id } = req.query;
        let query = `
            SELECT j.*, c.name as course_name, u.first_name as recruiter_name,
            (SELECT COUNT(*) FROM JobApplications WHERE job_id = j.id) as app_count
            FROM Jobs j
            JOIN Courses c ON j.course_id = c.id
            JOIN Users u ON j.created_by = u.id
        `;
        let params = [];
        if (course_id && course_id !== 'all') {
            query += ' WHERE j.course_id = ?';
            params.push(course_id);
        }
        query += ' ORDER BY j.created_at DESC';

        const [jobs] = await pool.query(query, params);
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs', error: error.message });
    }
};

// Update job (Recruiter only)
exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, company_name, description, course_id, status, hired_count, deadline_date } = req.body;

        await pool.query(
            'UPDATE Jobs SET title=?, company_name=?, description=?, course_id=?, status=?, hired_count=?, deadline_date=? WHERE id=?',
            [title, company_name, description, course_id, status, hired_count || 0, deadline_date, id]
        );

        res.json({ message: 'Job updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating job', error: error.message });
    }
};

// Get jobs for student (Filtered by course and eligibility)
exports.getStudentJobs = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Check if user is unlocked
        const [user] = await pool.query('SELECT job_portal_unlocked FROM Users WHERE id = ?', [studentId]);
        if (!user[0] || !user[0].job_portal_unlocked) {
            return res.status(403).json({ message: 'Job Portal Locked. Complete criteria and request access.' });
        }

        // 2. Get student's course
        const [batch] = await pool.query(`
            SELECT b.course_id FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);

        if (!batch[0]) {
            return res.json([]); // No active batch, no jobs
        }

        const courseId = batch[0].course_id;

        // 3. Fetch jobs for this course - excluding expired or closed
        const [jobs] = await pool.query(`
            SELECT j.*, 
            (SELECT status FROM JobApplications WHERE job_id = j.id AND student_id = ?) as student_app_status
            FROM Jobs j 
            WHERE j.course_id = ? 
            AND j.status = 'Open' 
            AND (j.deadline_date IS NULL OR j.deadline_date >= CURDATE())
            ORDER BY j.created_at DESC
        `, [studentId, courseId]);

        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student jobs', error: error.message });
    }
};

// Track application/click
exports.applyToJob = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { jobId } = req.body;

        await pool.query(`
            INSERT INTO JobApplications (job_id, student_id, status)
            VALUES (?, ?, 'applied')
            ON DUPLICATE KEY UPDATE status = 'applied', applied_at = CURRENT_TIMESTAMP
        `, [jobId, studentId]);

        res.json({ success: true, message: 'Application recorded' });
    } catch (error) {
        res.status(500).json({ message: 'Error recording application', error: error.message });
    }
};

// Recruiter Analytics
exports.getJobAnalytics = async (req, res) => {
    try {
        // 1. Overall stats
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_jobs,
                (SELECT COUNT(*) FROM JobApplications) as total_applications,
                (SELECT COUNT(DISTINCT student_id) FROM JobApplications) as unique_students
            FROM Jobs
        `);

        // 2. Course-wise jobs
        const [courseJobs] = await pool.query(`
            SELECT c.name as course_name, COUNT(j.id) as count
            FROM Courses c
            LEFT JOIN Jobs j ON c.id = j.course_id
            GROUP BY c.id, c.name
            HAVING count > 0
        `);

        // 3. Top student applies
        const [studentStats] = await pool.query(`
            SELECT u.first_name, u.last_name, u.email, COUNT(ja.id) as app_count
            FROM Users u
            JOIN JobApplications ja ON u.id = ja.student_id
            GROUP BY u.id
            ORDER BY app_count DESC
            LIMIT 10
        `);

        res.json({
            overview: stats[0],
            courseJobs,
            studentStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job analytics', error: error.message });
    }
};
// Get applicants for a specific job
exports.getJobApplicants = async (req, res) => {
    try {
        const { id } = req.params;
        const [applicants] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, ja.status, ja.applied_at,
                   (SELECT b.batch_name FROM Batches b JOIN BatchStudents bs ON b.id = bs.batch_id WHERE bs.student_id = u.id LIMIT 1) as batch_name
            FROM JobApplications ja
            JOIN Users u ON ja.student_id = u.id
            WHERE ja.job_id = ?
            ORDER BY ja.applied_at DESC
        `, [id]);
        res.json(applicants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching applicants', error: error.message });
    }
};
