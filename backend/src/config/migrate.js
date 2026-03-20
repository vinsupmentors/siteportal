const pool = require('./db');

async function addColumnIfNotExists(tableName, columnDef) {
    try {
        await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
    } catch (err) {
        // MySQL Error 1060 is "Duplicate column name", which we want to ignore
        if (err.errno !== 1060 && err.code !== 'ER_DUP_FIELDNAME') {
            console.error(`[Migration] Error adding column to ${tableName}:`, err.message);
        }
    }
}

async function runMigrations() {
    console.log('[Migration] Starting schema migration...');
    try {
        // ── Users: missing columns ──────────────────────────────────────
        await addColumnIfNotExists('Users', 'joining_date DATE');
        await addColumnIfNotExists('Users', 'is_probation TINYINT(1) DEFAULT 0');
        await addColumnIfNotExists('Users', 'casual_leave_count INT DEFAULT 0');
        await addColumnIfNotExists('Users', 'job_portal_unlocked TINYINT(1) DEFAULT 0');
        await addColumnIfNotExists('Users', "student_status ENUM('Regular','Irregular','Dropout','Batch Transfer','Course Completed') DEFAULT 'Regular'");

        // ── Modules: missing columns ────────────────────────────────────
        await addColumnIfNotExists('Modules', 'study_material_url VARCHAR(500)');
        await addColumnIfNotExists('Modules', 'test_url VARCHAR(500)');
        await addColumnIfNotExists('Modules', 'interview_questions_url VARCHAR(500)');

        // ── Days: missing columns ───────────────────────────────────────
        await addColumnIfNotExists('Days', 'notes_url VARCHAR(500)');

        // ── TrainerTasks: missing columns ───────────────────────────────
        await addColumnIfNotExists('TrainerTasks', 'review_notes TEXT');
        await addColumnIfNotExists('TrainerTasks', 'review_date TIMESTAMP NULL');

        // ── StudentAttendance: missing columns + unique key ─────────────
        await addColumnIfNotExists('StudentAttendance', 'notes TEXT');
        try {
            await pool.query(`ALTER TABLE StudentAttendance ADD UNIQUE KEY uq_student_batch_date (student_id, batch_id, attendance_date)`);
        } catch (e) { /* Ignore if key already exists */ }

        // ── TrainerAttendance: missing columns ──────────────────────────
        await addColumnIfNotExists('TrainerAttendance', "session ENUM('morning','afternoon','full_day') DEFAULT 'full_day'");

        // ── Certificates: missing columns ───────────────────────────────
        await addColumnIfNotExists('Certificates', "type ENUM('course_completion','internship') DEFAULT 'course_completion'");
        await addColumnIfNotExists('Certificates', 'issued_by INT');

        // ── Batches: missing columns ────────────────────────────────────
        await addColumnIfNotExists('Batches', 'schedule_type VARCHAR(50)');
        await addColumnIfNotExists('Batches', 'timing VARCHAR(100)');
        await addColumnIfNotExists('Batches', 'meeting_link VARCHAR(500)');

        // ── Jobs ────────────────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                description TEXT,
                course_id INT,
                created_by INT NOT NULL,
                ctc VARCHAR(100),
                experience_level VARCHAR(100),
                apply_link VARCHAR(500),
                deadline_date DATE,
                hired_count INT DEFAULT 0,
                status ENUM('Open','Closed') DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES Users(id)
            )
        `);

        // ── JobApplications ─────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS JobApplications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                student_id INT NOT NULL,
                status ENUM('applied','shortlisted','rejected','hired') DEFAULT 'applied',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_job_student (job_id, student_id),
                FOREIGN KEY (job_id) REFERENCES Jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // ── JobPortalRequests ───────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS JobPortalRequests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                google_review_img VARCHAR(500),
                portfolio_link VARCHAR(500),
                bypass_reason TEXT,
                status ENUM('pending','approved','rejected') DEFAULT 'pending',
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // ── BatchUnlocks ────────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS BatchUnlocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                batch_id INT NOT NULL,
                module_id INT NOT NULL,
                unlocked_up_to_day INT DEFAULT 0,
                is_projects_released TINYINT(1) DEFAULT 0,
                is_test_released TINYINT(1) DEFAULT 0,
                is_feedback_released TINYINT(1) DEFAULT 0,
                is_study_materials_released TINYINT(1) DEFAULT 0,
                is_interview_questions_released TINYINT(1) DEFAULT 0,
                unlocked_by INT NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_batch_module (batch_id, module_id),
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES Modules(id) ON DELETE CASCADE,
                FOREIGN KEY (unlocked_by) REFERENCES Users(id)
            )
        `);

        // Migration for existing tables
        await addColumnIfNotExists('BatchUnlocks', 'is_projects_released TINYINT(1) DEFAULT 0');
        await addColumnIfNotExists('BatchUnlocks', 'is_test_released TINYINT(1) DEFAULT 0');
        await addColumnIfNotExists('BatchUnlocks', 'is_feedback_released TINYINT(1) DEFAULT 0');
        await addColumnIfNotExists('BatchUnlocks', 'is_study_materials_released TINYINT(1) DEFAULT 0');
        await addColumnIfNotExists('BatchUnlocks', 'is_interview_questions_released TINYINT(1) DEFAULT 0');

        // ── ModuleProjects ──────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ModuleProjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                FOREIGN KEY (module_id) REFERENCES Modules(id) ON DELETE CASCADE
            )
        `);

        // ── ContentFiles ────────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ContentFiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                entity_type ENUM('module','day','project') NOT NULL,
                entity_id INT NOT NULL,
                category VARCHAR(100),
                original_name VARCHAR(255),
                stored_name VARCHAR(255),
                file_size INT,
                mime_type VARCHAR(100),
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ── TrainerKRA ──────────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS TrainerKRA (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainer_id INT NOT NULL,
                batch_id INT,
                date DATE NOT NULL,
                session ENUM('morning','afternoon','evening','weekends') DEFAULT 'morning',
                topics_covered TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE SET NULL
            )
        `);

        // ── TrainerLeaves ───────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS TrainerLeaves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainer_id INT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason TEXT,
                leave_type ENUM('casual','sick','comp') DEFAULT 'casual',
                session ENUM('full_day','morning','afternoon') DEFAULT 'full_day',
                status ENUM('pending','approved','rejected') DEFAULT 'pending',
                reviewed_by INT,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewed_by) REFERENCES Users(id) ON DELETE SET NULL
            )
        `);

        // ── StudentRemarks ──────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS StudentRemarks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                batch_id INT NOT NULL,
                trainer_id INT NOT NULL,
                remark_text TEXT NOT NULL,
                remark_type ENUM('positive','negative','neutral') DEFAULT 'neutral',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE CASCADE,
                FOREIGN KEY (trainer_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // ── FeedbackForms ───────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS FeedbackForms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT,
                title VARCHAR(255) NOT NULL,
                form_json JSON,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (module_id) REFERENCES Modules(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
            )
        `);

        // ── BatchFeedbackStatus ─────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS BatchFeedbackStatus (
                id INT AUTO_INCREMENT PRIMARY KEY,
                batch_id INT NOT NULL,
                module_id INT,
                form_id INT NOT NULL,
                is_released TINYINT(1) DEFAULT 0,
                released_at TIMESTAMP NULL,
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE CASCADE,
                FOREIGN KEY (form_id) REFERENCES FeedbackForms(id) ON DELETE CASCADE
            )
        `);

        // ── StudentFeedbackResponses ────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS StudentFeedbackResponses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                batch_id INT NOT NULL,
                module_id INT,
                form_id INT NOT NULL,
                response_json JSON,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE CASCADE,
                FOREIGN KEY (form_id) REFERENCES FeedbackForms(id) ON DELETE CASCADE
            )
        `);

        // ── TrainerSpecializations ──────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS TrainerSpecializations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainer_id INT NOT NULL,
                course_id INT NOT NULL,
                UNIQUE KEY uq_trainer_course (trainer_id, course_id),
                FOREIGN KEY (trainer_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE
            )
        `);
     // ── CapstoneProjecs ─────────────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS CapstoneProjecs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                sequence_order INT DEFAULT 1,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
            )
        `);

        // ── BatchReleases ───────────────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS BatchReleases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                batch_id INT NOT NULL,
                release_type ENUM(
                    'module_project',
                    'module_test',
                    'module_feedback',
                    'module_study_material',
                    'module_interview_questions',
                    'capstone_project'
                ) NOT NULL,
                entity_id INT NOT NULL,
                module_id INT NULL,
                due_date DATE NULL,
                released_by INT NOT NULL,
                released_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_batch_release_item (batch_id, release_type, entity_id),
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE CASCADE,
                FOREIGN KEY (released_by) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);

        // ── StudentReleaseSubmissions ───────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS StudentReleaseSubmissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                release_id INT NOT NULL,
                student_id INT NOT NULL,
                batch_id INT NOT NULL,
                file_url VARCHAR(500),
                github_link VARCHAR(500),
                notes TEXT,
                marks DECIMAL(5,2),
                feedback TEXT,
                graded_by INT,
                status ENUM('submitted','graded','returned') DEFAULT 'submitted',
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                graded_at TIMESTAMP NULL,
                UNIQUE KEY uq_release_student (release_id, student_id),
                FOREIGN KEY (release_id) REFERENCES BatchReleases(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE CASCADE,
                FOREIGN KEY (graded_by) REFERENCES Users(id) ON DELETE SET NULL
            )
        `);
        // ── ContentFiles: add binary storage column ─────────────────────────
        await addColumnIfNotExists('ContentFiles', 'file_data LONGBLOB');

        // ── JRP/IOP Program Type ─────────────────────────────────────────────
        await addColumnIfNotExists('Users', "program_type ENUM('JRP','IOP') DEFAULT 'JRP'");
        await addColumnIfNotExists('Users', 'roll_number VARCHAR(50) NULL');

        // ── Course Completion Tracking on BatchStudents ──────────────────────
        await addColumnIfNotExists('BatchStudents', 'course_completion_date DATE NULL');
        await addColumnIfNotExists('BatchStudents', 'ready_for_interview TINYINT(1) DEFAULT 0');

        // ── Certificate Enhancements ─────────────────────────────────────────
        await addColumnIfNotExists('Certificates', "cert_type ENUM('completion','internship') DEFAULT 'completion'");
        await addColumnIfNotExists('Certificates', 'generated_at DATETIME NULL');
        await addColumnIfNotExists('Certificates', 'reset_by_admin TINYINT(1) DEFAULT 0');
        await addColumnIfNotExists('Certificates', "program_type ENUM('JRP','IOP') DEFAULT 'JRP'");
        await addColumnIfNotExists('Certificates', 'cert_data LONGBLOB NULL');

        // ── IOP Curriculum ───────────────────────────────────────────────────
        // Global soft skills + aptitude modules (created once by SA, shared across all batches)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS IOPModules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('soft_skills','aptitude') NOT NULL,
                title VARCHAR(200) NOT NULL,
                sequence_order INT DEFAULT 0
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS IOPTopics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT NOT NULL,
                day_number INT NOT NULL,
                topic_name VARCHAR(300) NOT NULL,
                notes TEXT,
                FOREIGN KEY (module_id) REFERENCES IOPModules(id) ON DELETE CASCADE
            )
        `);

        // Per-batch IOP unlock state (IOP trainer controls unlock pace per batch)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS IOPBatchUnlocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                batch_id INT NOT NULL,
                module_id INT NOT NULL,
                unlocked_up_to_day INT DEFAULT 0,
                unlocked_by INT,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_iop_batch_module (batch_id, module_id),
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES IOPModules(id) ON DELETE CASCADE
            )
        `);

        // IOP trainer assigned per batch (separate from the technical trainer_id)
        await addColumnIfNotExists('Batches', 'iop_trainer_id INT NULL');

        // ── IOPModuleFiles (3 files per module: concepts, sample_problems, worksheet) ──
        await pool.query(`
            CREATE TABLE IF NOT EXISTS IOPModuleFiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT NOT NULL,
                file_type ENUM('concepts','sample_problems','worksheet') NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                file_size INT,
                file_data LONGBLOB NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (module_id) REFERENCES IOPModules(id) ON DELETE CASCADE,
                UNIQUE KEY uq_iop_module_filetype (module_id, file_type)
            )
        `);

        // ── StudentInterviews ────────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS StudentInterviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                batch_id INT NOT NULL,
                recruiter_id INT NOT NULL,
                interview_number TINYINT NOT NULL,
                company_name VARCHAR(255),
                scheduled_date DATE NULL,
                status ENUM('scheduled','in_progress','placed','rejected') DEFAULT 'scheduled',
                notes TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES Users(id),
                FOREIGN KEY (batch_id) REFERENCES Batches(id)
            )
        `);

        console.log('[Migration] All migrations applied successfully.');
    } catch (err) {
        console.error('[Migration] Error:', err.message);
    }
}

module.exports = runMigrations;
