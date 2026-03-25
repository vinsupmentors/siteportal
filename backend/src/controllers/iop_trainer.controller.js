const pool = require('../config/db');

// ── Dashboard ─────────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
    try {
        const trainerId = req.user.id;

        // My groups
        const [groups] = await pool.query(
            `SELECT id, name, status FROM IOPGroups WHERE iop_trainer_id = ?`,
            [trainerId]
        );
        const groupIds = groups.map(g => g.id);

        let totalStudents = 0;
        let activeGroups = groups.filter(g => g.status === 'active').length;

        if (groupIds.length > 0) {
            const placeholders = groupIds.map(() => '?').join(',');
            const [[{ cnt }]] = await pool.query(`
                SELECT COUNT(DISTINCT bs.student_id) as cnt
                FROM IOPGroupBatches igb
                JOIN BatchStudents bs ON igb.batch_id = bs.batch_id
                JOIN Users u ON bs.student_id = u.id
                WHERE igb.iop_group_id IN (${placeholders}) AND u.status = 'active'
            `, groupIds);
            totalStudents = Number(cnt);
        }

        // Total IOP modules
        const [[{ moduleCount }]] = await pool.query(
            'SELECT COUNT(*) as moduleCount FROM IOPModules'
        );

        // Upcoming group (next start_date)
        const [upcoming] = await pool.query(`
            SELECT name, start_date FROM IOPGroups
            WHERE iop_trainer_id = ? AND status = 'upcoming'
            ORDER BY start_date ASC LIMIT 1
        `, [trainerId]);

        res.json({
            totalGroups: groups.length,
            activeGroups,
            totalStudents,
            totalModules: Number(moduleCount),
            nextGroup: upcoming[0] || null
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP trainer dashboard', error: error.message });
    }
};

// ── My Groups ─────────────────────────────────────────────────────────────────

exports.getMyGroups = async (req, res) => {
    try {
        const trainerId = req.user.id;

        const [groups] = await pool.query(`
            SELECT g.id, g.name, g.status, g.start_date, g.end_date, g.timing,
                   g.created_at,
                   (SELECT COUNT(DISTINCT bs.student_id)
                    FROM IOPGroupBatches igb
                    JOIN BatchStudents bs ON igb.batch_id = bs.batch_id
                    JOIN Users u ON bs.student_id = u.id
                    WHERE igb.iop_group_id = g.id AND u.status = 'active') as student_count,
                   (SELECT COUNT(*) FROM IOPGroupBatches WHERE iop_group_id = g.id) as batch_count
            FROM IOPGroups g
            WHERE g.iop_trainer_id = ?
            ORDER BY g.created_at DESC
        `, [trainerId]);

        // For each group get batch names
        for (const group of groups) {
            const [batches] = await pool.query(`
                SELECT b.id, b.batch_name, c.name as course_name
                FROM IOPGroupBatches igb
                JOIN Batches b ON igb.batch_id = b.id
                JOIN Courses c ON b.course_id = c.id
                WHERE igb.iop_group_id = ?
            `, [group.id]);
            group.batches = batches;
        }

        res.json({ groups });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching IOP groups', error: error.message });
    }
};

// ── Group Details ─────────────────────────────────────────────────────────────

exports.getGroupDetails = async (req, res) => {
    try {
        const { groupId } = req.params;
        const trainerId = req.user.id;

        const [[group]] = await pool.query(
            'SELECT * FROM IOPGroups WHERE id = ? AND iop_trainer_id = ?',
            [groupId, trainerId]
        );
        if (!group) return res.status(404).json({ message: 'Group not found or not authorized' });

        const [batches] = await pool.query(`
            SELECT b.id, b.batch_name, c.name as course_name, b.status,
                   (SELECT COUNT(*) FROM BatchStudents WHERE batch_id = b.id) as student_count
            FROM IOPGroupBatches igb
            JOIN Batches b ON igb.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE igb.iop_group_id = ?
        `, [groupId]);

        group.batches = batches;
        res.json({ group });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching group details', error: error.message });
    }
};

// ── Group Curriculum with unlock state ───────────────────────────────────────

exports.getGroupCurriculum = async (req, res) => {
    try {
        const { groupId } = req.params;
        const trainerId = req.user.id;

        const [[group]] = await pool.query(
            'SELECT id FROM IOPGroups WHERE id = ? AND iop_trainer_id = ?',
            [groupId, trainerId]
        );
        if (!group) return res.status(403).json({ message: 'Not authorized for this group' });

        const [modules] = await pool.query(
            'SELECT * FROM IOPModules ORDER BY type, sequence_order'
        );
        const [topics] = await pool.query(
            'SELECT * FROM IOPTopics ORDER BY module_id, day_number'
        );
        const [unlocks] = await pool.query(
            `SELECT module_id, unlocked_up_to_day,
                    COALESCE(is_concepts_released, 0)        as is_concepts_released,
                    COALESCE(is_sample_problems_released, 0) as is_sample_problems_released,
                    COALESCE(is_worksheet_released, 0)       as is_worksheet_released
             FROM IOPGroupUnlocks WHERE iop_group_id = ?`,
            [groupId]
        );
        const unlockMap = {};
        unlocks.forEach(u => { unlockMap[u.module_id] = u; });

        const [files] = await pool.query(
            'SELECT id, module_id, file_type, file_name FROM IOPModuleFiles'
        );
        const filesByModule = {};
        files.forEach(f => {
            if (!filesByModule[f.module_id]) filesByModule[f.module_id] = {};
            filesByModule[f.module_id][f.file_type] = { id: f.id, file_name: f.file_name };
        });

        const result = modules.map(m => {
            const u = unlockMap[m.id] || {};
            return {
                ...m,
                unlocked_up_to_day:           u.unlocked_up_to_day           || 0,
                is_concepts_released:          u.is_concepts_released          || 0,
                is_sample_problems_released:   u.is_sample_problems_released   || 0,
                is_worksheet_released:         u.is_worksheet_released         || 0,
                files: filesByModule[m.id] || {},
                topics: topics
                    .filter(t => t.module_id === m.id)
                    .map(t => ({ ...t, is_unlocked: t.day_number <= (u.unlocked_up_to_day || 0) }))
            };
        });

        res.json({ modules: result });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching group curriculum', error: error.message });
    }
};

// ── Unlock / update module for group ─────────────────────────────────────────

exports.unlockGroupModule = async (req, res) => {
    try {
        const { groupId } = req.params;
        const trainerId = req.user.id;
        const {
            module_id,
            unlocked_up_to_day,
            is_concepts_released,
            is_sample_problems_released,
            is_worksheet_released,
        } = req.body;

        if (!module_id) {
            return res.status(400).json({ message: 'module_id is required' });
        }

        const [[group]] = await pool.query(
            'SELECT id FROM IOPGroups WHERE id = ? AND iop_trainer_id = ?',
            [groupId, trainerId]
        );
        if (!group) return res.status(403).json({ message: 'Not authorized for this group' });

        await pool.query(`
            INSERT INTO IOPGroupUnlocks
                (iop_group_id, module_id, unlocked_up_to_day,
                 is_concepts_released, is_sample_problems_released, is_worksheet_released,
                 unlocked_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                unlocked_up_to_day           = VALUES(unlocked_up_to_day),
                is_concepts_released         = VALUES(is_concepts_released),
                is_sample_problems_released  = VALUES(is_sample_problems_released),
                is_worksheet_released        = VALUES(is_worksheet_released),
                unlocked_by                  = VALUES(unlocked_by),
                unlocked_at                  = CURRENT_TIMESTAMP
        `, [
            groupId, module_id,
            unlocked_up_to_day          ?? 0,
            is_concepts_released        ?? 0,
            is_sample_problems_released ?? 0,
            is_worksheet_released       ?? 0,
            trainerId,
        ]);

        res.json({ message: 'Module unlock updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating module unlock', error: error.message });
    }
};

// ── Group Students ────────────────────────────────────────────────────────────

exports.getGroupStudents = async (req, res) => {
    try {
        const { groupId } = req.params;
        const trainerId = req.user.id;

        const [[group]] = await pool.query(
            'SELECT id FROM IOPGroups WHERE id = ? AND iop_trainer_id = ?',
            [groupId, trainerId]
        );
        if (!group) return res.status(403).json({ message: 'Not authorized for this group' });

        const [students] = await pool.query(`
            SELECT DISTINCT
                u.id, u.first_name, u.last_name, u.email, u.program_type,
                u.student_status, u.roll_number,
                b.id as batch_id, b.batch_name,
                c.name as course_name
            FROM IOPGroupBatches igb
            JOIN BatchStudents bs ON igb.batch_id = bs.batch_id
            JOIN Users u ON bs.student_id = u.id
            JOIN Batches b ON igb.batch_id = b.id
            JOIN Courses c ON b.course_id = c.id
            WHERE igb.iop_group_id = ? AND u.status = 'active'
            ORDER BY b.batch_name, u.first_name
        `, [groupId]);

        res.json({ students });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching group students', error: error.message });
    }
};

// ── Mark IOP Group Attendance ─────────────────────────────────────────────────

exports.markGroupAttendance = async (req, res) => {
    try {
        const { groupId } = req.params;
        const trainerId = req.user.id;
        const { attendance_date, records } = req.body;
        // records = [{ student_id, batch_id, status, notes }]

        if (!attendance_date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: 'attendance_date and records[] are required' });
        }

        const [[group]] = await pool.query(
            'SELECT id FROM IOPGroups WHERE id = ? AND iop_trainer_id = ?',
            [groupId, trainerId]
        );
        if (!group) return res.status(403).json({ message: 'Not authorized for this group' });

        // Upsert into IOPAttendance
        for (const rec of records) {
            await pool.query(`
                INSERT INTO IOPAttendance (iop_group_id, student_id, batch_id, attendance_date, status, notes, marked_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    notes = VALUES(notes),
                    marked_by = VALUES(marked_by)
            `, [groupId, rec.student_id, rec.batch_id, attendance_date, rec.status || 'present', rec.notes || null, trainerId]);
        }

        res.json({ message: 'Attendance marked successfully', count: records.length });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error: error.message });
    }
};

// ── Get IOP Group Attendance ──────────────────────────────────────────────────

exports.getGroupAttendance = async (req, res) => {
    try {
        const { groupId } = req.params;
        const trainerId = req.user.id;
        const { date } = req.query;

        const [[group]] = await pool.query(
            'SELECT id FROM IOPGroups WHERE id = ? AND iop_trainer_id = ?',
            [groupId, trainerId]
        );
        if (!group) return res.status(403).json({ message: 'Not authorized for this group' });

        const targetDate = date || new Date().toISOString().split('T')[0];

        const [attendance] = await pool.query(`
            SELECT ia.student_id, ia.batch_id, ia.status, ia.notes,
                   u.first_name, u.last_name, b.batch_name
            FROM IOPAttendance ia
            JOIN Users u ON ia.student_id = u.id
            JOIN Batches b ON ia.batch_id = b.id
            WHERE ia.iop_group_id = ? AND ia.attendance_date = ?
        `, [groupId, targetDate]);

        res.json({ date: targetDate, attendance });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

// ── Download IOP module file (IOP trainer) ────────────────────────────────────

exports.downloadIOPModuleFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const [[file]] = await pool.query('SELECT * FROM IOPModuleFiles WHERE id = ?', [fileId]);
        if (!file) return res.status(404).json({ message: 'File not found' });

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`);
        if (file.file_size) res.setHeader('Content-Length', file.file_size);
        res.send(file.file_data);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading file', error: error.message });
    }
};
