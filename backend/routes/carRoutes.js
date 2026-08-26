const express = require('express');
const router = express.Router();
const { getCarsForBuyer, getCarsForRenter, getCarById, askAIChatbot, deleteCar } = require('../controllers/carController');

router.get('/buyer', getCarsForBuyer);
router.get('/renter', getCarsForRenter);
router.get('/detail/:id', getCarById);
router.post('/ai-chat', askAIChatbot);
router.delete('/:id', deleteCar);

module.exports = router;
