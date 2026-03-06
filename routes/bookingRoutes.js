const express = require('express');
const router = express.Router();
const { getBookings, createBooking, getBookingById, updateBooking, deleteBooking, markAsRead } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getBookings)
    .post(createBooking);

router.route('/:id')
    .get(protect, getBookingById)
    .put(protect, updateBooking)
    .delete(protect, deleteBooking);

router.put('/:id/read', protect, markAsRead);

module.exports = router;
