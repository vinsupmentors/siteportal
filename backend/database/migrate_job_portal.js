const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '963.',
        database: process.env.DB_NAME || 'edutech_lms'
    });

    try {
        console.log('Starting Job Portal Migration...');

        // 1. Update Roles ENUM and add Job Assistance
        console.log('Updating Roles table...');
        await connection.query(`
            ALTER TABLE Roles MODIFY COLUMN name ENUM('Super Admin', 'Admin', 'Trainer', 'Student', 'Job Assistance') NOT NULL UNIQUE
        `);
        await connection.query(`
            INSERT IGNORE INTO Roles (name) VALUES ('Job Assistance')
        `);

        // 2. Update Users table
        console.log('Updating Users table...');
        const [usersCols] = await connection.query("SHOW COLUMNS FROM Users LIKE 'job_portal_unlocked'");
        if (usersCols.length === 0) {
            await connection.query("ALTER TABLE Users ADD COLUMN job_portal_unlocked BOOLEAN DEFAULT FALSE");
        }

        // 3. Create Jobs table
        console.log('Creating Jobs table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Jobs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                course_id INT NOT NULL,
                created_by INT NOT NULL,
                status ENUM('Open', 'Closed') DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES Courses(id),
                FOREIGN KEY (created_by) REFERENCES Users(id)
            )
        `);

        // 4. Create JobPortalRequests table
        console.log('Creating JobPortalRequests table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS JobPortalRequests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                google_review_img VARCHAR(255),
                portfolio_link VARCHAR(255),
                status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES Users(id)
            )
        `);

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
