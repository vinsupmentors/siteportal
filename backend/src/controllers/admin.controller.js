const pool = require('../config/db');

// ==========================================
// ADMIN DASHBOARDS & REPORTING (READ-ONLY)
// ==========================================

// Aggregates standard system health stats
exports.getSystemOverview = async (req, res) => {
    try {
        const [activeBatches] = await pool.query("SELECT COUNT(*) as count FROM Batches WHERE status = 'active'");
        const [pendingLeaves] = await pool.query("SELECT COUNT(*) as count FROM StudentLeaves WHERE status = 'pending'");
        const [openDoubts] = await pool.query("SELECT COUNT(*) as count FROM StudentDoubts WHERE status = 'open'");

        res.status(200).json({
            activeBatches: activeBatches[0].count,
            pendingLeaves: pendingLeaves[0].count,
            openDoubts: openDoubts[0].count
        });
    } catch (error) {
        res.status(500).json({ message: 'Server fault processing admin overview.', error: error.message });
    }
};

// Generates the explicit Audit Log tracking for Super Admin / Trainer modifications
exports.getAuditLogs = async (req, res) => {
    try {
        // Includes parameterized limit mapping for pagination logic
        const limit = parseInt(req.query.limit) || 50;

        const [logs] = await pool.query(`
            SELECT a.*, u.first_name, u.last_name, r.name as role_name
            FROM AuditLogs a
            LEFT JOIN Users u ON a.user_id = u.id
            LEFT JOIN Roles r ON u.role_id = r.id
            ORDER BY a.created_at DESC
            LIMIT ?
        `, [limit]);

        res.status(200).json({ logs });
    } catch (error) {
        res.status(500).json({ message: 'Server fault retrieving system logs.', error: error.message });
    }
};

// Generates Trainer efficacy matrix based on their session ratings
exports.getTrainerPerformance = async (req, res) => {
    try {
        const [performance] = await pool.query(`
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                AVG(sf.rating) as average_rating,
                COUNT(sf.id) as total_reviews
            FROM Users u
            JOIN Roles r ON u.role_id = r.id
            LEFT JOIN SessionFeedback sf ON u.id = sf.trainer_id
            WHERE r.name = 'Trainer'
            GROUP BY u.id
        `);

        res.status(200).json({ performance });
    } catch (error) {
        res.status(500).json({ message: 'Server fault retrieving performance metrics.', error: error.message });
    }
}

// ── Sidebar notification counts ───────────────────────────────────────────────
exports.getNotificationCounts = async (req, res) => {
    try {
        const [[{ pendingTrainerLeaves }]] = await pool.query(
            "SELECT COUNT(*) AS pendingTrainerLeaves FROM TrainerLeaves WHERE status = 'pending'");
        const [[{ openDoubts }]] = await pool.query(
            "SELECT COUNT(*) AS openDoubts FROM StudentDoubts WHERE status != 'resolved'");
        const [[{ openIssues }]] = await pool.query(
            "SELECT COUNT(*) AS openIssues FROM StudentIssues WHERE status != 'resolved'");
        res.json({ pendingTrainerLeaves, openDoubts, openIssues });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notification counts', error: error.message });
    }
};
