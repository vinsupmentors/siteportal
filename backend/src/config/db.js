const mysql = require('mysql2');

// Initializing Database connection pool
let dbConfig;
if (process.env.DATABASE_URL) {
    dbConfig = { uri: process.env.DATABASE_URL, waitForConnections: true, connectionLimit: 15, queueLimit: 0 };
} else {
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '963.',       // Defined explicit local password
        database: process.env.DB_NAME || 'edutech_lms',
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0
    };
}

const pool = mysql.createPool(dbConfig);

module.exports = pool.promise();
