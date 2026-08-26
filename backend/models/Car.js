const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  id: { type: String }, // Custom string identifier (e.g. car-12345678)
  title: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true }, // Selling price set by Admin
  rentalPricePerDay: { type: Number, default: 0 },
  sellerExpectedPrice: { type: Number, default: 0 },
  purchasePriceByAdmin: { type: Number, default: 0 }, // Price paid to seller by admin
  kmDriven: { type: Number, required: true },
  fuelType: { type: String, required: true }, // Petrol, Diesel, EV, CNG
  transmission: { type: String, required: true }, // Manual, Automatic
  color: { type: String, required: true },
  bodyType: { type: String, default: 'SUV' }, // SUV, Sedan, Hatchback, MUV
  location: { type: String, default: 'Chennai' },
  distanceKm: { type: Number, default: 12 }, // Distance from user
  vin: { type: String, required: true },
  licensePlate: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String, default: '' },
  
  // Status pipeline
  // seller_posted -> admin_inspected -> admin_purchased -> for_sale / for_rent / sale_and_rent -> sold / rented
  status: { 
    type: String, 
    default: 'seller_posted',
    enum: ['seller_posted', 'admin_inspected', 'admin_purchased', 'for_sale', 'for_rent', 'sale_and_rent', 'sold', 'rented']
  },
  targetMarket: { 
    type: String, 
    enum: ['buyer', 'renter', 'both', 'none'],
    default: 'none'
  },
  
  sellerId: { type: String, default: 'seller1' },
  sellerName: { type: String, default: 'John Seller' },
  sellerPhone: { type: String, default: '+91 9876543210' },

  // AI Inspection Data
  aiInspection: {
    damageScore: { type: Number, default: 95 }, // 100 = flawless
    blurPassed: { type: Boolean, default: true },
    ocrPlateDetected: { type: String, default: '' },
    detectedColor: { type: String, default: '' },
    estimatedMarketValue: { type: Number, default: 0 },
    damagePoints: [{ x: Number, y: Number, label: String, severity: String }]
  },

  engineCapacity: { type: String, default: '' }, // e.g. 1498 cc
  ownerName: { type: String, default: '' },
  noOfOwners: { type: String, default: '1st Owner' },
  address: { type: String, default: '' },
  coordinates: {
    lat: { type: Number, default: 13.0827 },
    lng: { type: Number, default: 80.2707 }
  },
  condition: { type: String, default: 'Very Good' },
  mileage: { type: Number, default: 16 },

  additionalInfo: {
    abs: { type: String, default: 'Yes' },
    adjustableSteering: { type: String, default: 'Yes' },
    alloyWheels: { type: String, default: 'Yes' },
    antiTheftDevice: { type: String, default: 'Yes' },
    auxCompatibility: { type: String, default: 'Yes' },
    bluetooth: { type: String, default: 'Yes' },
    cruiseControl: { type: String, default: 'Yes' },
    insuranceType: { type: String, default: 'Comprehensive' },
    makeMonth: { type: String, default: 'April' },
    navigationSystem: { type: String, default: 'Yes' },
    parkingSensors: { type: String, default: 'Yes' },
    powerSteering: { type: String, default: 'Yes' },
    amFmRadio: { type: String, default: 'Yes' },
    rearParkingCamera: { type: String, default: 'Yes' },
    registrationPlace: { type: String, default: 'TN' },
    exchange: { type: String, default: 'Yes' },
    finance: { type: String, default: 'Yes' },
    sunroof: { type: String, default: 'Yes' },
    usbCompatibility: { type: String, default: 'Yes' }
  },

  features: [{ type: String }],
  rating: { type: Number, default: 4.8 },
  priceDrop: { type: Boolean, default: false },
  originalPrice: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Car', carSchema);
