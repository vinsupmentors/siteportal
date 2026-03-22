const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function migrateChatForum() {
    try {
        const dbConfig = process.env.DATABASE_URL || {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '963.'
        };

        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected to MySQL successfully.");

        if (dbConfig.uri) {
            const dbName = new URL(dbConfig.uri).pathname.split('/')[1] || 'defaultdb';
            await connection.query(`USE \`${dbName}\``);
        } else {
            await connection.query(`USE \`${dbConfig.database || 'edutech_lms'}\``);
        }

        // Create Messages table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);
        console.log("Messages table created.");

        // Create ForumTopics table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ForumTopics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                upvotes INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES Courses(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);
        console.log("ForumTopics table created.");

        // Create ForumReplies table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ForumReplies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                topic_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                upvotes INT DEFAULT 0,
                is_accepted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES ForumTopics(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `);
        console.log("ForumReplies table created.");

        console.log("Chat and Forum migration completed successfully.");
        process.exit();

    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
}

migrateChatForum();
