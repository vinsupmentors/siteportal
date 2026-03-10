const mysql = require('mysql2/promise');
require('dotenv').config();

async function rename() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    const tables = [
        'Roles', 'Users', 'Programs', 'Courses', 'Modules', 'BatchStudents',
        'ModuleProjects', 'Batches', 'Days', 'ContentFiles', 'Submissions',
        'StudentAttendance', 'TrainerAttendance', 'StudentFeedbackResponses', 
        'SessionFeedback', 'BatchFeedbackStatus', 'StudentRemarks', 
        'Certificates', 'TrainerSpecializations', 'TrainerOtherWorks', 
        'TrainerTasks', 'TrainerKRA', 'AuditLogs', 'AdminRequests', 
        'PortfolioRequests', 'JobInterviews', 'JobApplications', 'Jobs', 
        'JobPortalRequests', 'BatchUnlocks', 'StudentIssues', 
        'Announcements', 'AnnouncementAcknowledgements', 'TrainerLeaves', 
        'StudentLeaves', 'FeedbackForms'
    ];
    
    console.log('Renaming tables to match schema casing...');
    for (let t of tables) {
        const lower = t.toLowerCase();
        if (lower !== t) {
            try {
                await conn.query(`RENAME TABLE \`${lower}\` TO \`${t}\``);
                console.log(`✓ Renamed: ${lower} -> ${t}`);
            } catch (e) {
                // Ignore errors (might not exist, or already renamed)
            }
        }
    }
    
    // Quick validation
    const [rows] = await conn.query('SHOW TABLES');
    console.log('\nCurrent Tables in Database:');
    console.log(rows.map(r => Object.values(r)[0]).join(', '));
    
    conn.end();
}
rename();
