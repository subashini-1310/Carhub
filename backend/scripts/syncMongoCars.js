const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Car = require('../models/Car');
const seedCars = require('../utils/seedData');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[CarHub MongoDB] Connected to Atlas successfully.');

    for (const car of seedCars) {
      await Car.findOneAndUpdate(
        { id: car.id },
        { $set: car },
        { upsert: true, new: true }
      );
    }

    const count = await Car.countDocuments();
    const published = await Car.countDocuments({ status: { $in: ['for_sale', 'sale_and_rent'] } });
    const sellerPosted = await Car.countDocuments({ status: 'seller_posted' });

    console.log(`[CarHub MongoDB] Total Cars in DB: ${count}`);
    console.log(`[CarHub MongoDB] Published Cars for Buyers: ${published}`);
    console.log(`[CarHub MongoDB] Seller Pending Cars: ${sellerPosted}`);
    process.exit(0);
  } catch (err) {
    console.error('[CarHub MongoDB Error]:', err);
    process.exit(1);
  }
}

seed();
