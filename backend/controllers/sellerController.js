const Car = require('../models/Car');
const { inMemoryCars, deletedCarIds } = require('./carController');
const { runAIImageInspection, calculateAISellerPriceRecommendation } = require('../utils/aiEngine');

const postCar = async (req, res) => {
  try {
    const { 
      title, 
      brand, 
      model, 
      year, 
      sellerExpectedPrice, 
      kmDriven, 
      mileage,
      condition,
      fuelType, 
      transmission, 
      engineCapacity,
      ownerName,
      noOfOwners,
      address,
      coordinates,
      color, 
      bodyType, 
      location, 
      vin, 
      licensePlate, 
      images, 
      description, 
      sellerId, 
      sellerName,
      sellerPhone
    } = req.body;

    const aiInspection = runAIImageInspection(req.body);

    const newCarData = {
      id: `car-${Date.now()}`,
      title: title || `${brand} ${model} ${year}`,
      brand,
      model,
      year: parseInt(year),
      price: parseInt(sellerExpectedPrice) || 500000,
      sellerExpectedPrice: parseInt(sellerExpectedPrice),
      purchasePriceByAdmin: 0,
      kmDriven: parseInt(kmDriven),
      mileage: parseFloat(mileage) || 16,
      condition: condition || 'Very Good',
      fuelType: fuelType || 'Petrol',
      transmission: transmission || 'Manual',
      engineCapacity: engineCapacity || '1498 cc',
      ownerName: ownerName || sellerName || 'Seller User',
      noOfOwners: noOfOwners || '1st Owner',
      address: address || 'Chennai, Tamil Nadu',
      coordinates: coordinates || { lat: 13.0827, lng: 80.2707 },
      color: color || 'White',
      bodyType: bodyType || 'SUV',
      location: location || 'Chennai',
      distanceKm: Math.floor(Math.random() * 20) + 5,
      vin: vin || `VIN${Date.now()}`,
      licensePlate: licensePlate || 'TN 09 AB 1234',
      images: images && images.length ? images : [],
      description: description || 'Owner submitted vehicle pending admin verification.',
      status: 'seller_posted', // Hidden from buyers and renters!
      targetMarket: 'none',
      sellerId: sellerId || 'seller1',
      sellerName: ownerName || sellerName || 'Seller User',
      sellerPhone: sellerPhone || '+91 9876543210',
      aiInspection
    };

    try {
      const carDoc = await Car.create(newCarData);
      inMemoryCars.unshift(carDoc.toObject());
    } catch (e) {
      console.warn('[CarHub DB PostCar Fallback]', e.message);
      inMemoryCars.unshift(newCarData);
    }

    return res.status(201).json({
      message: 'Vehicle submitted successfully! CarHub Admin will inspect and make a fair offer soon.',
      car: newCarData
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSellerCars = async (req, res) => {
  try {
    const { sellerId } = req.params;
    let cars = [];
    try {
      cars = await Car.find({ sellerId });
    } catch (e) {
      cars = inMemoryCars.filter(c => c.sellerId === sellerId || c.sellerId === 'seller1');
    }
    const filtered = cars.filter(c => !deletedCarIds.has(String(c.id)) && !deletedCarIds.has(String(c._id)));
    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAISellerPriceEstimate = async (req, res) => {
  try {
    const recommendation = calculateAISellerPriceRecommendation(req.body);
    return res.json(recommendation);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSellerCar = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    deletedCarIds.add(String(id));

    // Permanently delete from MongoDB
    try {
      const conditions = [{ id: String(id) }];
      if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id)) {
        conditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      await Car.deleteMany({ $or: conditions });
    } catch (e) {
      console.warn('[CarHub DB DeleteSellerCar Error]:', e.message);
    }

    // Permanently purge from in-memory fallback list
    for (let i = inMemoryCars.length - 1; i >= 0; i--) {
      const c = inMemoryCars[i];
      if (String(c.id) === String(id) || String(c._id) === String(id)) {
        inMemoryCars.splice(i, 1);
      }
    }

    return res.json({ 
      success: true, 
      message: 'Vehicle listing permanently deleted from database.', 
      id 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { postCar, getSellerCars, getAISellerPriceEstimate, deleteSellerCar };
