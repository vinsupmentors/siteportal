const pool = require('../config/db');

module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('join_chat', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their personal chat room`);
        });

        socket.on('send_message', async (data) => {
            const { senderId, receiverId, content } = data;
            
            try {
                // Save to DB
                const [result] = await pool.query(
                    'INSERT INTO Messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
                    [senderId, receiverId, content]
                );

                const newMessage = {
                    id: result.insertId,
                    sender_id: senderId,
                    receiver_id: receiverId,
                    content,
                    created_at: new Date()
                };

                // Emit to receiver's room
                io.to(`user_${receiverId}`).emit('receive_message', newMessage);
                // Also emit to sender's room to confirm
                io.to(`user_${senderId}`).emit('receive_message', newMessage);

            } catch (error) {
                console.error('Socket message error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
