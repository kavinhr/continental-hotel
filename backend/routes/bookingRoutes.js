/**
 * Booking Routes
 * Defines all routes related to bookings
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/available', bookingController.getAvailableRooms);
router.post('/', bookingController.createBooking);

// Protected routes
router.get('/', authenticate, isAdmin, bookingController.getAllBookings);
router.get('/:id', authenticate, isAdmin, bookingController.getBookingById);
router.put('/:id', authenticate, isAdmin, bookingController.updateBooking);
router.delete('/:id', authenticate, isAdmin, bookingController.deleteBooking);

module.exports = router;

