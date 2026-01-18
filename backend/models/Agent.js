/**
 * Agent Model
 * Mongoose schema for insurance agent-specific data
 * Links to base User model via userId
 */

const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Agent Details
  agentCode: {
    type: String,
    unique: true,
    sparse: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  licenseExpiry: {
    type: Date
  },
  // Work Information
  department: {
    type: String,
    enum: ['loans', 'insurance', 'claims', 'general'],
    default: 'general'
  },
  designation: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  // Assigned Region
  assignedRegions: [{
    type: String,
    trim: true
  }],
  // Performance Metrics
  totalApplicationsReviewed: {
    type: Number,
    default: 0
  },
  totalLoansApproved: {
    type: Number,
    default: 0
  },
  totalLoansRejected: {
    type: Number,
    default: 0
  },
  totalClaimsProcessed: {
    type: Number,
    default: 0
  },
  totalClaimsApproved: {
    type: Number,
    default: 0
  },
  totalClaimsRejected: {
    type: Number,
    default: 0
  },
  // Current Workload
  pendingLoans: {
    type: Number,
    default: 0
  },
  pendingClaims: {
    type: Number,
    default: 0
  },
  // Verification Status
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate unique agent code before saving
agentSchema.pre('save', async function(next) {
  if (!this.agentCode) {
    const count = await mongoose.model('Agent').countDocuments();
    this.agentCode = 'AGT' + String(count + 1001).padStart(6, '0');
  }
  next();
});

// Virtual to populate user data
agentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;
