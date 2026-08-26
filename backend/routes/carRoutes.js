const express = require('express');
const router = express.Router();
const { getCarsForBuyer, getCarsForRenter, getCarById, getRecommendations, askAIChatbot, deleteCar } = require('../controllers/carController');

router.get('/buyer', getCarsForBuyer);
router.get('/renter', getCarsForRenter);
router.get('/detail/:id', getCarById);
router.get('/recommendations/:id', getRecommendations);
router.post('/ai-chat', askAIChatbot);
router.delete('/:id', deleteCar);

module.exports = router;
