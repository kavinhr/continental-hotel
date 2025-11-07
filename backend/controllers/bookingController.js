/**
 * Booking Controller
 * Handles all booking-related operations using SQLite
 */

const { query, queryOne, run } = require('../config/database');

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    console.log('📋 [BOOKING] Fetching all bookings');
    
    const sql = `
      SELECT 
        b.*,
        r.roomNumber,
        r.roomType,
        r.price as roomPrice
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `;
    
    const bookings = await query(sql);
    
    // Format bookings to match expected structure
    const formattedBookings = bookings.map(booking => ({
      _id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      room: {
        _id: booking.room_id,
        roomNumber: booking.roomNumber,
        roomType: booking.roomType,
        price: booking.roomPrice
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalPrice: booking.totalPrice,
      status: booking.status,
      specialRequests: booking.specialRequests,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }));
    
    console.log(`✅ [BOOKING] Found ${formattedBookings.length} bookings`);
    res.json(formattedBookings);
  } catch (error) {
    console.error('❌ [BOOKING] Error fetching bookings:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch bookings' 
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    console.log('🔍 [BOOKING] Fetching booking:', bookingId);
    
    const sql = `
      SELECT 
        b.*,
        r.roomNumber,
        r.roomType,
        r.price as roomPrice,
        r.amenities
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `;
    
    const booking = await queryOne(sql, [bookingId]);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    // Parse amenities JSON string
    let amenities = [];
    try {
      amenities = JSON.parse(booking.amenities || '[]');
    } catch (e) {
      amenities = [];
    }
    
    const formattedBooking = {
      _id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      room: {
        _id: booking.room_id,
        roomNumber: booking.roomNumber,
        roomType: booking.roomType,
        price: booking.roomPrice,
        amenities: amenities
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalPrice: booking.totalPrice,
      status: booking.status,
      specialRequests: booking.specialRequests,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    };
    
    res.json(formattedBooking);
  } catch (error) {
    console.error('❌ [BOOKING] Error fetching booking:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch booking' 
    });
  }
};

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    console.log('📝 [BOOKING] Creating new booking:', {
      room: req.body.room,
      roomType: req.body.roomType,
      checkIn: req.body.checkIn,
      checkOut: req.body.checkOut,
      customerName: req.body.customerName
    });
    
    const { room, roomType, checkIn, checkOut, customerName, customerEmail, customerPhone, specialRequests } = req.body;
    
    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !checkIn || !checkOut) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: customerName, customerEmail, customerPhone, checkIn, checkOut are required' 
      });
    }
    
    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      return res.status(400).json({ 
        success: false,
        message: 'Check-in date cannot be in the past' 
      });
    }
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Check-out date must be after check-in date' 
      });
    }
    
    // Find room
    let roomId = room;
    if (!roomId && roomType) {
      const roomSql = 'SELECT id FROM rooms WHERE roomType = ? AND isAvailable = 1 LIMIT 1';
      const availableRoom = await queryOne(roomSql, [roomType]);
      if (!availableRoom) {
        return res.status(404).json({ 
          success: false,
          message: `No available ${roomType} rooms found` 
        });
      }
      roomId = availableRoom.id;
    }
    
    if (!roomId) {
      return res.status(400).json({ 
        success: false,
        message: 'Room ID or roomType is required' 
      });
    }
    
    // Check if room exists and is available
    const roomData = await queryOne('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!roomData) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found' 
      });
    }
    
    if (!roomData.isAvailable) {
      return res.status(400).json({ 
        success: false,
        message: 'Room is not available' 
      });
    }
    
    // Check for overlapping bookings
    const overlappingSql = `
      SELECT id FROM bookings 
      WHERE room_id = ? 
        AND status IN ('Pending', 'Confirmed')
        AND (
          (checkIn <= ? AND checkOut >= ?)
          OR (checkIn <= ? AND checkOut >= ?)
          OR (checkIn >= ? AND checkOut <= ?)
        )
      LIMIT 1
    `;
    
    const overlappingBooking = await queryOne(overlappingSql, [
      roomId,
      checkOutDate.toISOString().split('T')[0],
      checkInDate.toISOString().split('T')[0],
      checkOutDate.toISOString().split('T')[0],
      checkInDate.toISOString().split('T')[0],
      checkInDate.toISOString().split('T')[0],
      checkOutDate.toISOString().split('T')[0]
    ]);
    
    if (overlappingBooking) {
      return res.status(400).json({ 
        success: false,
        message: 'Room is already booked for these dates' 
      });
    }
    
    // Calculate total price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = roomData.price * nights;
    
    // Create booking
    const insertSql = `
      INSERT INTO bookings (
        customerName, customerEmail, customerPhone, room_id, 
        checkIn, checkOut, totalPrice, specialRequests, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `;
    
    const result = await run(insertSql, [
      customerName.trim(),
      customerEmail.trim().toLowerCase(),
      customerPhone.trim(),
      roomId,
      checkInDate.toISOString().split('T')[0],
      checkOutDate.toISOString().split('T')[0],
      totalPrice,
      (specialRequests || '').trim()
    ]);
    
    // Get created booking with room details
    const bookingSql = `
      SELECT 
        b.*,
        r.roomNumber,
        r.roomType,
        r.price as roomPrice
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `;
    
    const newBooking = await queryOne(bookingSql, [result.lastID]);
    
    console.log('✅ [BOOKING] Booking created successfully:', result.lastID);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: newBooking.id,
        _id: newBooking.id,
        customerName: newBooking.customerName,
        customerEmail: newBooking.customerEmail,
        room: {
          _id: newBooking.room_id,
          roomNumber: newBooking.roomNumber,
          roomType: newBooking.roomType,
          price: newBooking.roomPrice
        },
        checkIn: newBooking.checkIn,
        checkOut: newBooking.checkOut,
        totalPrice: newBooking.totalPrice,
        status: newBooking.status
      }
    });
  } catch (error) {
    console.error('❌ [BOOKING] Booking creation error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to create booking' 
    });
  }
};

// Update booking status
exports.updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    
    console.log('🔄 [BOOKING] Updating booking:', bookingId, 'Status:', status);
    
    const updateSql = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await run(updateSql, [status, bookingId]);
    
    // Get updated booking
    const bookingSql = `
      SELECT 
        b.*,
        r.roomNumber,
        r.roomType,
        r.price as roomPrice
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `;
    
    const booking = await queryOne(bookingSql, [bookingId]);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    const formattedBooking = {
      _id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      room: {
        _id: booking.room_id,
        roomNumber: booking.roomNumber,
        roomType: booking.roomType,
        price: booking.roomPrice
      },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalPrice: booking.totalPrice,
      status: booking.status,
      specialRequests: booking.specialRequests,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    };
    
    res.json(formattedBooking);
  } catch (error) {
    console.error('❌ [BOOKING] Error updating booking:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to update booking' 
    });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    console.log('🗑️ [BOOKING] Deleting booking:', bookingId);
    
    const deleteSql = 'DELETE FROM bookings WHERE id = ?';
    const result = await run(deleteSql, [bookingId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Booking deleted successfully' 
    });
  } catch (error) {
    console.error('❌ [BOOKING] Error deleting booking:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete booking' 
    });
  }
};

// Get available rooms for date range
exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    
    console.log('🔍 [BOOKING] Searching available rooms:', { checkIn, checkOut });
    
    if (!checkIn || !checkOut) {
      console.warn('⚠️ [BOOKING] Missing dates in request');
      return res.status(400).json({ 
        success: false,
        message: 'Check-in and check-out dates are required' 
      });
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Validate dates
    if (checkInDate >= checkOutDate) {
      console.warn('⚠️ [BOOKING] Invalid date range');
      return res.status(400).json({ 
        success: false,
        message: 'Check-out date must be after check-in date' 
      });
    }
    
    // Find all rooms that have bookings overlapping with the requested dates
    console.log('🔍 [BOOKING] Checking for overlapping bookings...');
    
    const bookedRoomsSql = `
      SELECT DISTINCT room_id 
      FROM bookings 
      WHERE status IN ('Pending', 'Confirmed')
        AND (
          (checkIn <= ? AND checkOut >= ?)
          OR (checkIn <= ? AND checkOut >= ?)
          OR (checkIn >= ? AND checkOut <= ?)
        )
    `;
    
    const bookedRooms = await query(bookedRoomsSql, [
      checkOutDate.toISOString().split('T')[0],
      checkInDate.toISOString().split('T')[0],
      checkOutDate.toISOString().split('T')[0],
      checkInDate.toISOString().split('T')[0],
      checkInDate.toISOString().split('T')[0],
      checkOutDate.toISOString().split('T')[0]
    ]);
    
    const bookedRoomIds = bookedRooms.map(r => r.room_id);
    console.log(`📊 [BOOKING] Found ${bookedRoomIds.length} booked rooms`);
    
    // Find all available rooms (not booked and marked as available)
    let availableRoomsSql = 'SELECT * FROM rooms WHERE isAvailable = 1';
    const params = [];
    
    if (bookedRoomIds.length > 0) {
      const placeholders = bookedRoomIds.map(() => '?').join(',');
      availableRoomsSql += ` AND id NOT IN (${placeholders})`;
      params.push(...bookedRoomIds);
    }
    
    // If no rooms are booked, still get all available rooms
    const availableRooms = await query(availableRoomsSql, params);
    
    // If no rooms found, check if there are any rooms in the database at all
    if (availableRooms.length === 0) {
      console.log('⚠️ [BOOKING] No available rooms found for dates, checking all rooms in database...');
      const allRooms = await query('SELECT * FROM rooms WHERE isAvailable = 1');
      if (allRooms.length > 0) {
        console.log(`✅ [BOOKING] Found ${allRooms.length} available rooms in database (may have date conflicts)`);
        // Return all available rooms - frontend will display them
        // Backend will still validate date conflicts when booking
        availableRooms.push(...allRooms);
      } else {
        console.log('⚠️ [BOOKING] No rooms found in database at all');
      }
    }
    
    // Format rooms to match expected structure
    const formattedRooms = availableRooms.map(room => {
      let amenities = [];
      try {
        amenities = JSON.parse(room.amenities || '[]');
      } catch (e) {
        amenities = [];
      }
      
      return {
        _id: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        price: room.price,
        description: room.description,
        amenities: amenities,
        maxOccupancy: room.maxOccupancy,
        isAvailable: room.isAvailable === 1,
        imageUrl: room.imageUrl
      };
    });
    
    console.log(`✅ [BOOKING] Found ${formattedRooms.length} available rooms`);
    
    res.json(formattedRooms);
  } catch (error) {
    console.error('❌ [BOOKING] Error getting available rooms:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch available rooms' 
    });
  }
};
