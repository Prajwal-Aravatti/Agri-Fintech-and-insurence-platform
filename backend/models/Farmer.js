/**
 * Farmer Model
 * Mongoose schema for farmer-specific data
 * Links to base User model via userId
 */

const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Farm Details
  farmName: {
    type: String,
    trim: true
  },
  farmArea: {
    type: Number,
    default: 0
  },
  farmAreaUnit: {
    type: String,
    enum: ['acres', 'hectares', 'bigha'],
    default: 'acres'
  },
  landLocation: {
    type: String,
    trim: true
  },
  // Crop Information
  primaryCrop: {
    type: String,
    trim: true
  },
  secondaryCrops: [{
    type: String,
    trim: true
  }],
  // Experience & History
  farmingExperience: {
    type: Number,
    default: 0
  },
  annualIncome: {
    type: Number,
    default: 0
  },
  // Documents
  landDocuments: [{
    documentType: String,
    documentPath: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Bank Details
  bankDetails: {
    accountHolderName: String,
    bankName: String,
    branchName: String,
    accountNumber: String,
    ifscCode: String,
    accountType: {
      type: String,
      enum: ['savings', 'current'],
      default: 'savings'
    }
  },
  // Identity
  identityType: {
    type: String,
    enum: ['aadhar', 'pan', 'voter_id', 'driving_license'],
  },
  identityNumber: {
    type: String,
    trim: true
  },
  // Statistics
  totalLoans: {
    type: Number,
    default: 0
  },
  activeLoans: {
    type: Number,
    default: 0
  },
  totalPolicies: {
    type: Number,
    default: 0
  },
  activePolicies: {
    type: Number,
    default: 0
  },
  totalClaims: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual to populate user data
farmerSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Farmer = mongoose.model('Farmer', farmerSchema);

module.exports = Farmer;
