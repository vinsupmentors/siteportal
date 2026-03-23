const pool = require('../config/db');

// ==========================================
// TRAINER SPECIFIC WORKFLOWS
// ==========================================

// Calendar — returns trainer's batches, tasks, and KRA entries
exports.getMyCalendar = async (req, res) => {
    try {
        const trainerId = req.user.id;
        console.log('Fetching calendar for trainer:', trainerId);
        const [batches] = await pool.query(`
            SELECT b.*, c.name as course_name
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            WHERE b.trainer_id = ? AND b.status IN ('active', 'upcoming', 'completed')
        `, [trainerId]);
        console.log('Batches found:', batches.length);
        const [tasks] = await pool.query('SELECT * FROM TrainerTasks WHERE trainer_id = ? ORDER BY due_date ASC', [trainerId]);
        const month = req.query.month || (new Date().getMonth() + 1);
        const year = req.query.year || new Date().getFullYear();
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
        const [kras] = await pool.query(
            'SELECT * FROM TrainerKRA WHERE trainer_id = ? AND date BETWEEN ? AND ?',
            [trainerId, startDate, endDate]
        );
        const [otherWorks] = await pool.query(
            'SELECT * FROM TrainerOtherWorks WHERE trainer_id = ? AND date BETWEEN ? AND ?',
            [trainerId, startDate, endDate]
        );
        res.json({ batches, tasks, kras, otherWorks });
    } catch (error) {
        res.status(500).json({ message: 'Calendar fetch error', error: error.message });
    }
};

// View assigned tasks
exports.getMyTasks = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const [tasks] = await pool.query('SELECT * FROM TrainerTasks WHERE trainer_id = ? ORDER BY due_date ASC', [trainerId]);
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: 'Server fault retrieving tasks.', error: error.message });
    }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        await pool.query('UPDATE TrainerTasks SET status = ? WHERE id = ? AND trainer_id = ?', [status, taskId, req.user.id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, `UPDATE_TASK_STATUS_${status.toUpperCase()}`, 'TrainerTasks', taskId]
        );

        res.status(200).json({ message: 'Task pipeline status updated.' });
    } catch (error) {
        res.status(500).json({ message: 'Server fault updating task.', error: error.message });
    }
};

// Submit task for review with notes
exports.submitTaskForReview = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { review_notes } = req.body;
        await pool.query(
            'UPDATE TrainerTasks SET status = ?, review_notes = ?, review_date = NOW() WHERE id = ? AND trainer_id = ?',
            ['review', review_notes, taskId, req.user.id]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'SUBMIT_FOR_REVIEW', 'TrainerTasks', taskId]
        );
        res.json({ message: 'Task submitted for review' });
    } catch (error) {
        res.status(500).json({ message: 'Submit review error', error: error.message });
    }
};

// ==========================================
// TRAINER ANNOUNCEMENTS
// ==========================================
exports.getAnnouncements = async (req, res) => {
    try {
        const [announcements] = await pool.query(`
            SELECT a.*,
                (SELECT COUNT(*) FROM AnnouncementAcknowledgements WHERE announcement_id = a.id) as acknowledged_count,
                (SELECT COUNT(DISTINCT bs.student_id) FROM BatchStudents bs 
                 JOIN Users u ON bs.student_id = u.id 
                 WHERE bs.batch_id = a.target_batch_id AND u.status = 'active') as total_target_audience,
                b.batch_name as target_batch_name
            FROM Announcements a
            LEFT JOIN Batches b ON a.target_batch_id = b.id
            WHERE a.created_by = ?
            ORDER BY a.created_at DESC
            LIMIT 50
        `, [req.user.id]);

        // Ensure recipient_count is mapped for frontend UI backwards compatibility
        const mapped = announcements.map(a => ({
            ...a,
            recipient_count: a.total_target_audience
        }));
        res.json({ announcements: mapped });
    } catch (error) {
        res.status(500).json({ message: 'Announcements fetch error', error: error.message });
    }
};

exports.broadcastAnnouncement = async (req, res) => {
    try {
        const { title, message, batch_id } = req.body;

        // Ensure the trainer actually owns the batch they are broadcasting to
        const [batchCheck] = await pool.query("SELECT id FROM Batches WHERE id = ? AND trainer_id = ? AND status IN ('active', 'upcoming')", [batch_id, req.user.id]);
        if (batchCheck.length === 0) {
            return res.status(403).json({ message: 'Unauthorized to broadcast to this batch' });
        }

        const [result] = await pool.query(
            'INSERT INTO Announcements (title, message, target_role, target_batch_id, created_by) VALUES (?, ?, ?, ?, ?)',
            [title, message, 'batch', batch_id, req.user.id]
        );

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'TRAINER_BROADCAST', 'Announcements', result.insertId]);

        // Send email to all active students in the batch (fire-and-forget)
        try {
            const emailService = require('../utils/email.service');
            const [trainer] = await pool.query('SELECT first_name, last_name FROM Users WHERE id = ?', [req.user.id]);
            const senderName = trainer.length ? `${trainer[0].first_name} ${trainer[0].last_name}` : 'Your Trainer';
            const [students] = await pool.query(
                'SELECT u.email, CONCAT(u.first_name, \' \', u.last_name) as name FROM Users u JOIN BatchStudents bs ON u.id = bs.student_id WHERE bs.batch_id = ? AND u.status = ?',
                [batch_id, 'active']
            );
            emailService.sendAnnouncementEmail(students, title, message, senderName);
        } catch (_) {}

        res.status(201).json({ message: 'Announcement broadcast successfully to your batch' });
    } catch (error) {
        res.status(500).json({ message: 'Broadcast error', error: error.message });
    }
};

// Submit KRA entry (daily class coverage) — supports per-session entries
exports.submitKRA = async (req, res) => {
    try {
        const { batch_id, date, topics_covered, notes, session } = req.body;
        const trainerId = req.user.id;
        const sessionVal = session || 'morning';
        // Upsert on (trainer, batch, date, session)
        const [existing] = await pool.query(
            'SELECT id FROM TrainerKRA WHERE trainer_id = ? AND batch_id = ? AND date = ? AND session = ?',
            [trainerId, batch_id, date, sessionVal]
        );
        if (existing.length > 0) {
            await pool.query('UPDATE TrainerKRA SET topics_covered = ?, notes = ? WHERE id = ?',
                [topics_covered, notes, existing[0].id]);
        } else {
            await pool.query(
                'INSERT INTO TrainerKRA (trainer_id, batch_id, date, session, topics_covered, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [trainerId, batch_id, date, sessionVal, topics_covered, notes]
            );
        }
        res.json({ message: 'KRA entry saved' });
    } catch (error) {
        res.status(500).json({ message: 'KRA save error', error: error.message });
    }
};

// Submit Other Work entry
exports.submitOtherWork = async (req, res) => {
    try {
        const { date, title, description, time_spent } = req.body;
        const trainerId = req.user.id;

        await pool.query(
            'INSERT INTO TrainerOtherWorks (trainer_id, date, title, description, time_spent) VALUES (?, ?, ?, ?, ?)',
            [trainerId, date, title, description, time_spent]
        );

        res.json({ message: 'Other work entry saved' });
    } catch (error) {
        res.status(500).json({ message: 'Other work save error', error: error.message });
    }
};

// Get KRA entries (now includes session)
exports.getMyKRA = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const [kras] = await pool.query(`
            SELECT k.*, b.batch_name, b.timing, c.name as course_name
            FROM TrainerKRA k
            JOIN Batches b ON k.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE k.trainer_id = ?
            ORDER BY k.date DESC
        `, [trainerId]);
        res.json({ kras });
    } catch (error) {
        res.status(500).json({ message: 'KRA fetch error', error: error.message });
    }
};

// Resolving technical Doubts raised by students
exports.resolveDoubt = async (req, res) => {
    try {
        const { doubtId } = req.params;
        const { response_text } = req.body;
        await pool.query(
            "UPDATE StudentDoubts SET status = 'resolved', response_text = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND trainer_id = ?",
            [response_text, doubtId, req.user.id]
        );
        res.status(200).json({ message: 'Technical ticket resolved successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server fault resolving ticket.', error: error.message });
    }
};

// Fetch Student Doubts — supports batch filtering + pagination
exports.getStudentDoubts = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const { batch_id, status, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let where = 'sd.trainer_id = ?';
        const params = [trainerId];
        if (batch_id) { where += ' AND sd.batch_id = ?'; params.push(batch_id); }
        if (status) { where += ' AND sd.status = ?'; params.push(status); }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM StudentDoubts sd WHERE ${where}`, params
        );

        const [doubts] = await pool.query(`
            SELECT sd.*, 
                   s.first_name as student_name, s.email as student_email,
                   b.batch_name, b.timing as batch_timing
            FROM StudentDoubts sd
            JOIN Users s ON sd.student_id = s.id
            JOIN Batches b ON sd.batch_id = b.id
            WHERE ${where}
            ORDER BY sd.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        res.status(200).json({
            doubts,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server fault fetching student doubts.', error: error.message });
    }
};

// ==========================================
// DYNAMIC FEEDBACK SYSTEM (TRAINER)
// ==========================================

exports.releaseFeedback = async (req, res) => {
    try {
        const { batch_id, module_id, form_id } = req.body;
        const trainer_id = req.user.id;

        // Verify batch ownership
        const [batchCheck] = await pool.query('SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batch_id, trainer_id]);
        if (batchCheck.length === 0) {
            return res.status(403).json({ message: 'Unauthorized to release feedback for this batch' });
        }

        // Upsert release status
        await pool.query(`
            INSERT INTO BatchFeedbackStatus (batch_id, module_id, form_id, is_released, released_at)
            VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE is_released = TRUE, released_at = CURRENT_TIMESTAMP
        `, [batch_id, module_id, form_id]);

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [trainer_id, 'FEEDBACK_RELEASED', 'BatchFeedbackStatus', batch_id]);

        res.json({ message: 'Feedback form released to students successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error releasing feedback', error: error.message });
    }
};
// Get Trainer Dashboard KPIs
exports.getTrainerDashboard = async (req, res) => {
    try {
        const trainerId = req.user.id;

        // 1. Active Batches Count
        const [[{ activeBatches }]] = await pool.query(
            "SELECT COUNT(*) as activeBatches FROM Batches WHERE trainer_id = ? AND status = 'active'",
            [trainerId]
        );

        // 2. Total Students under this trainer
        const [[{ totalStudents }]] = await pool.query(`
            SELECT COUNT(DISTINCT bs.student_id) as totalStudents
            FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            WHERE b.trainer_id = ? AND b.status = 'active'
        `, [trainerId]);

        // 3. Pending Doubts
        const [[{ pendingDoubts }]] = await pool.query(
            "SELECT COUNT(*) as pendingDoubts FROM StudentDoubts WHERE trainer_id = ? AND status = 'pending'",
            [trainerId]
        );

        // 4. Tasks Status
        const [tasks] = await pool.query(
            'SELECT status, COUNT(*) as count FROM TrainerTasks WHERE trainer_id = ? GROUP BY status',
            [trainerId]
        );

        // 5. Monthly KRA Submission Progress (Current Month)
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        const [[{ kraCount }]] = await pool.query(
            'SELECT COUNT(*) as kraCount FROM TrainerKRA WHERE trainer_id = ? AND MONTH(date) = ? AND YEAR(date) = ?',
            [trainerId, month, year]
        );

        // 6. Today's Schedule (Simplified)
        const [schedule] = await pool.query(`
            SELECT b.*, c.name as course_name 
            FROM Batches b 
            JOIN Courses c ON b.course_id = c.id
            WHERE b.trainer_id = ? AND b.status = 'active'
        `, [trainerId]);

        res.json({
            stats: {
                activeBatches,
                totalStudents,
                pendingDoubts,
                kraCompletion: kraCount,
                tasks: tasks.reduce((acc, t) => ({ ...acc, [t.status]: t.count }), {})
            },
            schedule
        });
    } catch (error) {
        res.status(500).json({ message: 'Dashboard stats error', error: error.message });
    }
};

// Get students for a specific batch (verify ownership)
exports.getBatchStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const [batch] = await pool.query('SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [id, req.user.id]);

        if (batch.length === 0) {
            return res.status(403).json({ message: 'Unauthorized access to this batch' });
        }

        const [students] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.student_status
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            WHERE bs.batch_id = ? AND u.status = 'active'
            ORDER BY u.first_name ASC
        `, [id]);

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Batch students fetch error', error: error.message });
    }
};

// Bulk Mark Attendance
exports.markStudentAttendance = async (req, res) => {
    try {
        const { batch_id, date, attendance } = req.body; // attendance: [{student_id, status, notes}]
        const trainerId = req.user.id;

        // Verify batch ownership
        const [batch] = await pool.query('SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batch_id, trainerId]);
        if (batch.length === 0) return res.status(403).json({ message: 'Unauthorized' });

        const values = attendance.map(a => [a.student_id, batch_id, date, a.status, a.notes || null]);

        await pool.query(`
            INSERT INTO StudentAttendance (student_id, batch_id, attendance_date, status, notes)
            VALUES ?
            ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes)
        `, [values]);

        // Auto-update student status based on leave/absent count
        const studentIds = attendance.map(a => a.student_id);
        if (studentIds.length > 0) {
            await pool.query(`
                UPDATE Users u
                LEFT JOIN (
                    SELECT student_id, COUNT(*) as leave_count 
                    FROM StudentAttendance 
                    WHERE status IN ('absent', 'leave') 
                    GROUP BY student_id
                ) a ON u.id = a.student_id
                SET u.student_status = 
                    CASE 
                        WHEN COALESCE(a.leave_count, 0) > 8 THEN 'Dropout'
                        WHEN COALESCE(a.leave_count, 0) > 4 THEN 'Irregular'
                        ELSE 'Regular'
                    END
                WHERE u.id IN (?) 
                  AND u.student_status NOT IN ('Batch Transfer', 'Course Completed')
            `, [studentIds]);
        }

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [trainerId, 'BULK_ATTENDANCE_MARKED', 'StudentAttendance', batch_id]
        );

        res.json({ message: 'Attendance recorded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Attendance marking error', error: error.message });
    }
};

// Get Attendance for a batch on a date
exports.getBatchAttendance = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { date } = req.query;

        const [records] = await pool.query(`
            SELECT sa.*, u.first_name, u.last_name, u.email
            FROM StudentAttendance sa
            JOIN Users u ON sa.student_id = u.id
            WHERE sa.batch_id = ? AND sa.attendance_date = ?
        `, [batchId, date]);

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Fetch attendance error', error: error.message });
    }
};

// ==========================================
// CONTENT UNLOCK MANAGEMENT (Batch-Level)
// ==========================================

// Get full curriculum tree for a batch with current unlock state
exports.getBatchCurriculum = async (req, res) => {
    try {
        const { batchId } = req.params;
        const trainerId = req.user.id;

        // Verify batch ownership
        const [batch] = await pool.query(
            'SELECT b.id, b.course_id, c.name as course_name FROM Batches b JOIN Courses c ON b.course_id = c.id WHERE b.id = ? AND b.trainer_id = ?',
            [batchId, trainerId]
        );
        if (!batch.length) return res.status(403).json({ message: 'Unauthorized access to this batch' });

        const courseId = batch[0].course_id;

        // Get all modules for the course (including resource URLs)
        const [modules] = await pool.query(
            'SELECT id, name, sequence_order, module_project_details, study_material_url, test_url, interview_questions_url FROM Modules WHERE course_id = ? ORDER BY sequence_order',
            [courseId]
        );

        if (!modules.length) return res.json({ course: batch[0].course_name, modules: [] });

        const moduleIds = modules.map(m => m.id);
        const placeholders = moduleIds.map(() => '?').join(',');

        // Get all days
        const [days] = await pool.query(
            `SELECT id, module_id, day_number, topic_name FROM Days WHERE module_id IN (${placeholders}) ORDER BY module_id, day_number`,
            moduleIds
        );

        // Get current unlock state
        const [unlocks] = await pool.query(
            `SELECT module_id, unlocked_up_to_day, is_projects_released, is_test_released, is_feedback_released, is_study_materials_released, is_interview_questions_released FROM BatchUnlocks WHERE batch_id = ? AND module_id IN (${placeholders})`,
            [batchId, ...moduleIds]
        );
        const unlockMap = {};
        unlocks.forEach(u => { unlockMap[u.module_id] = u; });

        // Get feedback forms for modules
        const [feedbackForms] = await pool.query(
            `SELECT id, module_id, title FROM FeedbackForms WHERE module_id IN (${placeholders})`,
            moduleIds
        );
        const feedbackFormMap = {};
        feedbackForms.forEach(f => { feedbackFormMap[f.module_id] = f; });

        // Get Module Projects
        const [projects] = await pool.query(
            `SELECT * FROM ModuleProjects WHERE module_id IN (${placeholders})`,
            moduleIds
        );
        const projectIds = projects.map(p => p.id);

        // Get Content Files for Modules and Projects
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

        // Get Feedback Forms linked to these modules
        const [feedbackForms] = await pool.query(
            `SELECT id, module_id, title FROM FeedbackForms WHERE module_id IN (${placeholders})`,
            moduleIds
        );
        const feedbackFormMap = {};
        feedbackForms.forEach(f => { feedbackFormMap[f.module_id] = f; });

        const modulesWithState = modules.map(mod => {
            const modDays = days.filter(d => d.module_id === mod.id);
            const totalDays = modDays.length;
            const unlockData = unlockMap[mod.id];
            const isUnlocked = unlockData !== undefined;
            const unlockedUpToDay = isUnlocked ? unlockData.unlocked_up_to_day : 0;

            // Map projects and files to this module
            const modProjects = projects.filter(p => p.module_id === mod.id).map(p => ({
                ...p,
                files: projectFiles.filter(f => f.entity_id === p.id)
            }));
            const modFiles = moduleFiles.filter(f => f.entity_type === 'module' && f.entity_id === mod.id);

            return {
                ...mod,
                total_days: totalDays,
                is_unlocked: isUnlocked,
                unlocked_up_to_day: isUnlocked ? unlockedUpToDay : 0,
                projects: modProjects,
                files: modFiles,
                feedback_form: feedbackFormMap[mod.id] || null,
                feedback: feedbackFormMap[mod.id] || null,
                // Granular flags
                is_projects_released: !!(unlockData?.is_projects_released),
                is_test_released: !!(unlockData?.is_test_released),
                is_feedback_released: !!(unlockData?.is_feedback_released),
                is_study_materials_released: !!(unlockData?.is_study_materials_released),
                is_interview_questions_released: !!(unlockData?.is_interview_questions_released),
                days: modDays.map(d => ({
                    ...d,
                    is_unlocked: isUnlocked && (unlockedUpToDay === -1 || d.day_number <= unlockedUpToDay),
                })),
            };
        });

        res.json({ course: batch[0].course_name, modules: modulesWithState });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching batch curriculum', error: error.message });
    }
};

// Unlock a module (or update unlocked_up_to_day / granular flags) for a batch
exports.unlockModule = async (req, res) => {
    try {
        const { batchId } = req.params;
        const {
            module_id,
            unlocked_up_to_day,
            is_projects_released,
            is_test_released,
            is_feedback_released,
            is_study_materials_released,
            is_interview_questions_released
        } = req.body;
        const trainerId = req.user.id;

        // Verify batch ownership
        const [batch] = await pool.query('SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batchId, trainerId]);
        if (!batch.length) return res.status(403).json({ message: 'Unauthorized' });

        // Build dynamically if some fields are missing in body (to support fine-grained updates)
        const updateFields = [];
        const values = [];

        if (unlocked_up_to_day !== undefined) { updateFields.push('unlocked_up_to_day = VALUES(unlocked_up_to_day)'); }
        if (is_projects_released !== undefined) { updateFields.push('is_projects_released = VALUES(is_projects_released)'); }
        if (is_test_released !== undefined) { updateFields.push('is_test_released = VALUES(is_test_released)'); }
        if (is_feedback_released !== undefined) { updateFields.push('is_feedback_released = VALUES(is_feedback_released)'); }
        if (is_study_materials_released !== undefined) { updateFields.push('is_study_materials_released = VALUES(is_study_materials_released)'); }
        if (is_interview_questions_released !== undefined) { updateFields.push('is_interview_questions_released = VALUES(is_interview_questions_released)'); }

        // Always update metadata
        updateFields.push('unlocked_by = VALUES(unlocked_by)', 'unlocked_at = CURRENT_TIMESTAMP');

        await pool.query(`
            INSERT INTO BatchUnlocks (
                batch_id, module_id, unlocked_up_to_day, 
                is_projects_released, is_test_released, is_feedback_released, 
                is_study_materials_released, is_interview_questions_released, 
                unlocked_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ${updateFields.join(', ')}
        `, [
            batchId, module_id,
            unlocked_up_to_day ?? 0,
            is_projects_released ?? 0,
            is_test_released ?? 0,
            is_feedback_released ?? 0,
            is_study_materials_released ?? 0,
            is_interview_questions_released ?? 0,
            trainerId
        ]);

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [trainerId, 'UNLOCK_MODULE_CONFIG', 'BatchUnlocks', module_id]);

        res.json({ message: 'Content access configuration updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating content access', error: error.message });
    }
};

// Lock a module for a batch (remove unlock record)
exports.lockModule = async (req, res) => {
    try {
        const { batchId, moduleId } = req.params;
        const trainerId = req.user.id;

        // Verify batch ownership
        const [batch] = await pool.query('SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batchId, trainerId]);
        if (!batch.length) return res.status(403).json({ message: 'Unauthorized' });

        await pool.query('DELETE FROM BatchUnlocks WHERE batch_id = ? AND module_id = ?', [batchId, moduleId]);

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [trainerId, 'LOCK_MODULE', 'BatchUnlocks', moduleId]);

        res.json({ message: 'Module locked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error locking module', error: error.message });
    }
};

// ==========================================
// SUBMISSIONS & GRADING
// ==========================================

// Get all submissions for a batch
exports.getBatchSubmissions = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { type, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const trainerId = req.user.id;

        // Verify batch ownership
        const [batch] = await pool.query('SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batchId, trainerId]);
        if (!batch.length) return res.status(403).json({ message: 'Unauthorized' });

        let where = 'b.id = ?';
        const params = [batchId];
        if (type) { where += ' AND s.submission_type = ?'; params.push(type); }

        const [[{ total }]] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM Submissions s
            JOIN Users u ON s.student_id = u.id
            JOIN BatchStudents bs ON u.id = bs.student_id
            JOIN Batches b ON bs.batch_id = b.id
            WHERE ${where}
        `, params);

        const [submissions] = await pool.query(`
            SELECT s.*, u.first_name, u.last_name, u.email,
                   m.name as module_name, d.day_number, d.topic_name
            FROM Submissions s
            JOIN Users u ON s.student_id = u.id
            JOIN BatchStudents bs ON u.id = bs.student_id
            JOIN Batches b ON bs.batch_id = b.id
            LEFT JOIN Modules m ON s.module_id = m.id
            LEFT JOIN Days d ON s.day_id = d.id
            WHERE ${where}
            ORDER BY s.submitted_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        res.json({
            submissions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
};

// Grade a submission
exports.gradeSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { marks, feedback } = req.body;
        const trainerId = req.user.id;

        // In a real app, verify trainer has access to this student/submission
        await pool.query(
            'UPDATE Submissions SET marks = ?, feedback = ?, graded_by = ? WHERE id = ?',
            [marks, feedback, trainerId, id]
        );

        res.json({ message: 'Submission graded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error grading submission', error: error.message });
    }
};

// ==========================================
// STUDENT REMARKS
// ==========================================

// Add a remark for a student
exports.addStudentRemark = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;
        const { remark_text, remark_type } = req.body;
        const trainerId = req.user.id;

        await pool.query(
            'INSERT INTO StudentRemarks (student_id, batch_id, trainer_id, remark_text, remark_type) VALUES (?, ?, ?, ?, ?)',
            [studentId, batchId, trainerId, remark_text, remark_type || 'neutral']
        );

        res.json({ message: 'Remark added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding remark', error: error.message });
    }
};

// Update student status (Trainer)
exports.updateStudentStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { student_status } = req.body;
        const trainerId = req.user.id;

        // Verify trainer teaches this student
        const [authCheck] = await pool.query(`
            SELECT 1 FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            WHERE bs.student_id = ? AND b.trainer_id = ?
        `, [studentId, trainerId]);

        if (authCheck.length === 0) return res.status(403).json({ message: 'Unauthorized. Student not in your batch.' });

        await pool.query('UPDATE Users SET student_status = ? WHERE id = ?', [student_status, studentId]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [trainerId, 'TRAINER_UPDATE_STUDENT_STATUS', 'Users', studentId]);

        res.json({ message: 'Student status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating student status', error: error.message });
    }
};


// Get remarks for a student
exports.getStudentRemarks = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;
        const [remarks] = await pool.query(`
            SELECT r.*, u.first_name as trainer_name
            FROM StudentRemarks r
            JOIN Users u ON r.trainer_id = u.id
            WHERE r.batch_id = ? AND r.student_id = ?
            ORDER BY r.created_at DESC
        `, [batchId, studentId]);

        res.json(remarks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching remarks', error: error.message });
    }
};

// Delete a remark
exports.deleteStudentRemark = async (req, res) => {
    try {
        const { remarkId } = req.params;
        const trainerId = req.user.id;

        // Only allow deleting own remarks
        const [result] = await pool.query('DELETE FROM StudentRemarks WHERE id = ? AND trainer_id = ?', [remarkId, trainerId]);

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'Unauthorized or remark not found' });
        }

        res.json({ message: 'Remark deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting remark', error: error.message });
    }
};

// Get student performance overview
exports.getStudentPerformance = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;

        // Get student info
        const [student] = await pool.query('SELECT first_name, last_name, email, student_status FROM Users WHERE id = ?', [studentId]);

        // Get all submissions
        const [submissions] = await pool.query(`
            SELECT s.*, m.name as module_name, d.day_number
            FROM Submissions s
            LEFT JOIN Modules m ON s.module_id = m.id
            LEFT JOIN Days d ON s.day_id = d.id
            WHERE s.student_id = ?
            ORDER BY s.submitted_at DESC
        `, [studentId]);

        // Get attendance stats for this batch
        const [[attendance]] = await pool.query(`
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days
            FROM StudentAttendance
            WHERE batch_id = ? AND student_id = ?
        `, [batchId, studentId]);

        res.json({
            student: student[0],
            submissions,
            attendance: {
                percentage: attendance.total_days > 0 ? (attendance.present_days / attendance.total_days) * 100 : 0,
                total: attendance.total_days,
                present: attendance.present_days
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching performance', error: error.message });
    }
};

// ==========================================
// TRAINER LEAVES
// ==========================================

// Request Leave
exports.requestLeave = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const { start_date, end_date, reason, leave_type, session } = req.body;

        if (!start_date || !end_date || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        await pool.query(`
            INSERT INTO TrainerLeaves (trainer_id, start_date, end_date, reason, leave_type, session)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [trainerId, start_date, end_date, reason, leave_type || 'casual', session || 'full_day']);

        res.status(201).json({ message: 'Leave request submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting leave request', error: error.message });
    }
};

// Get My Leaves
exports.getMyLeaves = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const [leaves] = await pool.query(`
            SELECT * FROM TrainerLeaves
            WHERE trainer_id = ?
            ORDER BY created_at DESC
        `, [trainerId]);

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave history', error: error.message });
    }
};

// ── Student Leave Requests (trainer view) ────────────────────────────────────

// GET /trainer/student-leaves — all leave requests from students in trainer's batches
exports.getStudentLeaves = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const [leaves] = await pool.query(`
            SELECT sl.*,
                CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                u.email AS student_email,
                b.batch_name
            FROM StudentLeaves sl
            JOIN Users u ON sl.student_id = u.id
            JOIN Batches b ON sl.batch_id = b.id
            WHERE b.trainer_id = ?
            ORDER BY sl.created_at DESC
        `, [trainerId]);
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student leaves', error: error.message });
    }
};

// PATCH /trainer/student-leaves/:leaveId — approve or reject a student leave
exports.updateStudentLeaveStatus = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const { leaveId } = req.params;
        const { status, trainer_note } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected' });
        }

        const [rows] = await pool.query(`
            SELECT sl.id FROM StudentLeaves sl
            JOIN Batches b ON sl.batch_id = b.id
            WHERE sl.id = ? AND b.trainer_id = ?
        `, [leaveId, trainerId]);

        if (!rows.length) {
            return res.status(403).json({ message: 'Not authorised to update this leave' });
        }

        await pool.query(
            'UPDATE StudentLeaves SET status = ?, trainer_note = ? WHERE id = ?',
            [status, trainer_note || null, leaveId]
        );
        res.json({ message: `Leave ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave status', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER: GET STUDENT REPORT CARD (module-wise marks + trainer review)
// ══════════════════════════════════════════════════════════════════════════════
exports.getStudentReportCard = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;
        const trainerId = req.user.id;

        // Verify trainer owns this batch
        const [batchCheck] = await pool.query(
            'SELECT b.id, b.course_id FROM Batches b WHERE b.id = ? AND b.trainer_id = ?',
            [batchId, trainerId]
        );
        if (!batchCheck.length) return res.status(403).json({ message: 'Unauthorized' });

        const courseId = batchCheck[0].course_id;

        // All modules for this course
        const [modules] = await pool.query(
            'SELECT id, name, sequence_order FROM Modules WHERE course_id = ? ORDER BY sequence_order',
            [courseId]
        );

        if (!modules.length) return res.json({ modules: [] });

        // All release submissions (graded) for this student in this batch
        const [submissions] = await pool.query(`
            SELECT srs.marks, srs.feedback, srs.status, br.release_type, br.entity_id, br.module_id
            FROM StudentReleaseSubmissions srs
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.student_id = ? AND srs.batch_id = ? AND srs.marks IS NOT NULL
        `, [studentId, batchId]);

        // All existing module reviews written by this trainer for this student
        const [reviews] = await pool.query(
            'SELECT * FROM StudentModuleReviews WHERE student_id = ? AND batch_id = ?',
            [studentId, batchId]
        );
        const reviewMap = {};
        reviews.forEach(r => { reviewMap[r.module_id] = r; });

        // Build per-module data
        const moduleData = modules.map(m => {
            // Test marks: release_type='module_test', entity_id = module.id
            const testSub = submissions.find(s => s.release_type === 'module_test' && s.entity_id === m.id);
            // Project marks: release_type='module_project', module_id = module.id (may have multiple)
            const projectSubs = submissions.filter(s => s.release_type === 'module_project' && s.module_id === m.id);
            const avgProjectMarks = projectSubs.length
                ? Math.round(projectSubs.reduce((acc, s) => acc + parseFloat(s.marks || 0), 0) / projectSubs.length)
                : null;

            return {
                ...m,
                test_marks: testSub ? parseFloat(testSub.marks) : null,
                project_marks: avgProjectMarks,
                project_count: projectSubs.length,
                review: reviewMap[m.id] || null,
            };
        });

        res.json({ modules: moduleData });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching report card', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER: UPSERT MODULE REVIEW (report card entry)
// ══════════════════════════════════════════════════════════════════════════════
exports.upsertModuleReview = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;
        const trainerId = req.user.id;
        const { module_id, overall_marks, grade, strengths, improvements, overall_comment } = req.body;

        // Verify trainer owns this batch
        const [batchCheck] = await pool.query(
            'SELECT id FROM Batches WHERE id = ? AND trainer_id = ?',
            [batchId, trainerId]
        );
        if (!batchCheck.length) return res.status(403).json({ message: 'Unauthorized' });

        await pool.query(`
            INSERT INTO StudentModuleReviews
                (student_id, batch_id, module_id, trainer_id, overall_marks, grade, strengths, improvements, overall_comment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                trainer_id = VALUES(trainer_id),
                overall_marks = VALUES(overall_marks),
                grade = VALUES(grade),
                strengths = VALUES(strengths),
                improvements = VALUES(improvements),
                overall_comment = VALUES(overall_comment),
                updated_at = NOW()
        `, [studentId, batchId, module_id, trainerId,
            overall_marks || null, grade || null,
            strengths || null, improvements || null, overall_comment || null]);

        res.json({ message: 'Module review saved' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving module review', error: error.message });
    }
};

// ── Sidebar notification counts ───────────────────────────────────────────────
exports.getNotificationCounts = async (req, res) => {
    try {
        const id = req.user.id;
        const [[{ pendingDoubts }]] = await pool.query(
            "SELECT COUNT(*) AS pendingDoubts FROM StudentDoubts WHERE trainer_id = ? AND status = 'pending'", [id]);
        const [[{ pendingStudentLeaves }]] = await pool.query(`
            SELECT COUNT(*) AS pendingStudentLeaves FROM StudentLeaves sl
            JOIN Batches b ON sl.batch_id = b.id WHERE b.trainer_id = ? AND sl.status = 'pending'`, [id]);
        const [[{ ungradedSubmissions }]] = await pool.query(`
            SELECT COUNT(*) AS ungradedSubmissions FROM StudentReleaseSubmissions srs
            JOIN Batches b ON srs.batch_id = b.id
            WHERE b.trainer_id = ? AND srs.marks IS NULL AND srs.status = 'submitted'`, [id]);
        const [[{ pendingTasks }]] = await pool.query(
            "SELECT COUNT(*) AS pendingTasks FROM TrainerTasks WHERE trainer_id = ? AND status = 'assigned'", [id]);
        res.json({ pendingDoubts, pendingStudentLeaves, ungradedSubmissions, pendingTasks });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notification counts', error: error.message });
    }
};
