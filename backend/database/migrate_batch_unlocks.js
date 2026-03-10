// Migration: Create BatchUnlocks table
// Run: node database/migrate_batch_unlocks.js

const pool = require('../src/config/db');

async function migrate() {
    try {
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
        console.log('✅ BatchUnlocks table created successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
