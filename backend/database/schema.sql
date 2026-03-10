-- Roles Mapping
CREATE TABLE IF NOT EXISTS Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('Super Admin', 'Admin', 'Trainer', 'Student') NOT NULL UNIQUE
);

-- Core Users 
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Specifically enforced NO HASH limitation
    phone VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    student_phase ENUM('Joined', 'Technical', 'Internship', 'Soft Skills', 'Certificate', 'Completed') DEFAULT 'Joined',
    specialization VARCHAR(255),
    cl_balance INT DEFAULT 0,
    comp_balance INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES Roles(id)
);

-- Programs Matrix (JRP, IOP, IOP_EXT, PAP)
CREATE TABLE IF NOT EXISTS Programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('JRP', 'IOP', 'IOP_EXT', 'PAP') NOT NULL,
    total_hours INT NOT NULL,
    tech_hours INT DEFAULT 0,
    soft_skills_hours INT DEFAULT 0,
    placement_support_days INT DEFAULT 0,
    assured_interviews INT DEFAULT 0
);

-- Courses inside Programs
CREATE TABLE IF NOT EXISTS Courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    FOREIGN KEY (program_id) REFERENCES Programs(id)
);

-- Modules inside Courses
CREATE TABLE IF NOT EXISTS Modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    sequence_order INT NOT NULL,
    module_project_details TEXT,
    FOREIGN KEY (course_id) REFERENCES Courses(id)
);

-- Days mapping to Modules
CREATE TABLE IF NOT EXISTS Days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    day_number INT NOT NULL,
    topic_name VARCHAR(255),
    material_url VARCHAR(500),
    worksheet_url VARCHAR(500),
    FOREIGN KEY (module_id) REFERENCES Modules(id)
);

-- Batches
CREATE TABLE IF NOT EXISTS Batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    trainer_id INT,
    batch_name VARCHAR(100) NOT NULL,
    schedule_type ENUM('weekday', 'weekend') NOT NULL,
    timing ENUM('morning', 'afternoon', 'evening', 'weekends') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
    meeting_link VARCHAR(500),
    FOREIGN KEY (course_id) REFERENCES Courses(id),
    FOREIGN KEY (trainer_id) REFERENCES Users(id)
);

-- Batch Student Mapping
CREATE TABLE IF NOT EXISTS BatchStudents (
    batch_id INT NOT NULL,
    student_id INT NOT NULL,
    loyalty_marks INT DEFAULT 0,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (batch_id, student_id),
    FOREIGN KEY (batch_id) REFERENCES Batches(id),
    FOREIGN KEY (student_id) REFERENCES Users(id)
);

-- Student Daily Attendance
CREATE TABLE IF NOT EXISTS StudentAttendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    student_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'leave') NOT NULL,
    logged_by INT, -- Usually the trainer
    FOREIGN KEY (batch_id) REFERENCES Batches(id),
    FOREIGN KEY (student_id) REFERENCES Users(id),
    FOREIGN KEY (logged_by) REFERENCES Users(id)
);

-- Student Leave Requests
CREATE TABLE IF NOT EXISTS StudentLeaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    batch_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Users(id),
    FOREIGN KEY (batch_id) REFERENCES Batches(id),
    FOREIGN KEY (reviewed_by) REFERENCES Users(id)
);

-- Diverse File Submissions (Worksheets, Projects)
CREATE TABLE IF NOT EXISTS Submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    day_id INT, 
    module_id INT, 
    file_paths JSON NOT NULL, 
    submission_type ENUM('worksheet', 'module_test', 'module_project', 'capstone') NOT NULL,
    marks DECIMAL(5,2),
    feedback TEXT,
    graded_by INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Users(id),
    FOREIGN KEY (day_id) REFERENCES Days(id),
    FOREIGN KEY (module_id) REFERENCES Modules(id),
    FOREIGN KEY (graded_by) REFERENCES Users(id)
);

-- Trainer Tasks from Super Admin
CREATE TABLE IF NOT EXISTS TrainerTasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    assigned_by INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('assigned', 'review', 'complete', 'return') DEFAULT 'assigned',
    due_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES Users(id),
    FOREIGN KEY (assigned_by) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS TrainerOtherWorks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    time_spent VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES Users(id)
);

-- Trainer Attendance & Leave Mgmt
CREATE TABLE IF NOT EXISTS TrainerAttendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'leave_probation', 'leave_post_probation', 'wfh', 'leave_with_comp') NOT NULL,
    approved_by INT,
    FOREIGN KEY (trainer_id) REFERENCES Users(id),
    FOREIGN KEY (approved_by) REFERENCES Users(id)
);

-- Technical Doubt Tickets
CREATE TABLE IF NOT EXISTS StudentDoubts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    trainer_id INT,
    batch_id INT,
    query_text TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    response_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by INT,
    FOREIGN KEY (student_id) REFERENCES Users(id),
    FOREIGN KEY (trainer_id) REFERENCES Users(id),
    FOREIGN KEY (batch_id) REFERENCES Batches(id),
    FOREIGN KEY (resolved_by) REFERENCES Users(id)
);

-- General Administrative Escalations (Student to Super Admin)
CREATE TABLE IF NOT EXISTS StudentIssues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    issue_type VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('open', 'in_progress', 'resolved', 'rejected') DEFAULT 'open',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Users(id)
);

-- Automated Portfolio Script Setup
CREATE TABLE IF NOT EXISTS PortfolioRequests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    details JSON NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    hosted_url VARCHAR(500),
    FOREIGN KEY (student_id) REFERENCES Users(id)
);

-- Session & Trainer Feedback Ratings
CREATE TABLE IF NOT EXISTS SessionFeedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    student_id INT NOT NULL,
    trainer_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES Batches(id),
    FOREIGN KEY (student_id) REFERENCES Users(id),
    FOREIGN KEY (trainer_id) REFERENCES Users(id)
);

-- Job Interviews & Placement Tracker 
CREATE TABLE IF NOT EXISTS JobInterviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_role VARCHAR(255),
    interview_date DATETIME,
    round_number INT DEFAULT 1,
    status ENUM('scheduled', 'completed', 'selected', 'rejected', 'no_show') DEFAULT 'scheduled',
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Users(id)
);

-- End of Course Generation 
CREATE TABLE IF NOT EXISTS Certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    certificate_url VARCHAR(500) NOT NULL,
    issued_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES Users(id),
    FOREIGN KEY (course_id) REFERENCES Courses(id)
);

-- Realtime UI Notifications Queue
CREATE TABLE IF NOT EXISTS Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255), -- Optional link to redirect within app
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Targeted Announcements Broadcasts
CREATE TABLE IF NOT EXISTS Announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_role ENUM('all', '3', '4', 'batch') NOT NULL,
    target_batch_id INT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (target_batch_id) REFERENCES Batches(id),
    FOREIGN KEY (created_by) REFERENCES Users(id)
);

-- Announcement Read-Receipts
CREATE TABLE IF NOT EXISTS AnnouncementAcknowledgements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES Announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY (announcement_id, user_id)
);

-- Enterprise Master Accountability Logging
CREATE TABLE IF NOT EXISTS AuditLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_data JSON,
    new_data JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
