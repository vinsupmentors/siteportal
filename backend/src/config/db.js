const mysql = require('mysql2');

// Initializing Database connection pool
let pool;

try {
    if (process.env.DATABASE_URL) {
        console.log('[Database] Connecting via DATABASE_URL');
        pool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            waitForConnections: true,
            connectionLimit: 15,
            queueLimit: 0,
            ssl: { rejectUnauthorized: false }
        });
    } else {
        console.log('[Database] Connecting via discrete credentials');
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '963.',
            database: process.env.DB_NAME || 'edutech_lms',
            waitForConnections: true,
            connectionLimit: 15,
            queueLimit: 0
        });
    }

    // Verify connection on startup
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('[Database] CRITICAL: Connection failed!', err.message);
        } else {
            console.log('[Database] Connection pool initialized successfully');
            connection.release();
        }
    });

} catch (err) {
    console.error('[Database] Pool creation error:', err.message);
}

module.exports = pool.promise();
