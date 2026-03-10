const pool = require('./backend/src/config/db');

async function test() {
    const batchId = 1;
    const trainerId = 3;
    try {
        // 1. Verify ownership
        const [batch] = await pool.query('SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batchId, trainerId]);
        console.log('--- Batch Ownership ---');
        console.log(batch);

        // 2. Fetch students
        const [students] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email
            FROM Users u
            JOIN BatchStudents bs ON u.id = bs.student_id
            WHERE bs.batch_id = ? AND u.status = "active"
            ORDER BY u.first_name ASC
        `, [batchId]);
        console.log('--- Students ---');
        console.log(students);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
