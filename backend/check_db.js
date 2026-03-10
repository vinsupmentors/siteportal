const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '963.',
            database: process.env.DB_NAME || 'edutech_lms'
        });
        console.log('Database connection successful');
        await connection.end();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}

checkDB();
