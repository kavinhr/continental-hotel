/**
 * Database Seeder
 * Populates SQLite database with sample data
 * Run with: node backend/seed.js
 */

require('dotenv').config();
const { initDB, run, queryOne } = require('./config/database');
const bcrypt = require('bcryptjs');

// Sample rooms data
const sampleRooms = [
  {
    roomNumber: '101',
    roomType: 'Single',
    price: 6500,
    description: 'Comfortable single room with a queen bed, perfect for solo travelers.',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
    maxOccupancy: 1,
    isAvailable: 1,
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'
  },
  {
    roomNumber: '102',
    roomType: 'Single',
    price: 6500,
    description: 'Cozy single room with city view.',
    amenities: ['WiFi', 'TV', 'AC'],
    maxOccupancy: 1,
    isAvailable: 1,
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'
  },
  {
    roomNumber: '201',
    roomType: 'Double',
    price: 9800,
    description: 'Spacious double room with two queen beds, ideal for couples or small families.',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony'],
    maxOccupancy: 2,
    isAvailable: 1,
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
  },
  {
    roomNumber: '202',
    roomType: 'Double',
    price: 9800,
    description: 'Elegant double room with modern amenities.',
    amenities: ['WiFi', 'TV', 'AC', 'Balcony'],
    maxOccupancy: 2,
    isAvailable: 1,
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
  },
  {
    roomNumber: '203',
    roomType: 'Double',
    price: 12300,
    description: 'Deluxe double room with ocean view.',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Ocean View'],
    maxOccupancy: 2,
    isAvailable: 1,
    imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
  },
  {
    roomNumber: '301',
    roomType: 'Suite',
    price: 20500,
    description: 'Luxurious suite with separate living area, perfect for extended stays.',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Jacuzzi', 'Room Service'],
    maxOccupancy: 4,
    isAvailable: 1,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
  },
  {
    roomNumber: '302',
    roomType: 'Suite',
    price: 22800,
    description: 'Premium suite with panoramic city views and premium amenities.',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Jacuzzi', 'Room Service', 'City View'],
    maxOccupancy: 4,
    isAvailable: 1,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
  }
];

// Sample admin user
const adminUser = {
  username: 'admin',
  email: 'admin@thecontinental.com',
  password: 'admin123',
  role: 'admin',
  fullName: 'Hotel Administrator'
};

const seedDatabase = async () => {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await initDB();
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await run('DELETE FROM bookings');
    await run('DELETE FROM rooms');
    await run('DELETE FROM users WHERE role = "admin"');
    
    // Insert sample rooms
    console.log('📦 Inserting sample rooms...');
    const insertRoomSql = `
      INSERT INTO rooms (
        roomNumber, roomType, price, description, 
        amenities, maxOccupancy, isAvailable, imageUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    let insertedRooms = 0;
    for (const room of sampleRooms) {
      await run(insertRoomSql, [
        room.roomNumber,
        room.roomType,
        room.price,
        room.description,
        JSON.stringify(room.amenities),
        room.maxOccupancy,
        room.isAvailable,
        room.imageUrl
      ]);
      insertedRooms++;
    }
    console.log(`✅ Inserted ${insertedRooms} rooms`);
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const existingAdmin = await queryOne('SELECT id FROM users WHERE email = ?', [adminUser.email]);
    if (!existingAdmin) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      await run(
        'INSERT INTO users (username, email, password, role, fullName) VALUES (?, ?, ?, ?, ?)',
        [adminUser.username, adminUser.email, hashedPassword, adminUser.role, adminUser.fullName]
      );
      console.log('✅ Admin user created');
      console.log('   Username: admin');
      console.log('   Email: admin@thecontinental.com');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
