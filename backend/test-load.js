// Test file to find the error
const express = require('express');
const router = express.Router();

try {
    const LoanApplication = require('./models/LoanApplication');
    const { loanUpload } = require('./middleware/uploadConfig');
    const { protect } = require('./middleware/auth');
    const { generateLoanPDF } = require('./utils/pdfGenerator');

    console.log('All modules loaded successfully!');
} catch (error) {
    console.error('Error loading modules:', error);
}
