const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDB() {
    try {
        const dbConfig = process.env.DATABASE_URL || {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '963.'
        };

        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected to MySQL Server successfully.");

        // Ensure context maps to the correct DB globally
        if (dbConfig.uri) {
            const dbName = new URL(dbConfig.uri).pathname.split('/')[1] || 'defaultdb';
            await connection.query(`USE \`${dbName}\``);
        } else {
            await connection.query(`USE \`${dbConfig.database || 'edutech_lms'}\``);
        }

        // Read the entire SQL file into memory
        const sqlPath = path.join(__dirname, 'database', 'schema.sql');
        const schemaQueries = fs.readFileSync(sqlPath, 'utf8');

        // Split queries by semicolon to execute sequentially
        const statements = schemaQueries.split(';').filter(stmt => stmt.trim() !== '');

        console.log("Executing schema statements...");

        for (let stmt of statements) {
            if (stmt.trim()) {
                await connection.query(stmt);
            }
        }

        // Add TrainerOtherWorks explicitly just in case the statements map misses it because it already exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS TrainerOtherWorks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                trainer_id INT NOT NULL,
                date DATE NOT NULL,
                title VARCHAR(200) NOT NULL,
                phone VARCHAR(20),
                status ENUM('active', 'inactive') DEFAULT 'active',
                student_phase ENUM('Joined', 'Technical', 'Internship', 'Soft Skills', 'Certificate', 'Completed') DEFAULT 'Joined',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES Roles(id)
            )
        `);

        // Add StudentIssues explicitly
        await connection.query(`
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
        `);

        // Add Announcements & Acknowledgements
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                target_role ENUM('all', '3', '4', 'batch') NOT NULL,
                target_batch_id INT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (target_batch_id) REFERENCES Batches(id),
                FOREIGN KEY (created_by) REFERENCES Users(id)
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS AnnouncementAcknowledgements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                user_id INT NOT NULL,
                acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (announcement_id) REFERENCES Announcements(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                UNIQUE KEY (announcement_id, user_id)
            )
        `);

        console.log("Schema compiled successfully.");

        // Re-importing seed logic safely after DB exists
        console.log("Seeding test users...");

        await connection.query("INSERT IGNORE INTO Roles (id, name) VALUES (1, 'Super Admin'), (2, 'Admin'), (3, 'Trainer'), (4, 'Student')");

        const seedUsers = [
            [1, 1, 'Super', 'Admin', 'admin@test.com', '963.'],
            [2, 2, 'Report', 'Admin', 'report@test.com', '963.'],
            [3, 3, 'Master', 'Trainer', 'trainer@test.com', '963.'],
            [4, 4, 'John', 'Student', 'student@test.com', '963.']
        ];

        for (let user of seedUsers) {
            await connection.query(`
                INSERT IGNORE INTO Users (id, role_id, first_name, last_name, email, password)
                VALUES (?, ?, ?, ?, ?, ?)
             `, user);
        }

        console.log("Test user matrix created!");
        process.exit();

    } catch (error) {
        console.error("Initialization Failed:", error);
        process.exit(1);
    }
}

initializeDB();
