const pool = require('../config/db');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query(
            'SELECT u.id, u.first_name, u.last_name, u.email, u.phone, r.name as role FROM Users u JOIN Roles r ON u.role_id = r.id WHERE u.id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, phone } = req.body;

        // Ensure required fields
        if (!first_name || !last_name) {
            return res.status(400).json({ message: 'First name and last name are required' });
        }

        await pool.query(
            'UPDATE Users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
            [first_name, last_name, phone || null, userId]
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};
