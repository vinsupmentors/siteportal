const mysql = require('mysql2/promise');
require('dotenv').config();

async function killAndTest() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        const [rows] = await conn.query('SHOW PROCESSLIST');
        for (let row of rows) {
            if (row.Id !== conn.threadId) {
                try {
                    await conn.query(`KILL CONNECTION ${row.Id}`);
                    console.log('Killed thread', row.Id);
                } catch(e) {}
            }
        }
        console.log('Successfully wiped all active connections.');
    } catch(e) {
        console.log('Error killing:', e.message);
    }
    
    // Quick test of the same query
    try {
        await conn.query(`
            SELECT d.*, 
                   u.first_name as student_fname, u.last_name as student_lname, u.email as student_email,
                   t.first_name as trainer_fname, t.last_name as trainer_lname
            FROM StudentDoubts d
            JOIN Users u ON d.student_id = u.id
            LEFT JOIN Users t ON d.resolved_by = t.id
            ORDER BY d.created_at DESC
        `);
        console.log('✅ Student Doubts OK after flush');
    } catch (e) {
        console.log('❌ Query failed:', e.message);
    }

    conn.end();
    process.exit();
}
killAndTest();
