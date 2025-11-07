/**
 * Room Routes
 * Defines all routes related to rooms
 */

const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);

// Admin only routes
router.post('/', authenticate, isAdmin, roomController.createRoom);
router.put('/:id', authenticate, isAdmin, roomController.updateRoom);
router.delete('/:id', authenticate, isAdmin, roomController.deleteRoom);

module.exports = router;

