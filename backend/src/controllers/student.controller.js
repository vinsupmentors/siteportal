const pool = require('../config/db');
const path = require('path');
const fs   = require('fs').promises;

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
            SELECT s.day_id, s.submission_type
            FROM Submissions s
            WHERE s.student_id = ? AND s.submission_type = 'worksheet' AND s.day_id IS NOT NULL
        `, [studentId]);

        const submittedDayIds = new Set(submissions.map(s => s.day_id));

        // 5. Map days to calendar dates (skip Sundays for weekday batches)
        const events = [];
       // Guard against null start_date
        const safeStart = batch.start_date ? new Date(batch.start_date) : new Date();
        let currentDate = new Date(safeStart);

        // Safety limit — never loop more than 365 days
        let dayLimit = 365;

        days.forEach((day) => {
            // Skip Sunday
            // Skip Sunday — with safety limit
            let skipCount = 0;
            while (currentDate.getDay() === 0 && skipCount < 7) {
                currentDate.setDate(currentDate.getDate() + 1);
                skipCount++;
            }
            
            if (--dayLimit <= 0) return; // safety break

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

        // 8. BatchReleases with due_dates (tests, projects, feedbacks, capstone)
        // Wrapped in try-catch so a query failure never breaks class events / attendance
        try {
            const [releases] = await pool.query(
                'SELECT br.id, br.release_type, br.entity_id, br.due_date, COALESCE(m.name, ?) as entity_name ' +
                'FROM BatchReleases br LEFT JOIN Modules m ON m.id = br.entity_id ' +
                'WHERE br.batch_id = ? AND br.due_date IS NOT NULL ' +
                'AND br.release_type IN (?, ?, ?, ?) ' +
                'ORDER BY br.due_date',
                ['Capstone Project', batchId, 'module_test', 'module_project', 'module_feedback', 'capstone_project']
            );

            const releaseTypeConfig = {
                module_test:      { label: 'Test Due',      eventType: 'test'     },
                module_project:   { label: 'Project Due',   eventType: 'deadline' },
                module_feedback:  { label: 'Feedback Due',  eventType: 'feedback' },
                capstone_project: { label: 'Capstone Due',  eventType: 'capstone' },
            };

            releases.forEach(r => {
                const cfg = releaseTypeConfig[r.release_type] || { label: 'Due', eventType: 'deadline' };
                const dateStr = typeof r.due_date === 'string'
                    ? r.due_date.split('T')[0]
                    : new Date(r.due_date).toISOString().split('T')[0];
                events.push({
                    id: `release-${r.id}`,
                    title: `${cfg.label}: ${r.entity_name}`,
                    date: dateStr,
                    type: cfg.eventType,
                    details: { release_type: r.release_type, entity_name: r.entity_name }
                });
            });
        } catch (releaseErr) {
            console.error('[Calendar] release events query failed:', releaseErr.message);
        }

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

        // 2. Consecutive streak
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

        // 4. Performance (test avg, projects, worksheets)
        const [perf] = await pool.query(`
            SELECT
                AVG(CASE WHEN submission_type = 'module_test' AND marks IS NOT NULL THEN marks ELSE NULL END) as avg_test_score,
                COUNT(CASE WHEN submission_type IN ('module_project', 'capstone') AND marks IS NOT NULL THEN 1 ELSE NULL END) as completed_projects,
                COUNT(CASE WHEN submission_type = 'worksheet' THEN 1 ELSE NULL END) as worksheets_submitted
            FROM Submissions WHERE student_id = ?
        `, [studentId]);

        // 5. Total worksheets available
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
                SELECT module_id, MAX(marks) as best_marks, COUNT(*) as attempts
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

        // 7. Graded submissions from release system (projects, tests, capstone)
        const [gradedSubmissions] = await pool.query(`
            SELECT srs.id, srs.release_id, srs.marks, srs.feedback, srs.status,
                   srs.submitted_at, srs.graded_at,
                   br.release_type, br.due_date, br.entity_id
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id = ? AND srs.batch_id = ?
            ORDER BY srs.submitted_at DESC
        `, [studentId, batch_id]);

        // Enrich with names
        const gradedItems = await Promise.all(gradedSubmissions.map(async s => {
            let name = '';
            try {
                if (s.release_type === 'module_project') {
                    const [[row]] = await pool.query('SELECT name FROM ModuleProjects WHERE id = ?', [s.entity_id]);
                    name = row?.name || 'Project';
                } else if (s.release_type === 'module_test') {
                    const [[mod]] = await pool.query('SELECT name FROM Modules WHERE id = ?', [s.entity_id]);
                    name = `${mod?.name || 'Module'} — Test`;
                } else if (s.release_type === 'capstone_project') {
                    const [[cap]] = await pool.query('SELECT name FROM CapstoneProjecs WHERE id = ?', [s.entity_id]);
                    name = cap?.name || 'Capstone Project';
                }
            } catch (_) {}
            return { ...s, name };
        }));

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
            gradedItems,
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

        // ── Check which tests are released via BatchReleases (new system) ──────
        const [releasedTests] = await pool.query(
            `SELECT entity_id as module_id FROM BatchReleases
             WHERE batch_id = ? AND release_type = 'module_test' AND entity_id IN (${placeholders})`,
            [batch_id, ...moduleIds]
        );
        const unlockedSet = new Set(releasedTests.map(r => Number(r.module_id)));

        // ── Get submissions from StudentReleaseSubmissions (new system) ─────────
        const [newSubs] = await pool.query(`
            SELECT br.entity_id as module_id, srs.marks, srs.submitted_at,
                   ROW_NUMBER() OVER (PARTITION BY br.entity_id ORDER BY srs.submitted_at DESC) as attempt_rank,
                   COUNT(*) OVER (PARTITION BY br.entity_id) as total_attempts
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id = ? AND srs.batch_id = ?
              AND br.release_type = 'module_test' AND br.entity_id IN (${placeholders})
        `, [studentId, batch_id, ...moduleIds]);

        // Build a map: module_id -> { attempts, marks, submitted_at }
        const submissionMap = {};
        newSubs.forEach(s => {
            if (!submissionMap[s.module_id] || s.attempt_rank === 1) {
                submissionMap[s.module_id] = {
                    attempts: parseInt(s.total_attempts),
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
        let dayFiles = [];
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

            // Fetch uploaded content files for each day
            if (queryDays.length > 0) {
                const dayIds = queryDays.map(d => d.id);
                const dayPh = dayIds.map(() => '?').join(',');
                const [qDayFiles] = await pool.query(
                    `SELECT * FROM ContentFiles WHERE entity_type = 'day' AND entity_id IN (${dayPh})`,
                    dayIds
                );
                dayFiles = qDayFiles;
            }
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
                    // Uploaded files from ContentFiles table
                    const uploaded_files = dayFiles.filter(f => f.entity_id === d.id);
                    
                    // URL-based files (legacy)
                    const url_files = [];
                    if (d.material_url) url_files.push({ name: 'Study Material', url: d.material_url, original_name: 'Study Material' });
                    if (d.worksheet_url) url_files.push({ name: 'Worksheet', url: d.worksheet_url, original_name: 'Worksheet' });
                    
                    // Merge both — uploaded files take priority
                    const content_files = [
                        ...uploaded_files,
                        ...url_files,
                    ];
                    
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
            SELECT ff.id, ff.title, ff.form_json, br.id as release_id, br.batch_id, br.module_id, br.due_date,
                   CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
                   EXISTS(
                       SELECT 1 FROM StudentFeedbackResponses sfr
                       WHERE sfr.student_id = ? AND sfr.form_id = ff.id AND sfr.batch_id = br.batch_id
                   ) as already_submitted
            FROM BatchReleases br
            JOIN FeedbackForms ff ON br.entity_id = ff.id
            JOIN BatchStudents bs ON br.batch_id = bs.batch_id AND bs.student_id = ?
            JOIN Batches b ON br.batch_id = b.id
            LEFT JOIN Users u ON b.trainer_id = u.id
            WHERE br.release_type = 'module_feedback'
        `, [studentId, studentId]);

        // Parse form_json and map fields → questions for frontend
        const forms = released.map(row => {
            const formJson = typeof row.form_json === 'string'
                ? JSON.parse(row.form_json)
                : (row.form_json || {});
            return {
                id: row.id,
                title: row.title,
                release_id: row.release_id,
                batch_id: row.batch_id,
                module_id: row.module_id,
                due_date: row.due_date,
                trainer_name: row.trainer_name,
                already_submitted: !!row.already_submitted,
                questions: formJson.fields || [],
            };
        });

        res.json(forms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching released feedback', error: error.message });
    }
};

exports.submitFeedback = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { feedback_form_id, release_id, responses } = req.body;

        console.log('[submitFeedback] student:', studentId, 'form:', feedback_form_id, 'release:', release_id);

        if (!feedback_form_id) return res.status(400).json({ message: 'feedback_form_id is required' });
        if (!release_id)       return res.status(400).json({ message: 'release_id is required' });

        // Resolve batch_id and module_id from the BatchReleases record
        const [[release]] = await pool.query(
            'SELECT batch_id, module_id FROM BatchReleases WHERE id = ?', [release_id]
        );
        if (!release) return res.status(404).json({ message: 'Release not found for id: ' + release_id });

        // Check for duplicate submission
        const [[existing]] = await pool.query(
            'SELECT id FROM StudentFeedbackResponses WHERE student_id = ? AND form_id = ? AND batch_id = ?',
            [studentId, feedback_form_id, release.batch_id]
        );
        if (existing) return res.status(409).json({ message: 'Feedback already submitted for this form' });

        await pool.query(
            'INSERT INTO StudentFeedbackResponses (student_id, batch_id, module_id, form_id, response_json) VALUES (?, ?, ?, ?, ?)',
            [studentId, release.batch_id, release.module_id || null, feedback_form_id, JSON.stringify(responses || {})]
        );

        // Non-fatal audit log
        try {
            await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
                [studentId, 'FEEDBACK_SUBMITTED', 'StudentFeedbackResponses', feedback_form_id]);
        } catch (auditErr) {
            console.warn('[submitFeedback] AuditLog insert failed (non-fatal):', auditErr.message);
        }

        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('[submitFeedback] ERROR:', error.message, error.stack);
        res.status(500).json({ message: 'Error submitting feedback', error: error.message });
    }
};

// ── Career Readiness / Internship Eligibility ─────────────────────────────────

exports.checkInternshipEligibility = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Get student's active batch + program type
        const [batchRows] = await pool.query(`
            SELECT b.id as batch_id, b.course_id, bs.course_completion_date, bs.ready_for_interview,
                   u.program_type
            FROM Batches b
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Users u ON u.id = ?
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId, studentId]);

        if (!batchRows.length) {
            return res.json({ program_type: 'JRP', allMet: false, criteria: {}, completionEligible: false, internshipEligible: false });
        }
        const { batch_id, course_id, course_completion_date, ready_for_interview, program_type } = batchRows[0];

        // 2. Attendance
        const [attRows] = await pool.query(`
            SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
            FROM StudentAttendance WHERE student_id = ? AND batch_id = ?
        `, [studentId, batch_id]);
        const attTotal = attRows[0].total || 0;
        const attPct = attTotal > 0 ? Math.round((attRows[0].present / attTotal) * 100) : 0;

        // 3. Module projects avg >= 75% (from StudentReleaseSubmissions)
        const [projRows] = await pool.query(`
            SELECT AVG(srs.marks) as avg_marks
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id = ? AND srs.batch_id = ? AND br.release_type = 'module_project' AND srs.status = 'graded'
        `, [studentId, batch_id]);
        const projAvg = projRows[0].avg_marks ? Math.round(projRows[0].avg_marks) : 0;

        // 4. Capstone min 1 completed
        const [capRows] = await pool.query(`
            SELECT COUNT(*) as cnt
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id = ? AND srs.batch_id = ? AND br.release_type = 'capstone_project' AND srs.status = 'graded'
        `, [studentId, batch_id]);
        const capCount = capRows[0].cnt || 0;

        // 5. Test attendance 100% (all released tests have submissions)
        const [releasedTests] = await pool.query(`
            SELECT COUNT(*) as total FROM BatchReleases WHERE batch_id = ? AND release_type = 'module_test'
        `, [batch_id]);
        const [submittedTests] = await pool.query(`
            SELECT COUNT(*) as submitted
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id = ? AND srs.batch_id = ? AND br.release_type = 'module_test'
        `, [studentId, batch_id]);
        const testTotal = releasedTests[0].total || 0;
        const testSubmitted = submittedTests[0].submitted || 0;
        const testPct = testTotal > 0 ? Math.round((testSubmitted / testTotal) * 100) : 100;

        // 6. Feedback forms 100%
        const [releasedFB] = await pool.query(`
            SELECT COUNT(*) as total FROM BatchFeedbackStatus WHERE batch_id = ? AND is_released = 1
        `, [batch_id]);
        const [submittedFB] = await pool.query(`
            SELECT COUNT(*) as submitted
            FROM StudentFeedbackResponses WHERE student_id = ? AND batch_id = ?
        `, [studentId, batch_id]);
        const fbTotal = releasedFB[0].total || 0;
        const fbSubmitted = submittedFB[0].submitted || 0;
        const fbPct = fbTotal > 0 ? Math.round((fbSubmitted / fbTotal) * 100) : 100;

        // 7. Portfolio approved (check PortfolioRequests, not JobPortalRequests)
        const [portRows] = await pool.query(
            'SELECT id FROM PortfolioRequests WHERE student_id = ? AND status = ? LIMIT 1',
            [studentId, 'approved']
        );
        const portfolioApproved = portRows.length > 0;
        const portfolioStatus = portfolioApproved ? 'approved' : 'not_submitted';

        const criteria = {
            attendance:      { met: attPct >= 80,   value: attPct,      required: 80 },
            module_projects: { met: projAvg >= 75,  value: projAvg,     required: 75 },
            capstone:        { met: capCount >= 1,  value: capCount,    required: 1 },
            test_attendance: { met: testPct >= 100, value: testPct,     required: 100 },
            feedback_forms:  { met: fbPct >= 100,   value: fbPct,       required: 100 },
            portfolio:       { met: portfolioApproved, status: portfolioStatus },
        };

        const completionEligible = attPct >= 75;
        const internshipEligible = Object.values(criteria).every(c => c.met);

        res.json({
            program_type,
            criteria,
            allMet: internshipEligible,
            completionEligible,
            internshipEligible,
            course_completion_date,
            ready_for_interview: !!ready_for_interview,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error checking eligibility', error: error.message });
    }
};

exports.markReadyForInterview = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get active batch + check IOP + check eligibility
        const [batchRows] = await pool.query(`
            SELECT b.id as batch_id, u.program_type, bs.ready_for_interview
            FROM Batches b
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Users u ON u.id = ?
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId, studentId]);

        if (!batchRows.length) return res.status(400).json({ message: 'No active batch found' });
        const { batch_id, program_type, ready_for_interview } = batchRows[0];

        if (program_type !== 'IOP') return res.status(403).json({ message: 'Only IOP students can mark ready for interview' });
        if (ready_for_interview) return res.status(400).json({ message: 'Already marked as ready for interview' });

        await pool.query(
            'UPDATE BatchStudents SET course_completion_date = CURDATE(), ready_for_interview = 1 WHERE student_id = ? AND batch_id = ?',
            [studentId, batch_id]
        );

        const today = new Date().toISOString().split('T')[0];
        res.json({ message: 'Course completion date recorded', date: today });
    } catch (error) {
        res.status(500).json({ message: 'Error marking ready for interview', error: error.message });
    }
};

const generateCertificateHTML = async (type, studentName, courseName, batchName, date, studentId, photoDataUrl, portfolioQRDataUrl) => {
    const formatted = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const dateShort = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const studentIdFmt = `VS${String(studentId).padStart(5, '0')}`;

    // Read the JPG template and convert to base64
    const templateFile = type === 'internship' ? 'cert_internship.jpg' : 'cert_completion.jpg';
    const templatePath = path.join(__dirname, '../assets', templateFile);
    const imgBuffer = await fs.readFile(templatePath);
    const base64 = imgBuffer.toString('base64');

    if (type === 'completion') {
        const photoHTML = photoDataUrl
            ? `<img class="ov" src="${photoDataUrl}" style="top:20.5%;left:3.5%;width:110px;height:110px;border-radius:50%;object-fit:cover;border:4px solid #d4a017;" />`
            : '';
        return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:794px;height:1123px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;overflow:hidden}
  .wrap{position:relative;width:794px;height:1123px;overflow:hidden}
  .bg{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill}
  .ov{position:absolute;font-family:'Segoe UI',Arial,sans-serif}
</style></head>
<body><div class="wrap">
  <img class="bg" src="data:image/jpeg;base64,${base64}" />
  ${photoHTML}
  <div class="ov" style="top:43%;left:50%;transform:translateX(-50%);width:460px;text-align:center;font-size:26px;font-weight:900;color:#1a3a6b;letter-spacing:2px;">
    ${studentName.toUpperCase()}
  </div>
  <div class="ov" style="top:67.2%;left:27.5%;font-size:13px;font-weight:700;color:#1a3a6b;">${dateShort}</div>
  <div class="ov" style="top:70.8%;left:27.5%;font-size:13px;font-weight:700;color:#1a3a6b;">${studentIdFmt}</div>
  <div class="ov" style="top:74.3%;left:27.5%;font-size:13px;font-weight:700;color:#1a3a6b;">${courseName}</div>
  <div class="ov" style="top:77.8%;left:27.5%;font-size:13px;font-weight:700;color:#1a3a6b;">${batchName}</div>
</div></body></html>`;
    }

    // ── INTERNSHIP ──────────────────────────────────────────────────────────────
    const qrHTML = portfolioQRDataUrl
        ? `<img class="ov" src="${portfolioQRDataUrl}" style="top:73.5%;left:68%;width:88px;height:88px;" />`
        : '';
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:794px;height:1123px;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;overflow:hidden}
  .wrap{position:relative;width:794px;height:1123px;overflow:hidden}
  .bg{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill}
  .ov{position:absolute;font-family:'Segoe UI',Arial,sans-serif}
</style></head>
<body><div class="wrap">
  <img class="bg" src="data:image/jpeg;base64,${base64}" />
  <div class="ov" style="top:28%;left:34%;font-size:15px;font-weight:700;color:#1a3a6b;font-style:italic;">
    ${studentName}
  </div>
  <div class="ov" style="top:74.2%;left:18%;font-size:13px;font-weight:600;color:#222;">${formatted}</div>
  <div class="ov" style="top:77.5%;left:18%;font-size:13px;font-weight:600;color:#222;">${studentIdFmt}</div>
  <div class="ov" style="top:80.7%;left:18%;font-size:13px;font-weight:600;color:#222;">${courseName}</div>
  <div class="ov" style="top:83.8%;left:18%;font-size:13px;font-weight:600;color:#222;">${batchName}</div>
  ${qrHTML}
</div></body></html>`;
};

exports.generateCertificate = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { cert_type } = req.body;
        if (!['completion', 'internship'].includes(cert_type)) {
            return res.status(400).json({ message: 'cert_type must be completion or internship' });
        }

        // Get student + batch info (allow active OR completed batches)
        const [infoRows] = await pool.query(`
            SELECT u.first_name, u.last_name, u.program_type, b.id as batch_id,
                   b.batch_name, b.course_id, c.name as course_name
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            JOIN Batches b ON bs.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE u.id = ?
            ORDER BY b.id DESC
            LIMIT 1
        `, [studentId]);

        if (!infoRows.length) return res.status(400).json({ message: 'No batch found for this student' });
        const info = infoRows[0];

        // Check existing non-reset certificate
        const [existing] = await pool.query(
            'SELECT id FROM Certificates WHERE student_id = ? AND cert_type = ? AND reset_by_admin = 0',
            [studentId, cert_type]
        );
        if (existing.length) return res.status(400).json({ message: 'Certificate already generated' });

        // Check eligibility
        if (cert_type === 'internship') {
            // All criteria must be met — do a quick check
            const [attRows] = await pool.query(`
                SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
                FROM StudentAttendance WHERE student_id = ? AND batch_id = ?
            `, [studentId, info.batch_id]);
            const attPct = attRows[0].total > 0 ? (attRows[0].present / attRows[0].total) * 100 : 0;
            if (attPct < 80) return res.status(403).json({ message: 'Attendance requirement not met (80% required)' });
        } else {
            const [attRows] = await pool.query(`
                SELECT COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
                FROM StudentAttendance WHERE student_id = ? AND batch_id = ?
            `, [studentId, info.batch_id]);
            const attPct = attRows[0].total > 0 ? (attRows[0].present / attRows[0].total) * 100 : 0;
            if (attPct < 75) return res.status(403).json({ message: 'Attendance requirement not met (75% required)' });
        }

        const studentName = `${info.first_name} ${info.last_name}`;

        // Fetch profile photo
        const [photoRows] = await pool.query('SELECT profile_photo FROM Users WHERE id = ?', [studentId]);
        const photoDataUrl = photoRows[0]?.profile_photo || null;

        // Fetch approved portfolio link and generate QR (internship only)
        let portfolioQRDataUrl = null;
        if (cert_type === 'internship') {
            try {
                const QRCode = require('qrcode');
                const [portRows] = await pool.query(
                    'SELECT portfolio_link FROM PortfolioRequests WHERE student_id = ? AND status = ? ORDER BY id DESC LIMIT 1',
                    [studentId, 'approved']
                );
                const portfolioLink = portRows[0]?.portfolio_link;
                if (portfolioLink) {
                    portfolioQRDataUrl = await QRCode.toDataURL(portfolioLink, { width: 88, margin: 1 });
                }
            } catch (qrErr) {
                console.error('[Certificate] QR generation skipped:', qrErr.message);
            }
        }

        const html = await generateCertificateHTML(cert_type, studentName, info.course_name, info.batch_name, new Date(), studentId, photoDataUrl, portfolioQRDataUrl);

        // Store as HTML in cert_data — include original schema columns to satisfy NOT NULL constraints
        const htmlBuffer = Buffer.from(html);
        const legacyType = cert_type === 'internship' ? 'internship' : 'course_completion';
        const today = new Date().toISOString().split('T')[0];
        const [result] = await pool.query(
            `INSERT INTO Certificates
                (student_id, course_id, type, issued_date, issued_by, cert_type, program_type, generated_at, cert_data, certificate_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, '')`,
            [studentId, info.course_id, legacyType, today, studentId, cert_type, info.program_type || 'JRP', htmlBuffer]
        );

        res.json({ message: 'Certificate generated', certificate_id: result.insertId, html });
    } catch (error) {
        console.error('[Certificate] generateCertificate error:', error.message, error.stack);
        res.status(500).json({ message: 'Error generating certificate', error: error.message });
    }
};

// ── Upload / update profile photo (stored as base64 data URL) ────────────────
exports.uploadProfilePhoto = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { photo } = req.body; // base64 data URL: "data:image/jpeg;base64,..."
        if (!photo) return res.status(400).json({ message: 'No photo provided' });
        if (!photo.startsWith('data:image/')) return res.status(400).json({ message: 'Invalid image format' });
        // Limit size: max ~2MB encoded
        if (photo.length > 2_800_000) return res.status(400).json({ message: 'Photo too large (max ~2MB)' });
        await pool.query('UPDATE Users SET profile_photo = ? WHERE id = ?', [photo, studentId]);
        res.json({ message: 'Profile photo saved' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving photo', error: error.message });
    }
};

exports.getCertificates = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [certs] = await pool.query(
            'SELECT id, cert_type, program_type, generated_at, reset_by_admin FROM Certificates WHERE student_id = ?',
            [studentId]
        );
        res.json({ certificates: certs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching certificates', error: error.message });
    }
};

exports.downloadCertificate = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { id } = req.params;
        const [rows] = await pool.query(
            'SELECT cert_data, cert_type FROM Certificates WHERE id = ? AND student_id = ?',
            [id, studentId]
        );
        if (!rows.length || !rows[0].cert_data) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        const html = rows[0].cert_data.toString('utf8');
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${rows[0].cert_type}_certificate.html"`);
        res.send(html);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading certificate', error: error.message });
    }
};

// ── Sidebar notification counts ───────────────────────────────────────────────
exports.getNotificationCounts = async (req, res) => {
    try {
        const id = req.user.id;
        const [[{ pendingLeaves }]] = await pool.query(
            "SELECT COUNT(*) AS pendingLeaves FROM StudentLeaves WHERE student_id = ? AND status = 'pending'", [id]);
        const [[{ unresolvedDoubts }]] = await pool.query(
            "SELECT COUNT(*) AS unresolvedDoubts FROM StudentDoubts WHERE student_id = ? AND status != 'resolved'", [id]);
        const [[{ openIssues }]] = await pool.query(
            "SELECT COUNT(*) AS openIssues FROM StudentIssues WHERE student_id = ? AND status != 'resolved'", [id]);
        res.json({ pendingLeaves, unresolvedDoubts, openIssues });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notification counts', error: error.message });
    }
};
