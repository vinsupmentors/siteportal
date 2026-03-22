const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forum.controller');

router.get('/courses/:courseId', forumController.getTopicsByCourse);
router.post('/topics', forumController.createTopic);
router.get('/topics/:topicId', forumController.getTopicDetails);
router.post('/topics/:topicId/upvote', forumController.upvoteTopic);

router.post('/replies', forumController.createReply);
router.post('/replies/:replyId/upvote', forumController.upvoteReply);
router.post('/replies/:replyId/accept', forumController.acceptReply);

module.exports = router;
