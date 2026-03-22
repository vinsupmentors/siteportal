const pool = require('../config/db');

exports.getTopicsByCourse = async (req, res) => {
    const { courseId } = req.params;
    try {
        const [topics] = await pool.query(`
            SELECT t.*, u.first_name, u.last_name, u.role_id,
                (SELECT COUNT(*) FROM ForumReplies WHERE topic_id = t.id) as reply_count
            FROM ForumTopics t
            JOIN Users u ON t.user_id = u.id
            WHERE t.course_id = ?
            ORDER BY t.created_at DESC
        `, [courseId]);
        res.json({ success: true, topics });
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch topics' });
    }
};

exports.createTopic = async (req, res) => {
    const { courseId, userId, title, content } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO ForumTopics (course_id, user_id, title, content) VALUES (?, ?, ?, ?)',
            [courseId, userId, title, content]
        );
        res.json({ success: true, topicId: result.insertId });
    } catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({ success: false, message: 'Failed to create topic' });
    }
};

exports.getTopicDetails = async (req, res) => {
    const { topicId } = req.params;
    try {
        const [topics] = await pool.query(`
            SELECT t.*, u.first_name, u.last_name, u.role_id 
            FROM ForumTopics t JOIN Users u ON t.user_id = u.id 
            WHERE t.id = ?
        `, [topicId]);

        if (!topics.length) return res.status(404).json({ success: false, message: 'Topic not found' });

        const [replies] = await pool.query(`
            SELECT r.*, u.first_name, u.last_name, u.role_id 
            FROM ForumReplies r JOIN Users u ON r.user_id = u.id 
            WHERE r.topic_id = ?
            ORDER BY r.is_accepted DESC, r.upvotes DESC, r.created_at ASC
        `, [topicId]);

        res.json({ success: true, topic: topics[0], replies });
    } catch (error) {
        console.error('Error fetching topic details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch topic details' });
    }
};

exports.createReply = async (req, res) => {
    const { topicId, userId, content } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO ForumReplies (topic_id, user_id, content) VALUES (?, ?, ?)',
            [topicId, userId, content]
        );
        res.json({ success: true, replyId: result.insertId });
    } catch (error) {
        console.error('Error creating reply:', error);
        res.status(500).json({ success: false, message: 'Failed to add reply' });
    }
};

exports.upvoteTopic = async (req, res) => {
    const { topicId } = req.params;
    try {
        await pool.query('UPDATE ForumTopics SET upvotes = upvotes + 1 WHERE id = ?', [topicId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

exports.upvoteReply = async (req, res) => {
    const { replyId } = req.params;
    try {
        await pool.query('UPDATE ForumReplies SET upvotes = upvotes + 1 WHERE id = ?', [replyId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

exports.acceptReply = async (req, res) => {
    const { replyId } = req.params;
    try {
        // Find topic first to ensure only one accepted reply, but let's just mark this one
        await pool.query('UPDATE ForumReplies SET is_accepted = TRUE WHERE id = ?', [replyId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};
