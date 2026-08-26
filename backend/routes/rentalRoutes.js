const express = require('express');
const router = express.Router();
const { bookCar, getRenterBookings, getAllBookingsForAdmin, updateBookingStatus } = require('../controllers/rentalController');

router.post('/book', bookCar);
router.get('/my-bookings/:renterId', getRenterBookings);
router.get('/admin-all', getAllBookingsForAdmin);
router.put('/status/:id', updateBookingStatus);

module.exports = router;
