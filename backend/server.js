/**
 * Hotel Management System - Backend Server
 * 
 * This is the main server file that:
 * - Sets up Express application
 * - Connects to SQLite database
 * - Configures middleware (CORS, JSON parsing, static files)
 * - Defines all API routes
 * - Handles error handling
 * - Serves frontend static files
 * 
 * @author Hotel Management System
 * @version 2.0.0 (SQLite)
 */

// Load environment variables from .env file
require('dotenv').config();

// Import required modules
const express = require('express');      // Web framework for Node.js
const cors = require('cors');            // Enable CORS for cross-origin requests
const path = require('path');            // Path utilities for file/directory operations
const { initDB } = require('./config/database');  // SQLite database initialization

// Import routes
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Import booking controller for alias route
const bookingController = require('./controllers/bookingController');

// ==================== INITIALIZE EXPRESS APP ====================
const app = express();
const PORT = process.env.PORT || 3000;  // Use PORT from .env or default to 3000

// ==================== MIDDLEWARE CONFIGURATION ====================

// CORS: Allow cross-origin requests from frontend
// This enables the frontend (running on different port) to make API calls
app.use(cors());

// JSON Parser: Parse JSON request bodies
// Allows Express to automatically parse JSON data sent in POST/PUT requests
app.use(express.json());

// URL Encoded Parser: Parse form data
// Allows Express to parse form-encoded data (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Static Files: Serve frontend files (HTML, CSS, JS, images)
// All files in the frontend directory are served as static assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Log route access (before routes)
app.use((req, res, next) => {
  console.log(`📥 [ROUTE] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ==================== API ROUTES ====================
// All API routes are prefixed with /api
// Each route module handles its own endpoints

// Room management routes: GET, POST, PUT, DELETE /api/rooms
app.use('/api/rooms', roomRoutes);

// Booking routes: GET, POST, PUT, DELETE /api/bookings
app.use('/api/bookings', bookingRoutes);

// User authentication routes: POST /api/users/register, /api/users/login
app.use('/api/users', userRoutes);

// Contact message routes: GET, POST, DELETE /api/messages
app.use('/api/messages', messageRoutes);

// Alias route for /api/book (for compatibility with frontend)
// This allows the frontend to use either /api/book or /api/bookings
// Both endpoints call the same createBooking controller function
app.post('/api/book', bookingController.createBooking);

// Test route - Simple backend check
app.get('/api', (req, res) => {
  res.send('🏨 Continental Hotel backend is running!');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: 'SQLite',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/booking.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/contact.html'));
});

app.get('/booking-confirmation', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/booking-confirmation.html'));
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.path });
});

// Global error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  console.error('Error Details:', {
    message: err.message,
    path: req.path,
    method: req.method
  });
  
  // Don't expose internal error details in production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
  
  res.status(err.status || 500).json({ 
    success: false,
    message: errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ==================== START SERVER ====================
// Initialize database first, then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🏨 THE CONTINENTAL - Hotel Management System');
    console.log('='.repeat(60));
    console.log(`✅ [SERVER] Database connected`);
    console.log(`✅ [SERVER] Tables initialized`);
    console.log(`🚀 [SERVER] Server running on http://localhost:${PORT}`);
    console.log(`🌐 [SERVER] Test route: http://localhost:${PORT}/api`);
    console.log(`📁 [SERVER] Frontend: http://localhost:${PORT}/`);
    console.log(`🌍 [SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 [SERVER] Database: SQLite (continental.db)`);
    console.log('='.repeat(60) + '\n');
  });
}).catch(err => {
  console.error('❌ [SERVER] Failed to start server:', err.message);
  console.error('💡 [SERVER] Please check database configuration');
  process.exit(1);
});

