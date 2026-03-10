const mysql = require('mysql2/promise');

async function createTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '963.',
            database: 'edutech_lms'
        });

        const sql = `
            CREATE TABLE IF NOT EXISTS StudentIssues (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                issue_type VARCHAR(200) NOT NULL,
                description TEXT,
                status ENUM('open', 'in_progress', 'resolved', 'rejected') DEFAULT 'open',
                admin_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES Users(id)
            )
        `;

        await connection.query(sql);
        console.log("StudentIssues table created successfully.");
        await connection.end();
    } catch (error) {
        console.error("Error creating table:", error);
    }
}

createTable();
