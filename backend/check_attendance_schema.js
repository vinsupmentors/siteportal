const mysql = require('mysql2/promise');

async function check() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '963.',
        database: 'edutech_lms'
    });
    try {
        const [columns] = await pool.query('DESCRIBE StudentAttendance');
        console.log('StudentAttendance Table:');
        console.table(columns);

        const [sample] = await pool.query('SELECT * FROM StudentAttendance LIMIT 5');
        console.log('Sample Data:');
        console.table(sample);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
