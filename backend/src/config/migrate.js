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
                unlocked_by INT NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_batch_module (batch_id, module_id),
                FOREIGN KEY (batch_id) REFERENCES Batches(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES Modules(id) ON DELETE CASCADE,
                FOREIGN KEY (unlocked_by) REFERENCES Users(id)
            )
        `);

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

        console.log('[Migration] All migrations applied successfully.');
    } catch (err) {
        console.error('[Migration] Error:', err.message);
    }
}

module.exports = runMigrations;
