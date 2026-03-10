const pool = require('./backend/src/config/db');

async function test() {
    const trainerId = 3;
    try {
        const [batches] = await pool.query(`
            SELECT b.*, c.name as course_name
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            WHERE b.trainer_id = ? AND b.status IN ('active', 'upcoming')
        `, [trainerId]);
        console.log('--- Batches ---');
        console.log(batches);

        const [schedule] = await pool.query(`
            SELECT b.*, c.name as course_name 
            FROM Batches b 
            JOIN Courses c ON b.course_id = c.id
            WHERE b.trainer_id = ? AND b.status = "active"
        `, [trainerId]);
        console.log('--- Schedule ---');
        console.log(schedule);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
