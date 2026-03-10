const pool = require('../src/config/db');

const migrate = async () => {
    try {
        console.log('Adding deadline_date and hired_count to Jobs table...');

        // Add deadline_date and hired_count
        await pool.query(`
            ALTER TABLE Jobs 
            ADD COLUMN deadline_date DATE NULL AFTER apply_link,
            ADD COLUMN hired_count INT DEFAULT 0 AFTER deadline_date
        `);

        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
};

migrate();
