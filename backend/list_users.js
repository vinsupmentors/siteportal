const mysql = require('mysql2/promise');
require('dotenv').config();

async function listUsers() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '963.',
            database: process.env.DB_NAME || 'edutech_lms'
        });
        const [rows] = await connection.query('SELECT u.email, r.name as role FROM Users u JOIN Roles r ON u.role_id = r.id');
        console.log(JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (err) {
        console.error(err);
    }
}
listUsers();
