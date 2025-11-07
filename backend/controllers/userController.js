/**
 * User Controller
 * Handles user authentication and registration using SQLite
 */

const { queryOne, run } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;
    
    console.log('📝 [USER] Registering new user:', email);
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Username, email, and password are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email.toLowerCase(), username]
    );
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email or username' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user (only allow customer role for registration)
    const insertSql = `
      INSERT INTO users (username, email, password, fullName, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await run(insertSql, [
      username.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      (fullName || username).trim(),
      role || 'customer'
    ]);
    
    // Get created user
    const newUser = await queryOne('SELECT id, username, email, role, fullName FROM users WHERE id = ?', [result.lastID]);
    
    // Generate token
    const token = generateToken(newUser.id);
    
    console.log('✅ [USER] User registered successfully:', newUser.id);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        _id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName
      }
    });
  } catch (error) {
    console.error('❌ [USER] Registration error:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to register user' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 [USER] Login attempt:', email);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }
    
    // Find user by email
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    
    if (!user) {
      console.warn('⚠️ [USER] Login failed: User not found');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.warn('⚠️ [USER] Login failed: Invalid password');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    console.log('✅ [USER] Login successful:', user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error('❌ [USER] Login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to login' 
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const user = await queryOne(
      'SELECT id, username, email, role, fullName, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    const formattedUser = {
      _id: user.id,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
    
    res.json(formattedUser);
  } catch (error) {
    console.error('❌ [USER] Error fetching profile:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch profile' 
    });
  }
};
