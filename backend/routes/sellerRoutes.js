const express = require('express');
const router = express.Router();
const { postCar, getSellerCars, getAISellerPriceEstimate, deleteSellerCar } = require('../controllers/sellerController');

router.post('/post-car', postCar);
router.get('/my-cars/:sellerId', getSellerCars);
router.post('/ai-price-estimate', getAISellerPriceEstimate);
router.delete('/cars/:id', deleteSellerCar);
router.delete('/delete-car/:id', deleteSellerCar);

module.exports = router;
