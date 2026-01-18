/**
 * InsuranceApplication Model
 * Mongoose schema for insurance applications
 */

const mongoose = require('mongoose');

const insuranceApplicationSchema = new mongoose.Schema({
    // Farmer Reference
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Farmer ID is required']
    },

    // Auto-generated Policy ID
    policyId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },

    // Application Date
    applicationDate: {
        type: Date,
        default: Date.now
    },

    // Farmer Details
    farmerType: {
        type: String,
        required: [true, 'Farmer type is required'],
        enum: ['landowner', 'tenant', 'sharecropper']
    },
    landLocation: {
        type: String,
        required: [true, 'Land location is required'],
        trim: true
    },

    // Crop & Coverage Details
    farmArea: {
        type: Number,
        required: [true, 'Farm area is required'],
        min: 0.1
    },
    cropType: {
        type: String,
        required: [true, 'Crop type is required'],
        trim: true
    },

    // Coverage Options
    coverageDetails: {
        yieldProtection: {
            type: Boolean,
            default: false
        },
        priceProtection: {
            type: Boolean,
            default: false
        },
        weatherRisk: {
            type: Boolean,
            default: false
        },
        pestDisease: {
            type: Boolean,
            default: false
        },
        flood: {
            type: Boolean,
            default: false
        },
        drought: {
            type: Boolean,
            default: false
        }
    },

    // Bank Details
    bankDetails: {
        accountHolder: {
            type: String,
            required: [true, 'Account holder name is required'],
            trim: true
        },
        bankName: {
            type: String,
            required: [true, 'Bank name is required'],
            trim: true
        },
        accountNumber: {
            type: String,
            required: [true, 'Account number is required'],
            trim: true
        },
        ifscCode: {
            type: String,
            required: [true, 'IFSC code is required'],
            trim: true,
            uppercase: true
        }
    },

    // Document Uploads (storing file paths)
    documents: {
        aadharCard: {
            type: String,
            required: [true, 'Aadhar card is required']
        },
        landRecords: {
            type: String,
            required: [true, 'Land records are required']
        },
        sowingCertificate: {
            type: String,
            required: [true, 'Sowing certificate is required']
        }
    },

    // Premium Calculation
    premiumAmount: {
        type: Number,
        default: 0
    },
    sumInsured: {
        type: Number,
        default: 0
    },

    // Application Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    // Admin Comments
    comments: {
        type: String,
        trim: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Generate Policy ID before validation
insuranceApplicationSchema.pre('validate', function (next) {
    if (!this.policyId) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.policyId = `INS-${year}${month}${day}-${random}`;
    }
    next();
});

// Calculate premium before saving
insuranceApplicationSchema.pre('save', function (next) {
    if (this.farmArea && this.cropType) {
        // Base rate per acre
        const baseRate = 500;
        let riskMultiplier = 1;

        // Add multipliers for each coverage option
        if (this.coverageDetails.yieldProtection) riskMultiplier += 0.2;
        if (this.coverageDetails.priceProtection) riskMultiplier += 0.15;
        if (this.coverageDetails.weatherRisk) riskMultiplier += 0.1;
        if (this.coverageDetails.pestDisease) riskMultiplier += 0.1;
        if (this.coverageDetails.flood) riskMultiplier += 0.15;
        if (this.coverageDetails.drought) riskMultiplier += 0.1;

        this.premiumAmount = Math.round(this.farmArea * baseRate * riskMultiplier);
        this.sumInsured = Math.round(this.farmArea * 50000); // ₹50,000 per acre
    }
    next();
});

const InsuranceApplication = mongoose.model('InsuranceApplication', insuranceApplicationSchema);

module.exports = InsuranceApplication;
