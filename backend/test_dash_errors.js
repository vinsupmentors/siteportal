const pool = require('./src/config/db');
require('dotenv').config();

async function runTests() {
    try {
        console.log("Testing students query...");
        await pool.query(`
            SELECT u.*, 
                   COUNT(DISTINCT a.id) as total_attendance,
                   COUNT(DISTINCT s.id) as total_submissions,
                   COUNT(DISTINCT d.id) as total_doubts
            FROM Users u
            LEFT JOIN StudentAttendance a ON u.id = a.student_id
            LEFT JOIN Submissions s ON u.id = s.student_id
            LEFT JOIN StudentDoubts d ON u.id = d.student_id
            WHERE u.role_id = 4
            GROUP BY u.id
        `);
        console.log("✅ Students OK");

        console.log("Testing trainer reports query...");
        await pool.query(`
            SELECT u.*, 
                   COUNT(DISTINCT a.id) as classes_conducted,
                   COUNT(DISTINCT tk.id) as tasks_assigned,
                   SUM(CASE WHEN tk.status = 'completed' THEN 1 ELSE 0 END) as tasks_completed,
                   AVG(sf.rating) as avg_rating
            FROM Users u
            LEFT JOIN TrainerAttendance a ON u.id = a.trainer_id AND a.status IN ('present', 'wfh')
            LEFT JOIN TrainerTasks tk ON u.id = tk.trainer_id
            LEFT JOIN SessionFeedback sf ON u.id = sf.trainer_id
            WHERE u.role_id = 3
            GROUP BY u.id
        `);
        console.log("✅ Trainer Reports OK");

        console.log("Testing student doubts query...");
        await pool.query(`
            SELECT d.*, 
                   u.first_name as student_fname, u.last_name as student_lname, u.email as student_email,
                   t.first_name as trainer_fname, t.last_name as trainer_lname
            FROM StudentDoubts d
            JOIN Users u ON d.student_id = u.id
            LEFT JOIN Users t ON d.resolved_by = t.id
            ORDER BY d.created_at DESC
        `);
        console.log("✅ Student Doubts OK");
        
    } catch(e) {
        console.log("❌ Query failed:", e.message);
    }
    process.exit();
}
runTests();
