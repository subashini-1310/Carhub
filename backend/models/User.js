const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['Buyer / Renter', 'Buyer', 'Seller', 'Renter', 'Admin'], 
    default: 'Buyer / Renter' 
  },
  phone: { type: String, default: '+91 9876543210' },
  city: { type: String, default: 'Chennai' },
  avatar: { type: String, default: '' },
  googleId: { type: String, default: '' },
  authProvider: { type: String, default: 'local' }, // 'local', 'google'
  wishlist: [{ type: String }], // Car IDs
  savedSearches: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
