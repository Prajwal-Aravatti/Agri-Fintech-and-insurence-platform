/**
 * Authentication Routes
 * Handles login, registration, and authentication endpoints
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Agent = require('../models/Agent');
const Admin = require('../models/Admin');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper function to get role-specific model
 */
const getRoleModel = (role) => {
  switch (role) {
    case 'farmer': return Farmer;
    case 'agent': return Agent;
    case 'admin': return Admin;
    default: return null;
  }
};

/**
 * Helper function to get role-specific data
 */
const getRoleData = async (userId, role) => {
  const RoleModel = getRoleModel(role);
  if (!RoleModel) return null;
  return await RoleModel.findOne({ userId });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    if (!['farmer', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be farmer, agent, or admin'
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone || '',
      address: address || ''
    });

    await user.save();

    // Create role-specific record
    let roleData = null;
    const RoleModel = getRoleModel(role);

    if (RoleModel) {
      const roleRecord = new RoleModel({ userId: user._id });
      await roleRecord.save();
      roleData = roleRecord.toObject();
      delete roleData.userId; // Remove duplicate reference
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt
        },
        roleData,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check role match if role is provided
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This account is registered as ${user.role}, not ${role}`
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Get role-specific data
    const roleData = await getRoleData(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt
        },
        roleData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error during login'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get role-specific data
    const roleData = await getRoleData(user._id, user.role);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          createdAt: user.createdAt
        },
        roleData
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user'
    });
  }
});

/**
 * @route   POST /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Private
 */
router.post('/verify-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.user.userId,
      role: req.user.role
    }
  });
});

module.exports = router;

