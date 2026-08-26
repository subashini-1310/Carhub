const Car = require('../models/Car');
const seedCars = require('../utils/seedData');
const { generateAIChatbotResponse } = require('../utils/aiEngine');

let inMemoryCars = [...seedCars];
const deletedCarIds = new Set();

// Helper for matching buyer eligibility
const isBuyerCar = (c) => {
  const s = c.status;
  const tm = c.targetMarket;
  return s === 'for_sale' || s === 'sale_and_rent' || s === 'both' || tm === 'buyer' || tm === 'both';
};

// Helper for matching renter eligibility
const isRenterCar = (c) => {
  const s = c.status;
  const tm = c.targetMarket;
  return s === 'for_rent' || s === 'sale_and_rent' || s === 'both' || tm === 'renter' || tm === 'both';
};

const getCarsForBuyer = async (req, res) => {
  try {
    let mongoCars = [];
    try {
      mongoCars = await Car.find({
        status: { $in: ['for_sale', 'sale_and_rent'] },
        targetMarket: { $in: ['buyer', 'both'] }
      }).lean();
    } catch (e) {}

    const mongoIds = new Set();
    mongoCars.forEach(c => {
      mongoIds.add(String(c._id));
      if (c.id) mongoIds.add(String(c.id));
    });

    const memCars = inMemoryCars.filter(c => 
      (c.status === 'for_sale' || c.status === 'sale_and_rent') && 
      (c.targetMarket === 'buyer' || c.targetMarket === 'both') && 
      !mongoIds.has(String(c._id)) && 
      !mongoIds.has(String(c.id))
    );

    const merged = [...mongoCars, ...memCars].filter(c => 
      !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id))
    );

    return res.json(merged);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCarsForRenter = async (req, res) => {
  try {
    let mongoCars = [];
    try {
      mongoCars = await Car.find({
        status: { $in: ['for_rent', 'sale_and_rent'] },
        targetMarket: { $in: ['renter', 'both'] }
      }).lean();
    } catch (e) {}

    const mongoIds = new Set();
    mongoCars.forEach(c => {
      mongoIds.add(String(c._id));
      if (c.id) mongoIds.add(String(c.id));
    });

    const memCars = inMemoryCars.filter(c => 
      (c.status === 'for_rent' || c.status === 'sale_and_rent') && 
      (c.targetMarket === 'renter' || c.targetMarket === 'both') && 
      !mongoIds.has(String(c._id)) && 
      !mongoIds.has(String(c.id))
    );

    const merged = [...mongoCars, ...memCars].filter(c => 
      !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id))
    );

    return res.json(merged);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    if (deletedCarIds.has(String(id))) {
      return res.status(404).json({ message: 'Car not found' });
    }

    let car = null;
    try {
      car = await Car.findOne({ $or: [{ _id: id }, { id }] }).lean();
    } catch (e) {}

    if (!car) {
      car = inMemoryCars.find(c => String(c.id) === id || String(c._id) === id);
    }

    if (!car || deletedCarIds.has(String(car.id)) || deletedCarIds.has(String(car._id))) {
      return res.status(404).json({ message: 'Car not found' });
    }
    return res.json(car);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const askAIChatbot = async (req, res) => {
  try {
    const { message } = req.body;
    let activeCars = [];
    try {
      const dbCars = await Car.find({ status: { $in: ['for_sale', 'for_rent', 'sale_and_rent', 'seller_posted'] } }).lean();
      if (dbCars && dbCars.length > 0) {
        activeCars = dbCars.filter(c => !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id)));
      }
    } catch (e) {}

    if (activeCars.length === 0) {
      activeCars = inMemoryCars.filter(c => !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id)));
    }

    const aiRes = generateAIChatbotResponse(message, activeCars);
    return res.json(aiRes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteCar = async (req, res) => {
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
      console.warn('[CarHub DB Delete Warning]:', e.message);
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

module.exports = {
  getCarsForBuyer,
  getCarsForRenter,
  getCarById,
  deleteCar,
  askAIChatbot,
  inMemoryCars,
  deletedCarIds
};
