/**
 * Admin Model
 * Mongoose schema for administrator-specific data
 * Links to base User model via userId
 */

const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Admin Details
  adminCode: {
    type: String,
    unique: true,
    sparse: true
  },
  // Access Level
  accessLevel: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  // Permissions
  permissions: {
    manageUsers: { type: Boolean, default: true },
    manageAgents: { type: Boolean, default: true },
    manageFarmers: { type: Boolean, default: true },
    viewReports: { type: Boolean, default: true },
    manageLoans: { type: Boolean, default: true },
    manageInsurance: { type: Boolean, default: true },
    manageClaims: { type: Boolean, default: true },
    managePayments: { type: Boolean, default: true },
    systemSettings: { type: Boolean, default: false }
  },
  // Department
  department: {
    type: String,
    trim: true
  },
  // Activity Tracking
  lastLoginAt: {
    type: Date
  },
  lastActivityAt: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  // Actions Log Summary
  totalUsersCreated: {
    type: Number,
    default: 0
  },
  totalUsersDeactivated: {
    type: Number,
    default: 0
  },
  // Verification
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  appointedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appointedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique admin code before saving
adminSchema.pre('save', async function(next) {
  if (!this.adminCode) {
    const count = await mongoose.model('Admin').countDocuments();
    this.adminCode = 'ADM' + String(count + 1001).padStart(6, '0');
  }
  next();
});

// Virtual to populate user data
adminSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
