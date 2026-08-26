const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const Car = require('../models/Car');

let inMemoryBookings = [];

const bookCar = async (req, res) => {
  try {
    const { 
      carId, 
      carTitle, 
      carImage,
      renterId, 
      renterName, 
      renterEmail,
      renterPhone,
      pickupLocation,
      startDate, 
      endDate, 
      days, 
      dailyRate,
      totalCost 
    } = req.body;

    let finalCarTitle = carTitle;
    let finalCarImage = carImage;
    let finalLocation = pickupLocation;
    let finalDailyRate = Number(dailyRate || 0);

    // Resolve car details if needed
    if (carId && (!finalCarImage || !finalCarTitle)) {
      try {
        const carDoc = await Car.findOne({ 
          $or: [
            { id: String(carId) },
            ...(mongoose.Types.ObjectId.isValid(carId) ? [{ _id: carId }] : [])
          ]
        }).lean();

        if (carDoc) {
          finalCarTitle = finalCarTitle || carDoc.title || `${carDoc.brand} ${carDoc.model}`;
          finalCarImage = finalCarImage || (carDoc.images && carDoc.images[0]) || '';
          finalLocation = finalLocation || carDoc.location || 'CarHub Central Hub';
          finalDailyRate = finalDailyRate || carDoc.rentalPricePerDay || carDoc.rentalRate || 0;
        }
      } catch (e) {}
    }

    const calculatedDays = parseInt(days) || 1;
    const calculatedTotal = parseInt(totalCost) || (calculatedDays * (finalDailyRate || 2500));

    let dbBooking = null;
    try {
      dbBooking = await RentalBooking.create({
        carId: String(carId),
        carTitle: finalCarTitle || 'Rental Vehicle',
        carImage: finalCarImage || '',
        renterId: String(renterId || 'usr-renter'),
        renterName: renterName || 'Customer',
        renterEmail: renterEmail || (renterId && renterId.includes('@') ? renterId : ''),
        renterPhone: renterPhone || '',
        pickupLocation: finalLocation || 'CarHub Central Hub',
        startDate,
        endDate,
        days: calculatedDays,
        dailyRate: finalDailyRate,
        totalCost: calculatedTotal,
        status: 'pending'
      });
    } catch (e) {
      console.error('Error creating RentalBooking in MongoDB:', e);
    }

    const newBooking = {
      id: dbBooking ? dbBooking._id.toString() : `book-${Date.now()}`,
      carId: String(carId),
      carTitle: finalCarTitle || 'Rental Vehicle',
      carImage: finalCarImage || '',
      renterId: String(renterId || 'usr-renter'),
      renterName: renterName || 'Customer',
      renterEmail: renterEmail || (renterId && renterId.includes('@') ? renterId : ''),
      renterPhone: renterPhone || '',
      pickupLocation: finalLocation || 'CarHub Central Hub',
      startDate,
      endDate,
      days: calculatedDays,
      dailyRate: finalDailyRate,
      totalCost: calculatedTotal,
      status: 'pending',
      createdAt: new Date()
    };

    inMemoryBookings.unshift(newBooking);

    return res.status(201).json({
      message: 'Rental booking requested successfully! Admin will confirm your pickup slot.',
      booking: dbBooking || newBooking
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getRenterBookings = async (req, res) => {
  try {
    const { renterId } = req.params;
    let mongoBookings = [];
    try {
      const conditions = [{ renterId: renterId }];
      if (renterId && renterId.includes('@')) {
        conditions.push({ renterEmail: renterId });
      }
      mongoBookings = await RentalBooking.find({ $or: conditions }).sort({ createdAt: -1 }).lean();
    } catch (e) {
      mongoBookings = [];
    }

    const mongoIds = new Set(mongoBookings.map(b => String(b._id)));
    const memBookings = inMemoryBookings.filter(b => 
      (b.renterId === renterId || (renterId && b.renterEmail === renterId)) &&
      !mongoIds.has(String(b.id)) && !mongoIds.has(String(b._id))
    );

    return res.json([...mongoBookings, ...memBookings]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllBookingsForAdmin = async (req, res) => {
  try {
    let mongoBookings = [];
    try {
      mongoBookings = await RentalBooking.find().sort({ createdAt: -1 }).lean();
    } catch (e) {
      mongoBookings = [];
    }

    const mongoIds = new Set(mongoBookings.map(b => String(b._id)));
    const memBookings = inMemoryBookings.filter(b =>
      !mongoIds.has(String(b.id)) && !mongoIds.has(String(b._id))
    );

    return res.json([...mongoBookings, ...memBookings]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed' or 'rejected' or 'completed' or 'cancelled'

    if (!['confirmed', 'rejected', 'completed', 'cancelled', 'pending'].includes((status || '').toLowerCase())) {
      return res.status(400).json({ message: 'Invalid booking status.' });
    }

    const normStatus = status.toLowerCase();

    // 1. MongoDB update
    let updatedDb = null;
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        updatedDb = await RentalBooking.findByIdAndUpdate(
          id,
          { status: normStatus },
          { new: true }
        ).lean();
      } else {
        updatedDb = await RentalBooking.findOneAndUpdate(
          { $or: [{ id: id }, { _id: id }] },
          { status: normStatus },
          { new: true }
        ).lean();
      }
    } catch (e) {}

    // 2. In-memory update
    const idx = inMemoryBookings.findIndex(b => String(b.id) === String(id) || String(b._id) === String(id));
    if (idx !== -1) {
      inMemoryBookings[idx].status = normStatus;
      if (!updatedDb) updatedDb = inMemoryBookings[idx];
    }

    // 3. Fleet availability management: Update car availability
    const targetCarId = updatedDb ? updatedDb.carId : null;
    if (targetCarId) {
      const isRented = (normStatus === 'confirmed');
      try {
        if (mongoose.Types.ObjectId.isValid(targetCarId)) {
          await Car.findByIdAndUpdate(targetCarId, {
            rentalStatus: isRented ? 'RENTED' : 'AVAILABLE',
            isAvailable: !isRented
          });
        } else {
          await Car.findOneAndUpdate(
            { $or: [{ id: targetCarId }, { _id: targetCarId }] },
            {
              rentalStatus: isRented ? 'RENTED' : 'AVAILABLE',
              isAvailable: !isRented
            }
          );
        }
      } catch (e) {}

      // Sync in-memory cars
      try {
        const { inMemoryCars } = require('./carController');
        if (inMemoryCars && Array.isArray(inMemoryCars)) {
          const targetCar = inMemoryCars.find(c => String(c.id) === String(targetCarId) || String(c._id) === String(targetCarId));
          if (targetCar) {
            targetCar.rentalStatus = isRented ? 'RENTED' : 'AVAILABLE';
            targetCar.isAvailable = !isRented;
          }
        }
      } catch (e) {}
    }

    return res.json({
      message: `Rental booking successfully updated to ${normStatus.toUpperCase()}!`,
      booking: updatedDb || { id, status: normStatus }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { bookCar, getRenterBookings, getAllBookingsForAdmin, updateBookingStatus, inMemoryBookings };
