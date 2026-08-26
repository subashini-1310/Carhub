const mongoose = require('mongoose');

const rentalBookingSchema = new mongoose.Schema({
  carId: { type: String, required: true },
  carTitle: { type: String, required: true },
  carImage: { type: String, default: '' },
  renterId: { type: String, required: true },
  renterName: { type: String, required: true },
  renterEmail: { type: String, default: '' },
  renterPhone: { type: String, default: '' },
  pickupLocation: { type: String, default: 'CarHub Central Hub' },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  days: { type: Number, required: true },
  dailyRate: { type: Number, default: 0 },
  totalCost: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RentalBooking', rentalBookingSchema);
