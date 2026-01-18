/**
 * Loan Routes
 * API endpoints for loan applications
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const LoanApplication = require('../models/LoanApplication');
const { loanUpload } = require('../middleware/uploadConfig');
const { authenticateToken: protect } = require('../middleware/auth');
const { generateLoanPDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');

/**
 * POST /api/loans/apply
 * Submit new loan application with file uploads
 * Protected route - requires authentication
 */
const applyLoanHandler = [
    protect,
    function (req, res, next) {
        loanUpload(req, res, function (err) {
            if (err) {
                console.error('Multer error details:', {
                    message: err.message,
                    code: err.code,
                    field: err.field,
                    name: err.name
                });

                // Provide more specific error message
                let errorMessage = 'File upload error';
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    errorMessage = `Unexpected file field: ${err.field}. Expected fields: farmerPhoto, identityProof, landProof, incomeCert`;
                } else if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = 'File size too large. Maximum size is 5MB.';
                } else if (err.code === 'LIMIT_FILE_COUNT') {
                    errorMessage = 'Too many files uploaded.';
                } else if (err.message) {
                    errorMessage = err.message;
                }

                return res.status(400).json({
                    success: false,
                    message: errorMessage
                });
            }
            next();
        });
    },
    async function (req, res) {
        try {
            console.log('=== LOAN APPLICATION REQUEST ===');
            console.log('Loan application request received');
            console.log('Body fields:', Object.keys(req.body));
            console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
            console.log('Full req.user object:', JSON.stringify(req.user, null, 2));
            console.log('req.user type:', typeof req.user);
            console.log('req.user keys:', req.user ? Object.keys(req.user) : 'req.user is null/undefined');
            console.log('req.user.userId:', req.user?.userId);
            console.log('req.user._id:', req.user?._id);
            console.log('req.user.id:', req.user?.id);

            // Verify authentication FIRST - before processing anything else
            if (!req.user) {
                console.error('❌ Authentication failed: req.user is missing');
                return res.status(401).json({
                    success: false,
                    message: 'Authentication error: User information not found. Please login again.'
                });
            }

            // Extract farmerId from req.user (check ALL possible field names and nested structures)
            let farmerId = req.user.userId ||
                req.user._id ||
                req.user.id ||
                (req.user.user && req.user.user.id) ||
                (req.user.user && req.user.user._id);

            console.log('FarmerId extraction attempt:');
            console.log('  - req.user.userId:', req.user.userId);
            console.log('  - req.user._id:', req.user._id);
            console.log('  - req.user.id:', req.user.id);
            console.log('  - Final farmerId:', farmerId);

            if (!farmerId || farmerId === 'undefined' || farmerId === 'null' || farmerId === '') {
                console.error('❌ Farmer ID not found in req.user');
                console.error('Full req.user object:', JSON.stringify(req.user, null, 2));
                return res.status(401).json({
                    success: false,
                    message: 'Authentication error: User ID not found in token. Please login again and try again.'
                });
            }

            console.log('✅ Farmer ID extracted successfully:', farmerId);

            // Extract form data
            const {
                firstName, middleName, lastName, identityType, identityNumber,
                accountHolderName, bankName, branchName, accountNumber, ifscCode, accountType,
                farmArea, cropType, landLocation, annualIncome,
                loanAmount, purpose, loanTenure, purposeDescription
            } = req.body;

            // Validate required text fields
            const requiredFields = {
                firstName, lastName, identityType, identityNumber,
                accountHolderName, bankName, branchName, accountNumber, ifscCode, accountType,
                farmArea, cropType, landLocation, annualIncome,
                loanAmount, purpose, loanTenure
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([key, value]) => !value || (typeof value === 'string' && !value.trim()))
                .map(([key]) => key);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Check if all files are uploaded
            if (!req.files) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded. Please upload all required documents.'
                });
            }

            const missingFiles = [];
            if (!req.files.farmerPhoto || !req.files.farmerPhoto[0]) missingFiles.push('farmerPhoto');
            if (!req.files.identityProof || !req.files.identityProof[0]) missingFiles.push('identityProof');
            if (!req.files.landProof || !req.files.landProof[0]) missingFiles.push('landProof');
            if (!req.files.incomeCert || !req.files.incomeCert[0]) missingFiles.push('incomeCert');

            if (missingFiles.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required file uploads: ${missingFiles.join(', ')}`
                });
            }

            // Validate data types
            const parsedFarmArea = parseFloat(farmArea);
            const parsedAnnualIncome = parseFloat(annualIncome);
            const parsedLoanAmount = parseFloat(loanAmount);
            const parsedLoanTenure = parseInt(loanTenure);

            if (isNaN(parsedFarmArea) || parsedFarmArea < 0.5) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid farm area. Minimum 0.5 acres required.'
                });
            }

            if (isNaN(parsedLoanAmount) || parsedLoanAmount < 10000) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid loan amount. Minimum ₹10,000 required.'
                });
            }

            if (isNaN(parsedLoanTenure) || parsedLoanTenure < 6 || parsedLoanTenure > 60) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid loan tenure. Must be between 6 and 60 months.'
                });
            }

            // Double-check farmerId before creating loan application - ensure it's a valid value
            if (!farmerId ||
                farmerId === 'undefined' ||
                farmerId === 'null' ||
                farmerId === '' ||
                (typeof farmerId === 'string' && farmerId.trim() === '')) {
                console.error('Farmer ID validation failed. farmerId:', farmerId);
                console.error('Type of farmerId:', typeof farmerId);
                console.error('req.user:', JSON.stringify(req.user, null, 2));
                return res.status(401).json({
                    success: false,
                    message: 'Authentication error: Invalid user ID. Please login again.'
                });
            }

            // Ensure farmerId is a valid MongoDB ObjectId string
            const validFarmerId = String(farmerId).trim();

            if (validFarmerId === 'undefined' || validFarmerId === 'null' || validFarmerId === '') {
                console.error('❌ Farmer ID is invalid after conversion:', validFarmerId);
                console.error('Original farmerId:', farmerId);
                return res.status(401).json({
                    success: false,
                    message: 'Authentication error: User ID is invalid. Please login again.'
                });
            }

            // Validate that it's a valid MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(validFarmerId)) {
                console.error('❌ Farmer ID is not a valid MongoDB ObjectId:', validFarmerId);
                console.error('req.user:', JSON.stringify(req.user, null, 2));
                return res.status(401).json({
                    success: false,
                    message: 'Authentication error: Invalid user ID format. Please login again.'
                });
            }

            console.log('✅ Valid farmerId confirmed:', validFarmerId);
            console.log('✅ ObjectId validation passed');

            // FINAL check - ensure farmerId is still valid (it shouldn't have changed, but just in case)
            if (!validFarmerId || validFarmerId === 'undefined' || validFarmerId === 'null' || validFarmerId === '') {
                console.error('❌ CRITICAL: farmerId is invalid right before creating LoanApplication!');
                console.error('validFarmerId:', validFarmerId);
                console.error('farmerId:', farmerId);
                console.error('req.user:', JSON.stringify(req.user, null, 2));
                return res.status(401).json({
                    success: false,
                    message: 'Authentication error: User ID is missing. Please login again and try submitting the application.'
                });
            }

            console.log('✅ Creating loan application with farmerId:', validFarmerId);
            console.log('FarmerId type:', typeof validFarmerId);
            console.log('FarmerId value:', validFarmerId);

            // Create loan application object - explicitly set farmerId
            const loanApplicationData = {
                firstName: firstName.trim(),
                middleName: middleName ? middleName.trim() : undefined,
                lastName: lastName.trim(),
                identityType,
                identityNumber: identityNumber.trim(),
                accountHolderName: accountHolderName.trim(),
                bankName: bankName.trim(),
                branchName: branchName.trim(),
                accountNumber: accountNumber.trim(),
                ifscCode: ifscCode.trim().toUpperCase(),
                accountType,
                farmArea: parsedFarmArea,
                cropType: cropType.trim(),
                landLocation: landLocation.trim(),
                annualIncome: parsedAnnualIncome,
                loanAmount: parsedLoanAmount,
                purpose: purpose.trim(),
                loanTenure: parsedLoanTenure,
                purposeDescription: purposeDescription ? purposeDescription.trim() : undefined,
                farmerPhoto: req.files.farmerPhoto[0].filename,
                identityProof: req.files.identityProof[0].filename,
                landProof: req.files.landProof[0].filename,
                incomeCert: req.files.incomeCert[0].filename,
                farmerId: new mongoose.Types.ObjectId(validFarmerId)  // Explicitly convert to ObjectId
            };

            // Log the data being used (without sensitive info)
            console.log('Loan application data prepared:');
            console.log('  - farmerId:', loanApplicationData.farmerId);
            console.log('  - firstName:', loanApplicationData.firstName);
            console.log('  - loanAmount:', loanApplicationData.loanAmount);

            console.log('Loan application data (without files):', {
                ...loanApplicationData,
                farmerPhoto: '[FILENAME]',
                identityProof: '[FILENAME]',
                landProof: '[FILENAME]',
                incomeCert: '[FILENAME]'
            });

            const loanApplication = new LoanApplication(loanApplicationData);

            // Save to database
            await loanApplication.save();

            console.log('Loan application saved successfully:', loanApplication._id);

            res.status(201).json({
                success: true,
                message: 'Loan application submitted successfully',
                data: {
                    loanId: loanApplication._id,
                    status: loanApplication.status,
                    monthlyEMI: loanApplication.monthlyEMI,
                    createdAt: loanApplication.createdAt
                }
            });
        } catch (error) {
            console.error('Loan application error:', error);
            console.error('Error stack:', error.stack);

            let errorMessage = 'Failed to submit loan application';
            let statusCode = 500;

            // Handle validation errors
            if (error.name === 'ValidationError') {
                statusCode = 400;
                const validationErrors = Object.values(error.errors).map(err => err.message);
                errorMessage = `Validation error: ${validationErrors.join(', ')}`;
            } else if (error.name === 'CastError') {
                statusCode = 400;
                errorMessage = `Invalid data format: ${error.message}`;
            } else if (error.message) {
                errorMessage = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: errorMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
];

router.post('/apply', applyLoanHandler[0], applyLoanHandler[1], applyLoanHandler[2]);

/**
 * GET /api/loans/:id/pdf
 * Download PDF of loan application
 * Protected route - requires authentication
 */
router.get('/:id/pdf', protect, async (req, res) => {
    try {
        const loanId = req.params.id;

        // Find loan application
        const loanApplication = await LoanApplication.findById(loanId);

        if (!loanApplication) {
            return res.status(404).json({
                success: false,
                message: 'Loan application not found'
            });
        }

        // Check if user owns this loan application
        if (loanApplication.farmerId.toString() !== req.user.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Generate PDF
        const pdfDir = path.join(__dirname, '..', 'uploads', 'pdfs');
        if (!fs.existsSync(pdfDir)) {
            fs.mkdirSync(pdfDir, { recursive: true });
        }

        const pdfFilename = `loan-application-${loanId}.pdf`;
        const pdfPath = path.join(pdfDir, pdfFilename);

        // Generate or use existing PDF
        if (!fs.existsSync(pdfPath)) {
            await generateLoanPDF(loanApplication, pdfPath);
        }

        // Send PDF file
        res.download(pdfPath, pdfFilename, (err) => {
            if (err) {
                console.error('PDF download error:', err);
                res.status(500).json({
                    success: false,
                    message: 'Failed to download PDF'
                });
            }
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: error.message
        });
    }
});

/**
 * GET /api/loans/pending
 * Get all pending loan applications (for agents/admins)
 * Protected route - requires agent or admin role
 */
router.get('/pending', protect, async (req, res) => {
    try {
        // Only agents and admins can view pending loans
        if (req.user.role !== 'agent' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only agents and admins can view pending loans.'
            });
        }

        const pendingLoans = await LoanApplication.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .select('-farmerPhoto -identityProof -landProof -incomeCert');

        res.json({
            success: true,
            count: pendingLoans.length,
            data: pendingLoans
        });
    } catch (error) {
        console.error('Get pending loans error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending loans',
            error: error.message
        });
    }
});

/**
 * PUT /api/loans/:id/status
 * Update loan status (approve/reject)
 * Protected route - requires agent or admin role
 */
router.put('/:id/status', protect, async (req, res) => {
    try {
        // Only agents and admins can update loan status
        if (req.user.role !== 'agent' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only agents and admins can update loan status.'
            });
        }

        const { status, comments } = req.body;

        // Validate status
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be "approved" or "rejected".'
            });
        }

        const loanApplication = await LoanApplication.findById(req.params.id);

        if (!loanApplication) {
            return res.status(404).json({
                success: false,
                message: 'Loan application not found'
            });
        }

        // Update loan status
        loanApplication.status = status;
        loanApplication.comments = comments || '';
        loanApplication.updatedAt = new Date();

        await loanApplication.save();

        console.log(`Loan ${req.params.id} ${status} by ${req.user.role} (${req.user.userId})`);

        res.json({
            success: true,
            message: `Loan application ${status} successfully`,
            data: {
                loanId: loanApplication._id,
                status: loanApplication.status,
                comments: loanApplication.comments,
                updatedAt: loanApplication.updatedAt
            }
        });
    } catch (error) {
        console.error('Update loan status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update loan status',
            error: error.message
        });
    }
});

/**
 * GET /api/loans
 * Get all loan applications for the current user
 * Protected route - requires authentication
 */
router.get('/', protect, async (req, res) => {
    try {
        // Agents and admins can see all loans, farmers only see their own
        const query = (req.user.role === 'admin' || req.user.role === 'agent')
            ? {}
            : { farmerId: req.user.userId };

        const loanApplications = await LoanApplication.find(query)
            .sort({ createdAt: -1 })
            .select('-farmerPhoto -identityProof -landProof -incomeCert'); // Don't send file paths

        res.json({
            success: true,
            count: loanApplications.length,
            data: loanApplications
        });
    } catch (error) {
        console.error('Get loans error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loan applications',
            error: error.message
        });
    }
});

module.exports = router;

