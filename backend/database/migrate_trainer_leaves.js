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
        console.log('Running migration: creating TrainerLeaves table...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS TrainerLeaves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainer_id INT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason TEXT NOT NULL,
                leave_type ENUM('sick', 'casual', 'emergency', 'other') DEFAULT 'casual',
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                reviewed_by INT,
                rejection_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (trainer_id) REFERENCES Users(id),
                FOREIGN KEY (reviewed_by) REFERENCES Users(id)
            )
        `);
        console.log('✓ TrainerLeaves table ready');

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

migrate();
