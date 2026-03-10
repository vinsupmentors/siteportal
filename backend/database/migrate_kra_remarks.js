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
        console.log('Running migration: add KRA session + StudentRemarks table...');

        // 1. Add session column to TrainerKRA
        const [cols] = await connection.query(`SHOW COLUMNS FROM TrainerKRA LIKE 'session'`);
        if (cols.length === 0) {
            await connection.query(`
                ALTER TABLE TrainerKRA 
                ADD COLUMN session ENUM('morning','afternoon','evening','weekends') DEFAULT 'morning' AFTER date
            `);
            console.log('✓ Added session column to TrainerKRA');

            // Drop existing unique key if it exists, then create new one with session
            try {
                await connection.query(`ALTER TABLE TrainerKRA DROP INDEX unique_kra`);
            } catch (e) { /* key may not exist */ }
            try {
                await connection.query(`ALTER TABLE TrainerKRA DROP INDEX trainer_batch_date`);
            } catch (e) { /* key may not exist */ }

            await connection.query(`
                ALTER TABLE TrainerKRA ADD UNIQUE KEY unique_kra_session (trainer_id, batch_id, date, session)
            `);
            console.log('✓ Added unique key (trainer_id, batch_id, date, session)');
        } else {
            console.log('⊘ session column already exists in TrainerKRA');
        }

        // 2. Create StudentRemarks table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS StudentRemarks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                batch_id INT NOT NULL,
                trainer_id INT NOT NULL,
                remark_text TEXT NOT NULL,
                remark_type ENUM('general','academic','behavioral','attendance') DEFAULT 'general',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES Users(id),
                FOREIGN KEY (batch_id) REFERENCES Batches(id),
                FOREIGN KEY (trainer_id) REFERENCES Users(id)
            )
        `);
        console.log('✓ StudentRemarks table ready');

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

migrate();
