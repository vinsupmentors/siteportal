const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── File upload config ─────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/submissions');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}_${safe}`);
    }
});

const capstoneStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/content');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `capstone_${Date.now()}_${safe}`);
    }
});

exports.uploadSubmission = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).single('file');
exports.uploadCapstoneFiles = multer({ storage: capstoneStorage, limits: { fileSize: 100 * 1024 * 1024 } }).array('files', 10);

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER: GET FULL RELEASE STATUS FOR A BATCH
// ══════════════════════════════════════════════════════════════════════════════
exports.getReleaseStatus = async (req, res) => {
    try {
        const { batchId } = req.params;
        const trainerId = req.user.id;

        const [batchRows] = await pool.query(
            `SELECT b.*, c.name as course_name, c.id as course_id
             FROM Batches b JOIN Courses c ON b.course_id = c.id
             WHERE b.id = ? AND b.trainer_id = ?`,
            [batchId, trainerId]
        );
        if (!batchRows.length) return res.status(403).json({ message: 'Unauthorized or batch not found' });

        const batch = batchRows[0];
        const courseId = batch.course_id;

        const [modules] = await pool.query(
            'SELECT * FROM Modules WHERE course_id = ? ORDER BY sequence_order',
            [courseId]
        );

        if (!modules.length) {
            return res.json({ batch, modules: [], capstones: [] });
        }

        const moduleIds = modules.map(m => m.id);
        const ph = moduleIds.map(() => '?').join(',');

        const [batchUnlocks] = await pool.query(
            'SELECT * FROM BatchUnlocks WHERE batch_id = ?', [batchId]
        );
        const unlockMap = {};
        batchUnlocks.forEach(u => { unlockMap[u.module_id] = u; });

        const [releases] = await pool.query(
            'SELECT * FROM BatchReleases WHERE batch_id = ?', [batchId]
        );
        const releaseMap = {};
        releases.forEach(r => { releaseMap[`${r.release_type}_${r.entity_id}`] = r; });

        const [days] = await pool.query(`
            SELECT d.*,
                (SELECT COUNT(*) FROM ContentFiles WHERE entity_type='day' AND entity_id=d.id AND category='material') as material_count,
                (SELECT COUNT(*) FROM ContentFiles WHERE entity_type='day' AND entity_id=d.id AND category='worksheet') as worksheet_count,
                (SELECT COUNT(*) FROM ContentFiles WHERE entity_type='day' AND entity_id=d.id AND category='notes') as notes_count
            FROM Days d
            WHERE d.module_id IN (${ph})
            ORDER BY d.module_id, d.day_number
        `, moduleIds);

        const [projects] = await pool.query(`
            SELECT mp.*,
                (SELECT COUNT(*) FROM ContentFiles WHERE entity_type='project' AND entity_id=mp.id) as file_count
            FROM ModuleProjects mp
            WHERE mp.module_id IN (${ph})
            ORDER BY mp.module_id, mp.id
        `, moduleIds);

        const [moduleFiles] = await pool.query(`
            SELECT entity_id as module_id, category, COUNT(*) as file_count
            FROM ContentFiles
            WHERE entity_type='module' AND entity_id IN (${ph})
            GROUP BY entity_id, category
        `, moduleIds);
        const moduleFileMap = {};
        moduleFiles.forEach(f => {
            if (!moduleFileMap[f.module_id]) moduleFileMap[f.module_id] = {};
            moduleFileMap[f.module_id][f.category] = f.file_count;
        });

        const [feedbackForms] = await pool.query(
            `SELECT * FROM FeedbackForms WHERE module_id IN (${ph})`, moduleIds
        );
        const feedbackMap = {};
        feedbackForms.forEach(f => { feedbackMap[f.module_id] = f; });

        const [capstones] = await pool.query(`
            SELECT cp.*,
                (SELECT COUNT(*) FROM ContentFiles WHERE entity_type='capstone' AND entity_id=cp.id) as file_count
            FROM CapstoneProjecs cp
            WHERE cp.course_id = ?
            ORDER BY cp.sequence_order
        `, [courseId]);

        const moduleData = modules.map(m => {
            const unlock = unlockMap[m.id];
            const files = moduleFileMap[m.id] || {};
            const feedback = feedbackMap[m.id];

            return {
                ...m,
                days: days.filter(d => d.module_id === m.id).map(d => ({
                    ...d,
                    released: unlock ? unlock.unlocked_up_to_day >= d.day_number : false,
                })),
                projects: projects.filter(p => p.module_id === m.id).map(p => ({
                    ...p,
                    release: releaseMap[`module_project_${p.id}`] || null,
                })),
                test: {
                    file_count: files['test'] || 0,
                    release: releaseMap[`module_test_${m.id}`] || null,
                },
                study_material: {
                    file_count: files['study_material'] || 0,
                    release: releaseMap[`module_study_material_${m.id}`] || null,
                },
                interview_questions: {
                    file_count: files['interview_questions'] || 0,
                    release: releaseMap[`module_interview_questions_${m.id}`] || null,
                },
                feedback: feedback ? {
                    ...feedback,
                    release: releaseMap[`module_feedback_${feedback.id}`] || null,
                } : null,
            };
        });

        const capstoneData = capstones.map(c => ({
            ...c,
            release: releaseMap[`capstone_project_${c.id}`] || null,
        }));

        res.json({ batch, modules: moduleData, capstones: capstoneData });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching release status', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER: RELEASE A DAY
// ══════════════════════════════════════════════════════════════════════════════
exports.releaseDay = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { module_id, day_number } = req.body;
        const trainerId = req.user.id;

        const [batchCheck] = await pool.query(
            'SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batchId, trainerId]
        );
        if (!batchCheck.length) return res.status(403).json({ message: 'Unauthorized' });

        const [existing] = await pool.query(
            'SELECT id, unlocked_up_to_day FROM BatchUnlocks WHERE batch_id = ? AND module_id = ?',
            [batchId, module_id]
        );

        if (existing.length > 0) {
            if (day_number > existing[0].unlocked_up_to_day) {
                await pool.query(
                    'UPDATE BatchUnlocks SET unlocked_up_to_day = ?, unlocked_by = ?, unlocked_at = NOW() WHERE id = ?',
                    [day_number, trainerId, existing[0].id]
                );
            }
        } else {
            await pool.query(
                `INSERT INTO BatchUnlocks (batch_id, module_id, unlocked_up_to_day, unlocked_by)
                 VALUES (?, ?, ?, ?)`,
                [batchId, module_id, day_number, trainerId]
            );
        }

        await pool.query(
            'INSERT INTO AuditLogs (user_id, action, table_name, record_id) VALUES (?, ?, ?, ?)',
            [trainerId, `RELEASE_DAY_${day_number}`, 'BatchUnlocks', batchId]
        );

        res.json({ message: `Day ${day_number} released successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error releasing day', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER: RELEASE AN ITEM (project / test / feedback / study / IQ / capstone)
// ══════════════════════════════════════════════════════════════════════════════
exports.releaseItem = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { release_type, entity_id, module_id, due_date } = req.body;
        const trainerId = req.user.id;

        const [batchCheck] = await pool.query(
            'SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batchId, trainerId]
        );
        if (!batchCheck.length) return res.status(403).json({ message: 'Unauthorized' });

        const validTypes = [
            'module_project', 'module_test', 'module_feedback',
            'module_study_material', 'module_interview_questions', 'capstone_project'
        ];
        if (!validTypes.includes(release_type)) {
            return res.status(400).json({ message: 'Invalid release type' });
        }

        const [existing] = await pool.query(
            'SELECT id FROM BatchReleases WHERE batch_id = ? AND release_type = ? AND entity_id = ?',
            [batchId, release_type, entity_id]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE BatchReleases SET due_date = ?, released_by = ?, released_at = NOW() WHERE id = ?',
                [due_date || null, trainerId, existing[0].id]
            );
        } else {
            await pool.query(
                `INSERT INTO BatchReleases (batch_id, release_type, entity_id, module_id, due_date, released_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [batchId, release_type, entity_id, module_id || null, due_date || null, trainerId]
            );
        }

        res.json({ message: 'Content released successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error releasing item', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER: UN-RELEASE AN ITEM
// ══════════════════════════════════════════════════════════════════════════════
exports.unreleaseItem = async (req, res) => {
    try {
        const { batchId, releaseId } = req.params;
        const trainerId = req.user.id;

        const [batchCheck] = await pool.query(
            'SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batchId, trainerId]
        );
        if (!batchCheck.length) return res.status(403).json({ message: 'Unauthorized' });

        await pool.query(
            'DELETE FROM BatchReleases WHERE id = ? AND batch_id = ?',
            [releaseId, batchId]
        );

        res.json({ message: 'Item un-released' });
    } catch (error) {
        res.status(500).json({ message: 'Error un-releasing item', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER: GET SUBMISSIONS FOR A BATCH
// ══════════════════════════════════════════════════════════════════════════════
exports.getBatchReleaseSubmissions = async (req, res) => {
    try {
        const { batchId } = req.params;
        const trainerId = req.user.id;

        const [batchCheck] = await pool.query(
            'SELECT id FROM Batches WHERE id = ? AND trainer_id = ?', [batchId, trainerId]
        );
        if (!batchCheck.length) return res.status(403).json({ message: 'Unauthorized' });

        const [submissions] = await pool.query(`
            SELECT srs.*,
                CONCAT(u.first_name, ' ', u.last_name) as student_name, u.email,
                br.release_type, br.due_date, br.entity_id
            FROM StudentReleaseSubmissions srs
            JOIN Users u ON srs.student_id = u.id
            JOIN BatchReleases br ON srs.release_id = br.id
            WHERE srs.batch_id = ?
            ORDER BY srs.submitted_at DESC
        `, [batchId]);

        res.json({ submissions });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// TRAINER: GRADE A SUBMISSION
// ══════════════════════════════════════════════════════════════════════════════
exports.gradeReleaseSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { marks, feedback, status } = req.body;
        const trainerId = req.user.id;

        await pool.query(`
            UPDATE StudentReleaseSubmissions
            SET marks = ?, feedback = ?, status = ?, graded_by = ?, graded_at = NOW()
            WHERE id = ?
        `, [marks, feedback, status || 'graded', trainerId, submissionId]);

        res.json({ message: 'Submission graded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error grading submission', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT: GET ALL RELEASED ITEMS FOR ACTIVE BATCH
// ══════════════════════════════════════════════════════════════════════════════
exports.getStudentReleases = async (req, res) => {
    try {
        const studentId = req.user.id;

        const [batchRows] = await pool.query(`
            SELECT b.*, c.name as course_name
            FROM Batches b
            JOIN BatchStudents bs ON b.id = bs.batch_id
            JOIN Courses c ON b.course_id = c.id
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);

        if (!batchRows.length) return res.json({ releases: [], batch: null });

        const batch = batchRows[0];

        const [releases] = await pool.query(`
            SELECT br.*,
                CONCAT(u.first_name, ' ', u.last_name) as released_by_name,
                (SELECT id FROM StudentReleaseSubmissions WHERE release_id = br.id AND student_id = ?) as submission_id,
                (SELECT status FROM StudentReleaseSubmissions WHERE release_id = br.id AND student_id = ?) as submission_status,
                (SELECT marks FROM StudentReleaseSubmissions WHERE release_id = br.id AND student_id = ?) as submission_marks
            FROM BatchReleases br
            JOIN Users u ON br.released_by = u.id
            WHERE br.batch_id = ?
            ORDER BY br.released_at DESC
        `, [studentId, studentId, studentId, batch.id]);

        const enriched = await Promise.all(releases.map(async r => {
            let name = '';
            let files = [];
            let extra = {};

            try {
                if (r.release_type === 'module_project') {
                    const [[row]] = await pool.query('SELECT name, description FROM ModuleProjects WHERE id = ?', [r.entity_id]);
                    name = row?.name || 'Project';
                    extra.description = row?.description || '';
                    // Get project files
                    const [pFiles] = await pool.query(
                        "SELECT * FROM ContentFiles WHERE entity_type = 'project' AND entity_id = ?", [r.entity_id]
                    );
                    files = pFiles;

                } else if (r.release_type === 'module_test') {
                    const [[mod]] = await pool.query('SELECT name, test_url FROM Modules WHERE id = ?', [r.entity_id]);
                    name = `${mod?.name || 'Module'} — Test`;
                    extra.test_url = mod?.test_url || null;
                    // Get test files
                    const [tFiles] = await pool.query(
                        "SELECT * FROM ContentFiles WHERE entity_type = 'module' AND entity_id = ? AND category = 'test'", [r.entity_id]
                    );
                    files = tFiles;

                } else if (r.release_type === 'module_feedback') {
                    const [[form]] = await pool.query('SELECT title FROM FeedbackForms WHERE id = ?', [r.entity_id]);
                    name = form?.title || 'Feedback Form';

                } else if (r.release_type === 'module_study_material') {
                    const [[mod]] = await pool.query('SELECT name, study_material_url FROM Modules WHERE id = ?', [r.entity_id]);
                    name = `${mod?.name || 'Module'} — Study Materials`;
                    extra.material_url = mod?.study_material_url || null;
                    // Get study material files
                    const [sFiles] = await pool.query(
                        "SELECT * FROM ContentFiles WHERE entity_type = 'module' AND entity_id = ? AND category = 'study_material'", [r.entity_id]
                    );
                    files = sFiles;

                } else if (r.release_type === 'module_interview_questions') {
                    const [[mod]] = await pool.query('SELECT name, interview_questions_url FROM Modules WHERE id = ?', [r.entity_id]);
                    name = `${mod?.name || 'Module'} — Interview Questions`;
                    extra.iq_url = mod?.interview_questions_url || null;
                    // Get IQ files
                    const [iFiles] = await pool.query(
                        "SELECT * FROM ContentFiles WHERE entity_type = 'module' AND entity_id = ? AND category = 'interview_questions'", [r.entity_id]
                    );
                    files = iFiles;

                } else if (r.release_type === 'capstone_project') {
                    const [[cap]] = await pool.query('SELECT name, description FROM CapstoneProjecs WHERE id = ?', [r.entity_id]);
                    name = cap?.name || 'Capstone Project';
                    extra.description = cap?.description || '';
                    // Get capstone files
                    const [cFiles] = await pool.query(
                        "SELECT * FROM ContentFiles WHERE entity_type = 'capstone' AND entity_id = ?", [r.entity_id]
                    );
                    files = cFiles;
                }
            } catch (_) {}

            return { ...r, name, files, ...extra };
        }));

        res.json({ releases: enriched, batch });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching releases', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT: SUBMIT WORK FOR A RELEASED ITEM
// ══════════════════════════════════════════════════════════════════════════════
exports.submitReleaseWork = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { releaseId } = req.params;
        const { github_link, notes } = req.body;

        const [batchRows] = await pool.query(`
            SELECT b.id FROM Batches b
            JOIN BatchStudents bs ON b.id = bs.batch_id
            WHERE bs.student_id = ? AND b.status = 'active'
            LIMIT 1
        `, [studentId]);
        if (!batchRows.length) return res.status(400).json({ message: 'No active batch' });

        const batchId = batchRows[0].id;

        const [releaseCheck] = await pool.query(
            'SELECT id FROM BatchReleases WHERE id = ? AND batch_id = ?',
            [releaseId, batchId]
        );
        if (!releaseCheck.length) return res.status(404).json({ message: 'Release not found' });

        const file_url = req.file ? `/uploads/submissions/${req.file.filename}` : null;

        const [existing] = await pool.query(
            'SELECT id FROM StudentReleaseSubmissions WHERE release_id = ? AND student_id = ?',
            [releaseId, studentId]
        );

        if (existing.length > 0) {
            await pool.query(`
                UPDATE StudentReleaseSubmissions
                SET file_url = IFNULL(?, file_url), github_link = ?, notes = ?,
                    status = 'submitted', submitted_at = NOW()
                WHERE id = ?
            `, [file_url, github_link || null, notes || null, existing[0].id]);
        } else {
            await pool.query(`
                INSERT INTO StudentReleaseSubmissions
                    (release_id, student_id, batch_id, file_url, github_link, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [releaseId, studentId, batchId, file_url, github_link || null, notes || null]);
        }

        res.status(201).json({ message: 'Submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting work', error: error.message });
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// SUPERADMIN: CAPSTONE CRUD
// ══════════════════════════════════════════════════════════════════════════════
exports.getCourseCapstones = async (req, res) => {
    try {
        const { courseId } = req.params;
        const [capstones] = await pool.query(`
            SELECT cp.*,
                (SELECT COUNT(*) FROM ContentFiles WHERE entity_type='capstone' AND entity_id=cp.id) as file_count,
                (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                    'id', cf.id, 'original_name', cf.original_name,
                    'stored_name', cf.stored_name, 'mime_type', cf.mime_type,
                    'file_size', cf.file_size, 'uploaded_at', cf.uploaded_at
                )) FROM ContentFiles cf WHERE cf.entity_type='capstone' AND cf.entity_id=cp.id) as files
            FROM CapstoneProjecs cp
            WHERE cp.course_id = ?
            ORDER BY cp.sequence_order
        `, [courseId]);

        const parsed = capstones.map(c => ({
            ...c,
            files: c.files ? (typeof c.files === 'string' ? JSON.parse(c.files) : c.files) : []
        }));

        res.json({ capstones: parsed });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching capstones', error: error.message });
    }
};

exports.createCapstone = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { name, description, sequence_order } = req.body;

        const [result] = await pool.query(
            'INSERT INTO CapstoneProjecs (course_id, name, description, sequence_order, created_by) VALUES (?, ?, ?, ?, ?)',
            [courseId, name, description || null, sequence_order || 1, req.user.id]
        );

        res.status(201).json({ message: 'Capstone created', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating capstone', error: error.message });
    }
};

exports.updateCapstone = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, sequence_order } = req.body;

        await pool.query(
            'UPDATE CapstoneProjecs SET name = ?, description = ?, sequence_order = ? WHERE id = ?',
            [name, description || null, sequence_order || 1, id]
        );

        res.json({ message: 'Capstone updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating capstone', error: error.message });
    }
};

exports.deleteCapstone = async (req, res) => {
    try {
        const { id } = req.params;

        const [files] = await pool.query(
            "SELECT stored_name FROM ContentFiles WHERE entity_type='capstone' AND entity_id=?", [id]
        );
        files.forEach(f => {
            const fp = path.join(__dirname, '../../uploads/content', f.stored_name);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        });

        await pool.query("DELETE FROM ContentFiles WHERE entity_type='capstone' AND entity_id=?", [id]);
        await pool.query('DELETE FROM CapstoneProjecs WHERE id = ?', [id]);

        res.json({ message: 'Capstone deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting capstone', error: error.message });
    }
};

exports.uploadCapstoneFilesHandler = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.files || !req.files.length) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        for (const file of req.files) {
            await pool.query(
                `INSERT INTO ContentFiles (entity_type, entity_id, category, original_name, stored_name, file_size, mime_type)
                 VALUES ('capstone', ?, 'capstone_files', ?, ?, ?, ?)`,
                [id, file.originalname, file.filename, file.size, file.mimetype]
            );
        }

        res.status(201).json({ message: `${req.files.length} file(s) uploaded` });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading files', error: error.message });
    }
};

exports.deleteCapstoneFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        const [rows] = await pool.query('SELECT stored_name FROM ContentFiles WHERE id = ?', [fileId]);
        if (!rows.length) return res.status(404).json({ message: 'File not found' });

        const fp = path.join(__dirname, '../../uploads/content', rows[0].stored_name);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);

        await pool.query('DELETE FROM ContentFiles WHERE id = ?', [fileId]);

        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
};