// AI Analysis & Recommendation Algorithms for CarHub

/**
 * AI Image Inspector: Simulates deep computer vision analysis on vehicle photos
 */
function runAIImageInspection(carData) {
  const brand = carData.brand || 'Toyota';
  const year = parseInt(carData.year) || 2022;
  const kmDriven = parseInt(carData.kmDriven) || 25000;
  
  // Calculate AI estimated fair market value
  let baseVal = 800000;
  if (brand.toLowerCase().includes('innov') || brand.toLowerCase().includes('toyota')) baseVal = 1400000;
  if (brand.toLowerCase().includes('cret') || brand.toLowerCase().includes('hyundai')) baseVal = 950000;
  if (brand.toLowerCase().includes('sonet') || brand.toLowerCase().includes('kia')) baseVal = 780000;
  if (brand.toLowerCase().includes('bmw') || brand.toLowerCase().includes('mercedes')) baseVal = 3200000;
  
  const ageDepreciation = (2026 - year) * 60000;
  const kmDepreciation = Math.floor(kmDriven / 10000) * 20000;
  const estimatedMarketValue = Math.max(300000, baseVal - ageDepreciation - kmDepreciation);

  // Generate simulated damage points bounding box canvas data
  const damagePoints = [
    { x: 35, y: 48, label: 'Minor Scratch (Fender)', severity: 'low' },
    { x: 72, y: 55, label: 'Tiny Paint Wear (Door Handle)', severity: 'low' }
  ];

  return {
    damageScore: 94,
    blurPassed: true,
    ocrPlateDetected: carData.licensePlate || 'TN 09 BX 4589',
    detectedColor: carData.color || 'Pearl White',
    estimatedMarketValue,
    damagePoints
  };
}

/**
 * AI Chatbot Response Engine: Answers car availability, SUV below 10 Lakhs, EMI, Rental rules, Booking status
/**
 * AI Chatbot Response Generator
 * Resolves user search intent, brand matches, budget limits, powertrain preferences,
 * and generates rich car cards and smart recommendations.
 */
function generateAIChatbotResponse(userMessage, carList = []) {
  const q = (userMessage || '').toLowerCase().trim();
  const seedCars = require('./seedData');
  const allCars = Array.isArray(carList) && carList.length > 0 ? carList : seedCars;

  // Format car card object for response
  const formatCar = (c, reason = '') => ({
    id: c.id || c._id,
    _id: c._id || c.id,
    title: c.title,
    brand: c.brand,
    model: c.model,
    year: c.year,
    price: c.price || c.sellingPrice || c.sellerExpectedPrice || 0,
    rentalPricePerDay: c.rentalPricePerDay || 0,
    kmDriven: c.kmDriven || 0,
    fuelType: c.fuelType || 'Petrol',
    transmission: c.transmission || 'Automatic',
    color: c.color || 'White',
    bodyType: c.bodyType || 'SUV',
    image: (c.images && c.images[0]) || c.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
    rating: c.rating || 4.8,
    inspectionScore: c.aiInspection?.damageScore || 95,
    status: c.status || 'for_sale',
    recommendationReason: reason || (c.aiInspection?.damageScore ? `🛡️ 140+ Point Score: ${c.aiInspection.damageScore}/100` : '⭐ Certified Master Pick')
  });

  // 1. Check for specific brand queries (e.g. "show me the tata brand cars", "tata cars", "hyundai", "toyota", "bmw", "mahindra", "kia", "maruti", "honda")
  const knownBrands = [
    { key: 'tata', name: 'Tata' },
    { key: 'hyundai', name: 'Hyundai' },
    { key: 'toyota', name: 'Toyota' },
    { key: 'mahindra', name: 'Mahindra' },
    { key: 'kia', name: 'Kia' },
    { key: 'bmw', name: 'BMW' },
    { key: 'maruti', name: 'Maruti Suzuki' },
    { key: 'suzuki', name: 'Maruti Suzuki' },
    { key: 'honda', name: 'Honda' },
    { key: 'volkswagen', name: 'Volkswagen' },
    { key: 'skoda', name: 'Skoda' },
    { key: 'mercedes', name: 'Mercedes-Benz' },
    { key: 'audi', name: 'Audi' },
    { key: 'mg', name: 'MG' }
  ];

  let matchedBrand = knownBrands.find(b => q.includes(b.key));

  if (matchedBrand) {
    const brandCars = allCars.filter(c => 
      (c.brand && c.brand.toLowerCase().includes(matchedBrand.key)) ||
      (c.title && c.title.toLowerCase().includes(matchedBrand.key))
    );

    if (brandCars.length > 0) {
      return {
        text: `🚗 Found ${brandCars.length} certified ${matchedBrand.name} vehicle${brandCars.length > 1 ? 's' : ''} available on CarHub with 140+ point quality inspection and verified service records! Click any vehicle below to view full details on the Buyer portal:`,
        cars: brandCars.map(c => formatCar(c, `🏆 140+ Point Score: ${c.aiInspection?.damageScore || 97}/100`)),
        quickReplies: [
          `View ${brandCars[0].title}`,
          `Calculate EMI for ${matchedBrand.name}`,
          'Show All SUVs under ₹10L',
          'Explore Rental Fleet',
          'Contact Admin'
        ]
      };
    } else {
      return {
        text: `We are currently acquiring new ${matchedBrand.name} vehicles directly from verified sellers. In the meantime, here are top certified cars available right now:`,
        cars: allCars.slice(0, 3).map(c => formatCar(c, '⭐ Certified Pick')),
        quickReplies: ['Show all available cars', 'Sell my Tata car', 'Contact Admin']
      };
    }
  }

  // 2. Budget / Price queries (e.g. "under 10 lakh", "below 15 lakhs", "cheap", "budget")
  if (q.includes('10 lakh') || q.includes('under 10') || q.includes('below 10') || q.includes('budget') || q.includes('under 15') || q.includes('under 20') || q.includes('under 8') || q.includes('under 7') || q.includes('cheap')) {
    let maxLimit = 1000000;
    if (q.includes('15')) maxLimit = 1500000;
    else if (q.includes('20')) maxLimit = 2000000;
    else if (q.includes('8') || q.includes('7')) maxLimit = 850000;

    const budgetCars = allCars.filter(c => (c.price || c.sellingPrice || 0) <= maxLimit);
    const resultCars = (budgetCars.length > 0 ? budgetCars : allCars).slice(0, 4);

    return {
      text: `💰 Here are our top certified cars within your budget (under ₹${(maxLimit / 100000).toFixed(0)} Lakhs). Each car includes 140+ point inspection report, 7-day money-back guarantee, and financing assistance:`,
      cars: resultCars.map(c => formatCar(c, `🔥 Best Value under ₹${(maxLimit / 100000).toFixed(0)}L`)),
      quickReplies: ['Calculate EMI', 'Cars with lowest KM', 'Self-drive rental rates', 'Talk to Admin']
    };
  }

  // 3. Body type queries (SUV, Sedan, 7 Seater, MUV, 4x4)
  if (q.includes('suv') || q.includes('sedan') || q.includes('7 seater') || q.includes('muv') || q.includes('4x4') || q.includes('offroad') || q.includes('hatchback')) {
    let targetType = 'suv';
    if (q.includes('sedan')) targetType = 'sedan';
    else if (q.includes('7 seater') || q.includes('muv')) targetType = 'muv';
    else if (q.includes('4x4') || q.includes('offroad')) targetType = '4x4';
    else if (q.includes('hatchback')) targetType = 'hatchback';

    const typeCars = allCars.filter(c => 
      (c.bodyType && c.bodyType.toLowerCase().includes(targetType)) ||
      (c.title && c.title.toLowerCase().includes(targetType)) ||
      (targetType === '4x4' && c.title && c.title.toLowerCase().includes('4x4')) ||
      (targetType === 'muv' && (c.bodyType?.toLowerCase() === 'muv' || c.title?.toLowerCase().includes('innova') || c.title?.toLowerCase().includes('safari')))
    );

    const results = (typeCars.length > 0 ? typeCars : allCars).slice(0, 4);
    return {
      text: `🚙 Here are certified ${targetType.toUpperCase()} models available in our marketplace. Click to view complete inspection scores, 360 photos, and EMI breakdowns:`,
      cars: results.map(c => formatCar(c, `✨ Top ${targetType.toUpperCase()} Pick`)),
      quickReplies: ['Filter by Price', 'Automatic transmission only', 'Check Rental Rates', 'Book Test Drive']
    };
  }

  // 4. Fuel & Transmission queries (Diesel, Petrol, Automatic, Electric/Hybrid)
  if (q.includes('diesel') || q.includes('petrol') || q.includes('automatic') || q.includes('hybrid') || q.includes('electric') || q.includes('mileage')) {
    let filterFn = () => true;
    let label = 'Special Match';
    if (q.includes('diesel')) {
      filterFn = c => (c.fuelType || '').toLowerCase() === 'diesel';
      label = '⛽ High-Torque Diesel Pick';
    } else if (q.includes('hybrid') || q.includes('mileage')) {
      filterFn = c => (c.fuelType || '').toLowerCase() === 'hybrid' || (c.title || '').toLowerCase().includes('hybrid');
      label = '⚡ 28 kmpl Top Mileage Pick';
    } else if (q.includes('automatic')) {
      filterFn = c => (c.transmission || '').toLowerCase() === 'automatic';
      label = '🕹️ Smooth Automatic Pick';
    } else if (q.includes('petrol')) {
      filterFn = c => (c.fuelType || '').toLowerCase() === 'petrol';
      label = '🌿 Refined Petrol Pick';
    }

    const matched = allCars.filter(filterFn);
    const results = (matched.length > 0 ? matched : allCars).slice(0, 4);
    return {
      text: `⚡ Here are top matching certified vehicles based on your powertrain preferences:`,
      cars: results.map(c => formatCar(c, label)),
      quickReplies: ['Show Tata cars', 'Show SUVs under ₹10L', 'Calculate EMI', 'Talk to Admin']
    };
  }

  // 5. Rental / Self-Drive queries
  if (q.includes('rent') || q.includes('rental') || q.includes('self drive') || q.includes('per day') || q.includes('hire') || q.includes('trip')) {
    const rentalCars = allCars.filter(c => c.status === 'for_rent' || c.status === 'sale_and_rent' || (c.rentalPricePerDay && c.rentalPricePerDay > 0));
    const results = (rentalCars.length > 0 ? rentalCars : allCars).slice(0, 4);

    return {
      text: `🔑 CarHub Self-Drive Rental Fleet:\n• Zero security deposit for verified members\n• 140+ point sanitized vehicles with 24/7 roadside assistance\n• Flexible daily rates starting from ₹1,600/day. Here are top rental vehicles:`,
      cars: results.map(c => formatCar(c, `🔑 ₹${(c.rentalPricePerDay || 2500).toLocaleString()}/day`)),
      quickReplies: ['Rent Innova Crysta', 'Rent Mahindra Thar', 'Rental Rules & Deposit', 'Contact Rental Admin']
    };
  }

  // 6. EMI & Loan Calculator
  if (q.includes('emi') || q.includes('loan') || q.includes('finance') || q.includes('down payment') || q.includes('interest')) {
    return {
      text: `💳 CarHub Smart Financing & EMI Assistance:\n• Interest rates starting at 8.5% p.a.\n• Up to 90% on-road funding from top partner banks (HDFC, SBI, ICICI)\n• Flexible tenure from 12 to 84 months\n\nClick any car on the Buyer page to access the live interactive EMI Calculator!`,
      cars: allCars.slice(0, 3).map(c => formatCar(c, `📊 Est. EMI: ₹${Math.round(((c.price || 900000) * 0.8 * 0.09) / 12 + ((c.price || 900000) * 0.8) / 60).toLocaleString()}/mo`)),
      quickReplies: ['Show Tata Nexon EMI', 'Show Creta EMI', 'Documents required for loan', 'Chat with Finance Admin']
    };
  }

  // 7. Selling vehicle query
  if (q.includes('sell') || q.includes('valuation') || q.includes('quote') || q.includes('doorstep') || q.includes('price for my car')) {
    return {
      text: `🏷️ Sell Your Vehicle to CarHub in 3 Simple Steps:\n1️⃣ Instant AI Valuation based on real-time market data.\n2️⃣ Free Doorstep 140+ Point Inspection.\n3️⃣ Instant bank payout within 30 minutes! CarHub buys directly with zero middleman commissions.`,
      cars: allCars.slice(0, 2).map(c => formatCar(c, '💎 Recent Direct Buyout')),
      quickReplies: ['Start Instant Car Valuation', 'Doorstep Inspection Details', 'Talk to Buyout Specialist']
    };
  }

  // 8. General / Fallback Smart Overview
  return {
    text: `👋 Hello! I am **CarHub AI Assistant**. I can help you search our live certified inventory, view 140+ point inspection scores, calculate EMIs, or book test drives!\n\nHere are our top trending certified cars available today:`,
    cars: allCars.slice(0, 4).map(c => formatCar(c, `⭐ 140+ Point Score: ${c.aiInspection?.damageScore || 97}/100`)),
    quickReplies: [
      'Show me Tata brand cars',
      'Show SUVs under ₹10 Lakhs',
      'Show Hyundai & Toyota cars',
      'Browse Self-Drive Rentals',
      'Calculate Car Loan EMI',
      'Contact Admin'
    ]
  };
}

/**
 * AI Price Recommendation Engine for Sellers
 * Computes fair market value recommendation based on brand, model, year, km driven, mileage, fuel, transmission, condition.
 */
function calculateAISellerPriceRecommendation(data) {
  const brand = (data.brand || '').trim().toLowerCase();
  const model = (data.model || '').trim().toLowerCase();
  const year = parseInt(data.year) || 2022;
  const kmDriven = parseInt(data.kmDriven) || 25000;
  const mileageKmpl = parseFloat(data.mileage) || 16.0;
  const fuelType = (data.fuelType || 'Petrol').trim().toLowerCase();
  const transmission = (data.transmission || 'Manual').trim().toLowerCase();
  const condition = (data.condition || 'Good').trim().toLowerCase();

  // 1. Base MSRP valuation mapping
  let baseMSRP = 900000;
  if (brand.includes('toyota')) {
    if (model.includes('innova') || model.includes('fortuner')) baseMSRP = 2600000;
    else if (model.includes('glanza') || model.includes('urban') || model.includes('hyryder')) baseMSRP = 1400000;
    else baseMSRP = 1600000;
  } else if (brand.includes('hyundai')) {
    if (model.includes('creta') || model.includes('alcazar') || model.includes('tucson')) baseMSRP = 1700000;
    else if (model.includes('venue') || model.includes('verna')) baseMSRP = 1250000;
    else if (model.includes('i20') || model.includes('grand')) baseMSRP = 850000;
    else baseMSRP = 1200000;
  } else if (brand.includes('kia')) {
    if (model.includes('seltos') || model.includes('carens')) baseMSRP = 1650000;
    else if (model.includes('sonet')) baseMSRP = 1150000;
    else if (model.includes('carnival') || model.includes('ev6')) baseMSRP = 3500000;
    else baseMSRP = 1350000;
  } else if (brand.includes('tata')) {
    if (model.includes('harrier') || model.includes('safari')) baseMSRP = 2100000;
    else if (model.includes('nexon') || model.includes('curvv')) baseMSRP = 1300000;
    else if (model.includes('punch') || model.includes('tiago') || model.includes('altroz')) baseMSRP = 800000;
    else baseMSRP = 1100000;
  } else if (brand.includes('mahindra')) {
    if (model.includes('xuv700') || model.includes('scorpio')) baseMSRP = 2200000;
    else if (model.includes('thar') || model.includes('xuv300') || model.includes('3xo')) baseMSRP = 1400000;
    else if (model.includes('bolero')) baseMSRP = 1000000;
    else baseMSRP = 1500000;
  } else if (brand.includes('maruti') || brand.includes('suzuki')) {
    if (model.includes('grand vitara') || model.includes('jimny')) baseMSRP = 1550000;
    else if (model.includes('brezza') || model.includes('ciaz') || model.includes('ertiga')) baseMSRP = 1100000;
    else if (model.includes('baleno') || model.includes('swift') || model.includes('dzire')) baseMSRP = 850000;
    else baseMSRP = 750000;
  } else if (brand.includes('honda')) {
    if (model.includes('city') || model.includes('elevate')) baseMSRP = 1500000;
    else if (model.includes('amaze')) baseMSRP = 900000;
    else baseMSRP = 1200000;
  } else if (brand.includes('bmw') || brand.includes('mercedes') || brand.includes('audi') || brand.includes('volvo')) {
    baseMSRP = 4500000;
  } else if (brand.includes('volkswagen') || brand.includes('skoda')) {
    if (model.includes('taigun') || model.includes('kushaq') || model.includes('slavia') || model.includes('virtus')) baseMSRP = 1600000;
    else baseMSRP = 1200000;
  }

  // 2. Age-based depreciation (approx. 9% per year for first 5 years, 6% thereafter)
  const currentYear = new Date().getFullYear();
  const vehicleAge = Math.max(0, currentYear - year);
  let ageDepreciationRate = 0;
  if (vehicleAge === 0) ageDepreciationRate = 0.08;
  else if (vehicleAge === 1) ageDepreciationRate = 0.15;
  else if (vehicleAge <= 5) ageDepreciationRate = 0.15 + (vehicleAge - 1) * 0.09;
  else ageDepreciationRate = 0.51 + (vehicleAge - 5) * 0.06;
  ageDepreciationRate = Math.min(0.78, ageDepreciationRate);

  const ageDepreciationAmount = Math.round(baseMSRP * ageDepreciationRate);
  let currentValue = baseMSRP - ageDepreciationAmount;

  // 3. KM Driven Adjustment (Standard = 12,000 km/year)
  const expectedKm = Math.max(10000, vehicleAge * 12000);
  const kmDifference = kmDriven - expectedKm;
  // Penalty for high km, bonus for low km
  const kmAdjustment = Math.round((kmDifference / 10000) * -18000);
  currentValue += kmAdjustment;

  // 4. Fuel & Efficiency Bonus / Penalty
  let fuelBonus = 0;
  if (fuelType.includes('ev') || fuelType.includes('electric')) {
    fuelBonus = 40000;
  } else if (fuelType.includes('hybrid')) {
    fuelBonus = 35000;
  } else if (fuelType.includes('diesel')) {
    fuelBonus = 20000; // High torque & highway demand
  } else if (fuelType.includes('cng')) {
    fuelBonus = 15000;
  }

  // Mileage efficiency rating (relative to 16 km/l benchmark)
  let mileageBonus = 0;
  if (mileageKmpl >= 20) mileageBonus = 30000;
  else if (mileageKmpl >= 17) mileageBonus = 15000;
  else if (mileageKmpl < 12 && !fuelType.includes('ev')) mileageBonus = -25000;

  // Transmission bonus
  let transmissionBonus = transmission.includes('auto') ? 35000 : 0;

  // Engine displacement bonus/adjustment
  let engineBonus = 0;
  const engineNumber = parseInt(data.engineCapacity) || 1498;
  if (engineNumber >= 2000) engineBonus = 50000;
  else if (engineNumber >= 1500) engineBonus = 25000;
  else if (engineNumber <= 1000) engineBonus = -15000;

  // Ownership history adjustment
  const noOfOwners = (data.noOfOwners || '1st Owner').toLowerCase();
  let ownershipFactor = 1.0;
  if (noOfOwners.includes('1st') || noOfOwners.includes('first') || noOfOwners.includes('single')) {
    ownershipFactor = 1.05; // 5% Single owner premium
  } else if (noOfOwners.includes('2nd') || noOfOwners.includes('second')) {
    ownershipFactor = 0.96;
  } else if (noOfOwners.includes('3rd') || noOfOwners.includes('third')) {
    ownershipFactor = 0.90;
  } else if (noOfOwners.includes('4') || noOfOwners.includes('more')) {
    ownershipFactor = 0.82;
  }

  currentValue += fuelBonus + mileageBonus + transmissionBonus + engineBonus;

  // 5. Condition multiplier
  let conditionFactor = 1.0;
  if (condition.includes('flawless') || condition.includes('showroom') || condition.includes('excellent')) {
    conditionFactor = 1.08;
  } else if (condition.includes('very good')) {
    conditionFactor = 1.04;
  } else if (condition.includes('fair')) {
    conditionFactor = 0.90;
  } else if (condition.includes('needs work') || condition.includes('poor')) {
    conditionFactor = 0.80;
  }

  currentValue = Math.round(currentValue * conditionFactor * ownershipFactor);

  // Floor safeguard
  const recommendedPrice = Math.max(150000, Math.round(currentValue / 5000) * 5000);
  const minPrice = Math.round((recommendedPrice * 0.94) / 5000) * 5000;
  const maxPrice = Math.round((recommendedPrice * 1.07) / 5000) * 5000;

  return {
    recommendedPrice,
    minPrice,
    maxPrice,
    confidenceScore: 97,
    breakdown: {
      baseMSRP,
      vehicleAge,
      ageDepreciationAmount,
      kmAdjustment,
      fuelBonus,
      mileageBonus,
      transmissionBonus,
      engineBonus,
      conditionFactor,
      ownershipFactor
    },
    marketInsights: `Valuation computed for ${data.noOfOwners || '1st Owner'} ${year} ${data.brand || ''} ${data.model || ''} (${data.engineCapacity || '1.5L'}). AI recommends listing between ₹${minPrice.toLocaleString()} and ₹${maxPrice.toLocaleString()} for fast closing.`
  };
}

module.exports = {
  runAIImageInspection,
  generateAIChatbotResponse,
  calculateAISellerPriceRecommendation
};
