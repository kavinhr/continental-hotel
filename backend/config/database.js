/**
 * SQLite Database Configuration
 * Creates and manages SQLite database connection
 * Database file: continental.db in project root
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path (in project root)
const DB_PATH = path.join(__dirname, '../../continental.db');

let db = null;

/**
 * Initialize database connection and create tables
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    // Open database connection
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ [DB] Error opening database:', err.message);
        reject(err);
        return;
      }
      
      console.log('✅ [DB] Connected to SQLite database');
      console.log('📁 [DB] Database file:', DB_PATH);
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.warn('⚠️ [DB] Could not enable foreign keys:', err.message);
        }
      });
      
      // Create tables
      createTables()
        .then(() => {
          console.log('✅ [DB] Tables initialized');
          resolve(db);
        })
        .catch(reject);
    });
  });
};

/**
 * Create all necessary tables if they don't exist
 */
const createTables = () => {
  return new Promise((resolve, reject) => {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'customer' CHECK(role IN ('admin', 'customer')),
        fullName TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Rooms table
      `CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roomNumber TEXT UNIQUE NOT NULL,
        roomType TEXT NOT NULL CHECK(roomType IN ('Single', 'Double', 'Suite')),
        price REAL NOT NULL CHECK(price >= 0),
        description TEXT DEFAULT '',
        amenities TEXT DEFAULT '[]',
        maxOccupancy INTEGER NOT NULL CHECK(maxOccupancy >= 1),
        isAvailable INTEGER DEFAULT 1 CHECK(isAvailable IN (0, 1)),
        imageUrl TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Bookings table
      `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerName TEXT NOT NULL,
        customerEmail TEXT NOT NULL,
        customerPhone TEXT NOT NULL,
        room_id INTEGER NOT NULL,
        checkIn DATE NOT NULL,
        checkOut DATE NOT NULL,
        totalPrice REAL NOT NULL CHECK(totalPrice >= 0),
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
        specialRequests TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
      )`,
      
      // Messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        isRead INTEGER DEFAULT 0 CHECK(isRead IN (0, 1)),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(checkIn, checkOut)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)',
      'CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(roomType)',
      'CREATE INDEX IF NOT EXISTS idx_rooms_available ON rooms(isAvailable)'
    ];
    
    let completed = 0;
    const total = tables.length + indexes.length;
    
    // Create tables
    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ [DB] Error creating table ${index + 1}:`, err.message);
          reject(err);
          return;
        }
        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
    
    // Create indexes
    indexes.forEach((sql) => {
      db.run(sql, (err) => {
        if (err) {
          console.warn(`⚠️ [DB] Error creating index:`, err.message);
        }
        completed++;
        if (completed === total) {
          resolve();
        }
      });
    });
  });
};

/**
 * Get database instance
 */
const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
};

/**
 * Close database connection
 */
const closeDB = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ [DB] Error closing database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ [DB] Database connection closed');
      db = null;
      resolve();
    });
  });
};

/**
 * Execute a query with error handling
 */
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
};

/**
 * Execute a single row query
 */
const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

/**
 * Execute an insert/update/delete query
 */
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
};

module.exports = {
  initDB,
  getDB,
  closeDB,
  query,
  queryOne,
  run
};
