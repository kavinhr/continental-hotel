/**
 * Message Routes
 * Defines all routes related to contact messages
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes
router.post('/', messageController.createMessage);

// Admin only routes
router.get('/', authenticate, isAdmin, messageController.getAllMessages);
router.get('/:id', authenticate, isAdmin, messageController.getMessageById);
router.put('/:id/read', authenticate, isAdmin, messageController.markAsRead);
router.delete('/:id', authenticate, isAdmin, messageController.deleteMessage);

module.exports = router;

