const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Get chat history with a specific user
router.get('/history/:userId/:otherUserId', chatController.getChatHistory);

// Get a list of contacts (trainers if student, students if trainer)
router.get('/contacts/:userId', chatController.getChatContacts);

module.exports = router;
