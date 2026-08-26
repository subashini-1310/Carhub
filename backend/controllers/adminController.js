const Car = require('../models/Car');
const { inMemoryCars, deletedCarIds } = require('./carController');
const { runAIImageInspection } = require('../utils/aiEngine');
const User = require('../models/User');

const getPendingInspections = async (req, res) => {
  try {
    let mongoCars = [];
    try {
      mongoCars = await Car.find({ status: 'seller_posted' }).lean();
    } catch (e) {}

    // Merge: MongoDB wins for records it knows; in-memory fills the rest
    const mongoIds = new Set(mongoCars.map(c => String(c._id)));
    const memPending = inMemoryCars.filter(c =>
      c.status === 'seller_posted' &&
      !mongoIds.has(String(c._id)) &&
      !mongoIds.has(String(c.id))
    );

    const merged = [...mongoCars, ...memPending].filter(c =>
      !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id))
    );

    return res.json(merged);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllCarsForAdmin = async (req, res) => {
  try {
    let mongoCars = [];
    try {
      mongoCars = await Car.find().lean();
    } catch (e) {}

    // Build a set of IDs already in Mongo
    const mongoIds = new Set();
    mongoCars.forEach(c => {
      mongoIds.add(String(c._id));
      if (c.id) mongoIds.add(String(c.id));
    });

    // Include in-memory cars that Mongo doesn't know about (offline-created)
    const memOnly = inMemoryCars.filter(c =>
      !mongoIds.has(String(c._id)) && !mongoIds.has(String(c.id))
    );

    const merged = [...mongoCars, ...memOnly].filter(c =>
      !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id))
    );

    return res.json(merged);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const runAIInspectionScan = async (req, res) => {
  try {
    const { id } = req.params;

    const aiInspection = runAIImageInspection({});

    // Try MongoDB first (by _id or custom id field)
    let updatedCar = null;
    try {
      updatedCar = await Car.findOneAndUpdate(
        { $or: [{ _id: id }, { id }] },
        { $set: { status: 'admin_inspected', aiInspection } },
        { new: true }
      ).lean();
    } catch (e) {}

    // Also sync inMemoryCars
    const memIdx = inMemoryCars.findIndex(c => String(c.id) === id || String(c._id) === id);
    if (memIdx !== -1) {
      inMemoryCars[memIdx].aiInspection = aiInspection;
      inMemoryCars[memIdx].status = 'admin_inspected';
      if (!updatedCar) updatedCar = inMemoryCars[memIdx];
    }

    if (!updatedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }

    return res.json({
      message: 'AI Inspection scan completed! Damage score: ' + aiInspection.damageScore + '/100',
      aiInspection,
      car: updatedCar
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const purchaseAndPublishCar = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    const {
      purchasePriceByAdmin, sellingPrice, rentalPricePerDay, targetMarket,
      title, brand, model, year, kmDriven, fuelType, transmission, color, description,
      engineCapacity, noOfOwners, licensePlate, vin, location, address,
      additionalInfo, features
    } = req.body;

    // ── Determine new status ───────────────────────────────────────────────────
    let newStatus;
    if (targetMarket === 'buyer')  newStatus = 'for_sale';
    else if (targetMarket === 'renter') newStatus = 'for_rent';
    else if (targetMarket === 'both')   newStatus = 'sale_and_rent';
    else newStatus = 'admin_purchased';

    const updateFields = {
      status: newStatus,
      targetMarket: targetMarket || 'buyer',
      purchasePriceByAdmin: parseInt(purchasePriceByAdmin) || 0,
      ...(sellingPrice     && { price: parseInt(sellingPrice) }),
      ...(rentalPricePerDay && { rentalPricePerDay: parseInt(rentalPricePerDay) }),
      ...(title            && { title }),
      ...(brand            && { brand }),
      ...(model            && { model }),
      ...(year             && { year: parseInt(year) }),
      ...(kmDriven         && { kmDriven: parseInt(kmDriven) }),
      ...(fuelType         && { fuelType }),
      ...(transmission     && { transmission }),
      ...(color            && { color }),
      ...(description      && { description }),
      ...(engineCapacity   && { engineCapacity }),
      ...(noOfOwners       && { noOfOwners }),
      ...(licensePlate     && { licensePlate }),
      ...(vin              && { vin }),
      ...(location         && { location }),
      ...(address          && { address }),
      ...(additionalInfo   && { additionalInfo }),
      ...(features         && { features })
    };

    // ── Check for price reduction to generate Price Drop Notification ─────────
    let existingCar = null;
    try {
      const conditions = [{ id: String(id) }];
      if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
        conditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      existingCar = await Car.findOne({ $or: conditions }).lean();
    } catch (e) {}

    if (!existingCar) {
      existingCar = inMemoryCars.find(c => String(c.id) === id || String(c._id) === id);
    }

    const newSellingPrice = parseInt(sellingPrice);
    if (newSellingPrice && existingCar && existingCar.price && newSellingPrice < existingCar.price) {
      updateFields.priceDrop = true;
      updateFields.originalPrice = existingCar.originalPrice || existingCar.price;
      
      // Store Price Drop Notification in MongoDB
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: 'all',
          title: '🔔 Price Drop Alert',
          message: `Price dropped for ${existingCar.title || updateFields.title || 'Vehicle'} from ₹${existingCar.price.toLocaleString()} to ₹${newSellingPrice.toLocaleString()}!`,
          type: 'price_drop',
          carId: String(id),
          actionUrl: '/buyer'
        });
        console.log(`[CarHub Notification] Price drop notification created for ${existingCar.title} in MongoDB.`);
      } catch (notifErr) {
        console.warn('[CarHub Price Drop Notification Notice]:', notifErr.message);
      }
    }

    // ── 1. Try to update in MongoDB (handles both _id and custom id field safely) ────
    let updatedCar = null;
    try {
      const conditions = [{ id: String(id) }];
      if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
        conditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      updatedCar = await Car.findOneAndUpdate(
        { $or: conditions },
        { $set: updateFields },
        { new: true, runValidators: true }
      ).lean();
    } catch (e) {
      console.warn('[CarHub Admin Purchase Warning]:', e.message);
    }

    // ── 2. Always sync inMemoryCars (source for in-memory fallback) ────────────
    const memIdx = inMemoryCars.findIndex(c => String(c.id) === id || String(c._id) === id);
    if (memIdx !== -1) {
      inMemoryCars[memIdx] = { ...inMemoryCars[memIdx], ...updateFields };
      if (!updatedCar) updatedCar = inMemoryCars[memIdx];
    }

    // ── 3. If neither source found the car ────────────────────────────────────
    if (!updatedCar) {
      return res.status(404).json({ message: `Car with id "${id}" not found in database or memory.` });
    }

    const destLabel = targetMarket === 'buyer'  ? 'Buyer Marketplace'
                    : targetMarket === 'renter' ? 'Rental Fleet'
                    : 'Buyer Marketplace & Rental Fleet';

    return res.json({
      message: `Car successfully purchased for ₹${(updateFields.purchasePriceByAdmin || 0).toLocaleString()} and published to ${destLabel}!`,
      car: updatedCar
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateCarByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    const updatePayload = { ...req.body };

    // Check for price reduction
    let existingCar = null;
    try {
      const conditions = [{ id: String(id) }];
      if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
        conditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      existingCar = await Car.findOne({ $or: conditions }).lean();
    } catch (e) {}

    if (!existingCar) {
      existingCar = inMemoryCars.find(c => String(c.id) === id || String(c._id) === id);
    }

    const newPrice = parseInt(updatePayload.price);
    if (newPrice && existingCar && existingCar.price && newPrice < existingCar.price) {
      updatePayload.priceDrop = true;
      updatePayload.originalPrice = existingCar.originalPrice || existingCar.price;

      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: 'all',
          title: '🔔 Price Drop Alert',
          message: `Price dropped for ${existingCar.title || 'Vehicle'} from ₹${existingCar.price.toLocaleString()} to ₹${newPrice.toLocaleString()}!`,
          type: 'price_drop',
          carId: String(id),
          actionUrl: '/buyer'
        });
        console.log(`[CarHub Notification] Price drop notification created for ${existingCar.title} in MongoDB.`);
      } catch (notifErr) {
        console.warn('[CarHub Price Drop Notification Notice]:', notifErr.message);
      }
    }

    let updatedCar = null;
    try {
      const conditions = [{ id: String(id) }];
      if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
        conditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      updatedCar = await Car.findOneAndUpdate(
        { $or: conditions },
        { $set: updatePayload },
        { new: true }
      ).lean();
    } catch (e) {
      console.warn('[CarHub Admin Update Warning]:', e.message);
    }

    const memIdx = inMemoryCars.findIndex(c => String(c.id) === id || String(c._id) === id);
    if (memIdx !== -1) {
      inMemoryCars[memIdx] = { ...inMemoryCars[memIdx], ...updatePayload };
      if (!updatedCar) updatedCar = inMemoryCars[memIdx];
    }

    if (!updatedCar) return res.status(404).json({ message: 'Car not found' });
    return res.json({ message: 'Car updated successfully', car: updatedCar });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getReportsAndStats = async (req, res) => {
  try {
    // Combine MongoDB + inMemoryCars for accurate reporting
    let allCars = [];
    try {
      const mongoCars = await Car.find().lean();
      const mongoIds = new Set();
      mongoCars.forEach(c => {
        mongoIds.add(String(c._id));
        if (c.id) mongoIds.add(String(c.id));
      });
      const memOnly = inMemoryCars.filter(c =>
        !mongoIds.has(String(c._id)) && !mongoIds.has(String(c.id))
      );
      allCars = [...mongoCars, ...memOnly];
    } catch (e) {
      allCars = [...inMemoryCars];
    }

    const totalCars        = allCars.filter(c => !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id))).length;
    const activeCars       = allCars.filter(c => !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id)));
    const pendingCount     = activeCars.filter(c => c.status === 'seller_posted' || c.status === 'admin_inspected').length;
    const purchasedCount   = activeCars.filter(c => c.purchasePriceByAdmin > 0).length;
    const forSaleCount     = activeCars.filter(c => c.status === 'for_sale'  || c.status === 'sale_and_rent').length;
    const forRentCount     = activeCars.filter(c => c.status === 'for_rent'  || c.status === 'sale_and_rent').length;
    const totalCapitalSpent    = activeCars.reduce((acc, c) => acc + (c.purchasePriceByAdmin || 0), 0);
    const totalInventoryValue  = activeCars.reduce((acc, c) => acc + (c.price || 0), 0);

    return res.json({
      totalCars, pendingCount, purchasedCount, forSaleCount, forRentCount,
      totalCapitalSpent, totalInventoryValue
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteCarByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    deletedCarIds.add(String(id));

    // Delete permanently from MongoDB
    try {
      const conditions = [{ id: String(id) }];
      if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
        conditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      await Car.deleteMany({ $or: conditions });
    } catch (e) {
      console.warn('[CarHub Admin DB Delete Warning]:', e.message);
    }

    // Delete permanently from inMemoryCars
    for (let i = inMemoryCars.length - 1; i >= 0; i--) {
      const c = inMemoryCars[i];
      if (String(c.id) === String(id) || String(c._id) === String(id)) {
        inMemoryCars.splice(i, 1);
      }
    }

    return res.json({ 
      success: true, 
      message: `Car with ID "${id}" was permanently deleted from database.`, 
      id 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    let users = [];
    try {
      users = await User.find({}, '-password').lean();
    } catch (e) {
      users = [];
    }

    if (!users || users.length === 0) {
      // Return default seed users if MongoDB is empty
      users = [
        { id: 'usr-admin', name: 'CarHub Admin', email: 'admin@carhub.com', role: 'Admin', city: 'Chennai', phone: '+91 9876543210', createdAt: new Date() },
        { id: 'usr-buyer', name: 'Rahul Customer', email: 'buyer@gmail.com', role: 'Buyer / Renter', city: 'Chennai', phone: '+91 9876543211', createdAt: new Date() },
        { id: 'usr-seller', name: 'Ramesh Seller', email: 'seller@gmail.com', role: 'Seller', city: 'Chennai', phone: '+91 9876543212', createdAt: new Date() },
        { id: 'usr-renter', name: 'Priya Renter', email: 'renter@gmail.com', role: 'Buyer / Renter', city: 'Chennai', phone: '+91 9876543213', createdAt: new Date() }
      ];
    }
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await User.findOneAndDelete({ $or: [{ _id: id }, { id }] });
    } catch (e) {}

    return res.json({ message: `User account "${id}" deleted successfully.` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingInspections,
  getAllCarsForAdmin,
  runAIInspectionScan,
  purchaseAndPublishCar,
  updateCarByAdmin,
  getReportsAndStats,
  getAdminUsers,
  deleteCarByAdmin,
  deleteUserByAdmin
};
