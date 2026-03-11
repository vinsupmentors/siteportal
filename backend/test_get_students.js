const pool = require('./src/config/db');
require('dotenv').config();

async function testStudents() {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status,
                   b.batch_name, c.name as course_name,
                   (SELECT ROUND(
                       (SELECT COUNT(*) FROM StudentAttendance sa WHERE sa.student_id = u.id AND sa.status = 'present') * 100.0 /
                       NULLIF((SELECT COUNT(*) FROM StudentAttendance sa WHERE sa.student_id = u.id), 0)
                   , 0)) as attendance_pct
            FROM Users u
            LEFT JOIN BatchStudents bs ON u.id = bs.student_id
            LEFT JOIN Batches b ON bs.batch_id = b.id
            LEFT JOIN Courses c ON b.course_id = c.id
            WHERE u.role_id = 4
            ORDER BY u.created_at DESC
        `);
        console.log('Main query OK:', rows.length, 'rows');
        
        const [totalActive] = await pool.query('SELECT COUNT(*) as c FROM Users WHERE role_id = 4 AND status = "active"');
        console.log('Active query OK:', totalActive[0].c);
        
        const [totalInactive] = await pool.query('SELECT COUNT(*) as c FROM Users WHERE role_id = 4 AND status = "inactive"');
        console.log('Inactive query OK:', totalInactive[0].c);
    } catch (e) {
        console.log('Error:', e.message);
    }
    process.exit();
}
testStudents();
