const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

/**
 * Selenium Test 4: Agent Loan Approval Workflow
 * 
 * Flow:
 * 1. Farmer Signup & Login
 * 2. Farmer Submits Loan Application
 * 3. Farmer Logout
 * 4. Agent Login
 * 5. Agent Approves Loan
 * 6. Agent Verifies in "Reviewed Loans"
 * 7. Agent Logout
 * 8. Farmer Login
 * 9. Farmer Verifies "Approved" Status
 */

async function runTest4() {
    let driver;
    const recordingDir = path.join(__dirname, 'test_recordings');

    if (!fs.existsSync(recordingDir)) {
        fs.mkdirSync(recordingDir);
    }

    try {
        console.log('🚀 Starting Test 4: Agent Loan Approval Workflow');
        console.log('='.repeat(60));

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

        // Unique Farmer Details
        const timestamp = Date.now();
        const farmerName = `Farmer ${timestamp}`;
        const farmerLastName = `TestUser`;
        const farmerEmail = `farmer_${timestamp}@test.com`;
        const farmerPhone = `9${Math.floor(Math.random() * 1000000000)}`;
        const farmerPass = 'Test@123';

        // Agent Details
        const agentEmail = 'agent@demo.com';
        const agentPass = 'password123';

        // --- STEP 1: Farmer Signup & Loan Submission ---
        console.log('\n👨‍🌾 PART 1: Farmer Actions');

        // Signup
        await driver.get('http://localhost:5500/signup-farmer.html');
        await driver.findElement(By.id('name')).sendKeys(`${farmerName} ${farmerLastName}`);
        await driver.findElement(By.id('email')).sendKeys(farmerEmail);
        await driver.findElement(By.id('phone')).sendKeys(farmerPhone);
        await driver.findElement(By.id('address')).sendKeys('Test Address');
        await driver.findElement(By.id('password')).sendKeys(farmerPass);
        await driver.findElement(By.id('confirm-password')).sendKeys(farmerPass);
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.sleep(2000);
        console.log('   ✅ Farmer Signup Completed');

        // Login
        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes('login-farmer')) {
            await driver.get('http://localhost:5500/login-farmer.html');
        }
        await driver.findElement(By.id('email')).sendKeys(farmerEmail);
        await driver.findElement(By.id('password')).sendKeys(farmerPass);
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.sleep(3000);
        console.log('   ✅ Farmer Login Successful');

        // Submit Loan
        await driver.get('http://localhost:5500/dashboard-farmer.html');
        await driver.sleep(3000); // Increased wait for full load

        // Open Form
        console.log('   → Opening Loan Application Form');
        await driver.wait(until.elementLocated(By.css('.tile-grid')), 15000);
        await driver.sleep(1000);

        try {
            const btn = await driver.findElement(By.css('a[href="#apply-loan"]'));
            await driver.executeScript("arguments[0].click();", btn);
        } catch (e) {
            console.log('   ⚠️ Tile click failed, trying fallbacks...');
            let fallbackSuccess = false;

            // Fallback 1: Text search
            if (!fallbackSuccess) {
                try {
                    const textBtn = await driver.findElement(By.xpath("//div[contains(text(), 'Apply for Loan')]/parent::a"));
                    await driver.executeScript("arguments[0].click();", textBtn);
                    fallbackSuccess = true;
                } catch (e2) { }
            }

            // Fallback 2: JS function
            if (!fallbackSuccess) {
                try {
                    await driver.executeScript("showLoanForm()");
                    fallbackSuccess = true;
                } catch (e3) {
                    console.log('   ❌ All open methods failed. Check if dashboard.js is loaded.');
                    throw e3;
                }
            }
        }
        await driver.sleep(1000);

        // Fill Step 1
        console.log('   → Filling Step 1');
        await driver.wait(until.elementIsVisible(driver.findElement(By.id('firstName'))), 5000);
        await driver.findElement(By.id('firstName')).sendKeys(farmerName);
        await driver.findElement(By.id('lastName')).sendKeys(farmerLastName);

        // Select Identity Type
        await driver.findElement(By.css('#identityType option[value="aadhar"]')).click();
        await driver.findElement(By.id('identityNumber')).sendKeys('123456789012');

        // Uploads
        const dummyPath = path.join(__dirname, 'test_documents', 'id_proof.pdf');
        if (!fs.existsSync(dummyPath)) {
            if (!fs.existsSync(path.dirname(dummyPath))) fs.mkdirSync(path.dirname(dummyPath));
            fs.writeFileSync(dummyPath, 'dummy pdf content');
        }

        await driver.findElement(By.id('farmer-photo')).sendKeys(dummyPath);
        await driver.findElement(By.id('identity-proof')).sendKeys(dummyPath);

        // Next Step 1 -> 2
        console.log('   → Going to Step 2');
        const nextBtn = await driver.findElement(By.css('#loan-form .btn-next'));
        await driver.executeScript("arguments[0].scrollIntoView(true); arguments[0].click();", nextBtn);
        await driver.wait(until.elementIsVisible(driver.findElement(By.id('accountHolderName'))), 5000);
        await driver.sleep(500);

        // Fill Step 2
        console.log('   → Filling Step 2');
        await driver.findElement(By.id('accountHolderName')).sendKeys(`${farmerName} ${farmerLastName}`);
        await driver.findElement(By.id('bankName')).sendKeys('SBI');
        await driver.findElement(By.id('branchName')).sendKeys('Khandwa Branch');
        await driver.findElement(By.id('accountNumber')).sendKeys('1234567890');
        await driver.findElement(By.id('confirmAccountNumber')).sendKeys('1234567890');
        await driver.findElement(By.id('ifscCode')).sendKeys('SBIN0001234');

        // Select Account Type
        await driver.findElement(By.css('#accountType option[value="savings"]')).click();

        // Next Step 2 -> 3
        console.log('   → Going to Step 3');
        // Reuse the SAME next button!
        await driver.executeScript("arguments[0].scrollIntoView(true); arguments[0].click();", nextBtn);
        await driver.wait(until.elementIsVisible(driver.findElement(By.id('farmArea'))), 5000);
        await driver.sleep(500);

        // Fill Step 3
        console.log('   → Filling Step 3');
        await driver.findElement(By.id('farmArea')).sendKeys('5');
        // Select Crop
        await driver.findElement(By.css('#cropType option[value="wheat"]')).click();
        await driver.findElement(By.id('landLocation')).sendKeys('Test Village');
        await driver.findElement(By.id('annualIncome')).sendKeys('500000');
        await driver.findElement(By.id('land-proof')).sendKeys(dummyPath);
        await driver.findElement(By.id('income-cert')).sendKeys(dummyPath);

        // Next Step 3 -> 4
        console.log('   → Going to Step 4');
        // Reuse the SAME next button!
        await driver.executeScript("arguments[0].scrollIntoView(true); arguments[0].click();", nextBtn);
        await driver.wait(until.elementIsVisible(driver.findElement(By.id('loanAmount'))), 5000);
        await driver.sleep(500);

        // Fill Step 4
        console.log('   → Filling Step 4');
        await driver.findElement(By.id('loanAmount')).sendKeys('50000');
        // Select Purpose
        await driver.findElement(By.css('#purpose option[value="seeds"]')).click();
        // Select Tenure
        await driver.findElement(By.css('#loanTenure option[value="12"]')).click();

        await driver.findElement(By.id('purposeDescription')).sendKeys('Test Purpose');

        // Submit
        console.log('   → Submitting Loan');
        const submitBtn = await driver.findElement(By.css('#loan-form .btn-submit'));
        await driver.executeScript("arguments[0].scrollIntoView(true); arguments[0].click();", submitBtn);
        await driver.sleep(3000);
        console.log('   ✅ Loan Submitted');

        // Logout Farmer
        const logoutBtn = await driver.findElement(By.id('logout-btn'));
        await driver.executeScript("arguments[0].click();", logoutBtn);
        await driver.sleep(2000);
        console.log('   ✅ Farmer Logged Out');


        // --- STEP 2: Agent Approval ---
        console.log('\n🕵️ PART 2: Agent Actions');

        // Agent Login
        await driver.get('http://localhost:5500/login-agent.html');
        await driver.sleep(1000);
        await driver.findElement(By.id('email')).sendKeys(agentEmail);
        await driver.findElement(By.id('password')).sendKeys(agentPass);
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.sleep(3000);
        console.log('   ✅ Agent Login Successful');

        // Go to Review Loans
        try {
            const reviewBtn = await driver.findElement(By.css('a[href="#review-loans"]'));
            await driver.executeScript("arguments[0].click();", reviewBtn);
        } catch (e) {
            await driver.executeScript("showLoanReviews()");
        }
        await driver.sleep(2000);

        // Find Loan Card by Farmer Name
        console.log(`   → Looking for loan from: ${farmerName}`);

        // Wait for cards
        await driver.wait(until.elementLocated(By.xpath(`//h3[contains(text(), '${farmerName}')]`)), 10000);

        const loanCardTitle = await driver.findElement(By.xpath(`//h3[contains(text(), '${farmerName}')]`));
        const loanCard = await loanCardTitle.findElement(By.xpath('./parent::div')); // Parent card

        // Find Approve button in this card
        const approveBtn = await loanCard.findElement(By.xpath(".//button[contains(text(), 'Approve')]"));
        await driver.executeScript("arguments[0].scrollIntoView(true);", approveBtn);
        await driver.sleep(1000);

        console.log('   → Clicking Approve button...');
        await driver.executeScript("arguments[0].click();", approveBtn);
        console.log('   → Approve button clicked.');

        // Verify Approval Success
        try {
            // Check for success alert or card removal
            // 1. Check for success message
            await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'alert-success') or contains(text(), 'approved successfully')]")), 5000);
            console.log('   ✅ Success Alert appeared');
        } catch (e) {
            console.log('   ⚠️ No success alert found. Checking if card disappeared...');
        }

        // 2. Wait for card to disappear from Pending list (because list reloads)
        await driver.sleep(2000); // Wait for potential reload
        try {
            await driver.wait(until.stalenessOf(loanCard), 5000);
            console.log('   ✅ Loan card removed from Pending list');
        } catch (e) {
            console.log('   ⚠️ Loan card still present in Pending list. Approval might have failed.');
            // Check for error alert
            try {
                const errorAlert = await driver.findElement(By.xpath("//div[contains(@class, 'alert-error') or contains(@class, 'error')]"));
                console.log('   ❌ Error Alert Found: ' + await errorAlert.getText());
            } catch (e2) { }
        }

        await driver.sleep(2000);
        console.log('   ✅ Loan Approval Step Completed');

        // Verify in "Reviewed Loans"
        console.log('   → Verifying in "Reviewed Loans"');
        try {
            const reviewedBtn = await driver.findElement(By.css('a[href="#reviewed-loans"]'));
            await driver.executeScript("arguments[0].click();", reviewedBtn);
        } catch (e) {
            await driver.executeScript("showReviewedLoans()");
        }
        await driver.sleep(2000);

        // Check if card exists and has Approved status
        try {
            await driver.wait(until.elementLocated(By.xpath(`//h3[contains(text(), '${farmerName}')]`)), 5000);
        } catch (e) {
            console.log('   ⚠️ Reviewed loan not found immediately. Reloading...');
            await driver.navigate().refresh();
            await driver.sleep(3000);
            try {
                const reviewedBtn = await driver.findElement(By.css('a[href="#reviewed-loans"]'));
                await driver.executeScript("arguments[0].click();", reviewedBtn);
            } catch (e2) {
                await driver.executeScript("showReviewedLoans()");
            }
            await driver.sleep(2000);
            // Try again
            await driver.wait(until.elementLocated(By.xpath(`//h3[contains(text(), '${farmerName}')]`)), 10000);
        }

        const reviewedCard = await driver.findElement(By.xpath(`//h3[contains(text(), '${farmerName}')]/ancestor::div[contains(@class, 'card')]`));

        // Check for 'approved' text/badge
        const cardText = await reviewedCard.getText();
        if (cardText.toLowerCase().includes('approved')) {
            console.log('   ✅ Verified: Loan appears in Reviewed list with Approved status');
        } else {
            throw new Error('Loan found in Reviewed list but status is not Approved');
        }

        // Logout Agent
        const agentLogout = await driver.findElement(By.id('logout-btn'));
        await driver.executeScript("arguments[0].click();", agentLogout);
        await driver.sleep(2000);
        console.log('   ✅ Agent Logged Out');


        // --- STEP 3: Farmer Verification ---
        console.log('\n👨‍🌾 PART 3: Farmer Verification');

        // Login Farmer
        await driver.get('http://localhost:5500/login-farmer.html');
        await driver.findElement(By.id('email')).sendKeys(farmerEmail);
        await driver.findElement(By.id('password')).sendKeys(farmerPass);
        await driver.findElement(By.css('button[type="submit"]')).click();

        // Wait for redirection and dashboard load
        await driver.wait(until.urlContains('dashboard-farmer.html'), 10000);
        await driver.wait(until.elementLocated(By.id('dashboard-stats')), 10000); // Ensures JS loaded
        await driver.sleep(2000);

        // Go to My Loans
        console.log('   → Checking "My Loans"');
        try {
            const myLoansBtn = await driver.findElement(By.css('a[href="#view-loans"]'));
            await driver.executeScript("arguments[0].click();", myLoansBtn);
        } catch (e) {
            await driver.executeScript("showLoans()");
        }
        await driver.sleep(2000);

        // Check status
        // Use robust reload if needed (from Test 2 experience)
        try {
            await driver.wait(until.elementLocated(By.xpath("//span[contains(@class, 'badge')]")), 5000);
        } catch (e) {
            console.log('   ⚠️ Stats not updated immediately, reloading...');
            await driver.navigate().refresh();
            await driver.sleep(3000);
            await driver.executeScript("showLoans()");
            await driver.sleep(2000);
        }

        // Find status badge
        // We look for the badge associated with this farmer's loan.
        const statusBadge = await driver.findElement(By.xpath("//div[contains(@class, 'card')]//span[contains(@class, 'badge')]/*[contains(text(), 'approved')] | //div[contains(@class, 'card')]//p[contains(text(), 'approved')]"));

        console.log('   ✅ Verified: Farmer sees "Approved" status');

        // Screenshot
        const screenshot = await driver.takeScreenshot();
        const screenshotPath = path.join(recordingDir, `test4_success_${Date.now()}.png`);
        fs.writeFileSync(screenshotPath, screenshot, 'base64');
        console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

        console.log('\n' + '='.repeat(60));
        console.log('🎉 TEST 4 COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error(error);
        if (driver) {
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync(path.join(recordingDir, `test4_error_${Date.now()}.png`), screenshot, 'base64');
        }
        throw error;
    } finally {
        if (driver) {
            await driver.sleep(3000);
            await driver.quit();
        }
    }
}

if (require.main === module) {
    runTest4().catch(() => process.exit(1));
}

module.exports = runTest4;
