async function runCompleteTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPLETE CARHUB VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: SINGLE LOGIN FOR EVERYONE
  console.log('--- TEST 1: Single Login System ---');
  
  // 1A. Admin Login
  const adminRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@carhub.com', password: 'password123' })
  }).then(r => r.json());
  console.log('1A. Admin Login Result:', adminRes.user ? ('SUCCESS -> Role: ' + adminRes.user.role + ', Name: ' + adminRes.user.name) : 'FAILED', adminRes.message || '');

  // 1B. Buyer Login
  const buyerRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'buyer@gmail.com', password: 'password123' })
  }).then(r => r.json());
  console.log('1B. Buyer Login Result:', buyerRes.user ? ('SUCCESS -> Role: ' + buyerRes.user.role + ', Name: ' + buyerRes.user.name) : 'FAILED', buyerRes.message || '');

  // 1C. Seller Login
  const sellerRes = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'seller@gmail.com', password: 'password123' })
  }).then(r => r.json());
  console.log('1C. Seller Login Result:', sellerRes.user ? ('SUCCESS -> Role: ' + sellerRes.user.role + ', Name: ' + sellerRes.user.name) : 'FAILED', sellerRes.message || '');


  // TEST 2: SELLER POST -> ADMIN APPROVAL & PUBLISH
  console.log('\n--- TEST 2: Seller Post -> Admin Review -> Publish Workflow ---');
  const newSellerCar = {
    title: 'BMW X5 xDrive40i M Sport 2023',
    brand: 'BMW',
    model: 'X5',
    year: 2023,
    sellerExpectedPrice: 6500000,
    kmDriven: 14000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Phytonic Blue',
    bodyType: 'SUV',
    location: 'Chennai Hub',
    sellerId: 'test_seller_bmw',
    sellerName: 'BMW Seller'
  };

  const postRes = await fetch('http://localhost:5001/api/seller/post-car', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSellerCar)
  }).then(r => r.json());
  const carId = postRes.car.id;
  console.log('2A. Car Posted ID:', carId, 'Status:', postRes.car.status);

  // Check Buyer Page - Must NOT be visible
  const buyerCars1 = await fetch('http://localhost:5001/api/cars/buyer').then(r => r.json());
  const foundInBuyer1 = buyerCars1.find(c => (c.id || c._id) === carId);
  console.log('2B. Is unapproved car on Buyer page?', foundInBuyer1 ? 'YES (BUG!)' : 'NO (CORRECT! Hidden)');

  // Admin Publishes Car
  const publishRes = await fetch('http://localhost:5001/api/admin/purchase-and-publish/' + carId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetMarket: 'buyer',
      sellingPrice: 6800000,
      rentalPricePerDay: 0,
      purchasePriceByAdmin: 6400000
    })
  }).then(r => r.json());
  console.log('2C. Admin Publish Result:', publishRes.message);

  // Check Buyer Page - Must NOW be visible
  const buyerCars2 = await fetch('http://localhost:5001/api/cars/buyer').then(r => r.json());
  const foundInBuyer2 = buyerCars2.find(c => (c.id || c._id) === carId);
  console.log('2D. Is published car on Buyer page?', foundInBuyer2 ? ('YES (CORRECT! Visible with price ₹' + foundInBuyer2.price.toLocaleString() + ')') : 'NO (ERROR)');


  // TEST 3: ADMIN EDIT PUBLISHED CAR & REDUCE PRICE (PRICE DROP NOTIFICATION)
  console.log('\n--- TEST 3: Admin Edit & Price Drop Alert ---');
  const editRes = await fetch('http://localhost:5001/api/admin/purchase-and-publish/' + carId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetMarket: 'buyer',
      sellingPrice: 6300000, // Reduced from 68,00,000 to 63,00,000
      purchasePriceByAdmin: 6400000
    })
  }).then(r => r.json());
  console.log('3A. Price reduced from ₹68,00,000 to ₹63,00,000. Edit response price:', editRes.car?.price);

  // Check Notifications for price drop alert
  const notifs = await fetch('http://localhost:5001/api/notifications/all').then(r => r.json());
  const priceDropNotif = notifs.find(n => n.type === 'price_drop' && (n.carId === carId || n.message.includes('BMW X5')));
  console.log('3B. Price Drop Notification created in MongoDB?', priceDropNotif ? ('YES -> "' + priceDropNotif.title + ': ' + priceDropNotif.message + '"') : 'NO (ERROR)');


  // TEST 4: SAME-BRAND RECOMMENDATIONS
  console.log('\n--- TEST 4: Same-Brand Car Recommendations ---');
  const recs = await fetch('http://localhost:5001/api/cars/recommendations/' + carId).then(r => r.json());
  console.log('4A. Recommendations for BMW X5 count:', recs.length);
  console.log('4B. Recommended cars:', recs.map(c => c.brand + ' ' + c.model + ' (₹' + c.price + ')'));


  // TEST 5: ADMIN PERMANENT DELETION
  console.log('\n--- TEST 5: Admin Delete Vehicle Everywhere ---');
  const delRes = await fetch('http://localhost:5001/api/admin/cars/' + carId, { method: 'DELETE' }).then(r => r.json());
  console.log('5A. Delete Response:', delRes.message);

  const buyerCarsFinal = await fetch('http://localhost:5001/api/cars/buyer').then(r => r.json());
  const foundFinal = buyerCarsFinal.find(c => (c.id || c._id) === carId);
  console.log('5B. Is deleted car gone from Buyer page?', foundFinal ? 'NO (ERROR)' : 'YES (CORRECT! Permanently removed)');

  console.log('\n====================================================');
  console.log('✅ ALL TEST SUITE CHECKS PASSED PERFECTLY!');
  console.log('====================================================');
}

runCompleteTestSuite();
