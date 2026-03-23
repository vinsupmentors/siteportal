const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { generatePremiumPortfolio } = require('../utils/portfolio.engine');

// ==========================================
// DASHBOARD STATS (Massive KPI Aggregation)
// ==========================================
exports.getDashboardStats = async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Core Entities
        const [activeStudents] = await pool.query(`SELECT COUNT(*) as count FROM Users WHERE role_id = 4 AND status = 'active'`);
        const [totalTrainers] = await pool.query(`SELECT COUNT(*) as count FROM Users WHERE role_id = 3 AND status = 'active'`);
        const [activeCourses] = await pool.query('SELECT COUNT(*) as count FROM Courses');
        const [activeBatches] = await pool.query(`SELECT COUNT(*) as count FROM Batches WHERE status = 'active'`);
        const [upcomingBatches] = await pool.query(`SELECT COUNT(*) as count FROM Batches WHERE status = 'upcoming'`);
        const [completedBatches] = await pool.query(`SELECT COUNT(*) as count FROM Batches WHERE status = 'completed'`);

        // Enrollments
        const [totalEnrollments] = await pool.query('SELECT COUNT(*) as count FROM BatchStudents');
        const [newEnrollments] = await pool.query('SELECT COUNT(*) as count FROM BatchStudents WHERE DATE(enrolled_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');

        // 2. Daily Operations
        const [studentsPresentToday] = await pool.query(`SELECT COUNT(DISTINCT student_id) as c FROM StudentAttendance WHERE attendance_date = ? AND status = 'present'`, [todayStr]);
        const [studentsAbsentToday] = await pool.query(`SELECT COUNT(DISTINCT student_id) as c FROM StudentAttendance WHERE attendance_date = ? AND status = 'absent'`, [todayStr]);
        const [trainersPresentToday] = await pool.query(`SELECT COUNT(DISTINCT trainer_id) as c FROM TrainerAttendance WHERE date = ? AND status IN ('present', 'wfh')`, [todayStr]);
        const [classesToday] = await pool.query(`SELECT COUNT(*) as c FROM TrainerTasks WHERE title LIKE '%class%' AND due_date = ?`, [todayStr]);
        const [studentsOnLeaveToday] = await pool.query(`SELECT COUNT(*) as c FROM StudentLeaves WHERE ? BETWEEN start_date AND end_date AND status = 'approved'`, [todayStr]);

        // 3. Task & Productivity Health
        const [globalCompletedTasks] = await pool.query(`SELECT COUNT(*) as count FROM TrainerTasks WHERE status = 'completed'`);
        const [globalPendingTasks] = await pool.query(`SELECT COUNT(*) as count FROM TrainerTasks WHERE status IN ('pending', 'review')`);
        const [globalOverdueTasks] = await pool.query(`SELECT COUNT(*) as count FROM TrainerTasks WHERE status NOT IN ('completed') AND due_date < ?`, [todayStr]);
        const [totalPortfolios] = await pool.query(`SELECT COUNT(*) as count FROM PortfolioRequests WHERE status = 'approved'`);
        const [pendingPortfolios] = await pool.query(`SELECT COUNT(*) as count FROM PortfolioRequests WHERE status = 'pending'`);
        const [zeroProjectStudents] = await pool.query(`SELECT COUNT(*) as count FROM Users u WHERE u.role_id = 4 AND u.status = 'active' AND (SELECT COUNT(*) FROM Submissions s WHERE s.student_id = u.id AND s.submission_type = 'module_project') = 0`);

        // 4. Quality & Engagement
        const [avgTestScore] = await pool.query(`SELECT AVG(marks) as avg FROM Submissions WHERE submission_type = 'module_test'`);
        const [avgTrainerRating] = await pool.query('SELECT AVG(rating) as avg FROM SessionFeedback');
        const [unresolvedDoubts] = await pool.query(`SELECT COUNT(*) as count FROM StudentDoubts WHERE status != 'resolved'`);
        const [unresolvedIssues] = await pool.query(`SELECT COUNT(*) as count FROM StudentIssues WHERE status != 'resolved'`);
        const [completedProjects] = await pool.query(`SELECT COUNT(*) as count FROM Submissions WHERE submission_type = 'module_project'`);

        // Calculate 30-day Avg Attendance
        const [attendance30d] = await pool.query(`
            SELECT 
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*) * 100 as avg 
            FROM StudentAttendance 
            WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `);

        // Critical Alerts Compilation (e.g., Doubts open > 3 days)
        const [criticalDoubts] = await pool.query(`SELECT COUNT(*) as count FROM StudentDoubts WHERE status != 'resolved' AND created_at < DATE_SUB(CURDATE(), INTERVAL 3 DAY)`);
        const criticalAlerts = criticalDoubts[0].count;

        // 5. Pipeline Stages
        const [pipelineData] = await pool.query('SELECT student_phase as stage, COUNT(*) as count FROM Users WHERE role_id = 4 GROUP BY student_phase');
        const pipeline = {};
        pipelineData.forEach(p => { pipeline[p.stage] = p.count; });

        // 6. Action Center & Health
        const [reviewTasks] = await pool.query(`SELECT COUNT(*) as count FROM TrainerTasks WHERE status = 'review'`);
        const [totalDoubts] = await pool.query('SELECT COUNT(*) as count FROM StudentDoubts');
        const [totalIssues] = await pool.query('SELECT COUNT(*) as count FROM StudentIssues');
        const [latestAnnouncement] = await pool.query(`
            SELECT a.*, 
                   (SELECT COUNT(*) FROM AnnouncementAcknowledgements WHERE announcement_id = a.id) as acknowledged_count,
                   (SELECT COUNT(*) FROM Users WHERE status = 'active' AND (role_id = 4 OR role_id = 3)) as total_target_audience
            FROM Announcements a ORDER BY created_at DESC LIMIT 1
        `);

        // 7. Recent Activity
        const [recentActivity] = await pool.query(`
            SELECT al.*, u.first_name, u.last_name 
            FROM AuditLogs al 
            JOIN Users u ON al.user_id = u.id 
            ORDER BY al.created_at DESC LIMIT 10
        `);

        // 8. Attendance Expectations
        const [studentExpected] = await pool.query(`SELECT COUNT(*) as count FROM Users WHERE role_id = 4 AND status = 'active'`);
        const [trainerExpected] = await pool.query(`SELECT COUNT(*) as count FROM Users WHERE role_id = 3 AND status = 'active'`);

        res.json({
            // Legacy Structure for SADashboard.jsx
            core: {
                totalStudents: activeStudents[0].count,
                activeTrainers: totalTrainers[0].count,
                activeBatches: activeBatches[0].count,
                totalCourses: activeCourses[0].count
            },
            pipeline,
            actionCenter: {
                pendingPortfolios: pendingPortfolios[0].count,
                reviewTasks: reviewTasks[0].count
            },
            health: {
                doubts: { open: unresolvedDoubts[0].count, total: totalDoubts[0].count },
                issues: { open: unresolvedIssues[0].count, total: totalIssues[0].count },
                latestAnnouncement: latestAnnouncement[0] || null
            },
            deliverables: {
                zeroProjects: zeroProjectStudents[0].count,
                readyPortfolios: totalPortfolios[0].count
            },
            attendance: {
                trainer_present_today: trainersPresentToday[0].c,
                trainer_expected: trainerExpected[0].count,
                student_present_today: studentsPresentToday[0].c,
                student_expected: studentExpected[0].count
            },
            recentActivity,

            // New Structure for SAReports.jsx (Common Dashboard tab)
            coreEntities: {
                activeStudents: activeStudents[0].count,
                totalTrainers: totalTrainers[0].count,
                activeCourses: activeCourses[0].count,
                activeBatches: activeBatches[0].count,
                totalEnrollments: totalEnrollments[0].count,
                newEnrollments: newEnrollments[0].count,
                upcomingBatches: upcomingBatches[0].count,
                completedBatches: completedBatches[0].count
            },
            dailyOperations: {
                studentsPresentToday: studentsPresentToday[0].c,
                studentsAbsentToday: studentsAbsentToday[0].c,
                trainersPresentToday: trainersPresentToday[0].c,
                classesScheduledToday: classesToday[0].c,
                studentsOnLeaveToday: studentsOnLeaveToday[0].c
            },
            taskHealth: {
                globalCompletedTasks: globalCompletedTasks[0].count,
                globalPendingTasks: globalPendingTasks[0].count,
                globalOverdueTasks: globalOverdueTasks[0].count,
                totalPortfoliosGenerated: totalPortfolios[0].count
            },
            qualityEngagement: {
                globalAvgTestScore: parseFloat(avgTestScore[0].avg || 0).toFixed(2),
                avgStudentAttendance30d: parseFloat(attendance30d[0].avg || 0).toFixed(1),
                avgTrainerRating: parseFloat(avgTrainerRating[0].avg || 0).toFixed(1),
                unresolvedDoubts: unresolvedDoubts[0].count,
                unresolvedIssues: unresolvedIssues[0].count,
                totalCompletedProjects: completedProjects[0].count,
                criticalAlerts: criticalAlerts
            }
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: 'Dashboard stats error', error: error.message });
    }
};

// ==========================================
// PROGRAMS (READ)
// ==========================================
exports.getPrograms = async (req, res) => {
    try {
        const [programs] = await pool.query('SELECT * FROM Programs ORDER BY id');
        res.json({ programs });
    } catch (error) {
        res.status(500).json({ message: 'Programs fetch error', error: error.message });
    }
};

// ==========================================
// COURSES CRUD
// ==========================================
exports.getCourses = async (req, res) => {
    try {
        const [courses] = await pool.query(`
            SELECT c.*, p.name as program_name, p.type as program_type,
                   (SELECT COUNT(*) FROM Modules WHERE course_id = c.id) as module_count,
                   (SELECT COUNT(*) FROM Modules m2 JOIN Days d ON d.module_id = m2.id WHERE m2.course_id = c.id) as total_days
            FROM Courses c
            LEFT JOIN Programs p ON c.program_id = p.id
            ORDER BY c.id
        `);
        res.json({ courses });
    } catch (error) {
        res.status(500).json({ message: 'Courses fetch error', error: error.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { name, description } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Courses (name, description) VALUES (?, ?)',
            [name, description]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_COURSE', 'Courses', result.insertId]);
        res.status(201).json({ message: 'Course created', courseId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Course creation error', error: error.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        await pool.query('UPDATE Courses SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_COURSE', 'Courses', id]);
        res.json({ message: 'Course updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Course update error', error: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        // Cascade: delete days -> modules -> course
        const [mods] = await pool.query('SELECT id FROM Modules WHERE course_id = ?', [id]);
        for (const m of mods) {
            await pool.query('DELETE FROM Days WHERE module_id = ?', [m.id]);
        }
        await pool.query('DELETE FROM Modules WHERE course_id = ?', [id]);
        await pool.query('DELETE FROM Courses WHERE id = ?', [id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'DELETE_COURSE', 'Courses', id]);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Course delete error', error: error.message });
    }
};

// Full course tree: course + modules + days + projects + files nested
exports.getFullCourseTree = async (req, res) => {
    try {
        const { id } = req.params;
        const [courses] = await pool.query('SELECT * FROM Courses WHERE id = ?', [id]);
        if (courses.length === 0) return res.status(404).json({ message: 'Course not found' });
        const course = courses[0];

        const [modules] = await pool.query('SELECT * FROM Modules WHERE course_id = ? ORDER BY sequence_order', [id]);
        for (const mod of modules) {
            // Module Files
            const [moduleFiles] = await pool.query(`SELECT * FROM ContentFiles WHERE entity_type = 'module' AND entity_id = ?`, [mod.id]);
            mod.files = moduleFiles;

            // Module Projects & Project Files
            const [projects] = await pool.query('SELECT * FROM ModuleProjects WHERE module_id = ?', [mod.id]);
            for (const proj of projects) {
                const [projFiles] = await pool.query(`SELECT * FROM ContentFiles WHERE entity_type = 'project' AND entity_id = ?`, [proj.id]);
                proj.files = projFiles;
            }
            mod.projects = projects;

            // Module Days & Day Files
            const [days] = await pool.query('SELECT * FROM Days WHERE module_id = ? ORDER BY day_number', [mod.id]);
            for (const day of days) {
                const [dayFiles] = await pool.query(`SELECT * FROM ContentFiles WHERE entity_type = 'day' AND entity_id = ?`, [day.id]);
                day.files = dayFiles;
            }
            mod.days = days;
        }
        course.modules = modules;
        res.json({ course });
    } catch (error) {
        res.status(500).json({ message: 'Course tree error', error: error.message });
    }
};

// ==========================================
// MODULES CRUD (with content URLs)
// ==========================================
exports.getModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        const [modules] = await pool.query(`
            SELECT m.*, (SELECT COUNT(*) FROM Days WHERE module_id = m.id) as day_count
            FROM Modules m WHERE m.course_id = ? ORDER BY m.sequence_order
        `, [courseId]);
        res.json({ modules });
    } catch (error) {
        res.status(500).json({ message: 'Modules fetch error', error: error.message });
    }
};

exports.createModule = async (req, res) => {
    try {
        const { course_id, name, sequence_order, module_project_details, study_material_url, test_url, interview_questions_url } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Modules (course_id, name, sequence_order, module_project_details, study_material_url, test_url, interview_questions_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [course_id, name, sequence_order, module_project_details || null, study_material_url || null, test_url || null, interview_questions_url || null]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_MODULE', 'Modules', result.insertId]);
        res.status(201).json({ message: 'Module created', moduleId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Module creation error', error: error.message });
    }
};

exports.updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sequence_order, module_project_details, study_material_url, test_url, interview_questions_url } = req.body;
        await pool.query(
            'UPDATE Modules SET name=?, sequence_order=?, module_project_details=?, study_material_url=?, test_url=?, interview_questions_url=? WHERE id=?',
            [name, sequence_order, module_project_details || null, study_material_url || null, test_url || null, interview_questions_url || null, id]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_MODULE', 'Modules', id]);
        res.json({ message: 'Module updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Module update error', error: error.message });
    }
};

exports.deleteModule = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Days WHERE module_id = ?', [id]);
        await pool.query('DELETE FROM Modules WHERE id = ?', [id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'DELETE_MODULE', 'Modules', id]);
        res.json({ message: 'Module deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Module delete error', error: error.message });
    }
};

// ==========================================
// DAYS CRUD
// ==========================================
exports.getDays = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const [days] = await pool.query('SELECT * FROM Days WHERE module_id = ? ORDER BY day_number', [moduleId]);
        res.json({ days });
    } catch (error) {
        res.status(500).json({ message: 'Days fetch error', error: error.message });
    }
};

exports.createDay = async (req, res) => {
    try {
        const { module_id, day_number, topic_name, material_url, worksheet_url, notes_url } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Days (module_id, day_number, topic_name, material_url, worksheet_url, notes_url) VALUES (?, ?, ?, ?, ?, ?)',
            [module_id, day_number, topic_name, material_url || null, worksheet_url || null, notes_url || null]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_DAY', 'Days', result.insertId]);
        res.status(201).json({ message: 'Day created', dayId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Day creation error', error: error.message });
    }
};

exports.updateDay = async (req, res) => {
    try {
        const { id } = req.params;
        const { topic_name, material_url, worksheet_url, notes_url } = req.body;
        await pool.query(
            'UPDATE Days SET topic_name=?, material_url=?, worksheet_url=?, notes_url=? WHERE id=?',
            [topic_name, material_url || null, worksheet_url || null, notes_url || null, id]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_DAY', 'Days', id]);
        res.json({ message: 'Day updated' });
    } catch (error) {
        res.status(500).json({ message: 'Day update error', error: error.message });
    }
};

exports.deleteDay = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Days WHERE id = ?', [id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'DELETE_DAY', 'Days', id]);
        res.json({ message: 'Day deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Day delete error', error: error.message });
    }
};

// ==========================================
// PROJECTS CRUD
// ==========================================
exports.getProjects = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const [projects] = await pool.query('SELECT * FROM ModuleProjects WHERE module_id = ?', [moduleId]);
        res.json({ projects });
    } catch (error) {
        res.status(500).json({ message: 'Projects fetch error', error: error.message });
    }
};

exports.createProject = async (req, res) => {
    try {
        const { module_id, name, description } = req.body;
        const [result] = await pool.query(
            'INSERT INTO ModuleProjects (module_id, name, description) VALUES (?, ?, ?)',
            [module_id, name, description || null]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_PROJECT', 'ModuleProjects', result.insertId]);
        res.status(201).json({ message: 'Project created', projectId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Project creation error', error: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        await pool.query('UPDATE ModuleProjects SET name=?, description=? WHERE id=?', [name, description || null, id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_PROJECT', 'ModuleProjects', id]);
        res.json({ message: 'Project updated' });
    } catch (error) {
        res.status(500).json({ message: 'Project update error', error: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        // First delete associated content files
        const [files] = await pool.query(`SELECT id, stored_name FROM ContentFiles WHERE entity_type = 'project' AND entity_id = ?`, [id]);
        for (const file of files) {
            const filePath = path.join(__dirname, '../../uploads/content', file.stored_name);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await pool.query(`DELETE FROM ContentFiles WHERE entity_type = 'project' AND entity_id = ?`, [id]);
        await pool.query('DELETE FROM ModuleProjects WHERE id = ?', [id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'DELETE_PROJECT', 'ModuleProjects', id]);
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Project delete error', error: error.message });
    }
};

// ==========================================
// CONTENT FILES CRUD (Multi-file upload system)
// ==========================================
exports.uploadContentFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }
        const { entity_type, entity_id, category } = req.body;
        if (!entity_type || !entity_id || !category) {
            return res.status(400).json({ message: 'entity_type, entity_id, and category are required' });
        }

        for (const file of req.files) {
            await pool.query(
                `INSERT INTO ContentFiles 
                    (entity_type, entity_id, category, original_name, stored_name, file_size, mime_type, file_data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    entity_type,
                    entity_id,
                    category,
                    file.originalname,
                    file.originalname, // stored_name = original_name (no disk path needed)
                    file.size,
                    file.mimetype,
                    file.buffer        // binary data stored in DB
                ]
            );
        }

        await pool.query(
            'INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'UPLOAD_FILES', 'ContentFiles', entity_id]
        );

        res.status(201).json({ message: `${req.files.length} file(s) uploaded successfully` });
    } catch (error) {
        res.status(500).json({ message: 'File upload error', error: error.message });
    }
};
exports.getContentFiles = async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const [files] = await pool.query(
            'SELECT * FROM ContentFiles WHERE entity_type = ? AND entity_id = ? ORDER BY uploaded_at DESC',
            [entityType, entityId]
        );
        res.json({ files });
    } catch (error) {
        res.status(500).json({ message: 'Files fetch error', error: error.message });
    }
};

exports.deleteContentFile = async (req, res) => {
    try {
        const { id } = req.params;
        const [files] = await pool.query('SELECT id FROM ContentFiles WHERE id = ?', [id]);
        if (files.length === 0) return res.status(404).json({ message: 'File not found' });

        await pool.query('DELETE FROM ContentFiles WHERE id = ?', [id]);
        await pool.query(
            'INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'DELETE_FILE', 'ContentFiles', id]
        );
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'File delete error', error: error.message });
    }
};
// ==========================================
// BATCHES CRUD
// ==========================================
exports.getBatches = async (req, res) => {
    try {
        const [batches] = await pool.query(`
            SELECT b.*, c.name as course_name,
                   CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
                   CONCAT(ui.first_name, ' ', ui.last_name) as iop_trainer_name,
                   (SELECT COUNT(*) FROM BatchStudents WHERE batch_id = b.id) as student_count
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            LEFT JOIN Users u ON b.trainer_id = u.id
            LEFT JOIN Users ui ON b.iop_trainer_id = ui.id
            ORDER BY b.start_date DESC
        `);
        res.json({ batches });
    } catch (error) {
        res.status(500).json({ message: 'Batches fetch error', error: error.message });
    }
};

exports.createBatch = async (req, res) => {
    try {
        const { course_id, trainer_id, batch_name, schedule_type, timing, start_date, end_date, meeting_link, iop_trainer_id } = req.body;
        const [result] = await pool.query(
            `INSERT INTO Batches (course_id, trainer_id, batch_name, schedule_type, timing, start_date, end_date, meeting_link, status, iop_trainer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
            [course_id, trainer_id || null, batch_name, schedule_type, timing, start_date, end_date || null, meeting_link || null, iop_trainer_id || null]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_BATCH', 'Batches', result.insertId]);
        res.status(201).json({ message: 'Batch created successfully', batchId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Batch creation error', error: error.message });
    }
};

exports.updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { batch_name, course_id, trainer_id, schedule_type, timing, start_date, end_date, status, meeting_link, iop_trainer_id } = req.body;
        await pool.query(
            'UPDATE Batches SET batch_name=?, course_id=?, trainer_id=?, schedule_type=?, timing=?, start_date=?, end_date=?, status=?, meeting_link=?, iop_trainer_id=? WHERE id=?',
            [batch_name, course_id, trainer_id || null, schedule_type, timing, start_date, end_date || null, status, meeting_link || null, iop_trainer_id || null, id]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_BATCH', 'Batches', id]);
        res.json({ message: 'Batch updated successfully' });
    } catch (error) {
        console.error('BATCH UPDATE ERROR:', error);
        res.status(500).json({ message: 'Batch update error', error: error.message });
    }
};

exports.deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM BatchStudents WHERE batch_id = ?', [id]);
        await pool.query('DELETE FROM Batches WHERE id = ?', [id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'DELETE_BATCH', 'Batches', id]);
        res.json({ message: 'Batch deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Batch delete error', error: error.message });
    }
};

// ==========================================
// STUDENTS CRUD
// ==========================================
exports.getStudents = async (req, res) => {
    try {
        const [students] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status,
                   b.batch_name, c.name as course_name,
                   (SELECT ROUND(
                       (SELECT COUNT(*) FROM StudentAttendance sa WHERE sa.student_id = u.id AND sa.status = 'present') * 100.0 /
                       NULLIF((SELECT COUNT(*) FROM StudentAttendance sa WHERE sa.student_id = u.id), 0)
                   , 0)) as attendance_pct
            FROM Users u
            LEFT JOIN BatchStudents bs ON u.id = bs.student_id
            LEFT JOIN Batches b ON bs.batch_id = b.id
            LEFT JOIN Courses c ON b.course_id = c.id
            WHERE u.role_id = 4 AND u.status = 'active'
            ORDER BY u.created_at DESC
        `);
        const [totalActive] = await pool.query(`SELECT COUNT(*) as c FROM Users WHERE role_id = 4 AND status = 'active'`);
        const [totalInactive] = await pool.query(`SELECT COUNT(*) as c FROM Users WHERE role_id = 4 AND status = 'inactive'`);
        res.json({ students, totalActive: totalActive[0].c, totalInactive: totalInactive[0].c });
    } catch (error) {
        res.status(500).json({ message: 'Students fetch error', error: error.message });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, batch_id, program_type } = req.body;
        const pt = ['JRP', 'IOP'].includes(program_type) ? program_type : 'JRP';
        const [result] = await pool.query(
            'INSERT INTO Users (role_id, first_name, last_name, email, password, phone, program_type) VALUES (4, ?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, password || 'abcd@1234', phone || null, pt]
        );
        if (batch_id) {
            await pool.query('INSERT INTO BatchStudents (batch_id, student_id) VALUES (?, ?)', [batch_id, result.insertId]);
        }
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_STUDENT', 'Users', result.insertId]);
        res.status(201).json({ message: 'Student created', studentId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
        res.status(500).json({ message: 'Student creation error', error: error.message });
    }
};

exports.bulkCreateStudents = async (req, res) => {
    try {
        const { students } = req.body; // Array of { first_name, last_name, email, phone }
        if (!students || !students.length) {
            return res.status(400).json({ message: 'No students data provided' });
        }
        let created = 0;
        const errors = [];
        for (const s of students) {
            try {
                await pool.query(
                    'INSERT INTO Users (role_id, first_name, last_name, email, password, phone) VALUES (4, ?, ?, ?, ?, ?)',
                    [s.first_name, s.last_name, s.email, 'abcd@1234', s.phone || null]
                );
                created++;
            } catch (e) {
                errors.push({ email: s.email, error: e.message });
            }
        }
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'BULK_CREATE_STUDENTS', 'Users', created]);
        res.status(201).json({ message: `${created} students created`, created, errors });
    } catch (error) {
        res.status(500).json({ message: 'Bulk creation error', error: error.message });
    }
};

exports.bulkAssignBatch = async (req, res) => {
    try {
        const { student_ids, batch_id } = req.body;
        if (!student_ids || !student_ids.length || !batch_id) {
            return res.status(400).json({ message: 'student_ids and batch_id are required' });
        }
        let assigned = 0;
        for (const sid of student_ids) {
            try {
                await pool.query('INSERT IGNORE INTO BatchStudents (batch_id, student_id) VALUES (?, ?)', [batch_id, sid]);
                assigned++;
            } catch (e) { /* skip duplicates */ }
        }
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'BULK_ASSIGN_BATCH', 'BatchStudents', batch_id]);
        res.json({ message: `${assigned} students assigned to batch` });
    } catch (error) {
        res.status(500).json({ message: 'Bulk assign error', error: error.message });
    }
};

exports.downloadStudentTemplate = async (req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=student_upload_template.csv');
    res.send('first_name,last_name,email,phone\nJohn,Doe,john.doe@example.com,9876543210\nJane,Smith,jane.smith@example.com,9876543211');
};

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, status, student_status, program_type } = req.body;

        let query = 'UPDATE Users SET first_name=?, last_name=?, email=?, phone=?, status=?';
        let params = [first_name, last_name, email, phone || null, status];

        if (student_status) {
            query += ', student_status=?';
            params.push(student_status);
        }

        if (program_type && ['JRP', 'IOP'].includes(program_type)) {
            query += ', program_type=?';
            params.push(program_type);
        }

        query += ' WHERE id=? AND role_id=4';
        params.push(id);

        await pool.query(query, params);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_STUDENT', 'Users', id]);
        res.json({ message: 'Student updated' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
        res.status(500).json({ message: 'Student update error', error: error.message });
    }
};

exports.transferStudentBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_batch_id } = req.body;

        // Check if student exists
        const [student] = await pool.query('SELECT id FROM Users WHERE id=? AND role_id=4', [id]);
        if (student.length === 0) return res.status(404).json({ message: 'Student not found' });

        // Remove from current batch if any and add to new batch
        await pool.query('DELETE FROM BatchStudents WHERE student_id = ?', [id]);
        await pool.query('INSERT INTO BatchStudents (batch_id, student_id) VALUES (?, ?)', [new_batch_id, id]);

        // Update user status
        await pool.query("UPDATE Users SET student_status = 'Batch Transfer' WHERE id = ?", [id]);

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'BATCH_TRANSFER', 'Users', id]);
        res.json({ message: 'Student transferred to new batch successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Batch transfer error', error: error.message });
    }
};


exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`UPDATE Users SET status = 'inactive' WHERE id = ? AND role_id = 4`, [id]);
        await pool.query('DELETE FROM BatchStudents WHERE student_id = ?', [id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'DELETE_STUDENT', 'Users', id]);
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Student delete error', error: error.message });
    }
};

// ==========================================
// TRAINERS CRUD
// ==========================================
exports.getTrainers = async (req, res) => {
    try {
        const [trainers] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status,
                   u.joining_date, u.is_probation,
                   COALESCE(AVG(sf.rating), 0) as avg_rating,
                   COUNT(DISTINCT sf.id) as total_reviews,
                   (SELECT COUNT(*) FROM Batches WHERE trainer_id = u.id AND status = 'active') as active_batches,
                   (SELECT COUNT(*) FROM TrainerTasks WHERE trainer_id = u.id AND status = 'complete') as tasks_completed,
                   (SELECT COUNT(*) FROM TrainerTasks WHERE trainer_id = u.id AND status != 'complete') as tasks_pending
            FROM Users u
            LEFT JOIN SessionFeedback sf ON u.id = sf.trainer_id
            WHERE u.role_id = 3 AND u.status = 'active'
            GROUP BY u.id
            ORDER BY u.first_name
        `);
        for (const t of trainers) {
            t.specializations = [];
        }
        res.json({ trainers });
    } catch (error) {
        res.status(500).json({ message: 'Trainers fetch error', error: error.message });
    }
};

exports.createTrainer = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, joining_date, is_probation, specialization_ids } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Users (role_id, first_name, last_name, email, password, phone, joining_date, is_probation) VALUES (3, ?, ?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, 'abcd@1234', phone || null, joining_date || null, is_probation ? 1 : 0]
        );
        // Insert specializations
        if (specialization_ids && specialization_ids.length > 0) {
            const specValues = specialization_ids.map(cid => [result.insertId, cid]);
            await pool.query('INSERT INTO TrainerSpecializations (trainer_id, course_id) VALUES ?', [specValues]);
        }
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_TRAINER', 'Users', result.insertId]);
        res.status(201).json({ message: 'Trainer created', trainerId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
        res.status(500).json({ message: 'Trainer creation error', error: error.message });
    }
};

exports.updateTrainer = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, phone, status, joining_date, is_probation, specialization_ids } = req.body;
        await pool.query(
            'UPDATE Users SET first_name=?, last_name=?, email=?, phone=?, status=?, joining_date=?, is_probation=? WHERE id=? AND role_id=3',
            [first_name, last_name, email, phone || null, status, joining_date || null, is_probation ? 1 : 0, id]
        );
        // Sync specializations: delete old, insert new
        if (specialization_ids) {
            await pool.query('DELETE FROM TrainerSpecializations WHERE trainer_id = ?', [id]);
            if (specialization_ids.length > 0) {
                const specValues = specialization_ids.map(cid => [id, cid]);
                await pool.query('INSERT INTO TrainerSpecializations (trainer_id, course_id) VALUES ?', [specValues]);
            }
        }
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_TRAINER', 'Users', id]);
        res.json({ message: 'Trainer updated' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
        res.status(500).json({ message: 'Trainer update error', error: error.message });
    }
};

exports.deleteTrainer = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE Users SET status = ? WHERE id = ? AND role_id = 3', ['inactive', id]);
        await pool.query('UPDATE Batches SET trainer_id = NULL WHERE trainer_id = ?', [id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'DELETE_TRAINER', 'Users', id]);
        res.json({ message: 'Trainer deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Trainer delete error', error: error.message });
    }
};

// ==========================================
// TRAINER TASKS CRUD
// ==========================================
exports.getTrainerTasks = async (req, res) => {
    try {
        const [tasks] = await pool.query(`
            SELECT tt.*, CONCAT(u.first_name, ' ', u.last_name) as trainer_name
            FROM TrainerTasks tt
            JOIN Users u ON tt.trainer_id = u.id
            ORDER BY tt.due_date ASC
        `);
        // Also get trainers with their batches for the calendar view
        const [trainers] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email
            FROM Users u WHERE u.role_id = 3 AND u.status = 'active'
        `);
        const [batches] = await pool.query(`
            SELECT b.id, b.batch_name, b.trainer_id, b.schedule_type, b.timing, b.start_date, b.end_date, b.status,
                   c.name as course_name
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            WHERE b.status IN ('active', 'upcoming')
        `);
        const [kras] = await pool.query(`SELECT * FROM TrainerKRA`);
        res.json({ tasks, trainers, batches, kras });
    } catch (error) {
        res.status(500).json({ message: 'Trainer tasks fetch error', error: error.message });
    }
};

exports.createTrainerTask = async (req, res) => {
    try {
        const { trainer_id, title, description, due_date } = req.body;
        const [result] = await pool.query(
            'INSERT INTO TrainerTasks (trainer_id, assigned_by, title, description, due_date) VALUES (?, ?, ?, ?, ?)',
            [trainer_id, req.user.id, title, description, due_date]
        );
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'ASSIGN_TASK', 'TrainerTasks', result.insertId]);
        res.status(201).json({ message: 'Task assigned', taskId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Task creation error', error: error.message });
    }
};

exports.updateTrainerTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, title, description, due_date } = req.body;
        if (status === 'complete') {
            await pool.query('UPDATE TrainerTasks SET status = ? WHERE id = ?', ['complete', id]);
        } else if (status === 'return' || status === 'assigned') {
            // Reassign — reset to assigned with optional new due_date, clear review
            await pool.query('UPDATE TrainerTasks SET status = ?, due_date = COALESCE(?, due_date), review_notes = NULL, review_date = NULL WHERE id = ?', ['assigned', due_date || null, id]);
        } else if (status) {
            await pool.query('UPDATE TrainerTasks SET status = ? WHERE id = ?', [status, id]);
        }
        if (title) {
            await pool.query('UPDATE TrainerTasks SET title = ?, description = ?, due_date = ? WHERE id = ?', [title, description, due_date, id]);
        }
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_TASK', 'TrainerTasks', id]);
        res.json({ message: 'Task updated' });
    } catch (error) {
        res.status(500).json({ message: 'Task update error', error: error.message });
    }
};

// ==========================================
// TRAINER ATTENDANCE & LEAVE
// ==========================================
exports.getTrainerAttendance = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const [records] = await pool.query(`
            SELECT ta.*, ta.session, CONCAT(u.first_name, ' ', u.last_name) as trainer_name
            FROM TrainerAttendance ta
            JOIN Users u ON ta.trainer_id = u.id
            WHERE ta.date = ?
        `, [date]);
        const [allTrainers] = await pool.query(`
            SELECT id, first_name, last_name, is_probation, casual_leave_count FROM Users WHERE role_id = 3 AND status = 'active'
        `);
        res.json({ records, allTrainers });
    } catch (error) {
        res.status(500).json({ message: 'Attendance fetch error', error: error.message });
    }
};

exports.updateCasualLeaveCount = async (req, res) => {
    try {
        const { id } = req.params;
        const { casual_leave_count } = req.body;
        await pool.query('UPDATE Users SET casual_leave_count = ? WHERE id = ? AND role_id = 3', [casual_leave_count, id]);
        res.json({ message: 'Casual leave count updated' });
    } catch (error) {
        res.status(500).json({ message: 'Update error', error: error.message });
    }
};

exports.markTrainerAttendance = async (req, res) => {
    try {
        const { trainer_id, date, status, session } = req.body;
        const sess = session || 'full_day';
        // Check existing record for this trainer+date+session
        const [existing] = await pool.query(
            'SELECT id, status as old_status FROM TrainerAttendance WHERE trainer_id = ? AND date = ? AND session = ?',
            [trainer_id, date, sess]
        );
        if (existing.length > 0) {
            const oldStatus = existing[0].old_status;
            // If changing FROM leave to something else, restore CL
            if (oldStatus === 'leave' && status !== 'leave') {
                await pool.query('UPDATE Users SET casual_leave_count = casual_leave_count + 1 WHERE id = ? AND role_id = 3', [trainer_id]);
            }
            // If changing TO leave from something else, deduct CL
            if (status === 'leave' && oldStatus !== 'leave') {
                await pool.query('UPDATE Users SET casual_leave_count = GREATEST(casual_leave_count - 1, 0) WHERE id = ? AND role_id = 3', [trainer_id]);
            }
            await pool.query('UPDATE TrainerAttendance SET status = ?, approved_by = ? WHERE id = ?', [status, req.user.id, existing[0].id]);
        } else {
            // New record — if leave, deduct CL
            if (status === 'leave') {
                await pool.query('UPDATE Users SET casual_leave_count = GREATEST(casual_leave_count - 1, 0) WHERE id = ? AND role_id = 3', [trainer_id]);
            }
            await pool.query('INSERT INTO TrainerAttendance (trainer_id, date, status, session, approved_by) VALUES (?, ?, ?, ?, ?)', [trainer_id, date, status, sess, req.user.id]);
        }
        res.json({ message: 'Attendance marked' });
    } catch (error) {
        res.status(500).json({ message: 'Attendance mark error', error: error.message });
    }
};

// Get All Trainer Leaves
exports.getAllTrainerLeaves = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT tl.*, CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
                   CONCAT(r.first_name, ' ', r.last_name) as reviewed_by_name
            FROM TrainerLeaves tl
            JOIN Users u ON tl.trainer_id = u.id
            LEFT JOIN Users r ON tl.reviewed_by = r.id
        `;
        const params = [];

        if (status) {
            query += ' WHERE tl.status = ?';
            params.push(status);
        }

        query += ' ORDER BY tl.created_at DESC';

        const [leaves] = await pool.query(query, params);
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trainer leaves', error: error.message });
    }
};

// Update Trainer Leave Status
exports.updateTrainerLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body;
        const adminId = req.user.id;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        await pool.query(`
            UPDATE TrainerLeaves 
            SET status = ?, reviewed_by = ?, rejection_reason = ?
            WHERE id = ?
        `, [status, adminId, rejection_reason || null, id]);

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [adminId, `LEAVE_${status.toUpperCase()}`, 'TrainerLeaves', id]);

        res.json({ message: `Leave request ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave status', error: error.message });
    }
};

exports.getMonthlyAttendanceReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        const y = year || new Date().getFullYear();
        const m = month || (new Date().getMonth() + 1);
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const endDate = `${y}-${String(m).padStart(2, '0')}-31`;

        const [rows] = await pool.query(`
            SELECT u.id as trainer_id, CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
                   u.casual_leave_count, u.is_probation,
                   ta.date, ta.session, ta.status
            FROM Users u
            LEFT JOIN TrainerAttendance ta ON u.id = ta.trainer_id AND ta.date BETWEEN ? AND ?
            WHERE u.role_id = 3 AND u.status = 'active'
            ORDER BY u.first_name, ta.date, ta.session
        `, [startDate, endDate]);

        const trainers = {};
        for (const r of rows) {
            if (!trainers[r.trainer_id]) {
                trainers[r.trainer_id] = { name: r.trainer_name, cl_balance: r.casual_leave_count ?? 0, is_probation: r.is_probation, present_morning: 0, present_afternoon: 0, present_full: 0, cl_used: 0, wfh: 0, comp_leave: 0, total_records: 0, records: [] };
            }
            if (r.date) {
                trainers[r.trainer_id].total_records++;
                if (r.status === 'present') {
                    if (r.session === 'morning') trainers[r.trainer_id].present_morning++;
                    else if (r.session === 'afternoon') trainers[r.trainer_id].present_afternoon++;
                    else trainers[r.trainer_id].present_full++;
                } else if (r.status === 'leave') trainers[r.trainer_id].cl_used++;
                else if (r.status === 'wfh') trainers[r.trainer_id].wfh++;
                else if (r.status === 'leave_with_comp') trainers[r.trainer_id].comp_leave++;
                trainers[r.trainer_id].records.push({ date: r.date, session: r.session, status: r.status });
            }
        }

        if (req.query.format === 'csv') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            let csv = `Monthly Attendance Report - ${monthNames[m - 1]} ${y}\n`;
            csv += 'Trainer,Present (Full Day),Present (Morning),Present (Afternoon),WFH,CL Used,Comp Leave,CL Balance,Total Records\n';
            for (const t of Object.values(trainers)) {
                csv += `${t.name},${t.present_full},${t.present_morning},${t.present_afternoon},${t.wfh},${t.cl_used},${t.comp_leave},${t.cl_balance},${t.total_records}\n`;
            }
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=attendance_${y}_${String(m).padStart(2, '0')}.csv`);
            return res.send(csv);
        }

        res.json({ year: y, month: m, trainers: Object.values(trainers) });
    } catch (error) {
        res.status(500).json({ message: 'Monthly report error', error: error.message });
    }
};

// ==========================================
// PORTFOLIOS
// ==========================================
exports.getPortfolios = async (req, res) => {
    try {
        const [portfolios] = await pool.query(`
            SELECT pr.*, CONCAT(u.first_name, ' ', u.last_name) as student_name, u.email,
                   bs.batch_id, b.batch_name
            FROM PortfolioRequests pr
            JOIN Users u ON pr.student_id = u.id
            LEFT JOIN BatchStudents bs ON u.id = bs.student_id
            LEFT JOIN Batches b ON bs.batch_id = b.id
            ORDER BY pr.id DESC
        `);
        res.json({ portfolios });
    } catch (error) {
        res.status(500).json({ message: 'Portfolio fetch error', error: error.message });
    }
};

exports.deletePortfolio = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch to see if it has a file to clean up before row deletion
        const [rows] = await pool.query('SELECT hosted_url FROM PortfolioRequests WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Portfolio request not found.' });

        // Extract filename from URL to delete it from the server
        if (rows[0].hosted_url) {
            const fileName = rows[0].hosted_url.substring(rows[0].hosted_url.lastIndexOf('/') + 1);
            const filePath = path.join(__dirname, '../../public/portfolios', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete from database
        await pool.query('DELETE FROM PortfolioRequests WHERE id = ?', [id]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'PORTFOLIO_DELETED', 'PortfolioRequests', id]);

        res.json({ message: 'Portfolio successfully deleted and files removed.' });
    } catch (error) {
        res.status(500).json({ message: 'Server fault deleting portfolio.', error: error.message });
    }
};

exports.updatePortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, hosted_url, qr_code } = req.body;

        let final_hosted_url = hosted_url || null;
        let qr_code_data = qr_code || null;

        if (status === 'approved' && !final_hosted_url) {
            // Fetch student details
            const [rows] = await pool.query(
                `SELECT pr.details, pr.student_id, u.first_name, u.last_name 
                 FROM PortfolioRequests pr JOIN Users u ON pr.student_id = u.id 
                 WHERE pr.id = ?`,
                [id]
            );
            if (!rows.length) return res.status(404).json({ message: 'Request not found' });

            const details = typeof rows[0].details === 'string' ? JSON.parse(rows[0].details) : rows[0].details;

            // Generate HTML
            const htmlString = generatePremiumPortfolio(details);

            // Ensure public directory exists
            const publicDir = path.join(__dirname, '../../public/portfolios');
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            // Write HTML file
            const studentName = `${rows[0].first_name}${rows[0].last_name}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            const rollNumber = rows[0].student_id;
            const fileName = `${studentName}_${rollNumber}.html`;
            const filePath = path.join(publicDir, fileName);
            fs.writeFileSync(filePath, htmlString, 'utf8');

            // Set final hosted URL based on server configuration mapping to public
            const baseUrl = req.protocol + '://' + req.get('host');
            final_hosted_url = `${baseUrl}/public/portfolios/${fileName}`;

            // Generate QR Code data URL
            qr_code_data = await QRCode.toDataURL(final_hosted_url);
        }

        await pool.query(
            'UPDATE PortfolioRequests SET status = ?, hosted_url = IFNULL(?, hosted_url), qr_code = IFNULL(?, qr_code) WHERE id = ?',
            [status, final_hosted_url, qr_code_data, id]
        );

        if (status === 'approved') {
            await pool.query(
                "UPDATE Users SET student_status = 'Course Completed' WHERE id = (SELECT student_id FROM PortfolioRequests WHERE id = ?)",
                [id]
            );
        }

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, `PORTFOLIO_${status.toUpperCase()}`, 'PortfolioRequests', id]);
        res.json({ message: 'Portfolio updated and automatically hosted successfully', url: final_hosted_url });
    } catch (error) {
        res.status(500).json({ message: 'Portfolio update error', error: error.message });
    }
};

// Endpoint to generate and stream the HTML file
exports.downloadPortfolioHTML = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT details FROM PortfolioRequests WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Request not found' });

        const data = typeof rows[0].details === 'string' ? JSON.parse(rows[0].details) : rows[0].details;
        const { generatePremiumPortfolio } = require('../utils/portfolio.engine');
        const html = generatePremiumPortfolio(data);

        res.setHeader('Content-Type', 'text/html');
        // Handle names that might not exist gracefully
        if (req.query.preview !== 'true') {
            const safeName = (data.personal?.name || 'student').toLowerCase().replace(/ /g, '-');
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}-portfolio.html"`);
        }
        res.send(html);
    } catch (error) {
        res.status(500).json({ message: 'Generation error', error: error.message });
    }
};

// ==========================================
// ANNOUNCEMENTS
// ==========================================
exports.getAnnouncements = async (req, res) => {
    try {
        const [announcements] = await pool.query(`
            SELECT a.*,
                (SELECT COUNT(*) FROM AnnouncementAcknowledgements WHERE announcement_id = a.id) as acknowledged_count,
                CASE 
                    WHEN a.target_role = 'all' THEN (SELECT COUNT(*) FROM Users WHERE status = 'active' AND role_id IN (3, 4))
                    WHEN a.target_role = '3' THEN (SELECT COUNT(*) FROM Users WHERE status = 'active' AND role_id = 3)
                    WHEN a.target_role = '4' THEN (SELECT COUNT(*) FROM Users WHERE status = 'active' AND role_id = 4)
                    WHEN a.target_role = 'batch' THEN (
                        SELECT COUNT(DISTINCT bs.student_id) FROM BatchStudents bs 
                        JOIN Users u ON bs.student_id = u.id 
                        WHERE bs.batch_id = a.target_batch_id AND u.status = 'active'
                    )
                    ELSE 0
                END as total_target_audience,
                b.batch_name as target_batch_name
            FROM Announcements a
            LEFT JOIN Batches b ON a.target_batch_id = b.id
            WHERE a.created_by = ? OR (SELECT role_id FROM Users WHERE id = ?) = 1
            ORDER BY a.created_at DESC
            LIMIT 50
        `, [req.user.id, req.user.id]);

        // Ensure recipient_count is correctly translated for frontend backwards compatibility 
        // while frontend updates to the new syntax.
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
        const { title, message, target } = req.body;
        // target mapping: 'all', '3' (trainers), '4' (students), or a numeric batch ID as string 'batch_12'

        let targetRole = 'all';
        let targetBatchId = null;

        if (target === '3') targetRole = '3';
        else if (target === '4') targetRole = '4';
        else if (target !== 'all' && target.startsWith('batch_')) {
            targetRole = 'batch';
            targetBatchId = parseInt(target.replace('batch_', ''), 10);
        }

        const [result] = await pool.query(
            'INSERT INTO Announcements (title, message, target_role, target_batch_id, created_by) VALUES (?, ?, ?, ?, ?)',
            [title, message, targetRole, targetBatchId, req.user.id]
        );

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'BROADCAST', 'Announcements', result.insertId]);

        // Send email to recipients (fire-and-forget)
        try {
            const emailService = require('../utils/email.service');
            let recipients = [];
            if (targetRole === 'batch' && targetBatchId) {
                const [rows] = await pool.query(
                    'SELECT u.email, CONCAT(u.first_name, \' \', u.last_name) as name FROM Users u JOIN BatchStudents bs ON u.id = bs.student_id WHERE bs.batch_id = ? AND u.status = ?',
                    [targetBatchId, 'active']
                );
                recipients = rows;
            } else if (targetRole === '3') {
                const [rows] = await pool.query('SELECT email, CONCAT(first_name, \' \', last_name) as name FROM Users WHERE role_id = 3 AND status = ?', ['active']);
                recipients = rows;
            } else if (targetRole === '4') {
                const [rows] = await pool.query('SELECT email, CONCAT(first_name, \' \', last_name) as name FROM Users WHERE role_id = 4 AND status = ?', ['active']);
                recipients = rows;
            } else {
                const [rows] = await pool.query('SELECT email, CONCAT(first_name, \' \', last_name) as name FROM Users WHERE role_id IN (3, 4) AND status = ?', ['active']);
                recipients = rows;
            }
            emailService.sendAnnouncementEmail(recipients, title, message, 'Vinsup Admin');
        } catch (_) {}

        res.status(201).json({ message: 'Announcement broadcast successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Broadcast error', error: error.message });
    }
};

// ==========================================
// MEETING LINKS
// ==========================================
exports.getMeetingLinks = async (req, res) => {
    try {
        const [batches] = await pool.query(`
            SELECT b.id, b.batch_name, b.meeting_link, b.status, c.name as course_name
            FROM Batches b JOIN Courses c ON b.course_id = c.id
            WHERE b.status IN ('active', 'upcoming')
            ORDER BY b.batch_name
        `);
        res.json({ batches });
    } catch (error) {
        res.status(500).json({ message: 'Meeting links fetch error', error: error.message });
    }
};

exports.updateMeetingLink = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { meeting_link } = req.body;
        await pool.query('UPDATE Batches SET meeting_link = ? WHERE id = ?', [meeting_link, batchId]);
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'UPDATE_MEETING_LINK', 'Batches', batchId]);
        res.json({ message: 'Meeting link updated' });
    } catch (error) {
        res.status(500).json({ message: 'Meeting link update error', error: error.message });
    }
};

// ==========================================
// REPORTS (Aggregations)
// ==========================================
exports.getTrainerReport = async (req, res) => {
    try {
        const [report] = await pool.query(`
            SELECT u.id as trainer_id, CONCAT(u.first_name, ' ', u.last_name) as name,
                   (SELECT COUNT(*) FROM Batches WHERE trainer_id = u.id AND status = 'active') as active_batches,
                   COALESCE(AVG(sf.rating), 0) as avg_rating,
                   (SELECT COUNT(*) FROM TrainerTasks WHERE trainer_id = u.id AND status = 'complete') as tasks_completed,
                   (SELECT COUNT(*) FROM TrainerTasks WHERE trainer_id = u.id AND status != 'complete') as tasks_pending,
                   (SELECT ROUND(
                       COUNT(CASE WHEN ta.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(ta.id), 0), 0
                   ) FROM TrainerAttendance ta WHERE ta.trainer_id = u.id) as attendance_pct,
                   (SELECT COUNT(*) FROM StudentDoubts WHERE trainer_id = u.id) as total_doubts_received,
                   (SELECT COUNT(*) FROM StudentDoubts WHERE trainer_id = u.id AND status = 'resolved') as total_doubts_cleared,
                   (SELECT ROUND(
                       COUNT(CASE WHEN status = 'resolved' AND TIMESTAMPDIFF(HOUR, created_at, resolved_at) <= 24 THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN status = 'resolved' THEN 1 END), 0), 0
                   ) FROM StudentDoubts WHERE trainer_id = u.id) as on_time_clearance_pct
            FROM Users u
            LEFT JOIN SessionFeedback sf ON u.id = sf.trainer_id
            WHERE u.role_id = 3 GROUP BY u.id
        `);
        res.json({ report });
    } catch (error) {
        res.status(500).json({ message: 'Trainer report error', error: error.message });
    }
};

exports.getBatchReport = async (req, res) => {
    try {
        const [report] = await pool.query(`
            SELECT b.id, b.batch_name, c.name as course_name,
                   (SELECT COUNT(*) FROM BatchStudents WHERE batch_id = b.id) as student_count,
                   b.status, b.start_date, b.end_date
            FROM Batches b JOIN Courses c ON b.course_id = c.id
            ORDER BY b.start_date DESC
        `);
        res.json({ report });
    } catch (error) {
        res.status(500).json({ message: 'Batch report error', error: error.message });
    }
};

exports.getStudentReport = async (req, res) => {
    try {
        const [report] = await pool.query(`
            SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as name,
                   b.batch_name,
                   (SELECT ROUND(
                       COUNT(CASE WHEN sa.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(sa.id), 0), 0
                   ) FROM StudentAttendance sa WHERE sa.student_id = u.id) as attendance_pct,
                   (SELECT ROUND(AVG(s.marks), 1) FROM Submissions s WHERE s.student_id = u.id AND s.marks IS NOT NULL) as test_avg,
                   (SELECT COUNT(*) FROM Submissions s WHERE s.student_id = u.id AND s.submission_type = 'worksheet') as worksheets_done,
                   (SELECT COUNT(*) FROM StudentDoubts WHERE student_id = u.id) as doubts_raised,
                   (SELECT COUNT(*) FROM StudentDoubts WHERE student_id = u.id AND status = 'resolved') as doubts_resolved,
                   (SELECT COUNT(*) FROM StudentDoubts WHERE student_id = u.id AND status != 'resolved') as doubts_pending
            FROM Users u
            LEFT JOIN BatchStudents bs ON u.id = bs.student_id
            LEFT JOIN Batches b ON bs.batch_id = b.id
            WHERE u.role_id = 4
            ORDER BY u.first_name
        `);
        res.json({ report });
    } catch (error) {
        res.status(500).json({ message: 'Student report error', error: error.message });
    }
};

exports.getCourseReport = async (req, res) => {
    try {
        const [report] = await pool.query(`
            SELECT c.id, c.name as course_name,
                   (SELECT COUNT(DISTINCT bs.student_id) FROM BatchStudents bs JOIN Batches b ON bs.batch_id = b.id WHERE b.course_id = c.id) as enrolled,
                   (SELECT COUNT(DISTINCT bs.student_id) FROM BatchStudents bs JOIN Batches b ON bs.batch_id = b.id WHERE b.course_id = c.id AND b.status = 'active') as active,
                   (SELECT COUNT(DISTINCT bs.student_id) FROM BatchStudents bs JOIN Batches b ON bs.batch_id = b.id WHERE b.course_id = c.id AND b.status = 'completed') as completed,
                   COALESCE((SELECT AVG(sf.rating) FROM SessionFeedback sf JOIN Batches b ON sf.batch_id = b.id WHERE b.course_id = c.id), 0) as satisfaction
            FROM Courses c ORDER BY c.name
        `);
        res.json({ report });
    } catch (error) {
        res.status(500).json({ message: 'Course report error', error: error.message });
    }
};

// ==========================================
// OPERATIONS: TRAINERS KRA DAILY VIEW
// ==========================================
exports.getDailyKRA = async (req, res) => {
    try {
        const date = req.query.date;
        if (!date) return res.status(400).json({ message: 'Date parameter is required' });

        const [trainers] = await pool.query(`
            SELECT id, first_name, last_name, email
            FROM Users
            WHERE role_id = 3 AND status = 'active'
        `);

        // Fetch Class Topics (TrainerKRA)
        const [kras] = await pool.query(`
            SELECT k.*, b.batch_name, c.name as course_name 
            FROM TrainerKRA k
            JOIN Batches b ON k.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE k.date = ?
        `, [date]);

        const [tasks] = await pool.query(`
            SELECT * FROM TrainerTasks 
            WHERE status IN ('review', 'complete') AND DATE(due_date) = ?
        `, [date]);

        // Fetch Other Works
        const [otherWorks] = await pool.query(`
            SELECT * FROM TrainerOtherWorks 
            WHERE date = ?
        `, [date]);

        res.json({ trainers, kras, tasks, otherWorks });
    } catch (error) {
        res.status(500).json({ message: 'Daily KRA fetch error', error: error.message });
    }
};

// ==========================================
// STUDENT QUERIES & ESCALATIONS
// ==========================================

// Fetch all student escalated issues
exports.getStudentIssues = async (req, res) => {
    try {
        const [issues] = await pool.query(`
            SELECT si.*, u.first_name, u.last_name, u.email
            FROM StudentIssues si
            JOIN Users u ON si.student_id = u.id
            ORDER BY si.created_at DESC
        `);
        res.status(200).json({ issues });
    } catch (error) {
        res.status(500).json({ message: 'Server fault fetching student issues.', error: error.message });
    }
};

// Update issue status and response
exports.updateStudentIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_response } = req.body;

        await pool.query(
            'UPDATE StudentIssues SET status = ?, admin_response = ? WHERE id = ?',
            [status, admin_response, id]
        );

        res.status(200).json({ message: 'Issue resolved successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server fault updating issue.', error: error.message });
    }
};

// Fetch all student doubts system-wide for monitoring
exports.getStudentDoubts = async (req, res) => {
    try {
        const [doubts] = await pool.query(`
            SELECT sd.*, 
                   s.first_name as student_name, s.email as student_email,
                   t.first_name as trainer_name,
                   b.batch_name
            FROM StudentDoubts sd
            JOIN Users s ON sd.student_id = s.id
            LEFT JOIN Users t ON sd.trainer_id = t.id
            JOIN Batches b ON sd.batch_id = b.id
            ORDER BY sd.created_at DESC
        `);
        res.status(200).json({ doubts });
    } catch (error) {
        res.status(500).json({ message: 'Server fault fetching system doubts.', error: error.message });
    }
};

// ==========================================
// ATTENDANCE & AUTOMATION
// ==========================================
exports.getAttendanceAnalytics = async (req, res) => {
    try {
        const { course_id, batch_id } = req.query;
        let whereClause = '';
        let params = [];

        if (course_id) {
            whereClause += ' AND b.course_id = ?';
            params.push(course_id);
        }
        if (batch_id) {
            whereClause += ' AND sa.batch_id = ?';
            params.push(batch_id);
        }

        // 1. Top KPIs
        const [kpis] = await pool.query(`
            SELECT 
                COUNT(DISTINCT sa.student_id) as total_students,
                SUM(CASE WHEN sa.status = 'present' AND sa.attendance_date = CURDATE() THEN 1 ELSE 0 END) as present_today,
                SUM(CASE WHEN sa.status = 'absent' AND sa.attendance_date = CURDATE() THEN 1 ELSE 0 END) as absent_today,
                AVG(CASE WHEN sa.status = 'present' THEN 100 ELSE 0 END) as avg_attendance
            FROM StudentAttendance sa
            JOIN Batches b ON sa.batch_id = b.id
            WHERE 1=1 ${whereClause}
        `, params);

        // 2. Course-wise Calendar Map (Today's status)
        const [calendar] = await pool.query(`
            SELECT 
                c.name as course_name, b.batch_name,
                COUNT(DISTINCT sa.student_id) as total,
                SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as absent
            FROM StudentAttendance sa
            JOIN Batches b ON sa.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE sa.attendance_date = CURDATE()
            GROUP BY c.id, b.id, c.name, b.batch_name
        `);

        // 3. Consecutive Absence Alerts
        const [alerts3d] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, b.batch_name, c.name as course_name,
                   3 as consecutive_absences, MAX(sa.attendance_date) as last_absent_date
            FROM StudentAttendance sa
            JOIN Users u ON sa.student_id = u.id
            JOIN Batches b ON sa.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE sa.status = 'absent'
            AND sa.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, b.batch_name, c.name
            HAVING COUNT(DISTINCT sa.attendance_date) >= 3
        `);

        const [alerts2d] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, b.batch_name, c.name as course_name,
                   2 as consecutive_absences, MAX(sa.attendance_date) as last_absent_date
            FROM StudentAttendance sa
            JOIN Users u ON sa.student_id = u.id
            JOIN Batches b ON sa.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE sa.status = 'absent'
            AND sa.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 5 DAY)
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, b.batch_name, c.name
            HAVING COUNT(DISTINCT sa.attendance_date) = 2
        `);

        res.json({
            kpis: kpis[0],
            calendar: calendar.length > 0 ? calendar : [],
            alerts: {
                consecutive3d: alerts3d,
                consecutive2d: alerts2d
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Attendance analytics error', error: error.message });
    }
};

// Trigger Absence Emails (Daily Job Logic)
exports.triggerAbsenceEmails = async () => {
    const emailService = require('../utils/email.service');
    try {
        // Students with 2+ absences in the last 7 days — include batch, course, trainer info + overall att%
        const [targets] = await pool.query(`
            SELECT
                u.id, u.first_name, u.last_name, u.email, u.phone,
                COUNT(DISTINCT sa.attendance_date) AS gaps,
                b.batch_name, c.name AS course_name,
                CONCAT(t.first_name, ' ', t.last_name) AS trainer_name,
                ROUND(
                    (SELECT COUNT(*) FROM StudentAttendance sa2 WHERE sa2.student_id = u.id AND sa2.status = 'present') * 100.0 /
                    NULLIF((SELECT COUNT(*) FROM StudentAttendance sa3 WHERE sa3.student_id = u.id), 0)
                , 1) AS att_pct
            FROM StudentAttendance sa
            JOIN Users u ON sa.student_id = u.id
            JOIN Batches b ON sa.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            LEFT JOIN Users t ON b.trainer_id = t.id
            WHERE sa.status = 'absent'
              AND sa.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              AND u.status = 'active'
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone,
                     b.batch_name, c.name, trainer_name, att_pct
            HAVING gaps >= 2
        `);

        // Fixed management email recipients (test: 2 addresses — add others after confirming delivery)
        const managementEmails = [
            'v7032vinsup@gmail.com',
            'productionvinsup@gmail.com',
        ];

        let count = 0;
        for (const t of targets) {
            const name = `${t.first_name} ${t.last_name}`;
            const studentData = {
                batch_name:   t.batch_name   || '',
                course_name:  t.course_name  || '',
                trainer_name: t.trainer_name || '',
                email:        t.email        || '',
                phone:        t.phone        || '',
                attPct:       t.att_pct      || 0,
            };

            // Always email the student (2 or 3+ days)
            await emailService.sendAbsenceEmail(t.email, name, t.gaps, false, studentData);
            count++;

            // 3+ consecutive days → also alert all management
            if (t.gaps >= 3) {
                for (const mgmtEmail of managementEmails) {
                    await emailService.sendAbsenceEmail(mgmtEmail, name, t.gaps, true, studentData);
                }
            }
        }
        return { success: true, count };
    } catch (err) {
        console.error('Absence Email Trigger Error:', err.message);
        return { success: false, count: 0 };
    }
};

// HTTP wrapper — responds immediately, sends emails in background
exports.triggerAbsenceEmailsHTTP = async (req, res) => {
    res.json({ success: true, message: 'Absence alert job started. Emails are being sent in the background.' });
    exports.triggerAbsenceEmails().then(r => {
        console.log(`[AbsenceAlert] Manual trigger complete — ${r.count} emails sent`);
    }).catch(err => {
        console.error('[AbsenceAlert] Manual trigger error:', err.message);
    });
};

// ==========================================
// BATCH HUB & DRILL-DOWN
// ==========================================
exports.getBatchReportHub = async (req, res) => {
    try {
        const [batches] = await pool.query(`
            SELECT b.id as batch_id, b.*, c.name as course_name, u.first_name as trainer_name,
                   (SELECT COUNT(*) FROM BatchStudents WHERE batch_id = b.id) as enrolled_count
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            LEFT JOIN Users u ON b.trainer_id = u.id
            ORDER BY b.start_date DESC
        `);
        res.json({ batches });
    } catch (error) {
        res.status(500).json({ message: 'Batch hub error', error: error.message });
    }
};

exports.getBatchDetailsFlow = async (req, res) => {
    try {
        const { id } = req.params;
        const [details] = await pool.query(`
            SELECT b.*, c.name as course_name, u.first_name as trainer_name
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            LEFT JOIN Users u ON b.trainer_id = u.id
            WHERE b.id = ?
        `, [id]);

        if (details.length === 0) return res.status(404).json({ message: 'Batch not found' });

        const [students] = await pool.query(`
            SELECT u.id as student_id, u.first_name, u.last_name, u.email, u.status, u.phone,
                   (SELECT COUNT(*) FROM StudentAttendance WHERE student_id = u.id AND status='present') / NULLIF((SELECT COUNT(*) FROM StudentAttendance WHERE student_id = u.id), 0) * 100 as attendance_pct
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            WHERE bs.batch_id = ?
        `, [id]);

        const [kras] = await pool.query('SELECT COUNT(*) as completed_count FROM TrainerKRA WHERE batch_id = ?', [id]);
        const classesCompleted = kras[0].completed_count || 0;

        const [courseDays] = await pool.query(`
            SELECT d.material_url, d.worksheet_url
            FROM Days d
            JOIN Modules m ON d.module_id = m.id
            WHERE m.course_id = ?
            ORDER BY m.sequence_order, d.day_number
        `, [details[0].course_id]);

        const releasedDays = courseDays.slice(0, classesCompleted);
        const materialsReleased = releasedDays.filter(d => d.material_url).length;
        const worksheetsReleased = releasedDays.filter(d => d.worksheet_url).length;

        const [kpis] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM BatchStudents WHERE batch_id = ?) as total_students,
                (SELECT ROUND(AVG(marks), 1) FROM Submissions WHERE student_id IN (SELECT student_id FROM BatchStudents WHERE batch_id = ?) AND submission_type = 'module_test') as avg_test_score,
                (SELECT ROUND(COUNT(CASE WHEN status='present' THEN 1 END) * 100.0 / NULLIF(COUNT(id), 0), 1) FROM StudentAttendance WHERE batch_id = ?) as avg_attendance
            FROM Batches b WHERE b.id = ?
        `, [id, id, id, id]);

        res.json({
            batch: details[0],
            students,
            kpis: {
                total_students: kpis[0].total_students || 0,
                classes_completed: classesCompleted,
                total_worksheets: worksheetsReleased,
                total_materials: materialsReleased,
                avg_test_score: kpis[0].avg_test_score || 0,
                avg_attendance: kpis[0].avg_attendance || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Batch details error', error: error.message });
    }
};

// ==========================================
// DETAILED DRILL-DOWN REPORT (STUDENT)
// ==========================================
exports.getDetailedStudentReport = async (req, res) => {
    try {
        const { id } = req.params;
        const [profileQuery] = await pool.query(`
            SELECT u.*, b.batch_name, c.name as course_name, t.first_name as trainer_name,
                   (SELECT status FROM PortfolioRequests WHERE student_id = u.id LIMIT 1) as portfolio_status,
                   (SELECT ROUND(COUNT(CASE WHEN status='present' THEN 1 END) * 100.0 / NULLIF(COUNT(id), 0), 1) FROM StudentAttendance WHERE student_id = u.id) as attendance_pct,
                   (SELECT ROUND(AVG(marks), 1) FROM Submissions WHERE student_id = u.id AND submission_type = 'module_test') as avg_test_score,
                   (SELECT ROUND(AVG(marks), 1) FROM Submissions WHERE student_id = u.id AND submission_type IN ('module_project', 'capstone')) as avg_module_score
            FROM Users u
            LEFT JOIN BatchStudents bs ON u.id = bs.student_id
            LEFT JOIN Batches b ON bs.batch_id = b.id
            LEFT JOIN Courses c ON b.course_id = c.id
            LEFT JOIN Users t ON b.trainer_id = t.id
            WHERE u.id = ?
        `, [id]);

        const [kpiExt] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM Submissions WHERE student_id = ? AND submission_type IN ('module_project', 'capstone')) as projects_completed,
                (SELECT COUNT(*) FROM ModuleProjects WHERE module_id IN (SELECT id FROM Modules WHERE course_id = (SELECT course_id FROM Batches WHERE id = (SELECT batch_id FROM BatchStudents WHERE student_id = ? LIMIT 1)))) as projects_total
        `, [id, id]);

        const [attendanceQuery] = await pool.query(`
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leaves
            FROM StudentAttendance WHERE student_id = ?
        `, [id]);

        const [modulePerformance] = await pool.query(`
            SELECT m.name as module_name, COALESCE(s.marks, 0) as module_marks,
                   100 as max_marks, COALESCE(s.marks, 0) as percent,
                   CASE 
                      WHEN s.marks >= 90 THEN 'A'
                      WHEN s.marks >= 80 THEN 'B'
                      WHEN s.marks >= 70 THEN 'C'
                      WHEN s.marks >= 50 THEN 'D'
                      WHEN s.marks IS NOT NULL THEN 'F'
                      ELSE '-' 
                   END as grade
            FROM Modules m
            LEFT JOIN Submissions s ON s.module_id = m.id AND s.submission_type = 'module_project' AND s.student_id = ?
            WHERE m.course_id = (SELECT course_id FROM Batches WHERE id = (SELECT batch_id FROM BatchStudents WHERE student_id = ? LIMIT 1))
        `, [id, id]);

        const [testPerformance] = await pool.query(`
            SELECT m.name as test_name, coalesce(s.submission_type, 'Module Test') as type, s.marks, 100 as max_marks, s.marks as percentage,
                   CASE WHEN s.marks >= 50 THEN 'Pass' ELSE 'Fail' END as status,
                   s.submitted_at as submitted
            FROM Submissions s
            LEFT JOIN Modules m ON s.module_id = m.id
            WHERE s.student_id = ? AND s.submission_type = 'module_test'
        `, [id]);

        const [projectPerformance] = await pool.query(`
            SELECT mp.name as project_name, s.submission_type as type, 
                   CASE WHEN s.marks IS NOT NULL THEN 'Graded' ELSE 'Submitted' END as status, 
                   s.marks, s.submitted_at as submission_date
            FROM Submissions s
            LEFT JOIN ModuleProjects mp ON s.module_id = mp.module_id
            WHERE s.student_id = ? AND s.submission_type IN ('module_project', 'capstone')
        `, [id]);

        const [worksheetPerformance] = await pool.query(`
            SELECT m.name as module, d.day_number as day, d.topic_name as material_name, 
                   'Completed' as status, s.submitted_at as completed_at
            FROM Submissions s
            JOIN Days d ON s.day_id = d.id
            JOIN Modules m ON d.module_id = m.id
            WHERE s.student_id = ? AND s.submission_type = 'worksheet'
            ORDER BY m.sequence_order, d.day_number
        `, [id]);

        const [engagement] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM StudentDoubts WHERE student_id = ?) as doubts_raised,
                (SELECT COUNT(*) FROM StudentDoubts WHERE student_id = ? AND status = 'resolved') as doubts_resolved,
                (SELECT COUNT(*) FROM PortfolioRequests WHERE student_id = ?) as portfolio_given,
                (SELECT COUNT(*) FROM SessionFeedback WHERE student_id = ? AND batch_id = (SELECT batch_id FROM BatchStudents WHERE student_id = ? LIMIT 1)) as feedback_given
        `, [id, id, id, id, id]);

        const [remarks] = await pool.query(`
            SELECT r.*, u.first_name as trainer_name 
            FROM StudentRemarks r
            JOIN Users u ON r.trainer_id = u.id
            WHERE r.student_id = ?
            ORDER BY r.created_at DESC
        `, [id]);

        res.status(200).json({
            profile: profileQuery[0],
            kpis: {
                avg_test_score: profileQuery[0]?.avg_test_score || 0,
                avg_module_score: profileQuery[0]?.avg_module_score || 0,
                attendance_pct: profileQuery[0]?.attendance_pct || 0,
                projects_completed: kpiExt[0]?.projects_completed || 0,
                projects_total: kpiExt[0]?.projects_total || 0,
                total_worksheets: (worksheetPerformance && worksheetPerformance.length) || 0
            },
            engagement: {
                doubts_raised: engagement[0]?.doubts_raised || 0,
                doubts_resolved: engagement[0]?.doubts_resolved || 0,
                feedback_given: engagement[0]?.feedback_given > 0,
                portfolio_status: engagement[0]?.portfolio_status || 'Pending',
                capstone_status: engagement[0]?.capstone_status || 'Not Assigned'
            },
            attendance: attendanceQuery[0] || { total_days: 0, present: 0, absent: 0, leaves: 0 },
            modules: modulePerformance,
            tests: testPerformance,
            projects: projectPerformance,
            worksheets: worksheetPerformance
        });
    } catch (error) {
        res.status(500).json({ message: 'Detailed student report error', error: error.message });
    }
};

// ==========================================
// DETAILED DRILL-DOWN REPORT (TRAINER)
// ==========================================
exports.getDetailedTrainerReport = async (req, res) => {
    try {
        const { id } = req.params;
        const [profile] = await pool.query(`
            SELECT u.id, CONCAT(u.first_name, ' ', u.last_name) as name, u.email, u.phone, u.specialization, u.cl_balance, u.comp_balance,
                   (SELECT COUNT(*) FROM Batches WHERE trainer_id = u.id) as total_batches,
                   (SELECT COUNT(*) FROM Batches WHERE trainer_id = u.id AND status = 'active') as active_batches,
                   (SELECT COUNT(DISTINCT student_id) FROM BatchStudents WHERE batch_id IN (SELECT id FROM Batches WHERE trainer_id = u.id)) as students_taught
            FROM Users u WHERE u.id = ?
        `, [id]);
        if (profile.length === 0) return res.status(404).json({ message: 'Trainer not found' });

        const [tasks] = await pool.query(`
            SELECT 
                COUNT(*) as overall_assigned,
                SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as overall_completed,
                SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as this_month_assigned,
                SUM(CASE WHEN status = 'complete' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as this_month_completed,
                SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_month_assigned,
                SUM(CASE WHEN status = 'complete' AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_month_completed
            FROM TrainerTasks WHERE trainer_id = ?
        `, [id]);

        const [kra] = await pool.query('SELECT * FROM TrainerKRA WHERE trainer_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)', [id]);

        const kraDays = new Set();
        kra.forEach(k => {
            if (k.date) kraDays.add(new Date(k.date).toISOString().split('T')[0]);
        });

        const [attRecord] = await pool.query(`
            SELECT 
                COUNT(*) as days_marked,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as forenoon_present,
                SUM(CASE WHEN status IN ('present', 'wfh') THEN 1 ELSE 0 END) as afternoon_present,
                ROUND(COUNT(CASE WHEN status IN ('present', 'wfh') THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as attendance_pct
            FROM TrainerAttendance WHERE trainer_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        `, [id]);

        const attendance = attRecord[0] || { days_marked: 0, forenoon_present: 0, afternoon_present: 0, attendance_pct: 0 };

        res.json({
            profile: profile[0],
            tasks: {
                overall: {
                    assigned: tasks[0].overall_assigned || 0,
                    completed: tasks[0].overall_completed || 0,
                    rate: tasks[0].overall_assigned > 0 ? ((tasks[0].overall_completed / tasks[0].overall_assigned) * 100).toFixed(1) : '0.0'
                },
                thisMonth: {
                    assigned: tasks[0].this_month_assigned || 0,
                    completed: tasks[0].this_month_completed || 0,
                    rate: tasks[0].this_month_assigned > 0 ? ((tasks[0].this_month_completed / tasks[0].this_month_assigned) * 100).toFixed(1) : '0.0'
                },
                lastMonth: {
                    assigned: tasks[0].last_month_assigned || 0,
                    completed: tasks[0].last_month_completed || 0,
                    rate: tasks[0].last_month_assigned > 0 ? ((tasks[0].last_month_completed / tasks[0].last_month_assigned) * 100).toFixed(1) : '0.0'
                }
            },
            kra: {
                total_entries: kra.length,
                days_with_classes: kraDays.size,
                active_tracking: kra.length > 0,
                history: kra
            },
            attendance: {
                days_marked: attendance.days_marked || 0,
                forenoon_present: attendance.forenoon_present || 0,
                afternoon_present: attendance.afternoon_present || 0,
                attendance_pct: attendance.attendance_pct || 0
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Detailed trainer report error', error: error.message });
    }
};

// ==========================================
// TRAINER REPORT EXPORTS (CSV)
// ==========================================

exports.downloadTrainerKRA = async (req, res) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;

        const [kras] = await pool.query(`
            SELECT k.date, b.batch_name, k.topics_covered, k.notes 
            FROM TrainerKRA k
            JOIN Batches b ON k.batch_id = b.id
            WHERE k.trainer_id = ? AND MONTH(k.date) = ? AND YEAR(k.date) = ?
            ORDER BY k.date DESC
        `, [id, month, year]);

        const [otherWorks] = await pool.query(`
            SELECT date, title
            FROM TrainerOtherWorks
            WHERE trainer_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
            ORDER BY date DESC
        `, [id, month, year]);

        let csv = 'Date,Category,Title/Batch,Details,Time Spent/Notes\n';

        kras.forEach(k => {
            const date = new Date(k.date).toLocaleDateString();
            csv += `"${date}","Class KRA","${k.batch_name}","${(k.topics_covered || '').replace(/"/g, '""')}","${(k.notes || '').replace(/"/g, '""')}"\n`;
        });

        otherWorks.forEach(o => {
            const date = new Date(o.date).toLocaleDateString();
            csv += `"${date}","Other Work","${o.title}","",""\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=trainer_kra_${id}_${month}_${year}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        res.status(500).json({ message: 'KRA download error', error: error.message });
    }
};

exports.downloadTrainerFullReport = async (req, res) => {
    try {
        const { id } = req.params;

        const [profile] = await pool.query('SELECT first_name, last_name, email, phone, specialization FROM Users WHERE id = ?', [id]);
        const [batches] = await pool.query('SELECT batch_name, status FROM Batches WHERE trainer_id = ?', [id]);
        const [tasks] = await pool.query('SELECT title, status, due_date FROM TrainerTasks WHERE trainer_id = ?', [id]);

        const name = `${profile[0].first_name} ${profile[0].last_name}`;

        let csv = `Trainer Full Performance Report: ${name}\n`;
        csv += `Email: ${profile[0].email}\n`;
        csv += `Phone: ${profile[0].phone || 'N/A'}\n`;
        csv += `Specialization: ${profile[0].specialization || 'N/A'}\n\n`;

        csv += '--- BATCHES ---\nBatch Name,Status\n';
        batches.forEach(b => {
            csv += `"${b.batch_name}","${b.status}"\n`;
        });

        csv += '\n--- TASKS ---\nTask Title,Status,Due Date\n';
        tasks.forEach(t => {
            const dueDate = t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A';
            csv += `"${t.title}","${t.status}","${dueDate}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=trainer_full_report_${id}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        res.status(500).json({ message: 'Full report download error', error: error.message });
    }
};

// ==========================================
// ATTENDANCE DRILL-DOWN (3-TIER)
// ==========================================

exports.getAttendanceBatchGroups = async (req, res) => {
    try {
        const [batches] = await pool.query(`SELECT DISTINCT batch_name FROM Batches WHERE status = 'active'`);
        const groups = [...new Set(batches.map(b => {
            const parts = b.batch_name.split(' ');
            if (parts[0] === 'Batch') return parts.slice(0, 2).join(' ');
            return parts[0];
        }))].sort();
        res.json({ groups });
    } catch (error) {
        res.status(500).json({ message: 'Attendance groups error', error: error.message });
    }
};

exports.getAttendanceSubBatches = async (req, res) => {
    try {
        const { group } = req.query;
        const [batches] = await pool.query(`
            SELECT b.id as batch_id, b.batch_name, c.name as course_name, b.timing
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            WHERE b.batch_name LIKE ? AND b.status = 'active'
        `, [`%${group}%`]);
        res.json({ batches });
    } catch (error) {
        res.status(500).json({ message: 'Attendance sub-batches error', error: error.message });
    }
};

exports.getDetailedBatchAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const [batch] = await pool.query('SELECT batch_name FROM Batches WHERE id = ?', [id]);
        if (batch.length === 0) return res.status(404).json({ message: 'Batch not found' });

        const [kpis] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM BatchStudents WHERE batch_id = ?) as total,
                (SELECT COUNT(*) FROM StudentAttendance WHERE batch_id = ? AND attendance_date = ? AND status = 'present') as present,
                (SELECT COUNT(*) FROM StudentAttendance WHERE batch_id = ? AND attendance_date = ? AND status = 'absent') as absent
        `, [id, id, targetDate, id, targetDate]);

        const [details] = await pool.query(`
            SELECT u.id as student_id, u.first_name, u.last_name, u.email, 
                   COALESCE(sa.status, 'not marked') as status,
                   (SELECT COUNT(*) FROM StudentAttendance WHERE student_id = u.id AND batch_id = bs.batch_id AND status = 'present') as total_present,
                   (SELECT COUNT(*) FROM StudentAttendance WHERE student_id = u.id AND batch_id = bs.batch_id AND status = 'absent') as total_absent
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            LEFT JOIN StudentAttendance sa ON u.id = sa.student_id AND sa.batch_id = bs.batch_id AND sa.attendance_date = ?
            WHERE bs.batch_id = ?
        `, [targetDate, id]);

        res.json({
            batch_name: batch[0].batch_name,
            kpis: kpis[0],
            details,
            date: targetDate
        });
    } catch (error) {
        res.status(500).json({ message: 'Detailed attendance error', error: error.message });
    }
};

// ==========================================
// DYNAMIC FEEDBACK SYSTEM (ADMIN)
// ==========================================

exports.createFeedbackForm = async (req, res) => {
    try {
        const { module_id, title, form_json } = req.body;
        const [result] = await pool.query(
            'INSERT INTO FeedbackForms (module_id, title, form_json) VALUES (?, ?, ?)',
            [module_id || null, title, JSON.stringify(form_json)]
        );
        res.status(201).json({ message: 'Feedback form created successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating feedback form', error: error.message });
    }
};

exports.getFeedbackForms = async (req, res) => {
    try {
        const [forms] = await pool.query(`
            SELECT ff.*, m.name as module_name 
            FROM FeedbackForms ff 
            LEFT JOIN Modules m ON ff.module_id = m.id 
            ORDER BY ff.created_at DESC
        `);
        res.json({ forms });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback forms', error: error.message });
    }
};

exports.getFeedbackReports = async (req, res) => {
    try {
        const { batch_id, form_id } = req.query;

        // Build WHERE clause
        const conditions = [];
        const params = [];
        if (batch_id) { conditions.push('sfr.batch_id = ?'); params.push(batch_id); }
        if (form_id)  { conditions.push('sfr.form_id = ?');  params.push(form_id); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [reports] = await pool.query(`
            SELECT
                sfr.id, sfr.student_id, sfr.batch_id, sfr.module_id, sfr.form_id,
                sfr.response_json, sfr.submitted_at,
                u.first_name, u.last_name, u.email,
                b.batch_name,
                c.id AS course_id, c.name AS course_name,
                m.id AS module_id_ref, m.name AS module_name, m.sequence_order AS module_order,
                ff.title AS form_title, ff.form_json
            FROM StudentFeedbackResponses sfr
            JOIN Users u ON sfr.student_id = u.id
            JOIN Batches b ON sfr.batch_id = b.id
            LEFT JOIN Courses c ON b.course_id = c.id
            LEFT JOIN FeedbackForms ff ON sfr.form_id = ff.id
            LEFT JOIN Modules m ON ff.module_id = m.id
            ${where}
            ORDER BY b.batch_name, c.name, m.sequence_order, sfr.submitted_at DESC
        `, params);

        // Batches that have at least one response (for filter dropdown)
        const [batches] = await pool.query(`
            SELECT DISTINCT b.id, b.batch_name, c.name AS course_name
            FROM StudentFeedbackResponses sfr
            JOIN Batches b ON sfr.batch_id = b.id
            LEFT JOIN Courses c ON b.course_id = c.id
            ORDER BY b.batch_name
        `);

        // Forms/modules that have responses (optionally scoped to batch)
        const formParams = [];
        let formWhere = '';
        if (batch_id) { formWhere = 'WHERE sfr.batch_id = ?'; formParams.push(batch_id); }
        const [forms] = await pool.query(`
            SELECT DISTINCT ff.id, ff.title, m.name AS module_name
            FROM StudentFeedbackResponses sfr
            JOIN FeedbackForms ff ON sfr.form_id = ff.id
            LEFT JOIN Modules m ON ff.module_id = m.id
            ${formWhere}
            ORDER BY ff.title
        `, formParams);

        // Aggregate stats
        const [stats] = await pool.query(`
            SELECT
                COUNT(*) AS total_responses,
                COUNT(DISTINCT sfr.student_id) AS unique_students,
                COUNT(DISTINCT sfr.batch_id) AS total_batches,
                COUNT(DISTINCT sfr.form_id) AS total_forms
            FROM StudentFeedbackResponses sfr
        `);

        res.json({ reports, batches, forms, stats: stats[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback reports', error: error.message });
    }
};

// ── JRP/IOP Program Type Management ──────────────────────────────────────────

exports.updateStudentProgramType = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { program_type } = req.body;
        if (!['JRP', 'IOP'].includes(program_type)) {
            return res.status(400).json({ message: 'program_type must be JRP or IOP' });
        }
        await pool.query('UPDATE Users SET program_type = ? WHERE id = ? AND role_id = 4', [program_type, studentId]);
        res.json({ message: 'Program type updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating program type', error: error.message });
    }
};

exports.resetStudentCertificate = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { cert_type } = req.body;
        if (!['completion', 'internship'].includes(cert_type)) {
            return res.status(400).json({ message: 'cert_type must be completion or internship' });
        }
        await pool.query(
            'UPDATE Certificates SET reset_by_admin = 1, generated_at = NULL, cert_data = NULL WHERE student_id = ? AND cert_type = ?',
            [studentId, cert_type]
        );
        res.json({ message: 'Certificate reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting certificate', error: error.message });
    }
};

exports.getStudentsWithProgramType = async (req, res) => {
    try {
        const [students] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.program_type, u.status,
                   bs.batch_id, bs.course_completion_date, bs.ready_for_interview,
                   b.batch_name
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            JOIN Batches b ON bs.batch_id = b.id
            WHERE u.role_id = 4
            ORDER BY u.program_type DESC, u.first_name
        `);
        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching program overview', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// SA: SEND PERSONALIZED PROGRESS REPORT EMAILS TO STUDENTS
// ══════════════════════════════════════════════════════════════════════════════
exports.sendProgressEmails = async (req, res) => {
    const emailService = require('../utils/email.service');
    try {
        const { target, batchId, programType, customMessage } = req.body;
        // target: 'all' | 'batch' | 'program'

        // 1. Resolve target students
        let studentsQuery = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.program_type, u.student_status,
                   b.id as batch_id, b.batch_name, c.name as course_name,
                   CONCAT(t.first_name, ' ', t.last_name) as trainer_name
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            JOIN Batches b ON bs.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            LEFT JOIN Users t ON b.trainer_id = t.id
            WHERE u.role_id = 4 AND u.status = 'active' AND b.status = 'active'
        `;
        const params = [];
        if (target === 'batch' && batchId) {
            studentsQuery += ' AND b.id = ?';
            params.push(batchId);
        } else if (target === 'program' && programType) {
            studentsQuery += ' AND u.program_type = ?';
            params.push(programType);
        }

        const [students] = await pool.query(studentsQuery, params);
        if (!students.length) return res.json({ sent: 0, failed: 0, message: 'No matching students found' });

        let sent = 0, failed = 0;

        // 2. For each student compile performance data then email (fire-and-forget per student)
        const emailPromises = students.map(async (student) => {
            try {
                // Attendance
                const [[att]] = await pool.query(`
                    SELECT
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
                        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                        SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days
                    FROM StudentAttendance
                    WHERE student_id = ? AND batch_id = ?
                `, [student.id, student.batch_id]);

                const attPct = att.total > 0 ? Math.round((att.present_days / att.total) * 100) : 0;

                // Module marks from release submissions
                const [submissions] = await pool.query(`
                    SELECT srs.marks, srs.status, br.release_type, br.entity_id, br.module_id,
                           m.name as module_name
                    FROM StudentReleaseSubmissions srs
                    JOIN BatchReleases br ON srs.release_id = br.id
                    LEFT JOIN Modules m ON (br.release_type = 'module_test' AND m.id = br.entity_id)
                                       OR (br.release_type IN ('module_project','module_study_material','module_interview_questions') AND m.id = br.module_id)
                    WHERE srs.student_id = ? AND srs.batch_id = ?
                    ORDER BY br.release_type, br.entity_id
                `, [student.id, student.batch_id]);

                // Pending submissions (released but not submitted)
                const [[pendingRow]] = await pool.query(`
                    SELECT COUNT(*) as pending_count
                    FROM BatchReleases br
                    WHERE br.batch_id = ?
                      AND br.release_type IN ('module_test','module_project','capstone_project')
                      AND NOT EXISTS (
                          SELECT 1 FROM StudentReleaseSubmissions srs
                          WHERE srs.release_id = br.id AND srs.student_id = ?
                      )
                `, [student.batch_id, student.id]);

                // Positive remarks
                const [positiveRemarks] = await pool.query(`
                    SELECT remark_text FROM StudentRemarks
                    WHERE student_id = ? AND batch_id = ? AND remark_type = 'positive'
                    ORDER BY created_at DESC LIMIT 3
                `, [student.id, student.batch_id]);

                // Module reviews (trainer-written)
                const [moduleReviews] = await pool.query(`
                    SELECT smr.overall_marks, smr.grade, smr.strengths, smr.improvements, m.name as module_name
                    FROM StudentModuleReviews smr
                    JOIN Modules m ON smr.module_id = m.id
                    WHERE smr.student_id = ? AND smr.batch_id = ?
                    ORDER BY m.sequence_order
                `, [student.id, student.batch_id]);

                const performanceData = {
                    attPct, att,
                    submissions,
                    pendingCount: pendingRow.pending_count,
                    positiveRemarks,
                    moduleReviews,
                    customMessage: customMessage || '',
                };

                await emailService.sendStudentProgressReport(student, performanceData);
                sent++;
            } catch (err) {
                console.error(`[ProgressEmail] Failed for ${student.email}:`, err.message);
                failed++;
            }
        });

        // Respond immediately — emails send in background
        res.json({ sent: students.length, failed: 0, total: students.length, message: `Progress emails are being sent to ${students.length} student(s) in the background.` });

        Promise.allSettled(emailPromises).then(results => {
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`[ProgressEmail] Complete — ${students.length - failed} sent, ${failed} failed`);
        });
    } catch (error) {
        res.status(500).json({ message: 'Error sending progress emails', error: error.message });
    }
}

// ==========================================
// IOP GROUPS MANAGEMENT (Super Admin)
// ==========================================

exports.getIOPTrainers = async (req, res) => {
    try {
        const [trainers] = await pool.query(`
            SELECT id, first_name, last_name, email
            FROM Users WHERE role_id = 6 AND status = 'active'
            ORDER BY first_name
        `);
        res.json({ trainers });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP trainers', error: error.message });
    }
};

exports.createIOPTrainer = async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ message: 'first_name, last_name, email, password are required' });
        }
        const [exists] = await pool.query('SELECT id FROM Users WHERE email = ?', [email]);
        if (exists.length > 0) return res.status(409).json({ message: 'Email already registered' });

        const [result] = await pool.query(
            'INSERT INTO Users (first_name, last_name, email, password, phone, role_id, status) VALUES (?, ?, ?, ?, ?, 6, ?)',
            [first_name, last_name, email, password, phone || null, 'active']
        );
        res.json({ message: 'IOP Trainer created', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating IOP trainer', error: error.message });
    }
};

exports.getIOPGroups = async (req, res) => {
    try {
        const [groups] = await pool.query(`
            SELECT g.*,
                   CONCAT(u.first_name, ' ', u.last_name) as trainer_name,
                   (SELECT COUNT(DISTINCT bs.student_id)
                    FROM IOPGroupBatches igb
                    JOIN BatchStudents bs ON igb.batch_id = bs.batch_id
                    WHERE igb.iop_group_id = g.id) as student_count,
                   (SELECT COUNT(*) FROM IOPGroupBatches WHERE iop_group_id = g.id) as batch_count
            FROM IOPGroups g
            JOIN Users u ON g.iop_trainer_id = u.id
            ORDER BY g.created_at DESC
        `);

        for (const group of groups) {
            const [batches] = await pool.query(`
                SELECT b.id, b.batch_name, c.name as course_name
                FROM IOPGroupBatches igb
                JOIN Batches b ON igb.batch_id = b.id
                JOIN Courses c ON b.course_id = c.id
                WHERE igb.iop_group_id = ?
            `, [group.id]);
            group.batches = batches;
        }

        res.json({ groups });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP groups', error: error.message });
    }
};

exports.createIOPGroup = async (req, res) => {
    try {
        const { name, iop_trainer_id, batch_ids, start_date, end_date, timing } = req.body;
        if (!name || !iop_trainer_id || !Array.isArray(batch_ids) || batch_ids.length === 0) {
            return res.status(400).json({ message: 'name, iop_trainer_id, and batch_ids[] are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO IOPGroups (name, iop_trainer_id, start_date, end_date, timing, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [name, iop_trainer_id, start_date || null, end_date || null, timing || null, req.user.id]
        );
        const groupId = result.insertId;

        for (const batchId of batch_ids) {
            await pool.query(
                'INSERT IGNORE INTO IOPGroupBatches (iop_group_id, batch_id) VALUES (?, ?)',
                [groupId, batchId]
            );
        }

        res.json({ message: 'IOP Group created', id: groupId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating IOP group', error: error.message });
    }
};

exports.updateIOPGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, iop_trainer_id, batch_ids, start_date, end_date, timing, status } = req.body;

        await pool.query(
            'UPDATE IOPGroups SET name = ?, iop_trainer_id = ?, start_date = ?, end_date = ?, timing = ?, status = ? WHERE id = ?',
            [name, iop_trainer_id, start_date || null, end_date || null, timing || null, status || 'upcoming', id]
        );

        if (Array.isArray(batch_ids)) {
            await pool.query('DELETE FROM IOPGroupBatches WHERE iop_group_id = ?', [id]);
            for (const batchId of batch_ids) {
                await pool.query(
                    'INSERT IGNORE INTO IOPGroupBatches (iop_group_id, batch_id) VALUES (?, ?)',
                    [id, batchId]
                );
            }
        }

        res.json({ message: 'IOP Group updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating IOP group', error: error.message });
    }
};

exports.deleteIOPGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM IOPGroups WHERE id = ?', [id]);
        res.json({ message: 'IOP Group deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting IOP group', error: error.message });
    }
};

// ── Sidebar notification counts ───────────────────────────────────────────────
exports.getNotificationCounts = async (req, res) => {
    try {
        const [[{ pendingTrainerLeaves }]] = await pool.query(
            "SELECT COUNT(*) AS pendingTrainerLeaves FROM TrainerLeaves WHERE status = 'pending'");
        const [[{ pendingTasks }]] = await pool.query(
            "SELECT COUNT(*) AS pendingTasks FROM TrainerTasks WHERE status IN ('assigned','review')");
        const [[{ pendingPortfolios }]] = await pool.query(
            "SELECT COUNT(*) AS pendingPortfolios FROM PortfolioRequests WHERE status = 'pending'");
        const [[{ unresolvedIssues }]] = await pool.query(
            "SELECT COUNT(*) AS unresolvedIssues FROM StudentIssues WHERE status != 'resolved'");
        const [[{ unresolvedDoubts }]] = await pool.query(
            "SELECT COUNT(*) AS unresolvedDoubts FROM StudentDoubts WHERE status != 'resolved'");
        const [[{ pendingJobRequests }]] = await pool.query(
            "SELECT COUNT(*) AS pendingJobRequests FROM JobPortalRequests WHERE status = 'pending'");
        res.json({ pendingTrainerLeaves, pendingTasks, pendingPortfolios, unresolvedIssues, unresolvedDoubts, pendingJobRequests });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notification counts', error: error.message });
    }
};

