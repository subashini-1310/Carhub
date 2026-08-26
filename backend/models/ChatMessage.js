const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  recipientId: { type: String, default: 'admin' }, // Users chat with admin
  text: { type: String, required: true },
  carId: { type: String, default: '' },
  carTitle: { type: String, default: '' },
  carImage: { type: String, default: '' },
  carPrice: { type: Number, default: 0 },
  isRead: { type: Boolean, default: false },
  seenAt: { type: Date, default: null },
  timestamp: { type: Date, default: Date.now },
  isCallNotification: { type: Boolean, default: false },
  callType: { type: String, enum: ['audio', 'video', 'none'], default: 'none' }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

