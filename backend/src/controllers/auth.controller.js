const pool = require('../config/db');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Lookup exact user instance
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // STRICT REQUIREMENT CHECK: Password is NOT hashed
        // Standard comparison executing against DB string
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Signing user credentials for stateless persistence 
        const token = jwt.sign(
            { id: user.id, role_id: user.role_id, email: user.email },
            process.env.JWT_SECRET || 'lms_secret_key_safe',
            { expiresIn: '24h' }
        );

        // Maps explicit portal UI routing via unboxed role values 
        const roleRoutes = {
            1: '/super-admin/dashboard',
            2: '/admin/dashboard',
            3: '/trainer/dashboard',
            4: '/student/dashboard',
            5: '/recruiter/dashboard',
            6: '/iop-trainer/dashboard'
        };

        res.status(200).json({
            message: 'Login successful',
            token,
            redirectUrl: roleRoutes[user.role_id] || '/login'
        });

    } catch (error) {
        console.error("Login System Fault:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const userId = req.user.id;

        const [users] = await pool.query('SELECT password FROM Users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        if (users[0].password !== old_password) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        await pool.query('UPDATE Users SET password = ? WHERE id = ?', [newPassword, req.user.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Password change error', error: error.message });
    }
};

// ==========================================
// GLOBAL ANNOUNCEMENTS (Popups & Receipts)
// ==========================================
exports.getUnacknowledged = async (req, res) => {
    try {
        const userId = req.user.id;
        const roleId = req.user.role_id;

        // Fetch batches the user belongs to (either as trainer or student)
        let batchIds = [];
        if (roleId === 3) { // Trainer
            const [batches] = await pool.query("SELECT id FROM Batches WHERE trainer_id = ? AND status IN ('active', 'upcoming')", [userId]);
            batchIds = batches.map(b => b.id);
        } else if (roleId === 4) { // Student
            const [batches] = await pool.query('SELECT batch_id FROM BatchStudents WHERE student_id = ?', [userId]);
            batchIds = batches.map(b => b.batch_id);
        }

        // Build the target filter array
        const targets = ['all', String(roleId)];
        if (batchIds.length > 0) {
            batchIds.forEach(id => targets.push(id));
        }

        // Query: Find the latest announcement meant for this user's role OR their specific batches
        // that they have NOT yet acknowledged in `AnnouncementAcknowledgements`.

        let batchCondition = '';
        if (batchIds.length > 0) {
            batchCondition = `OR a.target_batch_id IN (${batchIds.join(',')})`;
        } else {
            batchCondition = `OR a.target_batch_id IS NULL`; // fallback if no batches
        }

        const [unread] = await pool.query(`
            SELECT a.* 
            FROM Announcements a
            WHERE (a.target_role IN ('all', ?) ${batchCondition})
            AND NOT EXISTS (
                SELECT 1 FROM AnnouncementAcknowledgements ack 
                WHERE ack.announcement_id = a.id AND ack.user_id = ?
            )
            ORDER BY a.created_at DESC
            LIMIT 1
        `, [String(roleId), userId]);

        if (unread.length > 0) {
            res.json({ announcement: unread[0] });
        } else {
            res.json({ announcement: null });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error checking announcements', error: error.message });
    }
};

exports.acknowledgeAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await pool.query(
            'INSERT IGNORE INTO AnnouncementAcknowledgements (announcement_id, user_id) VALUES (?, ?)',
            [id, userId]
        );

        res.json({ message: 'Announcement acknowledged' });
    } catch (error) {
        res.status(500).json({ message: 'Error acknowledging announcement', error: error.message });
    }
};
