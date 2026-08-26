const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS servers to resolve MongoDB Atlas SRV records reliably
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const connectDB = async () => {
  const connStr = process.env.MONGO_URI || 'mongodb://subashinisakthivel2020_db_user:iGsTZBMLo3cdOaTu@ac-5m2ilhz-shard-00-00.yl3ywei.mongodb.net:27017,ac-5m2ilhz-shard-00-01.yl3ywei.mongodb.net:27017,ac-5m2ilhz-shard-00-02.yl3ywei.mongodb.net:27017/carhub?ssl=true&replicaSet=atlas-j5cbg6-shard-0&authSource=admin&retryWrites=true&w=majority';

  // Listen to connection events
  mongoose.connection.on('connected', () => {
    console.log(`[CarHub DB] MongoDB Connection Active: ${connStr.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[CarHub DB Error] ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[CarHub DB Warning] MongoDB disconnected. Reconnection will be attempted on next request.');
  });

  try {
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[CarHub DB] MongoDB Connected Successfully: ${conn.connection.host}`);

    // Seed database if empty
    try {
      const Car = require('../models/Car');
      const User = require('../models/User');
      const seedCars = require('../utils/seedData');
      const bcrypt = require('bcryptjs');

      const carCount = await Car.countDocuments();
      if (carCount === 0) {
        console.log('[CarHub DB] Seeding initial car inventory...');
        await Car.insertMany(seedCars);
        console.log(`[CarHub DB] Successfully seeded ${seedCars.length} cars into MongoDB.`);
      }

      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[CarHub DB] Seeding default demo accounts...');
        const defaultHash = await bcrypt.hash('password123', 10);
        await User.insertMany([
          { name: 'CarHub Admin', email: 'admin@carhub.com', password: defaultHash, role: 'Admin', city: 'Chennai', phone: '+91 9876543210' },
          { name: 'Rahul Customer', email: 'buyer@gmail.com', password: defaultHash, role: 'Buyer / Renter', city: 'Chennai', phone: '+91 9876543211' },
          { name: 'Ramesh Seller', email: 'seller@gmail.com', password: defaultHash, role: 'Seller', city: 'Chennai', phone: '+91 9876543212' },
          { name: 'Priya Renter', email: 'renter@gmail.com', password: defaultHash, role: 'Buyer / Renter', city: 'Chennai', phone: '+91 9876543213' }
        ]);
        console.log('[CarHub DB] Default demo accounts seeded.');
      }
    } catch (seedErr) {
      console.warn('[CarHub DB Seed Notice]', seedErr.message);
    }
  } catch (error) {
    console.warn(`[CarHub DB Warning] MongoDB initial connection failed: ${error.message}.`);
  }
};

module.exports = connectDB;
