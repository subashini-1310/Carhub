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
 */
function generateAIChatbotResponse(userMessage, carList = []) {
  const query = userMessage.toLowerCase();
  
  if (query.includes('suv') || query.includes('10 lakh') || query.includes('below 10')) {
    return {
      text: "Here are top certified SUVs under ₹10 Lakhs available at CarHub:",
      cars: [
        { title: 'Hyundai Creta SX 1.5', price: 920000, image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600' },
        { title: 'Kia Sonet GTX Plus', price: 790000, image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600' },
        { title: 'Tata Nexon XZ Plus', price: 840000, image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600' }
      ],
      quickReplies: ['Calculate EMI for Creta', 'Book Test Drive', 'Check Rental Rates']
    };
  }

  if (query.includes('emi') || query.includes('loan')) {
    return {
      text: "CarHub offers flexible EMI options starting at just 8.5% interest per annum! Use our built-in Loan EMI Calculator on any car page to customize down payment and tenure (1 to 7 years).",
      quickReplies: ['Show cars under ₹10k EMI', 'Loan Eligibility Documents', 'Contact Financial Admin']
    };
  }

  if (query.includes('rent') || query.includes('rule') || query.includes('deposit')) {
    return {
      text: "CarHub Rental Policy Summary:\n1. Minimum age 21 with valid driving license.\n2. Unlimited KM on selected models.\n3. Zero security deposit for verified CarHub members.\n4. Cleaned & 140-point inspected cars guaranteed.",
      quickReplies: ['Browse Rental Fleet', 'Rent Innova Crysta', 'Talk to Admin']
    };
  }

  if (query.includes('booking') || query.includes('status') || query.includes('inspection')) {
    return {
      text: "You can track your inspection status or rental booking directly in your Dashboard under 'My Cars' or 'Rental History'. Admin updates status in real-time!",
      quickReplies: ['Go to My Dashboard', 'Chat with Admin']
    };
  }

  return {
    text: "Welcome to CarHub AI! I can assist you with finding certified cars, rental bookings, loan EMI details, and vehicle evaluation. How can I help you today?",
    quickReplies: ['SUVs under ₹10 Lakhs', 'How Selling Works', 'Rental Policy', 'Contact Admin']
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
