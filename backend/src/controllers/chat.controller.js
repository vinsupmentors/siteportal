const pool = require('../config/db');

exports.getChatHistory = async (req, res) => {
    const { userId, otherUserId } = req.params;
    
    try {
        const [messages] = await pool.query(`
            SELECT * FROM Messages 
            WHERE (sender_id = ? AND receiver_id = ?)
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `, [userId, otherUserId, otherUserId, userId]);

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
    }
};

exports.getChatContacts = async (req, res) => {
    const { userId } = req.params;
    const { role } = req.query; // Trainer (3) or Student (4)

    try {
        // If it's a student (role 4), they can chat with Trainers
        // Wait, for simplicity, get users who have messaged this user, or just list all Trainers
        let query = '';
        if (role == 4) {
            query = 'SELECT id, first_name, last_name, role_id FROM Users WHERE role_id = 3 AND status = "active"';
        } else if (role == 3) {
            query = 'SELECT id, first_name, last_name, role_id FROM Users WHERE role_id = 4 AND status = "active"';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const [contacts] = await pool.query(query);
        res.json({ success: true, contacts });

    } catch (error) {
        console.error('Error fetching chat contacts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chat contacts' });
    }
};
