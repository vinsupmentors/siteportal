const pool = require('../config/db');

// ==========================================
// STUDENT SPECIFIC WORKFLOWS
// ==========================================

// Personal Dashboard stats

exports.getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Student name + active batch
        const [batches] = await pool.query(`
            SELECT b.*, bs.loyalty_marks, c.name as course_name,
                   u.first_name, u.last_name
            FROM Batches b
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Courses c ON b.course_id = c.id
            JOIN Users u ON u.id = ?
            WHERE bs.student_id = ? AND b.status = 'active'
        `, [studentId, studentId]);

        const activeBatch = batches[0];
        if (!activeBatch) {
            return res.status(200).json({ activeBatch: null });
        }

        // 2. Attendance %
        const [attendance] = await pool.query(`
            SELECT
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days
            FROM StudentAttendance
            WHERE student_id = ? AND batch_id = ?
        `, [studentId, activeBatch.id]);

        const attendancePct = attendance[0].total_days > 0
            ? Math.round((attendance[0].present_days / attendance[0].total_days) * 100)
            : 0;

        // 3. Performance Metrics
        const [performance] = await pool.query(`
            SELECT
                AVG(CASE WHEN submission_type = 'module_test' AND marks IS NOT NULL THEN marks ELSE NULL END) as avg_test_score,
                COUNT(CASE WHEN submission_type IN ('module_project', 'capstone') AND marks IS NOT NULL THEN 1 ELSE NULL END) as completed_projects
            FROM Submissions
            WHERE student_id = ?
        `, [studentId]);

        // 4. Next Lesson
        const [nextLesson] = await pool.query(`
            SELECT d.*, m.name as module_name
            FROM Days d
            JOIN Modules m ON d.module_id = m.id
            WHERE m.course_id = ?
            ORDER BY m.sequence_order, d.day_number
            LIMIT 1 OFFSET ?
        `, [activeBatch.course_id, attendance[0].total_days]);

        // 5. Pending worksheets (unsubmitted days, up to 3)
        const [pendingWorksheets] = await pool.query(`
            SELECT d.id, d.day_number, d.topic_name, d.worksheet_url, d.material_url, m.name as module_name
            FROM Days d
            JOIN Modules m ON d.module_id = m.id
            WHERE m.course_id = ?
            AND d.id NOT IN (
                SELECT day_id FROM Submissions
                WHERE student_id = ? AND submission_type = 'worksheet' AND day_id IS NOT NULL
            )
            ORDER BY m.sequence_order, d.day_number
            LIMIT 3
        `, [activeBatch.course_id, studentId]);

        // 6. Module progress (passed count)
        const [modules] = await pool.query(`SELECT id FROM Modules WHERE course_id = ?`, [activeBatch.course_id]);
        const totalModules = modules.length;
        let passedModules = 0;
        if (totalModules > 0) {
            const mIds = modules.map(m => m.id);
            const ph = mIds.map(() => '?').join(',');
            const [passed] = await pool.query(`
                SELECT COUNT(DISTINCT module_id) as cnt
                FROM Submissions
                WHERE student_id = ? AND submission_type = 'module_test'
                AND module_id IN (${ph}) AND marks >= 75
            `, [studentId, ...mIds]);
            passedModules = passed[0].cnt || 0;
        }

        // 7. Announcements
        const [announcements] = await pool.query(`
            SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as author
            FROM Announcements a
            JOIN Users u ON a.created_by = u.id
            WHERE a.target_role IN ('all', '4') OR a.target_batch_id = ?
            ORDER BY a.created_at DESC LIMIT 5
        `, [activeBatch.id]);

        res.status(200).json({
            activeBatch,
            studentName: `${activeBatch.first_name} ${activeBatch.last_name}`,
            stats: {
                attendancePct,
                loyaltyMarks: activeBatch.loyalty_marks,
                avgTestScore: Math.round(performance[0].avg_test_score || 0),
                completedProjects: performance[0].completed_projects || 0
            },
            nextLesson: nextLesson[0] || null,
            pendingWorksheets,
            moduleProgress: { passed: passedModules, total: totalModules },
            announcements
        });
    } catch (error) {
        res.status(500).json({ message: 'Server fault loading student dashboard.', error: error.message });
    }
};

// Comprehensive Calendar Feed
exports.getStudentCalendar = async (req, res) => {
    try {
        const studentId = req.user.id;

        const [batchRows] = await pool.query(`
            SELECT b.id, b.batch_name as name, b.start_date, b.end_date, b.course_id, b.meeting_link, b.schedule_type
            FROM Batches b
            JOIN BatchStudents bs ON b.id = bs.batch_id
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);

        if (!batchRows.length) return res.json({ events: [], batch: null });

        const batch = batchRows[0];
        const batchId = batch.id;

        // 1. Days/topics for this batch's course
        const [days] = await pool.query(`
            SELECT d.id, d.day_number, d.topic_name, d.material_url, d.worksheet_url,
                   m.name as module_name
            FROM Days d
            JOIN Modules m ON d.module_id = m.id
            WHERE m.course_id = ?
            ORDER BY m.sequence_order, d.day_number
        `, [batch.course_id]);

        // 2. Approved leaves
        const [leaves] = await pool.query(
            "SELECT * FROM StudentLeaves WHERE student_id = ? AND status = 'approved'",
            [studentId]
        );

        // 3. Attendance records
        const [attendance] = await pool.query(
            'SELECT attendance_date as date, status FROM StudentAttendance WHERE student_id = ? AND batch_id = ? ORDER BY attendance_date',
            [studentId, batchId]
        );

        // 4. Submitted worksheets (to show submission events)
        const [submissions] = await pool.query(`
            SELECT s.day_id, s.created_at, s.submission_type
            FROM Submissions s
            WHERE s.student_id = ? AND s.submission_type = 'worksheet' AND s.day_id IS NOT NULL
        `, [studentId]);

        const submittedDayIds = new Set(submissions.map(s => s.day_id));

        // 5. Map days to calendar dates (skip Sundays for weekday batches)
        const events = [];
        let currentDate = new Date(batch.start_date || new Date());

        days.forEach((day) => {
            // Skip Sunday
            while (currentDate.getDay() === 0) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const dateStr = currentDate.toISOString().split('T')[0];

            events.push({
                id: `class-${day.id}`,
                title: `📘 ${day.topic_name}`,
                date: dateStr,
                type: 'class',
                details: {
                    ...day,
                    submitted: submittedDayIds.has(day.id)
                }
            });

            // Worksheet deadline: 2 days after class
            const deadlineDate = new Date(currentDate);
            deadlineDate.setDate(deadlineDate.getDate() + 2);
            if (deadlineDate.getDay() === 0) deadlineDate.setDate(deadlineDate.getDate() + 1);

            if (!submittedDayIds.has(day.id)) {
                events.push({
                    id: `deadline-${day.id}`,
                    title: `⏰ Worksheet Due: ${day.topic_name}`,
                    date: deadlineDate.toISOString().split('T')[0],
                    type: 'deadline',
                    details: day
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        });

        // 6. Attendance markers
        attendance.forEach(a => {
            const dateStr = typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0];
            events.push({
                id: `att-${dateStr}`,
                title: a.status === 'present' ? '✅ Present' : a.status === 'late' ? '🕐 Late' : '❌ Absent',
                date: dateStr,
                type: 'attendance',
                status: a.status
            });
        });

        // 7. Leave blocks
        leaves.forEach(l => {
            const startStr = typeof l.start_date === 'string' ? l.start_date : new Date(l.start_date).toISOString().split('T')[0];
            const endDate = new Date(l.end_date);
            endDate.setDate(endDate.getDate() + 1); // FullCalendar end is exclusive
            events.push({
                id: `leave-${l.id}`,
                title: '🏖️ Approved Leave',
                start: startStr,
                end: endDate.toISOString().split('T')[0],
                type: 'leave'
            });
        });

        res.json({
            events,
            batch: {
                id: batch.id,
                name: batch.name,
                start_date: batch.start_date,
                end_date: batch.end_date,
                meeting_link: batch.meeting_link,
                schedule_type: batch.schedule_type
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error loading calendar', error: error.message });
    }
};

// Form to submit Technical Doubts mapped to the Batch Trainer
exports.raiseDoubt = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { batch_id, query_text } = req.body;

        // Lookup trainer tied to the batch to auto-assign the ticket
        const [batch] = await pool.query('SELECT trainer_id FROM Batches WHERE id = ?', [batch_id]);
        if (batch.length === 0) return res.status(404).json({ message: 'Invalid batch reference.' });

        const [result] = await pool.query(
            'INSERT INTO StudentDoubts (student_id, trainer_id, batch_id, query_text) VALUES (?, ?, ?, ?)',
            [studentId, batch[0].trainer_id, batch_id, query_text]
        );

        // Log explicitly to Audit Schema
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [studentId, 'RAISE_TECH_DOUBT', 'StudentDoubts', result.insertId]
        );

        res.status(201).json({ message: 'Technical doubt ticket generated.' });
    } catch (error) {
        res.status(500).json({ message: 'Server fault raising ticket.', error: error.message });
    }
};

// Handle leave requests spanning start_date -> end_date
exports.applyForLeave = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { batch_id, start_date, end_date, reason } = req.body;

        await pool.query(
            'INSERT INTO StudentLeaves (student_id, batch_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
            [studentId, batch_id, start_date, end_date, reason]
        );

        res.status(201).json({ message: 'Leave request pushed to Administration for review.' });
    } catch (error) {
        res.status(500).json({ message: 'Server fault applying for leave.', error: error.message });
    }
};

// Fetch all technical doubts raised by the student
exports.getDoubts = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [doubts] = await pool.query(`
            SELECT sd.*, b.batch_name, t.first_name as trainer_name
            FROM StudentDoubts sd
            LEFT JOIN Batches b ON sd.batch_id = b.id
            LEFT JOIN Users t ON sd.trainer_id = t.id
            WHERE sd.student_id = ?
            ORDER BY sd.created_at DESC
        `, [studentId]);
        res.status(200).json(doubts);
    } catch (error) {
        res.status(500).json({ message: 'Server fault fetching doubts.', error: error.message });
    }
};

// Form to submit generic issues to the Super Admin
exports.raiseIssue = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { issue_type, description } = req.body;

        await pool.query(
            'INSERT INTO StudentIssues (student_id, issue_type, description) VALUES (?, ?, ?)',
            [studentId, issue_type, description]
        );

        res.status(201).json({ message: 'Issue escalated to Super Admin successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server fault raising issue.', error: error.message });
    }
};

// Fetch all generic issues raised by the student
exports.getIssues = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [issues] = await pool.query(
            'SELECT * FROM StudentIssues WHERE student_id = ? ORDER BY created_at DESC',
            [studentId]
        );
        res.status(200).json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Server fault fetching issues.', error: error.message });
    }
};
// Submit detailed portfolio data for review and generation
exports.submitPortfolio = async (req, res) => {
    try {
        const studentId = req.user.id;
        const details = req.body;

        // Check if a request already exists
        const [existing] = await pool.query('SELECT id FROM PortfolioRequests WHERE student_id = ?', [studentId]);

        if (existing && existing.length > 0) {
            await pool.query(
                'UPDATE PortfolioRequests SET details = ?, status = ? WHERE student_id = ?',
                [JSON.stringify(details), 'pending', studentId]
            );
        } else {
            await pool.query(
                'INSERT INTO PortfolioRequests (student_id, details, status) VALUES (?, ?, ?)',
                [studentId, JSON.stringify(details), 'pending']
            );
        }

        res.status(201).json({ message: 'Portfolio request submitted for generation.' });
    } catch (error) {
        res.status(500).json({ message: 'Server fault submitting portfolio.', error: error.message });
    }
};

// Get student's own portfolio status
exports.getPortfolio = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [rows] = await pool.query(
            'SELECT * FROM PortfolioRequests WHERE student_id = ? ORDER BY id DESC LIMIT 1',
            [studentId]
        );
        res.json({ portfolio: rows[0] || null });
    } catch (error) {
        res.status(500).json({ message: 'Server fault fetching portfolio.', error: error.message });
    }
};

// Full progress analytics for the student
exports.getStudentProgress = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Active batch
        const [batchRows] = await pool.query(`
            SELECT bs.batch_id, b.course_id, bs.loyalty_marks
            FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);

        if (!batchRows.length) return res.json({ noBatch: true });
        const { batch_id, course_id, loyalty_marks } = batchRows[0];

        // 1. Attendance stats
        const [att] = await pool.query(`
            SELECT COUNT(*) as total_days,
                   SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days
            FROM StudentAttendance WHERE student_id = ? AND batch_id = ?
        `, [studentId, batch_id]);

        const total_days = att[0].total_days || 0;
        const present_days = att[0].present_days || 0;
        const attendancePct = total_days > 0 ? Math.round((present_days / total_days) * 100) : 0;

        // 2. Consecutive streak (class days, most recent first)
        const [attRows] = await pool.query(`
            SELECT status FROM StudentAttendance
            WHERE student_id = ? AND batch_id = ?
            ORDER BY attendance_date DESC
        `, [studentId, batch_id]);

        let streak = 0;
        for (const row of attRows) {
            if (row.status === 'present') streak++;
            else break;
        }

        // 3. Batch rank by loyalty marks
        const [batchStudents] = await pool.query(`
            SELECT student_id, loyalty_marks
            FROM BatchStudents WHERE batch_id = ?
            ORDER BY loyalty_marks DESC
        `, [batch_id]);

        const rankPos = batchStudents.findIndex(s => s.student_id === studentId) + 1;
        const totalStudents = batchStudents.length;

        // 4. Performance (test avg, projects)
        const [perf] = await pool.query(`
            SELECT
                AVG(CASE WHEN submission_type = 'module_test' AND marks IS NOT NULL THEN marks ELSE NULL END) as avg_test_score,
                COUNT(CASE WHEN submission_type IN ('module_project', 'capstone') AND marks IS NOT NULL THEN 1 ELSE NULL END) as completed_projects,
                COUNT(CASE WHEN submission_type = 'worksheet' THEN 1 ELSE NULL END) as worksheets_submitted
            FROM Submissions WHERE student_id = ?
        `, [studentId]);

        // 5. Total worksheets available (total Days in course)
        const [dayCount] = await pool.query(`
            SELECT COUNT(d.id) as total_days
            FROM Days d
            JOIN Modules m ON d.module_id = m.id
            WHERE m.course_id = ?
        `, [course_id]);

        // 6. Module roadmap with test pass status
        const [modules] = await pool.query(`
            SELECT m.id, m.name, m.sequence_order
            FROM Modules m WHERE m.course_id = ?
            ORDER BY m.sequence_order
        `, [course_id]);

        const moduleIds = modules.map(m => m.id);
        let moduleRoadmap = [];

        if (moduleIds.length) {
            const ph = moduleIds.map(() => '?').join(',');
            const [testSubs] = await pool.query(`
                SELECT module_id, MAX(marks) as best_marks,
                       COUNT(*) as attempts
                FROM Submissions
                WHERE student_id = ? AND submission_type = 'module_test'
                AND module_id IN (${ph})
                GROUP BY module_id
            `, [studentId, ...moduleIds]);

            const subMap = {};
            testSubs.forEach(s => { subMap[s.module_id] = s; });

            let activeSet = false;
            moduleRoadmap = modules.map(mod => {
                const sub = subMap[mod.id];
                let status;
                if (sub && sub.best_marks !== null) {
                    status = sub.best_marks >= 75 ? 'passed' : 'failed';
                } else if (sub) {
                    status = 'pending';
                } else if (!activeSet) {
                    status = 'active';
                    activeSet = true;
                } else {
                    status = 'locked';
                }
                return {
                    id: mod.id,
                    name: mod.name,
                    sequence_order: mod.sequence_order,
                    status,
                    best_score: sub?.best_marks || null,
                    attempts: sub?.attempts || 0,
                };
            });
        }

        const worksheetsSubmitted = perf[0].worksheets_submitted || 0;
        const totalWorksheets = dayCount[0].total_days || 0;
        const worksheetPct = totalWorksheets > 0
            ? Math.round((worksheetsSubmitted / totalWorksheets) * 100) : 0;

        const passedModules = moduleRoadmap.filter(m => m.status === 'passed').length;

        res.json({
            attendance: { pct: attendancePct, present: present_days, total: total_days },
            streak,
            rank: { position: rankPos, total: totalStudents },
            loyaltyMarks: loyalty_marks,
            avgTestScore: Math.round(perf[0].avg_test_score || 0),
            completedProjects: perf[0].completed_projects || 0,
            worksheets: { submitted: worksheetsSubmitted, total: totalWorksheets, pct: worksheetPct },
            passedModules,
            totalModules: modules.length,
            moduleRoadmap,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching progress', error: error.message });
    }
};

// Fetch all leave requests for the student
exports.getLeaves = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [leaves] = await pool.query(
            'SELECT * FROM StudentLeaves WHERE student_id = ? ORDER BY created_at DESC',
            [studentId]
        );
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

// Fetch module tests with submission status, scores and attempt count
exports.getStudentTests = async (req, res) => {
    try {
        const studentId = req.user.id;

        const [batchRows] = await pool.query(`
            SELECT bs.batch_id, b.course_id
            FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);

        if (!batchRows.length) return res.json({ tests: [] });

        const { batch_id, course_id } = batchRows[0];

        // Get all modules
        const [modules] = await pool.query(`
            SELECT id, name, sequence_order, test_url
            FROM Modules WHERE course_id = ?
            ORDER BY sequence_order
        `, [course_id]);

        if (!modules.length) return res.json({ tests: [] });

        const moduleIds = modules.map(m => m.id);
        const placeholders = moduleIds.map(() => '?').join(',');

        // Get unlock state for this batch (now including release flags)
        const [unlocks] = await pool.query(
            `SELECT module_id, is_test_released FROM BatchUnlocks WHERE batch_id = ? AND module_id IN (${placeholders})`,
            [batch_id, ...moduleIds]
        );
        const unlockedSet = new Set(unlocks.filter(u => u.is_test_released).map(u => u.module_id));

        // Get all module_test submissions for this student
        const [submissions] = await pool.query(`
            SELECT module_id, marks, submitted_at,
                   ROW_NUMBER() OVER (PARTITION BY module_id ORDER BY submitted_at DESC) as attempt_rank,
                   COUNT(*) OVER (PARTITION BY module_id) as total_attempts
            FROM Submissions
            WHERE student_id = ? AND submission_type = 'module_test' AND module_id IN (${placeholders})
        `, [studentId, ...moduleIds]);

        // Build a map: module_id -> { attempts, latest_marks, submitted_at }
        const submissionMap = {};
        submissions.forEach(s => {
            if (!submissionMap[s.module_id] || s.attempt_rank === 1) {
                submissionMap[s.module_id] = {
                    attempts: s.total_attempts,
                    marks: s.marks,
                    submitted_at: s.submitted_at
                };
            }
        });

        // Determine status for each module test
        const tests = modules.map((mod) => {
            const sub = submissionMap[mod.id];
            const isUnlocked = unlockedSet.has(mod.id);

            let status, score = null, attempts = 0, submitted_at = null;

            if (sub) {
                attempts = parseInt(sub.attempts);
                submitted_at = sub.submitted_at;
                if (sub.marks !== null) {
                    status = 'completed';
                    score = sub.marks;
                } else {
                    status = 'pending_review'; // submitted but not graded yet
                }
            } else if (isUnlocked) {
                status = 'active';
            } else {
                status = 'locked';
            }

            return {
                id: mod.id,
                title: `${mod.name} — Module Assessment`,
                module: `Module ${mod.sequence_order}`,
                module_name: mod.name,
                sequence_order: mod.sequence_order,
                status,
                score,
                attempts,
                max_attempts: 2,
                submitted_at,
                passed: score !== null ? score >= 75 : null,
                test_url: isUnlocked ? mod.test_url : null,
            };
        });

        res.json({ tests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tests', error: error.message });
    }
};

// Fetch full curriculum (modules + days + submission status) for student's active batch
// Only returns modules/days that have been unlocked by the trainer via BatchUnlocks
exports.getStudentCurriculum = async (req, res) => {
    try {
        const studentId = req.user.id;

        const [batchRows] = await pool.query(`
            SELECT bs.batch_id, b.course_id
            FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);

        if (!batchRows.length) return res.json({ modules: [] });

        const { batch_id, course_id } = batchRows[0];

        // Get all modules for this course
        const [allModules] = await pool.query(`
            SELECT id, name, sequence_order, module_project_details, study_material_url, test_url, interview_questions_url
            FROM Modules WHERE course_id = ?
            ORDER BY sequence_order
        `, [course_id]);

        if (!allModules.length) return res.json({ modules: [] });

        const moduleIds = allModules.map(m => m.id);
        const placeholders = moduleIds.map(() => '?').join(',');

        // Get unlock state for this batch
        const [unlocks] = await pool.query(
            `SELECT module_id, unlocked_up_to_day, is_projects_released, is_test_released, is_feedback_released, is_study_materials_released, is_interview_questions_released FROM BatchUnlocks WHERE batch_id = ? AND module_id IN (${placeholders})`,
            [batch_id, ...moduleIds]
        );

        const unlockMap = {};
        unlocks.forEach(u => { unlockMap[u.module_id] = u; });

        // Filter to only unlocked modules to query days
        const unlockedModules = allModules.filter(m => unlockMap[m.id] !== undefined);
        const unlockedModuleIds = unlockedModules.map(m => m.id);
        
        let days = [];
        if (unlockedModuleIds.length > 0) {
            const unlockPh = unlockedModuleIds.map(() => '?').join(',');
            const [queryDays] = await pool.query(`
                SELECT d.id, d.module_id, d.day_number, d.topic_name, d.material_url, d.worksheet_url,
                       s.id as submission_id
                FROM Days d
                LEFT JOIN Submissions s ON s.day_id = d.id AND s.student_id = ? AND s.submission_type = 'worksheet'
                WHERE d.module_id IN (${unlockPh})
                ORDER BY d.module_id, d.day_number
            `, [studentId, ...unlockedModuleIds]);
            days = queryDays;
        }

        // Get Module Projects and Content Files for released content
        const [projects] = await pool.query(
            `SELECT * FROM ModuleProjects WHERE module_id IN (${placeholders})`,
            moduleIds
        );
        const projectIds = projects.map(p => p.id);

        const [moduleFiles] = await pool.query(
            `SELECT * FROM ContentFiles WHERE entity_type = 'module' AND entity_id IN (${placeholders})`,
            moduleIds
        );

        let projectFiles = [];
        if (projectIds.length > 0) {
            const projPh = projectIds.map(() => '?').join(',');
            const [pFiles] = await pool.query(
                `SELECT * FROM ContentFiles WHERE entity_type = 'project' AND entity_id IN (${projPh})`,
                projectIds
            );
            projectFiles = pFiles;
        }

        // Return all modules, mapping their unlocked status
        const modulesWithDays = allModules.map(mod => {
            const unlockData = unlockMap[mod.id];
            const isUnlocked = unlockData !== undefined;
            const upToDayLimit = unlockData?.unlocked_up_to_day;

            if (!isUnlocked) {
                return { ...mod, is_unlocked: false, days: [] };
            }

            const modDays = days
                .filter(d => d.module_id === mod.id)
                .filter(d => upToDayLimit === -1 || d.day_number <= upToDayLimit)
                .map(d => {
                    const content_files = [];
                    // Day materials are usually worksheets or day sessions
                    if (d.material_url) content_files.push({ name: 'Study Material', url: d.material_url });
                    if (d.worksheet_url) content_files.push({ name: 'Worksheet', url: d.worksheet_url });
                    return { ...d, submitted: !!d.submission_id, content_files };
                });

            const isProjectsReleased = !!unlockData.is_projects_released;
            const isTestReleased = !!unlockData.is_test_released;
            const isFeedbackReleased = !!unlockData.is_feedback_released;
            const isMaterialsReleased = !!unlockData.is_study_materials_released;
            const isInterviewReleased = !!unlockData.is_interview_questions_released;

            // Map projects and files only if released
            const modProjects = isProjectsReleased 
                ? projects.filter(p => p.module_id === mod.id).map(p => ({
                    ...p,
                    files: projectFiles.filter(f => f.entity_id === p.id)
                })) 
                : [];
            
            const modFiles = isMaterialsReleased 
                ? moduleFiles.filter(f => f.entity_type === 'module' && f.entity_id === mod.id)
                : [];

            // Add released components at module level
            return { 
                id: mod.id,
                name: mod.name,
                sequence_order: mod.sequence_order,
                is_unlocked: true, 
                days: modDays,
                // Only return details/URLs if released
                module_project_details: isProjectsReleased ? mod.module_project_details : null,
                study_material_url: isMaterialsReleased ? mod.study_material_url : null,
                test_url: isTestReleased ? mod.test_url : null,
                interview_questions_url: isInterviewReleased ? mod.interview_questions_url : null,
                projects: modProjects,
                files: modFiles,
                is_projects_released: isProjectsReleased,
                is_test_released: isTestReleased,
                is_feedback_released: isFeedbackReleased,
                is_study_materials_released: isMaterialsReleased,
                is_interview_questions_released: isInterviewReleased
            };
        });

        // Also return total module count so the frontend knows what's locked
        res.json({ modules: modulesWithDays, total_modules: allModules.length });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching curriculum', error: error.message });
    }
};

// ==========================================
// DYNAMIC FEEDBACK SYSTEM (STUDENT)
// ==========================================

exports.getReleasedFeedback = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [released] = await pool.query(`
            SELECT ff.*, bfs.batch_id, bfs.module_id 
            FROM BatchFeedbackStatus bfs
            JOIN FeedbackForms ff ON bfs.form_id = ff.id
            JOIN BatchStudents bs ON bfs.batch_id = bs.batch_id
            JOIN BatchUnlocks bu ON bfs.batch_id = bu.batch_id AND bfs.module_id = bu.module_id
            WHERE bs.student_id = ? AND bfs.is_released = TRUE AND bu.is_feedback_released = TRUE
            AND NOT EXISTS (
                SELECT 1 FROM StudentFeedbackResponses sfr 
                WHERE sfr.student_id = ? AND sfr.form_id = ff.id AND sfr.batch_id = bfs.batch_id
            )
        `, [studentId, studentId]);

        res.json({ feedbackForms: released });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching released feedback', error: error.message });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { batch_id, module_id, form_id, response_json } = req.body;

        await pool.query(
            'INSERT INTO StudentFeedbackResponses (student_id, batch_id, module_id, form_id, response_json) VALUES (?, ?, ?, ?, ?)',
            [studentId, batch_id, module_id, form_id, JSON.stringify(response_json)]
        );

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [studentId, 'FEEDBACK_SUBMITTED', 'StudentFeedbackResponses', form_id]);

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting feedback', error: error.message });
    }
};
