require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '963.',
        database: process.env.DB_NAME || 'edutech_lms'
    });

    try {
        const [rows] = await pool.query('DESCRIBE Users');
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkSchema();
