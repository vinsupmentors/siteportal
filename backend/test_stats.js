const pool = require('./src/config/db');
require('dotenv').config();

async function test() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        console.log('Testing activeStudents');
        await pool.query("SELECT COUNT(*) as count FROM Users WHERE role_id = 4 AND status = 'active'");
        
        console.log('Testing totalTrainers');
        await pool.query('SELECT COUNT(*) as count FROM Users WHERE role_id = 3');
        
        console.log('Testing activeCourses');
        await pool.query('SELECT COUNT(*) as count FROM Courses');
        
        console.log('Testing activeBatches');
        await pool.query("SELECT COUNT(*) as count FROM Batches WHERE status = 'active'");
        
        console.log('Testing upcomingBatches');
        await pool.query("SELECT COUNT(*) as count FROM Batches WHERE status = 'upcoming'");
        
        console.log('Testing completedBatches');
        await pool.query("SELECT COUNT(*) as count FROM Batches WHERE status = 'completed'");

        console.log('Testing totalEnrollments');
        await pool.query('SELECT COUNT(*) as count FROM BatchStudents');
        
        console.log('Testing newEnrollments');
        await pool.query('SELECT COUNT(*) as count FROM BatchStudents WHERE DATE(enrolled_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');

        console.log('Testing studentsPresentToday');
        await pool.query("SELECT COUNT(DISTINCT student_id) as c FROM StudentAttendance WHERE attendance_date = ? AND status = 'present'", [todayStr]);
        
        console.log('Testing studentsAbsentToday');
        await pool.query("SELECT COUNT(DISTINCT student_id) as c FROM StudentAttendance WHERE attendance_date = ? AND status = 'absent'", [todayStr]);
        
        console.log('Testing trainersPresentToday');
        await pool.query("SELECT COUNT(DISTINCT trainer_id) as c FROM TrainerAttendance WHERE date = ? AND status IN ('present', 'wfh')", [todayStr]);
        
        console.log('Testing classesToday');
        await pool.query("SELECT COUNT(*) as c FROM TrainerTasks WHERE title LIKE '%class%' AND due_date = ?", [todayStr]);
        
        console.log('Testing studentsOnLeaveToday');
        await pool.query("SELECT COUNT(*) as c FROM StudentLeaves WHERE ? BETWEEN start_date AND end_date AND status = 'approved'", [todayStr]);

        console.log('Testing globalCompletedTasks');
        await pool.query("SELECT COUNT(*) as count FROM TrainerTasks WHERE status = 'completed'");
        
        console.log('Testing globalPendingTasks');
        await pool.query("SELECT COUNT(*) as count FROM TrainerTasks WHERE status IN ('pending', 'review')");
        
        console.log('Testing globalOverdueTasks');
        await pool.query("SELECT COUNT(*) as count FROM TrainerTasks WHERE status NOT IN ('completed') AND due_date < ?", [todayStr]);
        
        console.log('Testing totalPortfolios');
        await pool.query("SELECT COUNT(*) as count FROM PortfolioRequests WHERE status = 'approved'");

        console.log('Testing avgTestScore');
        await pool.query("SELECT AVG(marks) as avg FROM Submissions WHERE submission_type = 'module_test'");
        
        console.log('Testing avgTrainerRating');
        await pool.query('SELECT AVG(rating) as avg FROM SessionFeedback');
        
        console.log('Testing unresolvedDoubts');
        await pool.query("SELECT COUNT(*) as count FROM StudentDoubts WHERE status != 'resolved'");
        
        console.log('Testing unresolvedIssues');
        await pool.query("SELECT COUNT(*) as count FROM StudentIssues WHERE status != 'resolved'");
        
        console.log('Testing completedProjects');
        await pool.query("SELECT COUNT(*) as count FROM Submissions WHERE submission_type = 'module_project'");

        console.log('Testing attendance30d');
        await pool.query(`
            SELECT 
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) / COUNT(*) * 100 as avg 
            FROM StudentAttendance 
            WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `);

        console.log('Testing criticalDoubts');
        await pool.query("SELECT COUNT(*) as count FROM StudentDoubts WHERE status != 'resolved' AND created_at < DATE_SUB(CURDATE(), INTERVAL 3 DAY)");

        console.log('Testing pipelineData');
        await pool.query('SELECT student_phase as stage, COUNT(*) as count FROM Users WHERE role_id = 4 GROUP BY student_phase');

        console.log('Testing reviewTasks');
        await pool.query("SELECT COUNT(*) as count FROM TrainerTasks WHERE status = 'review'");
        
        console.log('Testing totalDoubts');
        await pool.query('SELECT COUNT(*) as count FROM StudentDoubts');
        
        console.log('Testing totalIssues');
        await pool.query('SELECT COUNT(*) as count FROM StudentIssues');
        
        console.log('Testing latestAnnouncement');
        await pool.query(`
            SELECT a.*, 
                   (SELECT COUNT(*) FROM AnnouncementAcknowledgements WHERE announcement_id = a.id) as acknowledged_count,
                   (SELECT COUNT(*) FROM Users WHERE status = 'active' AND (role_id = 4 OR role_id = 3)) as total_target_audience
            FROM Announcements a ORDER BY created_at DESC LIMIT 1
        `);

        console.log('Testing recentActivity');
        await pool.query(`
            SELECT al.*, u.first_name, u.last_name 
            FROM AuditLogs al 
            JOIN Users u ON al.user_id = u.id 
            ORDER BY al.created_at DESC LIMIT 10
        `);

        console.log('All tests passed');
    } catch (e) {
        console.error('Failed on query:', e.message);
    }
    process.exit();
}
test();
