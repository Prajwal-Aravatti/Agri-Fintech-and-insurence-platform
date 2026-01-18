/**
 * PDF Generator Utility
 * Generates formatted loan application PDFs using PDFKit
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate loan application PDF
 * @param {Object} loanData - Loan application data
 * @param {String} outputPath - Path to save PDF
 * @returns {Promise} - Resolves when PDF is created
 */
function generateLoanPDF(loanData, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({ margin: 50, size: 'A4' });

            // Pipe to file
            const stream = fs.createWriteStream(outputPath);
            doc.pipe(stream);

            // Header
            doc.fontSize(20)
                .fillColor('#2D8659')
                .text('AGRI FINTECH & INSURANCE', { align: 'center' })
                .moveDown(0.5);

            doc.fontSize(16)
                .fillColor('#000000')
                .text('Loan Application Form', { align: 'center' })
                .moveDown(0.3);

            doc.fontSize(10)
                .fillColor('#666666')
                .text(`Application ID: ${loanData._id}`, { align: 'center' })
                .text(`Date: ${new Date(loanData.createdAt).toLocaleDateString()}`, { align: 'center' })
                .text(`Status: ${loanData.status.toUpperCase()}`, { align: 'center' })
                .moveDown(1);

            // Horizontal line
            doc.strokeColor('#2D8659')
                .lineWidth(2)
                .moveTo(50, doc.y)
                .lineTo(545, doc.y)
                .stroke()
                .moveDown(1);

            // Section 1: Personal Details
            addSection(doc, 'Personal Details');
            addField(doc, 'Full Name', `${loanData.firstName} ${loanData.middleName || ''} ${loanData.lastName}`.trim());
            addField(doc, 'Identity Type', loanData.identityType === 'aadhar' ? 'Aadhar Card' : 'PAN Card');
            addField(doc, 'Identity Number', loanData.identityNumber);
            doc.moveDown(0.5);

            // Section 2: Bank Details
            addSection(doc, 'Bank Details');
            addField(doc, 'Account Holder Name', loanData.accountHolderName);
            addField(doc, 'Bank Name', loanData.bankName);
            addField(doc, 'Branch Name', loanData.branchName);
            addField(doc, 'Account Number', loanData.accountNumber);
            addField(doc, 'IFSC Code', loanData.ifscCode);
            addField(doc, 'Account Type', loanData.accountType.charAt(0).toUpperCase() + loanData.accountType.slice(1));
            doc.moveDown(0.5);

            // Section 3: Land & Income Details
            addSection(doc, 'Land & Income Details');
            addField(doc, 'Farm Area', `${loanData.farmArea} acres`);
            addField(doc, 'Primary Crop Type', loanData.cropType);
            addField(doc, 'Land Location', loanData.landLocation);
            addField(doc, 'Annual Income', `₹${loanData.annualIncome.toLocaleString()}`);
            doc.moveDown(0.5);

            // Section 4: Loan Details
            addSection(doc, 'Loan Details');
            addField(doc, 'Loan Amount', `₹${loanData.loanAmount.toLocaleString()}`);
            addField(doc, 'Purpose', loanData.purpose);
            addField(doc, 'Loan Tenure', `${loanData.loanTenure} months`);
            addField(doc, 'Interest Rate', `${loanData.interestRate}% p.a.`);
            addField(doc, 'Monthly EMI', `₹${loanData.monthlyEMI.toLocaleString()}`);
            if (loanData.purposeDescription) {
                addField(doc, 'Purpose Description', loanData.purposeDescription, true);
            }
            doc.moveDown(0.5);

            // Section 5: Submitted Documents
            addSection(doc, 'Submitted Documents');
            doc.fontSize(10)
                .fillColor('#000000')
                .text('✓ Farmer Photo', 70)
                .text('✓ Identity Proof', 70)
                .text('✓ Land Ownership Proof', 70)
                .text('✓ Income Certificate', 70)
                .moveDown(1);

            // Footer
            doc.fontSize(8)
                .fillColor('#888888')
                .text('This is a computer-generated document. No signature is required.', 50, doc.page.height - 50, {
                    align: 'center'
                });

            // Finalize PDF
            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Add section header to PDF
 */
function addSection(doc, title) {
    doc.fontSize(14)
        .fillColor('#2D8659')
        .text(title, { underline: true })
        .moveDown(0.5);
}

/**
 * Add field to PDF
 */
function addField(doc, label, value, multiline = false) {
    doc.fontSize(10)
        .fillColor('#666666')
        .text(`${label}:`, 70, doc.y, { continued: !multiline })

    if (multiline) {
        doc.moveDown(0.3);
    }

    doc.fillColor('#000000')
        .text(value, multiline ? 70 : undefined)
        .moveDown(0.3);
}

module.exports = { generateLoanPDF };
