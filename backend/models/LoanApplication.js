/**
 * LoanApplication Model
 * Mongoose schema for loan applications
 */

const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
    // Personal Details
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    middleName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    identityType: {
        type: String,
        required: [true, 'Identity type is required'],
        enum: ['aadhar', 'pan']
    },
    identityNumber: {
        type: String,
        required: [true, 'Identity number is required'],
        trim: true
    },

    // Bank Details
    accountHolderName: {
        type: String,
        required: [true, 'Account holder name is required'],
        trim: true
    },
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true
    },
    branchName: {
        type: String,
        required: [true, 'Branch name is required'],
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
    },
    accountType: {
        type: String,
        required: [true, 'Account type is required'],
        enum: ['savings', 'current']
    },

    // Land & Income Details
    farmArea: {
        type: Number,
        required: [true, 'Farm area is required'],
        min: 0.5
    },
    cropType: {
        type: String,
        required: [true, 'Crop type is required'],
        trim: true
    },
    landLocation: {
        type: String,
        required: [true, 'Land location is required'],
        trim: true
    },
    annualIncome: {
        type: Number,
        required: [true, 'Annual income is required'],
        min: 0
    },

    // Loan Details
    loanAmount: {
        type: Number,
        required: [true, 'Loan amount is required'],
        min: 10000
    },
    purpose: {
        type: String,
        required: [true, 'Loan purpose is required'],
        trim: true
    },
    loanTenure: {
        type: Number,
        required: [true, 'Loan tenure is required'],
        min: 6,
        max: 60
    },
    purposeDescription: {
        type: String,
        trim: true
    },

    // File Uploads (storing file paths)
    farmerPhoto: {
        type: String,
        required: [true, 'Farmer photo is required']
    },
    identityProof: {
        type: String,
        required: [true, 'Identity proof is required']
    },
    landProof: {
        type: String,
        required: [true, 'Land proof is required']
    },
    incomeCert: {
        type: String,
        required: [true, 'Income certificate is required']
    },

    // Farmer Reference
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Farmer ID is required']
    },

    // Application Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    // Calculated Fields
    monthlyEMI: {
        type: Number
    },
    interestRate: {
        type: Number,
        default: 8.5
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

// Calculate EMI before saving
loanApplicationSchema.pre('save', function (next) {
    if (this.loanAmount && this.loanTenure && this.interestRate) {
        const P = this.loanAmount;
        const r = this.interestRate / 12 / 100;
        const n = this.loanTenure;

        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        this.monthlyEMI = Math.round(emi);
    }
    next();
});

const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);

module.exports = LoanApplication;
