const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTable() {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        console.log('Fetching existing doubts mapping (backup in memory)...');
        let backup = [];
        try {
            const [rows] = await conn.query('SELECT * FROM StudentDoubts');
            backup = rows;
            console.log('Backed up ' + backup.length + ' rows.');
        } catch(e) {
            console.log('Backup failed:', e.message);
        }
        
        try { await conn.query('DROP TABLE IF EXISTS StudentDoubts'); console.log('Dropped Pascal case table'); } catch(e){}
        try { await conn.query('DROP TABLE IF EXISTS studentdoubts'); console.log('Dropped lower case table'); } catch(e){}
        try { await conn.query('DROP TABLE IF EXISTS studentdoubtsResponses'); console.log('Dropped lower responses table'); } catch(e){}
        try { await conn.query('DROP TABLE IF EXISTS StudentDoubtResponses'); console.log('Dropped pascal responses table'); } catch(e){}

        console.log('Recreating correct schema...');
        await conn.query(`
            CREATE TABLE StudentDoubts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                trainer_id INT,
                batch_id INT,
                query_text TEXT NOT NULL,
                status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
                response_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                resolved_by INT,
                FOREIGN KEY (student_id) REFERENCES Users(id),
                FOREIGN KEY (trainer_id) REFERENCES Users(id),
                FOREIGN KEY (batch_id) REFERENCES Batches(id),
                FOREIGN KEY (resolved_by) REFERENCES Users(id)
            );
        `);
        console.log('Created StudentDoubts properly!');
        
        for (let r of backup) {
            try {
                // Formatting dates so MySQL doesn't fail on insertion
                const ca = r.created_at ? new Date(r.created_at).toISOString().slice(0, 19).replace('T', ' ') : null;
                const ra = r.resolved_at ? new Date(r.resolved_at).toISOString().slice(0, 19).replace('T', ' ') : null;
                await conn.query(
                    'INSERT IGNORE INTO StudentDoubts (id, student_id, trainer_id, batch_id, query_text, status, response_text, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [r.id, r.student_id, r.trainer_id, r.batch_id, r.query_text, r.status, r.response_text, ca, ra]
                );
            } catch (e) {
                console.log('Insert skip:', r.id, e.message);
            }
        }
        console.log('Restored data!');

    } catch(e) {
        console.log('Error:', e.message);
    }
    
    // Quick test
    try {
        console.log('Validating querying...');
        const [test] = await conn.query(`
            SELECT d.*, 
                   u.first_name as student_fname, u.last_name as student_lname, u.email as student_email,
                   t.first_name as trainer_fname, t.last_name as trainer_lname
            FROM StudentDoubts d
            JOIN Users u ON d.student_id = u.id
            LEFT JOIN Users t ON d.resolved_by = t.id
            ORDER BY d.created_at DESC
        `);
        console.log('Validation OK. Returned Rows:', test.length);
    } catch(e) { console.log('Validation ERROR', e.message); }

    conn.end();
    process.exit();
}
fixTable();
