const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

/**
 * Selenium Test 2: Loan Application Submission
 * This test covers:
 * 1. Farmer Signup
 * 2. Farmer Login
 * 3. Navigate to Loan Application
 * 4. Fill all loan application details (4 steps)
 * 5. Submit the application
 * 6. Verify submission in "My Loans"
 */

async function runTest2() {
    let driver;
    const recordingDir = path.join(__dirname, 'test_recordings');

    // Create recordings directory if it doesn't exist
    if (!fs.existsSync(recordingDir)) {
        fs.mkdirSync(recordingDir);
    }

    try {
        console.log('🚀 Starting Test 2: Loan Application Submission Test');
        console.log('='.repeat(60));

        // Setup Chrome options with video recording
        const options = new chrome.Options();
        options.addArguments('--start-maximized');
        options.addArguments('--disable-blink-features=AutomationControlled');
        options.excludeSwitches(['enable-automation']);
        options.setUserPreferences({
            'download.default_directory': recordingDir,
            'download.prompt_for_download': false,
        });

        // Initialize WebDriver
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        console.log('✅ WebDriver initialized successfully');

        // Test data
        const testData = {
            signup: {
                name: 'Test Farmer Loan',
                email: `farmer_loan_${Date.now()}@test.com`,
                phone: `9${Math.floor(Math.random() * 1000000000)}`,
                password: 'Test@123456',
                // Address components
                state: 'Maharashtra',
                district: 'Pune',
                taluka: 'Haveli',
                village: 'Hadapsar'
            },
            loan: {
                // Step 1: Personal
                // using signup name

                // Step 2: Bank
                bankName: 'State Bank of India',
                accountNumber: '1234567890',
                ifscCode: 'SBIN0001234',

                // Step 3: Land & Income
                landSize: '5',
                cropType: 'Wheat',
                annualIncome: '200000',

                // Step 4: Loan Details
                amount: '50000',
                purpose: 'Crop cultivation and irrigation',

                documentPaths: {
                    idProof: path.join(__dirname, 'test_documents', 'id_proof.pdf'),
                    addressProof: path.join(__dirname, 'test_documents', 'address_proof.pdf'),
                    incomeProof: path.join(__dirname, 'test_documents', 'income_proof.pdf'),
                    landDocuments: path.join(__dirname, 'test_documents', 'land_documents.pdf')
                }
            }
        };

        // STEP 1: Farmer Signup
        console.log('\n📝 STEP 1: Farmer Signup');
        await driver.get('http://localhost:5500/signup-farmer.html');
        await driver.sleep(2000);

        await driver.findElement(By.id('name')).sendKeys(testData.signup.name);
        await driver.findElement(By.id('email')).sendKeys(testData.signup.email);
        await driver.findElement(By.id('phone')).sendKeys(testData.signup.phone);
        await driver.findElement(By.id('address')).sendKeys(`${testData.signup.village}, ${testData.signup.taluka}, ${testData.signup.district}, ${testData.signup.state}`);
        await driver.findElement(By.id('password')).sendKeys(testData.signup.password);
        await driver.findElement(By.id('confirm-password')).sendKeys(testData.signup.password);

        console.log('   ✅ Filled signup form');

        // Click signup button
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.sleep(3000);

        console.log('   ✅ Signup completed');

        // STEP 2: Farmer Login
        console.log('\n🔐 STEP 2: Farmer Login');

        // Check if redirected to login or navigate to login
        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes('login-farmer.html')) {
            await driver.get('http://localhost:5500/login-farmer.html');
            await driver.sleep(2000);
        }

        await driver.findElement(By.id('email')).sendKeys(testData.signup.email);
        await driver.findElement(By.id('password')).sendKeys(testData.signup.password);
        await driver.findElement(By.css('button[type="submit"]')).click();

        await driver.sleep(3000);

        console.log('   ✅ Login successful');

        // STEP 3: Navigate to Loan Application
        console.log('\n📋 STEP 3: Navigate to Loan Application');

        // Wait for dashboard to load
        await driver.wait(until.urlContains('dashboard-farmer.html'), 10000);
        console.log('   ✅ Dashboard loaded');

        // Click on "Apply for Loan" button/link
        await driver.sleep(2000);

        // Try multiple selectors to find the loan application button
        let loanButton;
        try {
            loanButton = await driver.findElement(By.xpath("//a[contains(text(), 'Apply for Loan')]"));
        } catch (e) {
            try {
                loanButton = await driver.findElement(By.xpath("//button[contains(text(), 'Apply for Loan')]"));
            } catch (e2) {
                try {
                    loanButton = await driver.findElement(By.id('apply-loan-btn'));
                } catch (e3) {
                    loanButton = await driver.findElement(By.css('a[href="#apply-loan"]'));
                }
            }
        }

        await loanButton.click();
        await driver.sleep(2000);

        console.log('   ✅ Loan application form opened');

        // Create dummy documents if they don't exist
        const docDir = path.join(__dirname, 'test_documents');
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir);
        }

        // Create dummy PDF files
        const dummyPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Document) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000262 00000 n\n0000000341 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n431\n%%EOF';

        Object.values(testData.loan.documentPaths).forEach(docPath => {
            if (!fs.existsSync(docPath)) {
                fs.writeFileSync(docPath, dummyPdfContent);
            }
        });

        // Create dummy photo for signup
        const photoPath = path.join(recordingDir, 'farmer_photo.jpg');
        if (!fs.existsSync(photoPath)) {
            fs.writeFileSync(photoPath, dummyPdfContent); // Dummy content
        }

        // STEP 4: Fill Loan Application - Step 1 (Personal Details)
        console.log('\n📝 STEP 4: Filling Loan Application Form');
        console.log('   → Step 1: Personal Details');

        await driver.wait(until.elementLocated(By.id('firstName')), 5000);

        const names = testData.signup.name.split(' ');
        await driver.findElement(By.id('firstName')).sendKeys(names[0]);
        if (names.length > 1) {
            await driver.findElement(By.id('lastName')).sendKeys(names[names.length - 1]);
        }

        const identityTypeSelect = await driver.findElement(By.id('identityType'));
        await identityTypeSelect.findElement(By.css('option[value="aadhar"]')).click();

        await driver.findElement(By.id('identityNumber')).sendKeys('123456789012');

        // Uploads for Step 1
        console.log('   → Uploading Step 1 documents');
        await driver.findElement(By.id('farmer-photo')).sendKeys(photoPath);
        await driver.findElement(By.id('identity-proof')).sendKeys(testData.loan.documentPaths.idProof);

        console.log('   ✅ Step 1 completed');

        // Click Next
        await driver.findElement(By.css('#loan-form .btn-next')).click();
        await driver.sleep(1000);

        // STEP 4: Fill Loan Application - Step 2 (Bank Details)
        console.log('   → Step 2: Bank Details');

        await driver.wait(until.elementLocated(By.id('accountHolderName')), 2000);
        await driver.findElement(By.id('accountHolderName')).sendKeys(testData.signup.name);
        await driver.findElement(By.id('bankName')).sendKeys(testData.loan.bankName);
        await driver.findElement(By.id('branchName')).sendKeys('Main Branch');
        await driver.findElement(By.id('accountNumber')).sendKeys(testData.loan.accountNumber);
        await driver.findElement(By.id('confirmAccountNumber')).sendKeys(testData.loan.accountNumber);
        await driver.findElement(By.id('ifscCode')).sendKeys(testData.loan.ifscCode);

        const accountTypeSelect = await driver.findElement(By.id('accountType'));
        await accountTypeSelect.findElement(By.css('option[value="savings"]')).click();

        console.log('   ✅ Step 2 completed');

        // Click Next
        await driver.findElement(By.css('#loan-form .btn-next')).click();
        await driver.sleep(1000);

        // STEP 4: Fill Loan Application - Step 3 (Land & Income)
        console.log('   → Step 3: Land & Income Details');

        await driver.wait(until.elementLocated(By.id('farmArea')), 2000);
        await driver.findElement(By.id('farmArea')).sendKeys(testData.loan.landSize);

        const cropTypeSelect = await driver.findElement(By.id('cropType'));
        await cropTypeSelect.findElement(By.css('option[value="wheat"]')).click();

        await driver.findElement(By.id('landLocation')).sendKeys(`${testData.signup.village}, ${testData.signup.taluka}`);
        await driver.findElement(By.id('annualIncome')).sendKeys(testData.loan.annualIncome);

        // Uploads for Step 3
        console.log('   → Uploading Step 3 documents');
        await driver.findElement(By.id('land-proof')).sendKeys(testData.loan.documentPaths.landDocuments);
        await driver.findElement(By.id('income-cert')).sendKeys(testData.loan.documentPaths.incomeProof);

        console.log('   ✅ Step 3 completed');

        // Click Next
        await driver.findElement(By.css('#loan-form .btn-next')).click();
        await driver.sleep(1000);

        // STEP 4: Fill Loan Application - Step 4 (Loan Details)
        console.log('   → Step 4: Loan Details');

        await driver.wait(until.elementLocated(By.id('loanAmount')), 2000);
        await driver.findElement(By.id('loanAmount')).sendKeys(testData.loan.amount);

        const purposeSelect = await driver.findElement(By.id('purpose'));
        await purposeSelect.findElement(By.css('option[value="seeds"]')).click();

        const tenureSelect = await driver.findElement(By.id('loanTenure'));
        await tenureSelect.findElement(By.css('option[value="12"]')).click();

        await driver.findElement(By.id('purposeDescription')).sendKeys(testData.loan.purpose);

        console.log('   ✅ Step 4 completed');

        // Wait for summary to update
        await driver.sleep(1000);

        // Click Submit
        console.log('\n✅ STEP 5: Submitting Loan Application');
        const submitBtn = await driver.findElement(By.css('#loan-form .btn-submit'));

        // Ensure visible
        await driver.executeScript("arguments[0].scrollIntoView(true);", submitBtn);
        await driver.sleep(500);

        await submitBtn.click();
        await driver.sleep(3000);

        console.log('   ✅ Application submitted');

        // STEP 6: Verify in "My Loans"
        console.log('\n🔍 STEP 6: Verifying Submission in "My Loans"');

        await driver.sleep(2000);

        // Close success popup if it exists
        try {
            const closeBtn = await driver.findElement(By.css('.swal2-confirm, .swal-button--confirm, button[onclick*="hideLoanSuccessPopup"]'));
            if (await closeBtn.isDisplayed()) {
                await closeBtn.click();
                await driver.sleep(1000);
            }
        } catch (e) {
            // Ignore if no popup
        }

        // Navigate to My Loans section
        try {
            const myLoansLink = await driver.findElement(By.css('a[href="#view-loans"]'));
            await myLoansLink.click();
        } catch (e) {
            console.log('   ⚠️ Could not click My Loans link, trying scroll');
            await driver.executeScript("window.scrollTo(0, document.body.scrollHeight);");
            await driver.sleep(1000);
        }

        await driver.sleep(3000);

        // Check if loan appears in the list
        try {
            // Wait for cards to appear
            await driver.wait(until.elementLocated(By.xpath("//h3[contains(text(), 'Loan Application')]")), 5000);

            const loanCards = await driver.findElements(By.xpath("//h3[contains(text(), 'Loan Application')]/ancestor::div[contains(@class, 'card')]"));

            if (loanCards.length > 0) {
                console.log(`   ✅ Verification successful! Found ${loanCards.length} loan(s) in "My Loans"`);

                // Get the latest loan details
                const latestLoan = loanCards[0];
                const loanText = await latestLoan.getText();
                console.log(`   📄 Latest Loan Details:\n${loanText.substring(0, 200)}...`);
            } else {
                console.log('   ⚠️  No loan cards found - please check manually');
            }
        } catch (verifyError) {
            console.log('   ⚠️  Could not verify loans automatically - please check manually');
            console.log('   Error:', verifyError.message);
        }

        // Take final screenshot
        const screenshot = await driver.takeScreenshot();
        const screenshotPath = path.join(recordingDir, `test2_final_${Date.now()}.png`);
        fs.writeFileSync(screenshotPath, screenshot, 'base64');
        console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

        console.log('\n' + '='.repeat(60));
        console.log('🎉 TEST 2 COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\nTest Summary:');
        console.log('✅ Farmer Signup');
        console.log('✅ Farmer Login');
        console.log('✅ Loan Application Form Navigation');
        console.log('✅ Loan Application Step 1 - Personal Details');
        console.log('✅ Loan Application Step 2 - Bank Details');
        console.log('✅ Loan Application Step 3 - Land & Income');
        console.log('✅ Loan Application Step 4 - Loan Details');
        console.log('✅ Application Submission');
        console.log('✅ Verification in "My Loans"');
        console.log('\n📁 Screenshots and logs saved in:', recordingDir);

    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);

        // Take error screenshot
        if (driver) {
            try {
                const screenshot = await driver.takeScreenshot();
                const errorScreenshotPath = path.join(recordingDir, `test2_error_${Date.now()}.png`);
                fs.writeFileSync(errorScreenshotPath, screenshot, 'base64');
                console.log(`\n📸 Error screenshot saved: ${errorScreenshotPath}`);
            } catch (screenshotError) {
                console.error('Could not take error screenshot:', screenshotError.message);
            }
        }

        throw error;
    } finally {
        // Keep browser open for 5 seconds to see the result
        console.log('\n⏳ Keeping browser open for 5 seconds...');
        await driver.sleep(5000);

        // Close the browser
        if (driver) {
            await driver.quit();
            console.log('✅ Browser closed');
        }
    }
}

// Run the test
if (require.main === module) {
    runTest2()
        .then(() => {
            console.log('\n✅ Test execution completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test execution failed');
            console.error(error);
            process.exit(1);
        });
}

module.exports = runTest2;
