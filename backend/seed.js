const pool = require('./src/config/db');

async function seed() {
    try {
        console.log("Seeding initial Roles...");
        await pool.query("INSERT IGNORE INTO Roles (id, name) VALUES (1, 'Super Admin'), (2, 'Admin'), (3, 'Trainer'), (4, 'Student')");

        console.log("Seeding test users (Password is '963.')...");

        // Seed Super Admin
        await pool.query(`
            INSERT IGNORE INTO Users (id, role_id, first_name, last_name, email, password)
            VALUES (1, 1, 'Super', 'Admin', 'admin@test.com', '963.')
        `);

        // Seed Admin
        await pool.query(`
            INSERT IGNORE INTO Users (id, role_id, first_name, last_name, email, password)
            VALUES (2, 2, 'Report', 'Admin', 'report@test.com', '963.')
        `);

        // Seed Trainer
        await pool.query(`
            INSERT IGNORE INTO Users (id, role_id, first_name, last_name, email, password)
            VALUES (3, 3, 'Master', 'Trainer', 'trainer@test.com', '963.')
        `);

        // Seed Student
        await pool.query(`
            INSERT IGNORE INTO Users (id, role_id, first_name, last_name, email, password)
            VALUES (4, 4, 'John', 'Student', 'student@test.com', '963.')
        `);

        console.log("Database seeded successfully with test credentials!");
    } catch (error) {
        console.error("Seeding error:", error);
    } finally {
        process.exit();
    }
}
seed();
