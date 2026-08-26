const ChatMessage = require('../models/ChatMessage');
const Car = require('../models/Car');
const Notification = require('../models/Notification');
const { inMemoryCars } = require('./carController');

let inMemoryMessages = [
  {
    id: 'msg-1',
    senderId: 'usr-buyer',
    senderName: 'Rahul Customer',
    senderRole: 'Buyer / Renter',
    recipientId: 'admin',
    text: 'Hello Admin! Is the Toyota Innova Crysta available for test drive in Chennai?',
    carId: 'car-101',
    carTitle: 'Toyota Innova Crysta 2.4 VX',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: 'msg-2',
    senderId: 'admin',
    senderName: 'CarHub Admin',
    senderRole: 'Admin',
    recipientId: 'usr-buyer',
    text: 'Hi Rahul! Yes, the Innova Crysta is 140-point inspected and ready at our Chennai Hub. Would you like to schedule a home test drive?',
    carId: 'car-101',
    carTitle: 'Toyota Innova Crysta 2.4 VX',
    timestamp: new Date(Date.now() - 1800000)
  },
  {
    id: 'msg-3',
    senderId: 'usr-renter',
    senderName: 'Priya Renter',
    senderRole: 'Buyer / Renter',
    recipientId: 'admin',
    text: 'Hi, I would like to book the Hyundai Creta for a 3-day weekend trip to Pondicherry.',
    carId: 'car-102',
    carTitle: 'Hyundai Creta SX 1.5 Petrol',
    timestamp: new Date(Date.now() - 900000)
  }
];

const sendMessage = async (req, res) => {
  try {
    const { senderId, senderName, senderRole, recipientId, text, carId, carTitle, carImage, carPrice, isCallNotification, callType } = req.body;

    let resolvedCarTitle = carTitle || '';
    let resolvedCarImage = carImage || '';
    let resolvedCarPrice = carPrice || 0;

    // If carId provided but title/image missing, resolve from DB
    if (carId && (!resolvedCarTitle || !resolvedCarImage)) {
      try {
        let carDoc = await Car.findOne({ $or: [{ id: String(carId) }, ...(carId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: carId }] : [])] }).lean();
        if (carDoc) {
          resolvedCarTitle = resolvedCarTitle || carDoc.title || `${carDoc.brand} ${carDoc.model}`;
          resolvedCarImage = resolvedCarImage || (carDoc.images && carDoc.images[0]) || '';
          resolvedCarPrice = resolvedCarPrice || carDoc.price || carDoc.sellingPrice || 0;
        }
      } catch (e) {}
    }

    const newMsgData = {
      senderId: senderId || 'guest',
      senderName: senderName || 'Customer',
      senderRole: senderRole || 'Buyer / Renter',
      recipientId: recipientId || 'admin',
      text: text || '',
      carId: carId || 'general',
      carTitle: resolvedCarTitle || 'Car Inquiry',
      carImage: resolvedCarImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400',
      carPrice: resolvedCarPrice,
      isRead: false,
      seenAt: null,
      timestamp: new Date(),
      isCallNotification: !!isCallNotification,
      callType: callType || 'none'
    };

    let savedMsg = null;
    try {
      const doc = await ChatMessage.create(newMsgData);
      savedMsg = doc.toObject();
    } catch (e) {
      savedMsg = { id: `msg-${Date.now()}`, ...newMsgData };
    }

    inMemoryMessages.push(savedMsg);

    // Create Notification for Recipient
    try {
      const notifRecipient = (recipientId === 'admin' || !recipientId) ? 'admin' : recipientId;
      const notifTitle = isCallNotification 
        ? `📞 Incoming ${callType ? callType.toUpperCase() : ''} Call from ${senderName}`
        : `💬 New Message for ${resolvedCarTitle || 'Car'}`;
      
      const notifMsg = isCallNotification
        ? `${senderName} initiated a ${callType} call regarding ${resolvedCarTitle || 'a vehicle'}.`
        : `${senderName}: ${text.length > 60 ? text.substring(0, 57) + '...' : text}`;

      await Notification.create({
        userId: notifRecipient,
        title: notifTitle,
        message: notifMsg,
        type: isCallNotification ? 'call' : 'chat',
        carId: carId || '',
        actionUrl: '/admin'
      });
    } catch (notifErr) {}

    return res.status(201).json(savedMsg);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { carId, partnerId } = req.query;

    let queryConditions = [];

    if (userId === 'admin') {
      if (partnerId && partnerId !== 'admin') {
        queryConditions.push({
          $or: [
            { senderId: partnerId, recipientId: 'admin' },
            { senderId: 'admin', recipientId: partnerId },
            { senderId: partnerId },
            { recipientId: partnerId }
          ]
        });
      } else {
        queryConditions.push({
          $or: [{ senderId: 'admin' }, { recipientId: 'admin' }, { senderRole: 'Admin' }, { recipientId: /admin/i }]
        });
      }
    } else {
      queryConditions.push({
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ]
      });
    }

    const query = queryConditions.length > 1 ? { $and: queryConditions } : (queryConditions[0] || {});

    if (carId && carId !== 'all') {
      query.carId = carId;
    }

    let dbMessages = [];
    try {
      dbMessages = await ChatMessage.find(query).sort({ timestamp: 1 }).lean();
    } catch (e) {
      dbMessages = [];
    }

    if (dbMessages.length > 0) {
      return res.json(dbMessages);
    }

    // In-memory fallback
    const filtered = inMemoryMessages.filter(m => {
      const userMatch = (userId === 'admin')
        ? (partnerId ? (m.senderId === partnerId || m.recipientId === partnerId) : (m.senderId === 'admin' || m.recipientId === 'admin'))
        : (m.senderId === userId || m.recipientId === userId);
      const carMatch = (carId && carId !== 'all') ? String(m.carId) === String(carId) : true;
      return userMatch && carMatch;
    });

    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markMessagesSeen = async (req, res) => {
  try {
    const { readerId, senderId, carId } = req.body;
    const query = {};

    if (readerId === 'admin') {
      query.recipientId = 'admin';
      if (senderId && senderId !== 'admin') query.senderId = senderId;
    } else if (readerId) {
      query.recipientId = readerId;
      if (senderId) query.senderId = senderId;
    }
    if (carId && carId !== 'all') query.carId = carId;

    try {
      await ChatMessage.updateMany(query, {
        $set: { isRead: true, seenAt: new Date() }
      });
    } catch (e) {}

    // Update in-memory
    inMemoryMessages.forEach(m => {
      let match = true;
      if (readerId === 'admin') {
        if (m.recipientId !== 'admin') match = false;
        if (senderId && senderId !== 'admin' && m.senderId !== senderId) match = false;
      } else {
        if (readerId && m.recipientId !== readerId) match = false;
        if (senderId && m.senderId !== senderId) match = false;
      }
      if (carId && carId !== 'all' && String(m.carId) !== String(carId)) match = false;
      if (match) {
        m.isRead = true;
        m.seenAt = new Date();
      }
    });

    return res.json({ success: true, message: 'Messages marked as seen' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAdminChatThreads = async (req, res) => {
  try {
    let allMessages = [];
    try {
      allMessages = await ChatMessage.find().sort({ timestamp: -1 }).lean();
    } catch (e) {
      allMessages = [];
    }

    if (allMessages.length === 0) {
      allMessages = [...inMemoryMessages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Group messages by carId + customerId
    const threadMap = new Map();

    for (const msg of allMessages) {
      const isCustomerSender = msg.senderRole !== 'Admin';
      const customerId = isCustomerSender ? msg.senderId : msg.recipientId;
      const customerName = isCustomerSender ? msg.senderName : 'Customer';
      const carId = msg.carId || 'general';

      const threadKey = `${carId}_${customerId}`;

      if (!threadMap.has(threadKey)) {
        // Resolve car title and thumbnail if carId is present
        let carTitle = msg.carTitle;
        let carImage = msg.carImage;
        let carPrice = msg.carPrice || 0;

        if (!carTitle || carTitle === 'Car Inquiry' || !carImage) {
          try {
            const carDoc = await Car.findOne({ $or: [{ id: String(carId) }, ...(carId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: carId }] : [])] }).lean();
            if (carDoc) {
              carTitle = carTitle || carDoc.title || `${carDoc.brand} ${carDoc.model}`;
              carImage = carImage || (carDoc.images && carDoc.images[0]) || '';
              carPrice = carPrice || carDoc.price || carDoc.sellingPrice || 0;
            }
          } catch (e) {}
        }

        const unreadCount = (msg.recipientId === 'admin' && !msg.isRead) ? 1 : 0;

        threadMap.set(threadKey, {
          threadId: threadKey,
          carId: carId,
          carTitle: carTitle || (carId === 'general' ? 'General Inquiry' : 'Certified Vehicle'),
          carImage: carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400',
          carPrice: carPrice,
          buyerId: customerId,
          buyerName: customerName,
          buyerRole: isCustomerSender ? msg.senderRole : 'Buyer / Renter',
          lastMessage: msg.text || '',
          lastMessageTime: msg.timestamp,
          lastMessageSenderId: msg.senderId,
          isSeen: msg.isRead || false,
          unreadCount: unreadCount
        });
      } else {
        const existing = threadMap.get(threadKey);
        if (msg.recipientId === 'admin' && !msg.isRead) {
          existing.unreadCount = (existing.unreadCount || 0) + 1;
        }
      }
    }

    const threads = Array.from(threadMap.values()).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    return res.json(threads);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserChatThreads = async (req, res) => {
  try {
    const { userId } = req.params;
    let userMessages = [];

    try {
      userMessages = await ChatMessage.find({
        $or: [{ senderId: userId }, { recipientId: userId }]
      }).sort({ timestamp: -1 }).lean();
    } catch (e) {
      userMessages = [];
    }

    if (userMessages.length === 0) {
      userMessages = inMemoryMessages.filter(m => m.senderId === userId || m.recipientId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Group messages by carId for this specific user
    const threadMap = new Map();

    for (const msg of userMessages) {
      const carId = msg.carId || 'general';
      const threadKey = `${carId}`;

      if (!threadMap.has(threadKey)) {
        let carTitle = msg.carTitle;
        let carImage = msg.carImage;
        let carPrice = msg.carPrice || 0;

        if (!carTitle || carTitle === 'Car Inquiry' || !carImage) {
          try {
            const carDoc = await Car.findOne({ $or: [{ id: String(carId) }, ...(carId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: carId }] : [])] }).lean();
            if (carDoc) {
              carTitle = carTitle || carDoc.title || `${carDoc.brand} ${carDoc.model}`;
              carImage = carImage || (carDoc.images && carDoc.images[0]) || '';
              carPrice = carPrice || carDoc.price || carDoc.sellingPrice || 0;
            }
          } catch (e) {}
        }

        const unreadCount = (msg.recipientId === userId && !msg.isRead) ? 1 : 0;

        threadMap.set(threadKey, {
          threadId: threadKey,
          carId: carId,
          carTitle: carTitle || (carId === 'general' ? 'General Inquiry' : 'Certified Car'),
          carImage: carImage || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400',
          carPrice: carPrice,
          buyerId: userId,
          buyerName: msg.senderId === userId ? msg.senderName : msg.recipientId,
          lastMessage: msg.text || '',
          lastMessageTime: msg.timestamp,
          lastMessageSenderId: msg.senderId,
          isSeen: msg.isRead || false,
          unreadCount: unreadCount
        });
      } else {
        const existing = threadMap.get(threadKey);
        if (msg.recipientId === userId && !msg.isRead) {
          existing.unreadCount = (existing.unreadCount || 0) + 1;
        }
      }
    }

    const threads = Array.from(threadMap.values()).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    return res.json(threads);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, getConversation, markMessagesSeen, getAdminChatThreads, getUserChatThreads };

