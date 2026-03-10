const pool = require('../config/db');

// ==========================================
// COURSE HIERARCHY CRUD OPERATIONS
// ==========================================

// Create a new master Course mapped to a Program
exports.createCourse = async (req, res) => {
    try {
        const { program_id, name, description } = req.body;

        // Validation ensuring program exists
        const [programs] = await pool.query('SELECT id FROM Programs WHERE id = ?', [program_id]);
        if (programs.length === 0) return res.status(404).json({ message: 'Parent Program not found.' });

        const [result] = await pool.query(
            'INSERT INTO Courses (program_id, name, description) VALUES (?, ?, ?)',
            [program_id, name, description]
        );

        // Log action
        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_COURSE', 'Courses', result.insertId]);

        res.status(201).json({ message: 'Course generated successfully.', courseId: result.insertId });
    } catch (error) {
        console.error("Super Admin System Fault:", error);
        res.status(500).json({ message: 'Server fault processing curriculum operation.', error: error.message });
    }
};

// Create a new Module inside a Course
exports.createModule = async (req, res) => {
    try {
        const { course_id, name, sequence_order, module_project_details } = req.body;

        const [result] = await pool.query(
            'INSERT INTO Modules (course_id, name, sequence_order, module_project_details) VALUES (?, ?, ?, ?)',
            [course_id, name, sequence_order, module_project_details]
        );

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_MODULE', 'Modules', result.insertId]);

        res.status(201).json({ message: 'Module defined successfully.', moduleId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server fault processing module.', error: error.message });
    }
};

// Detailed Day structuring map logic 
exports.createDay = async (req, res) => {
    try {
        const { module_id, day_number, topic_name } = req.body;

        // Handles optional multer paths dynamically applied during patching later
        const [result] = await pool.query(
            'INSERT INTO Days (module_id, day_number, topic_name) VALUES (?, ?, ?)',
            [module_id, day_number, topic_name]
        );

        await pool.query('INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)', [req.user.id, 'CREATE_DAY_SLOT', 'Days', result.insertId]);

        res.status(201).json({ message: 'Day block mapped successfully.', dayId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server fault mapping Day.', error: error.message });
    }
};
