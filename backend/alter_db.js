const mysql = require('mysql2/promise');
async function run() {
    try {
        const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '963.', database: 'edutech_lms' });
        await db.query("ALTER TABLE Users ADD COLUMN student_phase ENUM('Joined', 'Technical', 'Internship', 'Soft Skills', 'Certificate', 'Completed') DEFAULT 'Joined'");
        console.log('Added student_phase column to live DB');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
            process.exit(0);
        } else {
            console.error(err);
            process.exit(1);
        }
    }
}
run();
