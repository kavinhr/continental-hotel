/**
 * Room Controller
 * Handles all room-related operations using SQLite
 */

const { query, queryOne, run } = require('../config/database');

// Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    console.log('🏨 [ROOM] Fetching rooms with filters:', req.query);
    
    const { roomType, isAvailable } = req.query;
    
    let sql = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];
    
    if (roomType) {
      sql += ' AND roomType = ?';
      params.push(roomType);
    }
    
    if (isAvailable !== undefined) {
      sql += ' AND isAvailable = ?';
      params.push(isAvailable === 'true' ? 1 : 0);
    }
    
    sql += ' ORDER BY roomNumber ASC';
    
    const rooms = await query(sql, params);
    
    // Format rooms to match expected structure
    const formattedRooms = rooms.map(room => {
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
        imageUrl: room.imageUrl,
        createdAt: room.created_at,
        updatedAt: room.updated_at
      };
    });
    
    console.log(`✅ [ROOM] Found ${formattedRooms.length} rooms`);
    
    res.json(formattedRooms);
  } catch (error) {
    console.error('❌ [ROOM] Error fetching rooms:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch rooms' 
    });
  }
};

// Get single room by ID
exports.getRoomById = async (req, res) => {
  try {
    const roomId = req.params.id;
    console.log('🔍 [ROOM] Fetching room:', roomId);
    
    const room = await queryOne('SELECT * FROM rooms WHERE id = ?', [roomId]);
    
    if (!room) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found' 
      });
    }
    
    let amenities = [];
    try {
      amenities = JSON.parse(room.amenities || '[]');
    } catch (e) {
      amenities = [];
    }
    
    const formattedRoom = {
      _id: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price,
      description: room.description,
      amenities: amenities,
      maxOccupancy: room.maxOccupancy,
      isAvailable: room.isAvailable === 1,
      imageUrl: room.imageUrl,
      createdAt: room.created_at,
      updatedAt: room.updated_at
    };
    
    res.json(formattedRoom);
  } catch (error) {
    console.error('❌ [ROOM] Error fetching room:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch room' 
    });
  }
};

// Create new room
exports.createRoom = async (req, res) => {
  try {
    const { roomNumber, roomType, price, description, amenities, maxOccupancy, isAvailable, imageUrl } = req.body;
    
    console.log('➕ [ROOM] Creating room:', roomNumber);
    
    // Validate required fields
    if (!roomNumber || !roomType || price === undefined || !maxOccupancy) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: roomNumber, roomType, price, maxOccupancy' 
      });
    }
    
    // Check if room number already exists
    const existingRoom = await queryOne('SELECT id FROM rooms WHERE roomNumber = ?', [roomNumber]);
    if (existingRoom) {
      return res.status(400).json({ 
        success: false,
        message: 'Room number already exists' 
      });
    }
    
    // Convert amenities array to JSON string
    const amenitiesJson = JSON.stringify(amenities || []);
    
    const insertSql = `
      INSERT INTO rooms (
        roomNumber, roomType, price, description, 
        amenities, maxOccupancy, isAvailable, imageUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await run(insertSql, [
      roomNumber.trim(),
      roomType,
      price,
      (description || '').trim(),
      amenitiesJson,
      maxOccupancy,
      isAvailable !== false ? 1 : 0,
      (imageUrl || '').trim()
    ]);
    
    // Get created room
    const newRoom = await queryOne('SELECT * FROM rooms WHERE id = ?', [result.lastID]);
    
    let amenitiesArray = [];
    try {
      amenitiesArray = JSON.parse(newRoom.amenities || '[]');
    } catch (e) {
      amenitiesArray = [];
    }
    
    const formattedRoom = {
      _id: newRoom.id,
      roomNumber: newRoom.roomNumber,
      roomType: newRoom.roomType,
      price: newRoom.price,
      description: newRoom.description,
      amenities: amenitiesArray,
      maxOccupancy: newRoom.maxOccupancy,
      isAvailable: newRoom.isAvailable === 1,
      imageUrl: newRoom.imageUrl,
      createdAt: newRoom.created_at,
      updatedAt: newRoom.updated_at
    };
    
    res.status(201).json(formattedRoom);
  } catch (error) {
    console.error('❌ [ROOM] Error creating room:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to create room' 
    });
  }
};

// Update room
exports.updateRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const { roomNumber, roomType, price, description, amenities, maxOccupancy, isAvailable, imageUrl } = req.body;
    
    console.log('🔄 [ROOM] Updating room:', roomId);
    
    // Check if room exists
    const existingRoom = await queryOne('SELECT id FROM rooms WHERE id = ?', [roomId]);
    if (!existingRoom) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found' 
      });
    }
    
    // If roomNumber is being updated, check for duplicates
    if (roomNumber) {
      const duplicateRoom = await queryOne('SELECT id FROM rooms WHERE roomNumber = ? AND id != ?', [roomNumber, roomId]);
      if (duplicateRoom) {
        return res.status(400).json({ 
          success: false,
          message: 'Room number already exists' 
        });
      }
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (roomNumber !== undefined) {
      updates.push('roomNumber = ?');
      params.push(roomNumber.trim());
    }
    if (roomType !== undefined) {
      updates.push('roomType = ?');
      params.push(roomType);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description.trim());
    }
    if (amenities !== undefined) {
      updates.push('amenities = ?');
      params.push(JSON.stringify(amenities));
    }
    if (maxOccupancy !== undefined) {
      updates.push('maxOccupancy = ?');
      params.push(maxOccupancy);
    }
    if (isAvailable !== undefined) {
      updates.push('isAvailable = ?');
      params.push(isAvailable ? 1 : 0);
    }
    if (imageUrl !== undefined) {
      updates.push('imageUrl = ?');
      params.push(imageUrl.trim());
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No fields to update' 
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(roomId);
    
    const updateSql = `UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`;
    await run(updateSql, params);
    
    // Get updated room
    const updatedRoom = await queryOne('SELECT * FROM rooms WHERE id = ?', [roomId]);
    
    let amenitiesArray = [];
    try {
      amenitiesArray = JSON.parse(updatedRoom.amenities || '[]');
    } catch (e) {
      amenitiesArray = [];
    }
    
    const formattedRoom = {
      _id: updatedRoom.id,
      roomNumber: updatedRoom.roomNumber,
      roomType: updatedRoom.roomType,
      price: updatedRoom.price,
      description: updatedRoom.description,
      amenities: amenitiesArray,
      maxOccupancy: updatedRoom.maxOccupancy,
      isAvailable: updatedRoom.isAvailable === 1,
      imageUrl: updatedRoom.imageUrl,
      createdAt: updatedRoom.created_at,
      updatedAt: updatedRoom.updated_at
    };
    
    res.json(formattedRoom);
  } catch (error) {
    console.error('❌ [ROOM] Error updating room:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to update room' 
    });
  }
};

// Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    console.log('🗑️ [ROOM] Deleting room:', roomId);
    
    // Check if room has bookings
    const bookings = await query('SELECT id FROM bookings WHERE room_id = ? LIMIT 1', [roomId]);
    if (bookings.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete room with existing bookings' 
      });
    }
    
    const deleteSql = 'DELETE FROM rooms WHERE id = ?';
    const result = await run(deleteSql, [roomId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Room not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Room deleted successfully' 
    });
  } catch (error) {
    console.error('❌ [ROOM] Error deleting room:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete room' 
    });
  }
};
