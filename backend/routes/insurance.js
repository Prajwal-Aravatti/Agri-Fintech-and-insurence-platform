/**
 * Insurance Routes
 * API endpoints for insurance applications
 */

const express = require('express');
const router = express.Router();
const InsuranceApplication = require('../models/InsuranceApplication');
const { insuranceUpload } = require('../middleware/uploadConfig');
const { authenticateToken: protect } = require('../middleware/auth');

/**
 * POST /api/insurance/apply
 * Submit new insurance application with file uploads
 * Protected route - requires authentication
 */
const applyInsuranceHandler = [
    protect,
    function (req, res, next) {
        insuranceUpload(req, res, function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload error'
                });
            }
            next();
        });
    },
    async function (req, res) {
        try {
            // Extract form data
            const {
                farmerType, landLocation, farmArea, cropType,
                yieldProtection, priceProtection, weatherRisk, pestDisease, flood, drought,
                accountHolder, bankName, accountNumber, ifscCode
            } = req.body;

            // Check if all files are uploaded
            if (!req.files || !req.files.aadharCard || !req.files.landRecords || !req.files.sowingCertificate) {
                return res.status(400).json({
                    success: false,
                    message: 'All document uploads are required (Aadhar Card, Land Records, Sowing Certificate)'
                });
            }

            // Create insurance application
            const insuranceApplication = new InsuranceApplication({
                farmerId: req.user._id,
                farmerType,
                landLocation,
                farmArea: parseFloat(farmArea),
                cropType,
                coverageDetails: {
                    yieldProtection: yieldProtection === 'true' || yieldProtection === true,
                    priceProtection: priceProtection === 'true' || priceProtection === true,
                    weatherRisk: weatherRisk === 'true' || weatherRisk === true,
                    pestDisease: pestDisease === 'true' || pestDisease === true,
                    flood: flood === 'true' || flood === true,
                    drought: drought === 'true' || drought === true
                },
                bankDetails: {
                    accountHolder,
                    bankName,
                    accountNumber,
                    ifscCode
                },
                documents: {
                    aadharCard: req.files.aadharCard[0].filename,
                    landRecords: req.files.landRecords[0].filename,
                    sowingCertificate: req.files.sowingCertificate[0].filename
                }
            });

            // Save to database
            await insuranceApplication.save();

            res.status(201).json({
                success: true,
                message: 'Insurance application submitted successfully',
                data: {
                    policyId: insuranceApplication.policyId,
                    status: insuranceApplication.status,
                    premiumAmount: insuranceApplication.premiumAmount,
                    sumInsured: insuranceApplication.sumInsured,
                    createdAt: insuranceApplication.createdAt
                }
            });
        } catch (error) {
            console.error('Insurance application error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit insurance application',
                error: error.message
            });
        }
    }
];

router.post('/apply', applyInsuranceHandler[0], applyInsuranceHandler[1], applyInsuranceHandler[2]);

/**
 * GET /api/insurance/my-policies
 * Get all insurance policies for the current user
 * Protected route - requires authentication
 */
router.get('/my-policies', protect, async (req, res) => {
    try {
        const query = req.user.role === 'admin'
            ? {}
            : { farmerId: req.user._id };

        const policies = await InsuranceApplication.find(query)
            .sort({ createdAt: -1 })
            .select('-documents'); // Don't send document file paths

        res.json({
            success: true,
            count: policies.length,
            data: policies
        });
    } catch (error) {
        console.error('Get policies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch insurance policies',
            error: error.message
        });
    }
});

/**
 * GET /api/insurance/:policyId
 * Get a specific insurance policy by policyId
 * Protected route - requires authentication
 */
router.get('/:policyId', protect, async (req, res) => {
    try {
        const policy = await InsuranceApplication.findOne({ policyId: req.params.policyId });

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: 'Policy not found'
            });
        }

        // Check if user owns this policy or is admin
        if (policy.farmerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: policy
        });
    } catch (error) {
        console.error('Get policy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch policy',
            error: error.message
        });
    }
});

module.exports = router;
