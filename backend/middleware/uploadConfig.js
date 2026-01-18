/**
 * Upload Configuration Middleware
 * Multer configuration for handling file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: fieldname-timestamp-randomstring.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images and PDFs only
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG, and PDF files are allowed!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter,
    // Ignore unexpected fields to prevent errors
    onError: function(err, next) {
        // Log the error but continue processing
        console.error('Multer error:', err);
        next(err);
    }
});

// Middleware for loan application uploads (4 files)
const loanUpload = upload.fields([
    { name: 'farmerPhoto', maxCount: 1 },
    { name: 'identityProof', maxCount: 1 },
    { name: 'landProof', maxCount: 1 },
    { name: 'incomeCert', maxCount: 1 }
]);

// Middleware for insurance application uploads (3 files)
const insuranceUpload = upload.fields([
    { name: 'aadharCard', maxCount: 1 },
    { name: 'landRecords', maxCount: 1 },
    { name: 'sowingCertificate', maxCount: 1 }
]);

module.exports = { upload, loanUpload, insuranceUpload };
