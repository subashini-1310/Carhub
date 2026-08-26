const Notification = require('../models/Notification');
const User = require('../models/User');

let inMemoryNotifications = [
  {
    id: 'notif-1',
    userId: 'usr-buyer',
    title: 'Welcome to CarHub! 🚗',
    message: 'Browse certified cars, rent a vehicle, or post yours for inspection.',
    type: 'info',
    isRead: false,
    createdAt: new Date()
  }
];

const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    let list = [];
    try {
      list = await Notification.find({ 
        $or: [{ userId }, { userId: 'all' }, { userId: 'usr-buyer' }] 
      }).sort({ createdAt: -1 }).limit(30).lean();
    } catch (e) {
      list = [];
    }

    if (list.length === 0) {
      list = inMemoryNotifications.filter(n => n.userId === userId || n.userId === 'all');
    }

    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, carId, actionUrl } = req.body;

    const notifData = {
      id: `notif-${Date.now()}`,
      userId: userId || 'all',
      title: title || 'Notification',
      message: message || '',
      type: type || 'info',
      carId: carId || '',
      actionUrl: actionUrl || '',
      isRead: false,
      createdAt: new Date()
    };

    let doc = null;
    try {
      doc = await Notification.create(notifData);
      doc = doc.toObject();
    } catch (e) {
      doc = notifData;
    }

    inMemoryNotifications.unshift(doc);
    return res.status(201).json(doc);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await Notification.findOneAndUpdate({ $or: [{ _id: id }, { id }] }, { $set: { isRead: true } });
    } catch (e) {}

    const memItem = inMemoryNotifications.find(n => String(n.id) === id || String(n._id) === id);
    if (memItem) memItem.isRead = true;

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const triggerPriceDropAlert = async (req, res) => {
  try {
    const { carId, carTitle, oldPrice, newPrice } = req.body;

    // Find users who have wishlisted this car
    let wishlistedUsers = [];
    try {
      wishlistedUsers = await User.find({ wishlist: carId }).lean();
    } catch (e) {}

    const priceDiff = Math.max(0, (oldPrice || 0) - (newPrice || 0));
    const title = `🔥 Price Drop Alert: ${carTitle || 'A Wishlisted Car'}!`;
    const message = `Price reduced by ₹${priceDiff.toLocaleString()}! New offer price: ₹${(newPrice || 0).toLocaleString()}. Don't miss this deal!`;

    const createdAlerts = [];
    for (const u of wishlistedUsers) {
      try {
        const notif = await Notification.create({
          userId: String(u._id || u.id),
          title,
          message,
          type: 'price_drop',
          carId,
          actionUrl: '/buyer'
        });
        createdAlerts.push(notif);
      } catch (e) {}
    }

    // Also broadcast to public/all
    const publicNotif = {
      id: `notif-${Date.now()}`,
      userId: 'all',
      title,
      message,
      type: 'price_drop',
      carId,
      actionUrl: '/buyer',
      isRead: false,
      createdAt: new Date()
    };
    inMemoryNotifications.unshift(publicNotif);

    return res.json({
      message: `Price drop alerts sent to ${wishlistedUsers.length} interested buyers.`,
      alertsCreated: createdAlerts.length
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserNotifications,
  createNotification,
  markAsRead,
  triggerPriceDropAlert
};
