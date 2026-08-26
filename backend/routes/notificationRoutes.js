const express = require('express');
const router = express.Router();
const { 
  getUserNotifications, 
  createNotification, 
  markAsRead, 
  triggerPriceDropAlert 
} = require('../controllers/notificationController');

router.get('/:userId', getUserNotifications);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);
router.post('/price-drop', triggerPriceDropAlert);

module.exports = router;
