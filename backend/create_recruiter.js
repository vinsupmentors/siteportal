const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRecruiter() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '963.',
        database: process.env.DB_NAME || 'edutech_lms'
    });

    try {
        console.log('Creating Recruiter User...');

        // Role ID 5 is 'Job Assistance'
        const [result] = await connection.query(`
            INSERT IGNORE INTO Users (first_name, last_name, email, password, role_id) 
            VALUES ('Placement', 'Officer', 'recruiter@edutech.com', 'recruiter123', 5)
        `);

        if (result.affectedRows > 0) {
            console.log('Recruiter user created successfully!');
            console.log('Email: recruiter@edutech.com');
            console.log('Password: recruiter123');
        } else {
            console.log('Recruiter user already exists or failed to create.');
        }

    } catch (err) {
        console.error('Error creating recruiter:', err);
    } finally {
        await connection.end();
    }
}

createRecruiter();
