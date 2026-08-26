const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  getConversation, 
  markMessagesSeen,
  getAdminChatThreads, 
  getUserChatThreads 
} = require('../controllers/chatController');

router.post('/send', sendMessage);
router.get('/conversation/:userId', getConversation);
router.put('/mark-seen', markMessagesSeen);
router.get('/admin-threads', getAdminChatThreads);
router.get('/user-threads/:userId', getUserChatThreads);

module.exports = router;

