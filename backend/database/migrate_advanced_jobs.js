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
        console.log('Starting Advanced Job Portal Migration...');

        // 1. Add CTC, Experience, and Apply Link to Jobs table
        console.log('Enhancing Jobs table...');
        const [jobsCols] = await connection.query("SHOW COLUMNS FROM Jobs LIKE 'ctc'");
        if (jobsCols.length === 0) {
            await connection.query(`
                ALTER TABLE Jobs 
                ADD COLUMN ctc VARCHAR(100),
                ADD COLUMN experience_level ENUM('Fresher', 'Experienced', 'Both') DEFAULT 'Both',
                ADD COLUMN apply_link VARCHAR(500)
            `);
        }

        // 2. Create JobApplications table to track clicks/applies
        console.log('Creating JobApplications table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS JobApplications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                student_id INT NOT NULL,
                status ENUM('Clicked', 'Applied') DEFAULT 'Clicked',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES Jobs(id),
                FOREIGN KEY (student_id) REFERENCES Users(id),
                UNIQUE KEY unique_app (job_id, student_id)
            )
        `);

        console.log('Advanced Job Portal Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
