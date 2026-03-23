const pool = require('../config/db');

// ── SA: IOP Modules CRUD ──────────────────────────────────────────────────────

exports.getIOPModules = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT m.*, COUNT(t.id) as topic_count
            FROM IOPModules m
            LEFT JOIN IOPTopics t ON t.module_id = m.id
            GROUP BY m.id
            ORDER BY m.type, m.sequence_order
        `);
        // Include file metadata (no binary data) for each module
        const [files] = await pool.query(
            'SELECT id, module_id, file_type, file_name, file_size, uploaded_at FROM IOPModuleFiles'
        );
        const filesByModule = {};
        files.forEach(f => {
            if (!filesByModule[f.module_id]) filesByModule[f.module_id] = {};
            filesByModule[f.module_id][f.file_type] = { id: f.id, file_name: f.file_name, file_size: f.file_size, uploaded_at: f.uploaded_at };
        });
        res.json({ modules: rows.map(m => ({ ...m, files: filesByModule[m.id] || {} })) });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP modules', error: error.message });
    }
};

exports.createIOPModule = async (req, res) => {
    try {
        const { type, title, sequence_order } = req.body;
        if (!type || !title) return res.status(400).json({ message: 'type and title are required' });
        const [result] = await pool.query(
            'INSERT INTO IOPModules (type, title, sequence_order) VALUES (?, ?, ?)',
            [type, title, sequence_order || 0]
        );
        res.json({ message: 'IOP module created', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating IOP module', error: error.message });
    }
};

exports.updateIOPModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, title, sequence_order } = req.body;
        await pool.query(
            'UPDATE IOPModules SET type = ?, title = ?, sequence_order = ? WHERE id = ?',
            [type, title, sequence_order || 0, id]
        );
        res.json({ message: 'IOP module updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating IOP module', error: error.message });
    }
};

exports.deleteIOPModule = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM IOPModules WHERE id = ?', [id]);
        res.json({ message: 'IOP module deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting IOP module', error: error.message });
    }
};

// ── SA: IOP Topics CRUD ───────────────────────────────────────────────────────

exports.getIOPTopics = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const [rows] = await pool.query(
            'SELECT * FROM IOPTopics WHERE module_id = ? ORDER BY day_number',
            [moduleId]
        );
        res.json({ topics: rows });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP topics', error: error.message });
    }
};

exports.createIOPTopic = async (req, res) => {
    try {
        const { module_id, day_number, topic_name, notes } = req.body;
        if (!module_id || !day_number || !topic_name) {
            return res.status(400).json({ message: 'module_id, day_number and topic_name are required' });
        }
        const [result] = await pool.query(
            'INSERT INTO IOPTopics (module_id, day_number, topic_name, notes) VALUES (?, ?, ?, ?)',
            [module_id, day_number, topic_name, notes || null]
        );
        res.json({ message: 'IOP topic created', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating IOP topic', error: error.message });
    }
};

exports.updateIOPTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { day_number, topic_name, notes } = req.body;
        await pool.query(
            'UPDATE IOPTopics SET day_number = ?, topic_name = ?, notes = ? WHERE id = ?',
            [day_number, topic_name, notes || null, id]
        );
        res.json({ message: 'IOP topic updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating IOP topic', error: error.message });
    }
};

exports.deleteIOPTopic = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM IOPTopics WHERE id = ?', [id]);
        res.json({ message: 'IOP topic deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting IOP topic', error: error.message });
    }
};

// ── Trainer: Get IOP curriculum for a batch ───────────────────────────────────

exports.getIOPCurriculum = async (req, res) => {
    try {
        const { batchId } = req.params;
        const trainerId = req.user.id;

        // Verify the caller is the iop_trainer_id for this batch
        const [[batch]] = await pool.query(
            'SELECT id, iop_trainer_id, batch_name FROM Batches WHERE id = ?',
            [batchId]
        );
        if (!batch || Number(batch.iop_trainer_id) !== Number(trainerId)) {
            return res.status(403).json({ message: 'Not authorized as IOP trainer for this batch' });
        }

        // Count IOP students in this batch
        const [[{ iop_count }]] = await pool.query(`
            SELECT COUNT(*) as iop_count
            FROM BatchStudents bs
            JOIN Users u ON bs.student_id = u.id
            WHERE bs.batch_id = ? AND u.program_type = 'IOP' AND u.status = 'active'
        `, [batchId]);

        // Fetch all IOP modules and topics
        const [modules] = await pool.query(
            'SELECT * FROM IOPModules ORDER BY type, sequence_order'
        );
        const [topics] = await pool.query(
            'SELECT * FROM IOPTopics ORDER BY module_id, day_number'
        );

        // Get unlock state for this batch
        const [unlocks] = await pool.query(
            'SELECT module_id, unlocked_up_to_day FROM IOPBatchUnlocks WHERE batch_id = ?',
            [batchId]
        );
        const unlockMap = {};
        unlocks.forEach(u => { unlockMap[u.module_id] = u.unlocked_up_to_day; });

        // File metadata for each module
        const [files] = await pool.query(
            'SELECT id, module_id, file_type, file_name FROM IOPModuleFiles'
        );
        const filesByModule = {};
        files.forEach(f => {
            if (!filesByModule[f.module_id]) filesByModule[f.module_id] = {};
            filesByModule[f.module_id][f.file_type] = { id: f.id, file_name: f.file_name };
        });

        // Build response
        const result = modules.map(m => ({
            ...m,
            unlocked_up_to_day: unlockMap[m.id] || 0,
            files: filesByModule[m.id] || {},
            topics: topics
                .filter(t => t.module_id === m.id)
                .map(t => ({ ...t, is_unlocked: t.day_number <= (unlockMap[m.id] || 0) }))
        }));

        res.json({ iop_student_count: Number(iop_count), modules: result });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP curriculum', error: error.message });
    }
};

// ── Trainer: Unlock IOP module topics ────────────────────────────────────────

exports.unlockIOPModule = async (req, res) => {
    try {
        const { batchId } = req.params;
        const trainerId = req.user.id;
        const { module_id, unlocked_up_to_day } = req.body;

        if (!module_id || unlocked_up_to_day === undefined) {
            return res.status(400).json({ message: 'module_id and unlocked_up_to_day are required' });
        }

        // Verify the caller is the iop_trainer_id for this batch
        const [[batch]] = await pool.query(
            'SELECT iop_trainer_id FROM Batches WHERE id = ?',
            [batchId]
        );
        if (!batch || Number(batch.iop_trainer_id) !== Number(trainerId)) {
            return res.status(403).json({ message: 'Not authorized as IOP trainer for this batch' });
        }

        await pool.query(`
            INSERT INTO IOPBatchUnlocks (batch_id, module_id, unlocked_up_to_day, unlocked_by)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                unlocked_up_to_day = VALUES(unlocked_up_to_day),
                unlocked_by = VALUES(unlocked_by),
                unlocked_at = CURRENT_TIMESTAMP
        `, [batchId, module_id, unlocked_up_to_day, trainerId]);

        res.json({ message: 'IOP module unlock updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error unlocking IOP module', error: error.message });
    }
};

// ── Trainer: Get batches where I am the IOP trainer ──────────────────────────

exports.getMyIOPBatches = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const [batches] = await pool.query(`
            SELECT b.id, b.batch_name, b.status,
                   c.name as course_name,
                   (SELECT COUNT(*) FROM BatchStudents bs2
                    JOIN Users u2 ON bs2.student_id = u2.id
                    WHERE bs2.batch_id = b.id AND u2.program_type = 'IOP' AND u2.status = 'active') as iop_student_count
            FROM Batches b
            JOIN Courses c ON b.course_id = c.id
            WHERE b.iop_trainer_id = ? AND b.status IN ('active', 'upcoming')
            ORDER BY b.start_date DESC
        `, [trainerId]);
        res.json({ batches });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP batches', error: error.message });
    }
};

// ── SA: Upload file for an IOP module ────────────────────────────────────────

exports.uploadIOPModuleFile = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { file_type } = req.body;

        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        if (!file_type || !['concepts', 'sample_problems', 'worksheet'].includes(file_type)) {
            return res.status(400).json({ message: 'file_type must be concepts, sample_problems, or worksheet' });
        }

        const [[mod]] = await pool.query('SELECT id FROM IOPModules WHERE id = ?', [moduleId]);
        if (!mod) return res.status(404).json({ message: 'IOP module not found' });

        await pool.query(`
            INSERT INTO IOPModuleFiles (module_id, file_type, file_name, mime_type, file_size, file_data)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                file_name = VALUES(file_name),
                mime_type = VALUES(mime_type),
                file_size = VALUES(file_size),
                file_data = VALUES(file_data),
                uploaded_at = CURRENT_TIMESTAMP
        `, [moduleId, file_type, req.file.originalname, req.file.mimetype, req.file.size, req.file.buffer]);

        res.json({ message: 'File uploaded', file_name: req.file.originalname });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
};

// ── Trainer / Student: Download an IOP module file ────────────────────────────

exports.downloadIOPModuleFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role_id;

        const [[file]] = await pool.query('SELECT * FROM IOPModuleFiles WHERE id = ?', [fileId]);
        if (!file) return res.status(404).json({ message: 'File not found' });

        // Students: verify IOP + module unlocked in their batch
        if (userRole === 4) {
            const [[user]] = await pool.query('SELECT program_type FROM Users WHERE id = ?', [userId]);
            if (!user || user.program_type !== 'IOP') {
                return res.status(403).json({ message: 'IOP files are only for IOP students' });
            }
            const [[bs]] = await pool.query(`
                SELECT bs.batch_id FROM BatchStudents bs
                JOIN Batches b ON bs.batch_id = b.id
                WHERE bs.student_id = ? AND b.status = 'active'
                LIMIT 1
            `, [userId]);
            if (bs) {
                const [[unlock]] = await pool.query(
                    'SELECT unlocked_up_to_day FROM IOPBatchUnlocks WHERE batch_id = ? AND module_id = ?',
                    [bs.batch_id, file.module_id]
                );
                if (!unlock || unlock.unlocked_up_to_day === 0) {
                    return res.status(403).json({ message: 'This module has not been unlocked yet' });
                }
            }
        }

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`);
        if (file.file_size) res.setHeader('Content-Length', file.file_size);
        res.send(file.file_data);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading file', error: error.message });
    }
};

// ── SA: Delete an IOP module file ─────────────────────────────────────────────

exports.deleteIOPModuleFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        await pool.query('DELETE FROM IOPModuleFiles WHERE id = ?', [fileId]);
        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
};

// ── Student: Get IOP curriculum ───────────────────────────────────────────────
// Checks IOPGroupUnlocks (new group-based system) first, falls back to IOPBatchUnlocks (legacy)

exports.getStudentIOPCurriculum = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Verify student is IOP
        const [[user]] = await pool.query(
            'SELECT program_type FROM Users WHERE id = ?',
            [studentId]
        );
        if (!user || user.program_type !== 'IOP') {
            return res.status(403).json({ message: 'IOP curriculum is only available for IOP students' });
        }

        // Get student's active batch
        const [[bs]] = await pool.query(`
            SELECT bs.batch_id
            FROM BatchStudents bs
            JOIN Batches b ON bs.batch_id = b.id
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);

        if (!bs) return res.json({ modules: [] });

        // Check if the student's batch belongs to an IOP Group
        const [[groupRow]] = await pool.query(`
            SELECT igb.iop_group_id
            FROM IOPGroupBatches igb
            JOIN IOPGroups g ON igb.iop_group_id = g.id
            WHERE igb.batch_id = ?
            LIMIT 1
        `, [bs.batch_id]);

        // Fetch all IOP modules and topics
        const [modules] = await pool.query(
            'SELECT * FROM IOPModules ORDER BY type, sequence_order'
        );
        const [topics] = await pool.query(
            'SELECT * FROM IOPTopics ORDER BY module_id, day_number'
        );

        // Build unlock map from IOPGroupUnlocks (new) or IOPBatchUnlocks (legacy)
        let unlocks = [];
        if (groupRow) {
            [unlocks] = await pool.query(
                'SELECT module_id, unlocked_up_to_day FROM IOPGroupUnlocks WHERE iop_group_id = ?',
                [groupRow.iop_group_id]
            );
        } else {
            [unlocks] = await pool.query(
                'SELECT module_id, unlocked_up_to_day FROM IOPBatchUnlocks WHERE batch_id = ?',
                [bs.batch_id]
            );
        }
        const unlockMap = {};
        unlocks.forEach(u => { unlockMap[u.module_id] = u.unlocked_up_to_day; });

        // File metadata (only for unlocked modules)
        const [files] = await pool.query(
            'SELECT id, module_id, file_type, file_name FROM IOPModuleFiles'
        );
        const filesByModule = {};
        files.forEach(f => {
            if (!filesByModule[f.module_id]) filesByModule[f.module_id] = {};
            filesByModule[f.module_id][f.file_type] = { id: f.id, file_name: f.file_name };
        });

        const result = modules.map(m => {
            const isUnlocked = (unlockMap[m.id] || 0) > 0;
            return {
                ...m,
                unlocked_up_to_day: unlockMap[m.id] || 0,
                is_unlocked: isUnlocked,
                files: isUnlocked ? (filesByModule[m.id] || {}) : {},
                topics: topics
                    .filter(t => t.module_id === m.id)
                    .map(t => ({ ...t, is_unlocked: t.day_number <= (unlockMap[m.id] || 0) }))
            };
        });

        res.json({ modules: result });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student IOP curriculum', error: error.message });
    }
};
