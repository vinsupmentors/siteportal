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
        console.log('Running migration: adding session column to TrainerLeaves table...');

        await connection.query(`
            ALTER TABLE TrainerLeaves 
            ADD COLUMN session ENUM('full_day', 'morning', 'evening') DEFAULT 'full_day' AFTER leave_type;
        `);
        console.log('✓ TrainerLeaves table updated with session column');

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

migrate();
