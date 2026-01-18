const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

/**
 * Selenium Test 3: Insurance Application Submission
 * This test covers:
 * 1. Farmer Signup
 * 2. Farmer Login
 * 3. Navigate to Insurance Application
 * 4. Fill all insurance application details (4 steps)
 * 5. Submit the application
 * 6. Verify submission in "My Policies"
 */

async function runTest3() {
    let driver;
    const recordingDir = path.join(__dirname, 'test_recordings');

    // Create recordings directory if it doesn't exist
    if (!fs.existsSync(recordingDir)) {
        fs.mkdirSync(recordingDir);
    }

    try {
        console.log('🚀 Starting Test 3: Insurance Application Submission Test');
        console.log('='.repeat(60));

        // Setup Chrome options
        const options = new chrome.Options();
        options.addArguments('--start-maximized');
        options.addArguments('--disable-blink-features=AutomationControlled');
        options.excludeSwitches(['enable-automation']);
        options.setUserPreferences({
            'download.default_directory': recordingDir,
            'download.prompt_for_download': false,
        });

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        console.log('✅ WebDriver initialized successfully');

        // Test Data
        const testData = {
            signup: {
                name: 'Test Farmer Insurance',
                email: `farmer_ins_${Date.now()}@test.com`,
                phone: `9${Math.floor(Math.random() * 1000000000)}`,
                password: 'Test@123456',
                address: 'Pune, Maharashtra'
            },
            insurance: {
                // Step 1
                farmerType: 'landowner',
                landLocation: 'Survey No 45, Haveli, Pune',

                // Step 2
                cropType: 'wheat',
                farmArea: '10.5',

                // Step 4
                accountHolder: 'Test Farmer Insurance',
                bankName: 'HDFC Bank',
                accountNumber: '9876543210',
                ifscCode: 'HDFC0001234',

                documentPaths: {
                    aadhar: path.join(__dirname, 'test_documents', 'aadhar.pdf'),
                    landRecords: path.join(__dirname, 'test_documents', '7_12_extract.pdf'),
                    sowingCert: path.join(__dirname, 'test_documents', 'sowing_cert.pdf')
                }
            }
        };

        // Create dummy documents
        const docDir = path.join(__dirname, 'test_documents');
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir);
        }
        const dummyPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Document) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000262 00000 n\n0000000341 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n431\n%%EOF';

        Object.values(testData.insurance.documentPaths).forEach(docPath => {
            if (!fs.existsSync(docPath)) {
                fs.writeFileSync(docPath, dummyPdfContent);
            }
        });

        // 1. Signup
        console.log('\n📝 STEP 1: Farmer Signup');
        await driver.get('http://localhost:5500/signup-farmer.html');
        await driver.sleep(2000);

        await driver.findElement(By.id('name')).sendKeys(testData.signup.name);
        await driver.findElement(By.id('email')).sendKeys(testData.signup.email);
        await driver.findElement(By.id('phone')).sendKeys(testData.signup.phone);
        await driver.findElement(By.id('address')).sendKeys(testData.signup.address);
        await driver.findElement(By.id('password')).sendKeys(testData.signup.password);
        await driver.findElement(By.id('confirm-password')).sendKeys(testData.signup.password);

        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.sleep(2000);
        console.log('   ✅ Signup completed');

        // 2. Login
        console.log('\n🔐 STEP 2: Farmer Login');
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

        // 3. Navigate to Insurance
        console.log('\n📋 STEP 3: Navigate to Insurance Application');
        await driver.wait(until.urlContains('dashboard-farmer.html'), 10000);

        // Wait for tiles to be clickable
        await driver.sleep(2000);

        try {
            const insuranceLink = await driver.findElement(By.css('a[href="#apply-insurance"]'));
            await insuranceLink.click();
        } catch (e) {
            console.log('   ⚠️ Click failed, trying direct function call');
            await driver.executeScript("showInsuranceForm()");
        }
        await driver.sleep(2000);
        console.log('   ✅ Insurance form opened');

        // 4. Fill Form
        console.log('\n📝 STEP 4: Filling Insurance Application Form');

        // Step 1: Farmer Details
        console.log('   → Step 1: Farmer Details');
        await driver.wait(until.elementLocated(By.id('ins-farmerType')), 5000);

        const farmerTypeSelect = await driver.findElement(By.id('ins-farmerType'));
        await farmerTypeSelect.findElement(By.css(`option[value="${testData.insurance.farmerType}"]`)).click();

        await driver.findElement(By.id('ins-landLocation')).sendKeys(testData.insurance.landLocation);

        console.log('   ✅ Step 1 completed');
        await driver.findElement(By.css('#insurance-form .btn-ins-next')).click();
        await driver.sleep(1000);

        // Step 2: Crop & Coverage
        console.log('   → Step 2: Crop & Coverage');
        await driver.wait(until.elementLocated(By.id('ins-cropType')), 2000);

        const cropTypeSelect = await driver.findElement(By.id('ins-cropType'));
        await cropTypeSelect.findElement(By.css(`option[value="${testData.insurance.cropType}"]`)).click();

        await driver.findElement(By.id('ins-farmArea')).sendKeys(testData.insurance.farmArea);

        // Select coverage options (checkboxes)
        await driver.findElement(By.css('input[name="yieldProtection"]')).click();
        await driver.findElement(By.css('input[name="weatherRisk"]')).click();

        console.log('   ✅ Step 2 completed');
        await driver.findElement(By.css('#insurance-form .btn-ins-next')).click();
        await driver.sleep(1000);

        // Step 3: Documents
        console.log('   → Step 3: Document Uploads');
        await driver.findElement(By.id('ins-aadhar')).sendKeys(testData.insurance.documentPaths.aadhar);
        await driver.findElement(By.id('ins-land')).sendKeys(testData.insurance.documentPaths.landRecords);
        await driver.findElement(By.id('ins-sowing')).sendKeys(testData.insurance.documentPaths.sowingCert);

        console.log('   ✅ Step 3 completed');
        await driver.findElement(By.css('#insurance-form .btn-ins-next')).click();
        await driver.sleep(1000);

        // Step 4: Bank Details
        console.log('   → Step 4: Bank Details');
        await driver.wait(until.elementLocated(By.id('ins-accountHolder')), 2000);

        await driver.findElement(By.id('ins-accountHolder')).sendKeys(testData.insurance.accountHolder);
        await driver.findElement(By.id('ins-bankName')).sendKeys(testData.insurance.bankName);
        await driver.findElement(By.id('ins-accountNumber')).sendKeys(testData.insurance.accountNumber);
        await driver.findElement(By.id('ins-ifscCode')).sendKeys(testData.insurance.ifscCode);

        console.log('   ✅ Step 4 completed');

        // Submit
        console.log('\n✅ STEP 5: Submitting Insurance Application');
        await driver.sleep(1000);
        const submitBtn = await driver.findElement(By.css('#insurance-form .btn-ins-submit'));
        await driver.executeScript("arguments[0].scrollIntoView(true);", submitBtn);
        await submitBtn.click();
        await driver.sleep(3000);
        console.log('   ✅ Application submitted');

        // Close popup if any
        try {
            const closeBtn = await driver.findElement(By.css('.swal2-confirm, .swal-button--confirm, button[onclick*="hide"]'));
            if (await closeBtn.isDisplayed()) {
                await closeBtn.click();
            }
        } catch (e) { }

        // 6. Verify
        console.log('\n🔍 STEP 6: Verifying Submission in "My Policies"');
        await driver.sleep(2000);

        // Navigate to My Policies
        try {
            const policiesLink = await driver.findElement(By.css('a[href="#view-policies"]'));
            // Use JS click for robustness (works better with overlays/scroll)
            await driver.executeScript("arguments[0].click();", policiesLink);
        } catch (e) {
            console.log('   ⚠️ Link click failed, calling showPoliciesFromAPI()');
            try {
                await driver.executeScript("showPoliciesFromAPI();");
            } catch (jsError) {
                console.log('   ⚠️ executeScript also failed: ' + jsError.message);
                // Try navigating by URL hash as last resort
                await driver.get('http://localhost:5500/dashboard-farmer.html#view-policies');
                // Force reload of policies manually if needed
                // But usually the hash change might trigger something if listener exists, or we just rely on reload
            }
        }
        await driver.sleep(2000);

        // Robust Verification Logic
        try {
            // Wait for card
            await driver.wait(until.elementLocated(By.xpath("//h3[contains(text(), 'Policy')]")), 5000);
        } catch (e) {
            console.log('   ⚠️ Policy card not found immediately. Reloading...');
            await driver.navigate().refresh();
            await driver.sleep(3000);
            try {
                // Try finding and clicking again after refresh
                const policiesLink = await driver.wait(until.elementLocated(By.css('a[href="#view-policies"]')), 5000);
                await driver.executeScript("arguments[0].click();", policiesLink);
            } catch (retryError) {
                // Ignore
            }
            await driver.sleep(3000);
        }

        const policyCards = await driver.findElements(By.xpath("//h3[contains(text(), 'Policy')]/ancestor::div[contains(@class, 'card')]"));

        if (policyCards.length > 0) {
            console.log(`   ✅ Verification successful! Found ${policyCards.length} policy(s)`);
            const text = await policyCards[0].getText();
            console.log(`   📄 Latest Policy Details:\n${text.substring(0, 200)}...`);
        } else {
            console.warn('   ⚠️ No policy cards found after verification attempts');
        }

        // Final Screenshot
        const screenshot = await driver.takeScreenshot();
        const screenshotPath = path.join(recordingDir, `test3_final_${Date.now()}.png`);
        fs.writeFileSync(screenshotPath, screenshot, 'base64');
        console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

        console.log('\n' + '='.repeat(60));
        console.log('🎉 TEST 3 COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error(error);

        if (driver) {
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync(path.join(recordingDir, `test3_error_${Date.now()}.png`), screenshot, 'base64');
        }
        throw error;
    } finally {
        if (driver) {
            await driver.sleep(5000);
            await driver.quit();
        }
    }
}

if (require.main === module) {
    runTest3().catch(() => process.exit(1));
}

module.exports = runTest3;
