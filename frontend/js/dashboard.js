/**
 * Agri Fintech & Insurance - Dashboard JavaScript
 * Handles dashboard data loading, form submissions, and interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only load if on dashboard page (though this script is likely only included there)
    try {
        loadDashboardData();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
    setupDashboardEventListeners();
});

function setupDashboardEventListeners() {
    // Form submissions
    const loanForm = document.getElementById('loan-form');
    if (loanForm) {
        loanForm.addEventListener('submit', handleLoanFormSubmit);

        // Add explicit click handler to submit button as backup
        const submitBtn = loanForm.querySelector('.btn-submit');
        if (submitBtn && !submitBtn.hasAttribute('data-submit-handler-attached')) {
            submitBtn.setAttribute('data-submit-handler-attached', 'true');
            submitBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Validate all steps and submit
                if (validateAllLoanSteps()) {
                    loanForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            });
        }
    }

    const insuranceForm = document.getElementById('insurance-form');
    if (insuranceForm) insuranceForm.addEventListener('submit', handleInsuranceFormSubmit);

    const claimForm = document.getElementById('claim-form');
    if (claimForm) claimForm.addEventListener('submit', handleClaimFormSubmit);

    // File upload
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Multi-step form file uploads
    setupLoanFormFileUploads();

    // Loan summary calculation
    const loanAmount = document.getElementById('loanAmount');
    const loanTenure = document.getElementById('loanTenure');
    if (loanAmount) loanAmount.addEventListener('input', updateLoanSummary);
    if (loanTenure) loanTenure.addEventListener('change', updateLoanSummary);
}

/**
 * Handle Loan Form Submit
 */
function handleLoanFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();

    // Validate ALL steps before submitting (not just current step)
    if (!validateAllLoanSteps()) {
        return; // Stop submission if validation fails
    }

    const loanForm = document.getElementById('loan-form');

    // Extract only text field values directly from form inputs (skip file inputs)
    const textData = {};

    // List of expected text fields (exclude file inputs and validation fields)
    const expectedFields = [
        'firstName', 'middleName', 'lastName',
        'identityType', 'identityNumber',
        'accountHolderName', 'bankName', 'branchName',
        'accountNumber', 'ifscCode', 'accountType',
        // Note: We exclude 'confirmAccountNumber' - it's only for validation
        'farmArea', 'cropType', 'landLocation', 'annualIncome',
        'loanAmount', 'purpose', 'loanTenure', 'purposeDescription'
    ];

    // Manually extract only text field values (don't use FormData to avoid file inputs)
    expectedFields.forEach(fieldName => {
        const input = loanForm.querySelector(`[name="${fieldName}"]`);
        if (input && input.type !== 'file' && input.value) {
            textData[fieldName] = input.value.trim();
        }
    });

    handleLoanApplication(textData);
}

/**
 * Handle Insurance Form Submit
 */
function handleInsuranceFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    handleInsuranceApplication(formData);
}

/**
 * Handle Claim Form Submit
 */
function handleClaimFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    handleClaimSubmission(data);
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    if (!currentUser) {
        // If common.js hasn't loaded user yet, wait or redirect.
        // Assuming common.js runs first and sets currentUser if in localStorage.
        const storedUser = localStorage.getItem('currentUser');
        if (!storedUser) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = JSON.parse(storedUser);
    }

    // Show loading state
    const statsContainer = document.getElementById('dashboard-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
        <div class="tile-grid">
          <div class="tile"><div class="tile-title">Loading...</div></div>
        </div>
      `;
    }

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');

        // Fetch loans from backend API
        let loans = [];
        if (token) {
            try {
                const response = await fetch('http://localhost:3000/api/loans', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (result.success) {
                    loans = result.data;
                }
            } catch (error) {
                console.error('Error fetching loans from API:', error);
            }
        }

        // For policies and claims, still use localStorage (not implemented in backend yet)
        const policies = JSON.parse(localStorage.getItem('policies') || '[]')
            .filter(policy => policy.farmerId === currentUser.id);

        const claims = JSON.parse(localStorage.getItem('claims') || '[]')
            .filter(claim => claim.farmerId === currentUser.id);

        // Display dashboard stats
        updateDashboardStats({
            loans: loans.length,
            policies: policies.length,
            claims: claims.length,
            pendingLoans: loans.filter(l => l.status === 'pending').length
        });

        // Display recent activities
        displayRecentActivities(loans, policies, claims);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        updateDashboardStats({
            loans: 0,
            policies: 0,
            claims: 0,
            pendingLoans: 0
        });
    }
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats(stats) {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
    <div class="tile-grid">
      <div class="tile">
        <img src="assets/images/loan-icon.png" alt="Active Loans" class="tile-icon-img" onerror="this.style.display='none';">
        <div class="tile-title">Active Loans</div>
        <div class="tile-description">${stats.loans}</div>
      </div>
      <div class="tile">
        <img src="assets/images/insurance-icon.png" alt="Policies" class="tile-icon-img" onerror="this.style.display='none';">
        <div class="tile-title">Policies</div>
        <div class="tile-description">${stats.policies}</div>
      </div>
      <div class="tile">
        <img src="assets/images/claim-icon.png" alt="Claims" class="tile-icon-img" onerror="this.style.display='none';">
        <div class="tile-title">Claims</div>
        <div class="tile-description">${stats.claims}</div>
      </div>
      <div class="tile">
        <img src="assets/images/status-icon.png" alt="Pending" class="tile-icon-img" onerror="this.style.display='none';">
        <div class="tile-title">Pending</div>
        <div class="tile-description">${stats.pendingLoans}</div>
      </div>
    </div>
  `;
}

/**
 * Display recent activities
 */
function displayRecentActivities(loans, policies, claims) {
    const activitiesContainer = document.getElementById('recent-activities');
    if (!activitiesContainer) return;

    const allActivities = [
        ...loans.map(l => ({ ...l, type: 'loan', date: l.createdAt })),
        ...policies.map(p => ({ ...p, type: 'policy', date: p.createdAt })),
        ...claims.map(c => ({ ...c, type: 'claim', date: c.createdAt }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (allActivities.length === 0) {
        activitiesContainer.innerHTML = '<p>No recent activities</p>';
        return;
    }

    activitiesContainer.innerHTML = allActivities.map(activity => {
        const iconSrc = activity.type === 'loan' ? 'assets/images/loan-icon.png' :
            activity.type === 'policy' ? 'assets/images/insurance-icon.png' :
                'assets/images/claim-icon.png';
        const title = activity.type === 'loan' ? `Loan ${activity.id}` :
            activity.type === 'policy' ? `Policy ${activity.id}` :
                `Claim ${activity.id}`;

        return `
      <div class="card">
        <div class="card-header">
          <img src="${iconSrc}" alt="${activity.type}" class="card-icon-img" style="width: 32px; height: 32px; margin-right: 0.5rem;" onerror="this.style.display='none';">
          <h3>${title}</h3>
          <span class="badge badge-${activity.status}">${activity.status}</span>
        </div>
        <p>Date: ${new Date(activity.date).toLocaleDateString()}</p>
      </div>
    `;
    }).join('');
}

/**
 * Handle loan application submission to backend
 */
async function handleLoanApplication(formData) {
    try {
        // Get the current user's token (try both 'token' and 'authToken')
        let token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            showAlert('Please login to submit loan application', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        // Create a FRESH FormData (don't create from form to avoid including form's file inputs)
        const submitData = new FormData();

        // Add all text fields from formData (already filtered to exclude validation fields)
        for (const [key, value] of Object.entries(formData)) {
            if (value !== undefined && value !== null && value !== '') {
                submitData.append(key, String(value));
            }
        }

        // Add files from loanFormFiles object (these are the only files we send)
        // Map input IDs to backend field names
        const fileMapping = {
            'farmer-photo': 'farmerPhoto',
            'identity-proof': 'identityProof',
            'land-proof': 'landProof',
            'income-cert': 'incomeCert'
        };

        let hasAllFiles = true;
        const missingFiles = [];

        for (const [inputId, fieldName] of Object.entries(fileMapping)) {
            if (loanFormFiles[inputId]) {
                try {
                    // Convert base64 to File object
                    const fileData = loanFormFiles[inputId];
                    let blob;

                    // Check if fileData.data is a base64 string or a data URL
                    if (fileData.data.startsWith('data:')) {
                        // It's a data URL, convert to blob
                        const response = await fetch(fileData.data);
                        blob = await response.blob();
                    } else if (fileData.data.startsWith('blob:')) {
                        // It's already a blob URL, fetch it
                        blob = await fetch(fileData.data).then(r => r.blob());
                    } else {
                        // Assume it's a base64 string
                        const base64Data = fileData.data.split(',')[1] || fileData.data;
                        const byteCharacters = atob(base64Data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        blob = new Blob([byteArray], { type: fileData.type });
                    }

                    const file = new File([blob], fileData.name, { type: fileData.type });
                    // Append file with the exact field name expected by backend
                    submitData.append(fieldName, file);
                    console.log(`Added file: ${fieldName} (${fileData.name}, ${file.size} bytes)`);
                } catch (error) {
                    console.error(`Error processing file ${inputId}:`, error);
                    hasAllFiles = false;
                    missingFiles.push(fieldName);
                }
            } else {
                // Check if file is required
                const fileInput = document.getElementById(inputId);
                if (fileInput && fileInput.hasAttribute('required')) {
                    hasAllFiles = false;
                    missingFiles.push(fieldName);
                }
            }
        }

        if (!hasAllFiles) {
            showAlert(`Please upload all required files: ${missingFiles.join(', ')}`, 'error');
            return;
        }


        // Debug: Log what we're sending (remove in production)
        console.log('Submitting loan application...');
        console.log('Text fields:', Object.fromEntries([...submitData.entries()].filter(([k, v]) => !(v instanceof File))));
        console.log('Files:', Array.from(submitData.entries()).filter(([k, v]) => v instanceof File).map(([k]) => k));

        // Show loading message
        showAlert('Submitting your application...', 'info');

        // Submit to backend
        let response;
        try {
            response = await fetch('http://localhost:3000/api/loans/apply', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: submitData
            });
        } catch (networkError) {
            console.error('Network error:', networkError);
            showAlert(`Network error: Cannot connect to backend server. Please make sure the backend is running on http://localhost:3000`, 'error');
            return;
        }

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response text:', responseText);

        if (!response.ok) {
            let errorMessage = 'Failed to submit loan application';
            try {
                const errorJson = JSON.parse(responseText);
                errorMessage = errorJson.message || errorJson.error || errorMessage;
            } catch (e) {
                // If response is not JSON, show the raw text or status text
                errorMessage = responseText || response.statusText || errorMessage;
            }

            // Add status code to error message for debugging
            showAlert(`Error (${response.status}): ${errorMessage}`, 'error');
            return;
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            showAlert(`Error: Invalid response from server. Please try again.`, 'error');
            return;
        }

        if (result.success) {
            // Store loan ID for PDF download
            const loanId = result.data.loanId;

            // Show success message with download button
            showLoanSuccessPopup(loanId, result.data);

            // Reset form
            hideLoanForm();
            loadDashboardData(); // Refresh stats
        } else {
            showAlert(`Error: ${result.message || result.error || 'Failed to submit loan application'}`, 'error');
        }
    } catch (error) {
        console.error('Loan submission error:', error);
        console.error('Error stack:', error.stack);
        const errorMessage = error.message || 'Network error. Please check if the backend server is running on http://localhost:3000';
        showAlert(`Failed to submit loan application: ${errorMessage}`, 'error');
    }
}

/**
 * Calculate loan eligibility
 */
function calculateLoanEligibility(data) {
    const farmArea = parseFloat(data.farmArea) || 0;
    const loanAmount = parseFloat(data.loanAmount) || 0;

    // Simple eligibility rules
    if (farmArea < 0.5) {
        return {
            eligible: false,
            reason: 'Farm area must be at least 0.5 acres',
            maxLoanAmount: 0
        };
    }

    if (loanAmount > farmArea * 50000) {
        return {
            eligible: false,
            reason: 'Loan amount exceeds maximum based on farm area',
            maxLoanAmount: farmArea * 50000
        };
    }

    return {
        eligible: true,
        reason: 'Eligible for loan',
        maxLoanAmount: farmArea * 50000,
        interestRate: 8.5,
        tenure: 12
    };
}

/**
 * Handle insurance quote request
 */
function handleInsuranceQuote(data) {
    const premium = calculateInsurancePremium(data);

    const quote = {
        id: `QUOTE_${Date.now()}`,
        farmerId: currentUser.id,
        cropType: data.cropType,
        farmArea: parseFloat(data.farmArea),
        coverageAmount: parseFloat(data.coverageAmount),
        premium: premium,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
    };

    const quotes = JSON.parse(localStorage.getItem('insuranceQuotes') || '[]');
    quotes.push(quote);
    localStorage.setItem('insuranceQuotes', JSON.stringify(quotes));

    showAlert(`Insurance quote generated! Premium: ₹${premium.toFixed(2)}`, 'success');

    // Show quote details
    displayQuoteDetails(quote);
}

/**
 * Calculate insurance premium
 */
function calculateInsurancePremium(data) {
    const coverageAmount = parseFloat(data.coverageAmount) || 0;
    const farmArea = parseFloat(data.farmArea) || 0;
    const cropType = data.cropType || 'wheat';

    // Premium calculation: 2-5% of coverage based on crop type
    const premiumRates = {
        'wheat': 0.03,
        'rice': 0.035,
        'corn': 0.04,
        'cotton': 0.045,
        'sugarcane': 0.03
    };

    const rate = premiumRates[cropType.toLowerCase()] || 0.035;
    return coverageAmount * rate;
}

/**
 * Display quote details
 */
function displayQuoteDetails(quote) {
    const quoteContainer = document.getElementById('quote-details');
    if (!quoteContainer) return;

    quoteContainer.innerHTML = `
    <div class="card">
      <h3>Insurance Quote</h3>
      <p><strong>Quote ID:</strong> ${quote.id}</p>
      <p><strong>Crop Type:</strong> ${quote.cropType}</p>
      <p><strong>Coverage Amount:</strong> ₹${quote.coverageAmount.toFixed(2)}</p>
      <p><strong>Premium:</strong> ₹${quote.premium.toFixed(2)}</p>
      <p><strong>Valid Until:</strong> ${new Date(quote.validUntil).toLocaleDateString()}</p>
      <button class="btn btn-cta" onclick="purchasePolicy('${quote.id}')">
        <img src="assets/images/payment-icon.png" alt="Purchase" class="btn-icon-img" onerror="this.style.display='none';">
        <span class="btn-label">Purchase Policy</span>
      </button>
    </div>
  `;
}

/**
 * Purchase insurance policy
 */
function purchasePolicy(quoteId) {
    const quotes = JSON.parse(localStorage.getItem('insuranceQuotes') || '[]');
    const quote = quotes.find(q => q.id === quoteId);

    if (!quote) {
        showAlert('Quote not found', 'error');
        return;
    }

    const policy = {
        id: `POLICY_${Date.now()}`,
        farmerId: currentUser.id,
        quoteId: quoteId,
        cropType: quote.cropType,
        coverageAmount: quote.coverageAmount,
        premium: quote.premium,
        status: 'active',
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    const policies = JSON.parse(localStorage.getItem('policies') || '[]');
    policies.push(policy);
    localStorage.setItem('policies', JSON.stringify(policies));

    showAlert(`Policy purchased successfully! Policy ID: ${policy.id}`, 'success');
    loadDashboardData(); // Refresh stats
}

/**
 * Handle claim submission
 */
function handleClaimSubmission(data) {
    const claim = {
        id: `CLAIM_${Date.now()}`,
        farmerId: currentUser.id,
        policyId: data.policyId,
        claimType: data.claimType,
        description: data.description,
        damageDate: data.damageDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
        files: JSON.parse(localStorage.getItem('uploadedFiles') || '[]')
    };

    const claims = JSON.parse(localStorage.getItem('claims') || '[]');
    claims.push(claim);
    localStorage.setItem('claims', JSON.stringify(claims));

    // Clear uploaded files
    localStorage.removeItem('uploadedFiles');

    showAlert(`Claim filed successfully! Claim ID: ${claim.id}`, 'success');

    // Clear file preview
    const previewContainer = document.getElementById('file-preview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }

    hideClaimForm();
    loadDashboardData(); // Refresh stats
}

/**
 * Handle file upload with preview
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showAlert('Please upload an image (JPG/PNG) or PDF file', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'error');
        return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewContainer = document.getElementById('file-preview');
        if (previewContainer) {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                previewItem.appendChild(img);
            } else {
                previewItem.innerHTML = `
          <div style="padding: 1rem; background: #f5f5f5; text-align: center;">
            <p style="font-size: 0.75rem; margin-top: 0.5rem;">${file.name}</p>
          </div>
        `;
            }

            // Store file data in localStorage for demo
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                timestamp: new Date().toISOString()
            };

            const storedFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
            storedFiles.push(fileData);
            localStorage.setItem('uploadedFiles', JSON.stringify(storedFiles));

            previewContainer.appendChild(previewItem);
        }
    };

    reader.readAsDataURL(file);
}

// UI Toggle Functions
function showLoanForm() {
    document.getElementById('loan-form-section').style.display = 'block';
    document.getElementById('insurance-form-section').style.display = 'none';
    document.getElementById('claim-form-section').style.display = 'none';

    // Initialize multi-step form to step 1
    currentLoanStep = 1;
    showLoanStep(1);

    // Ensure submit button handler is attached (backup in case it wasn't attached on load)
    const loanForm = document.getElementById('loan-form');
    const submitBtn = loanForm ? loanForm.querySelector('.btn-submit') : null;
    if (loanForm && submitBtn && !submitBtn.hasAttribute('data-submit-handler-attached')) {
        submitBtn.setAttribute('data-submit-handler-attached', 'true');
        submitBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            // Validate all steps and submit
            if (validateAllLoanSteps()) {
                loanForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        });
    }

    document.getElementById('loan-form-section').scrollIntoView({ behavior: 'smooth' });
}

function hideLoanForm() {
    document.getElementById('loan-form-section').style.display = 'none';
    resetLoanForm();
}

function showInsuranceForm() {
    document.getElementById('insurance-form-section').style.display = 'block';
    document.getElementById('loan-form-section').style.display = 'none';
    document.getElementById('claim-form-section').style.display = 'none';
    document.getElementById('insurance-form-section').scrollIntoView({ behavior: 'smooth' });
}

function hideInsuranceForm() {
    document.getElementById('insurance-form-section').style.display = 'none';
}

function showClaimForm() {
    document.getElementById('claim-form-section').style.display = 'block';
    document.getElementById('loan-form-section').style.display = 'none';
    document.getElementById('insurance-form-section').style.display = 'none';
    document.getElementById('claim-form-section').scrollIntoView({ behavior: 'smooth' });
}

function hideClaimForm() {
    document.getElementById('claim-form-section').style.display = 'none';
}

async function showLoans() {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;

    dynamicContent.innerHTML = `
        <div class="card">
            <h2>My Loan Applications</h2>
            <p>Loading your loans...</p>
        </div>
    `;
    dynamicContent.scrollIntoView({ behavior: 'smooth' });

    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            dynamicContent.innerHTML = `
                <div class="card">
                    <h2>My Loan Applications</h2>
                    <p>Please login to view your loans</p>
                </div>
            `;
            return;
        }

        const response = await fetch('http://localhost:3000/api/loans', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!result.success) {
            dynamicContent.innerHTML = `
                <div class="card">
                    <h2>My Loan Applications</h2>
                    <p>Error: ${result.message}</p>
                </div>
            `;
            return;
        }

        const loans = result.data;

        // Get status badge class
        const getBadgeClass = (status) => {
            switch (status) {
                case 'approved': return 'badge-approved';
                case 'rejected': return 'badge-rejected';
                case 'pending': return 'badge-pending';
                default: return 'badge-pending';
            }
        };

        // Get status message
        const getStatusMessage = (status) => {
            switch (status) {
                case 'approved': return 'Your loan has been approved!';
                case 'rejected': return 'Your loan application was rejected.';
                case 'pending': return 'Application is under review.';
                default: return 'Status unknown';
            }
        };

        dynamicContent.innerHTML = `
            <div class="card">
                <h2>My Loan Applications</h2>
                ${loans.length === 0 ? '<p>No loan applications found. Apply for a loan to get started!</p>' : ''}
                ${loans.map(loan => `
                    <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid ${loan.status === 'approved' ? '#28a745' : loan.status === 'rejected' ? '#dc3545' : '#ffc107'};">
                        <h3 style="margin-bottom: 1rem;">
                            Loan Application
                            <span class="badge" style="background: ${loan.status === 'approved' ? '#28a745' : loan.status === 'rejected' ? '#dc3545' : '#ffc107'}; color: white; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; font-size: 0.8rem; margin-left: 10px;">${loan.status}</span>
                        </h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem; color: #333;">Personal Details</h4>
                                <p><strong>Name:</strong> ${loan.firstName} ${loan.middleName || ''} ${loan.lastName}</p>
                                <p><strong>ID Type:</strong> ${loan.identityType?.toUpperCase() || 'N/A'}</p>
                                <p><strong>ID Number:</strong> ${loan.identityNumber || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem; color: #333;">Bank Details</h4>
                                <p><strong>Bank:</strong> ${loan.bankName || 'N/A'}</p>
                                <p><strong>Branch:</strong> ${loan.branchName || 'N/A'}</p>
                                <p><strong>Account:</strong> ${loan.accountNumber || 'N/A'}</p>
                                <p><strong>IFSC:</strong> ${loan.ifscCode || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem; color: #333;">Farm Details</h4>
                                <p><strong>Farm Area:</strong> ${loan.farmArea || 'N/A'} acres</p>
                                <p><strong>Crop Type:</strong> ${loan.cropType || 'N/A'}</p>
                                <p><strong>Location:</strong> ${loan.landLocation || 'N/A'}</p>
                                <p><strong>Annual Income:</strong> ₹${loan.annualIncome?.toLocaleString() || 'N/A'}</p>
                            </div>
                            
                            <div style="background: ${loan.status === 'approved' ? '#e8f5e9' : loan.status === 'rejected' ? '#ffebee' : '#fff3e0'}; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem; color: #333;">Loan Details</h4>
                                <p><strong>Amount:</strong> ₹${loan.loanAmount?.toLocaleString() || 'N/A'}</p>
                                <p><strong>Purpose:</strong> ${loan.purpose || 'N/A'}</p>
                                <p><strong>Tenure:</strong> ${loan.loanTenure || 'N/A'} months</p>
                                <p><strong>Monthly EMI:</strong> ₹${loan.monthlyEMI?.toLocaleString() || 'N/A'}</p>
                                <p><strong>Interest Rate:</strong> ${loan.interestRate || '8.5'}%</p>
                            </div>
                        </div>
                        
                        <p style="margin-top: 1rem; color: ${loan.status === 'approved' ? '#28a745' : loan.status === 'rejected' ? '#dc3545' : '#856404'}; font-style: italic; font-weight: bold;">
                            ${getStatusMessage(loan.status)}
                        </p>
                        ${loan.comments ? `<p><strong>Comments:</strong> ${loan.comments}</p>` : ''}
                        <p style="color: #666;"><strong>Applied:</strong> ${new Date(loan.createdAt).toLocaleDateString()} at ${new Date(loan.createdAt).toLocaleTimeString()}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading loans:', error);
        dynamicContent.innerHTML = `
            <div class="card">
                <h2>My Loan Applications</h2>
                <p>Error loading loans: ${error.message}</p>
            </div>
        `;
    }
}

function showPolicies() {
    const policies = JSON.parse(localStorage.getItem('policies') || '[]');
    const userPolicies = policies.filter(policy => policy.farmerId === currentUser?.id);

    const dynamicContent = document.getElementById('dynamic-content');
    if (dynamicContent) {
        dynamicContent.innerHTML = `
            <div class="card">
                <h2>My Insurance Policies</h2>
                ${userPolicies.length === 0 ? '<p>No insurance policies found.</p>' : ''}
                <div class="tile-grid">
                    ${userPolicies.map(policy => `
                        <div class="card">
                            <h3>Policy #${policy.id}</h3>
                            <p><strong>Type:</strong> ${policy.insuranceType || 'N/A'}</p>
                            <p><strong>Coverage:</strong> ₹${policy.coverageAmount?.toLocaleString() || 'N/A'}</p>
                            <p><strong>Premium:</strong> ₹${policy.premium?.toLocaleString() || 'N/A'}</p>
                            <p><strong>Status:</strong> <span class="badge badge-${policy.status}">${policy.status}</span></p>
                            <p><strong>Valid Until:</strong> ${policy.validUntil || 'N/A'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        dynamicContent.scrollIntoView({ behavior: 'smooth' });
    }
}

function showClaims() {
    const claims = JSON.parse(localStorage.getItem('claims') || '[]');
    const userClaims = claims.filter(claim => claim.farmerId === currentUser?.id);

    const dynamicContent = document.getElementById('dynamic-content');
    if (dynamicContent) {
        dynamicContent.innerHTML = `
            <div class="card">
                <h2>My Insurance Claims</h2>
                ${userClaims.length === 0 ? '<p>No claims found.</p>' : ''}
                <div class="tile-grid">
                    ${userClaims.map(claim => `
                        <div class="card">
                            <h3>Claim #${claim.id}</h3>
                            <p><strong>Type:</strong> ${claim.claimType || 'N/A'}</p>
                            <p><strong>Amount:</strong> ₹${claim.claimedAmount?.toLocaleString() || 'N/A'}</p>
                            <p><strong>Status:</strong> <span class="badge badge-${claim.status}">${claim.status}</span></p>
                            <p><strong>Description:</strong> ${claim.description || 'N/A'}</p>
                            <p><strong>Filed:</strong> ${new Date(claim.createdAt).toLocaleDateString()}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        dynamicContent.scrollIntoView({ behavior: 'smooth' });
    }
}

// Expose UI functions to global scope
window.showLoanForm = showLoanForm;
window.hideLoanForm = hideLoanForm;
window.showInsuranceForm = showInsuranceForm;
window.hideInsuranceForm = hideInsuranceForm;
window.showClaimForm = showClaimForm;
window.hideClaimForm = hideClaimForm;
window.showLoans = showLoans;
window.showPolicies = showPolicies;
window.showClaims = showClaims;
window.purchasePolicy = purchasePolicy;

// ==================== Multi-Step Loan Form Functions ====================

let currentLoanStep = 1;
const totalSteps = 4;
let loanFormFiles = {};  // Changed from const to let to allow resetting

/**
 * Navigate to next step in loan form
 */
function nextLoanStep() {
    if (validateCurrentStep()) {
        if (currentLoanStep < totalSteps) {
            currentLoanStep++;
            showLoanStep(currentLoanStep);
        }
    }
}

/**
 * Navigate to previous step in loan form
 */
function prevLoanStep() {
    if (currentLoanStep > 1) {
        currentLoanStep--;
        showLoanStep(currentLoanStep);
    }
}

/**
 * Show specific step and update UI
 */
function showLoanStep(stepNumber) {
    const loanForm = document.getElementById('loan-form');
    if (!loanForm) return;

    // Hide all steps in loan form
    loanForm.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    const currentStep = loanForm.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }

    // Update progress indicator
    // Note: Progress indicators are outside the form in .form-progress, so we need to look in the section
    const section = document.getElementById('loan-form-section');
    if (section) {
        section.querySelectorAll('.progress-step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < stepNumber) {
                step.classList.add('completed');
            } else if (index + 1 === stepNumber) {
                step.classList.add('active');
            }
        });
    }

    // Update navigation buttons
    const prevBtn = loanForm.querySelector('.btn-prev');
    const nextBtn = loanForm.querySelector('.btn-next');
    const submitBtn = loanForm.querySelector('.btn-submit');

    if (prevBtn) prevBtn.style.display = stepNumber === 1 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = stepNumber === totalSteps ? 'none' : 'inline-flex';
    if (submitBtn) {
        submitBtn.style.display = stepNumber === totalSteps ? 'inline-flex' : 'none';
    }

    // Show loan summary on last step
    if (stepNumber === totalSteps) {
        updateLoanSummary();
    }
}

/**
 * Validate current step fields
 */
function validateCurrentStep() {
    const loanForm = document.getElementById('loan-form');
    if (!loanForm) return false;

    const currentStepElem = loanForm.querySelector(`.form-step[data-step="${currentLoanStep}"]`);
    if (!currentStepElem) return false;

    const requiredFields = currentStepElem.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        if (!field.value.trim() && field.type !== 'file') {
            isValid = false;
            field.style.borderColor = '#f44336';
            if (!firstInvalidField) firstInvalidField = field;
        } else if (field.type === 'file' && !field.files.length && !loanFormFiles[field.id]) {
            isValid = false;
            const uploadDiv = field.previousElementSibling;
            if (uploadDiv) uploadDiv.style.borderColor = '#f44336';
            if (!firstInvalidField) firstInvalidField = field;
        } else {
            field.style.borderColor = '';
            if (field.type === 'file') {
                const uploadDiv = field.previousElementSibling;
                if (uploadDiv) uploadDiv.style.borderColor = '';
            }
        }
    });

    // Additional validation: Account number match
    if (currentLoanStep === 2) {
        const accNum = document.getElementById('accountNumber');
        const confAccNum = document.getElementById('confirmAccountNumber');
        if (accNum && confAccNum && accNum.value !== confAccNum.value) {
            isValid = false;
            confAccNum.style.borderColor = '#f44336';
            showAlert('Account numbers do not match!', 'error');
            if (!firstInvalidField) firstInvalidField = confAccNum;
        }
    }

    if (!isValid) {
        showAlert('Please fill in all required fields before proceeding', 'error');
        if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

/**
 * Validate ALL steps before final submission
 */
function validateAllLoanSteps() {
    const loanForm = document.getElementById('loan-form');
    if (!loanForm) {
        showAlert('Loan form not found', 'error');
        return false;
    }

    let isValid = true;
    let firstInvalidField = null;
    let invalidStep = null;

    // Validate each step
    for (let step = 1; step <= totalSteps; step++) {
        const stepElem = loanForm.querySelector(`.form-step[data-step="${step}"]`);
        if (!stepElem) continue;

        const requiredFields = stepElem.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            // Check if field is visible (in the active step)
            const stepElement = field.closest('.form-step');
            const isFieldVisible = stepElement && stepElement.classList.contains('active');

            // Only validate visible fields (we validate all steps, but check visibility for proper error display)
            if (!isFieldVisible && step !== currentLoanStep) {
                // For non-active steps, we still need to validate them
                // but we'll make the step visible if there's an error
            }

            if (field.type === 'file') {
                // Check if file was uploaded
                if (!field.files.length && !loanFormFiles[field.id]) {
                    isValid = false;
                    if (!invalidStep) invalidStep = step;
                    const uploadDiv = field.previousElementSibling;
                    if (uploadDiv && uploadDiv.classList && uploadDiv.classList.contains('file-upload')) {
                        uploadDiv.style.borderColor = '#f44336';
                    }
                    if (!firstInvalidField) firstInvalidField = field;
                } else {
                    const uploadDiv = field.previousElementSibling;
                    if (uploadDiv && uploadDiv.classList && uploadDiv.classList.contains('file-upload')) {
                        uploadDiv.style.borderColor = '';
                    }
                }
            } else if (field.type === 'select-one' || field.tagName === 'SELECT') {
                // Validate select fields
                if (!field.value || field.value.trim() === '') {
                    isValid = false;
                    if (!invalidStep) invalidStep = step;
                    field.style.borderColor = '#f44336';
                    if (!firstInvalidField) firstInvalidField = field;
                } else {
                    field.style.borderColor = '';
                }
            } else {
                // Validate text/textarea/number fields
                const fieldValue = field.value ? field.value.toString().trim() : '';
                if (!fieldValue) {
                    isValid = false;
                    if (!invalidStep) invalidStep = step;
                    field.style.borderColor = '#f44336';
                    if (!firstInvalidField) firstInvalidField = field;
                } else {
                    field.style.borderColor = '';
                }
            }
        });

        // Additional validation for step 2: Account number match
        if (step === 2) {
            const accNum = document.getElementById('accountNumber');
            const confAccNum = document.getElementById('confirmAccountNumber');
            if (accNum && confAccNum && accNum.value && confAccNum.value) {
                if (accNum.value !== confAccNum.value) {
                    isValid = false;
                    if (!invalidStep) invalidStep = step;
                    confAccNum.style.borderColor = '#f44336';
                    showAlert('Account numbers do not match!', 'error');
                    if (!firstInvalidField) firstInvalidField = confAccNum;
                }
            }
        }
    }

    if (!isValid) {
        // Show the step with the first error
        if (invalidStep && invalidStep !== currentLoanStep) {
            currentLoanStep = invalidStep;
            showLoanStep(invalidStep);
        }

        showAlert('Please fill in all required fields in all steps before submitting', 'error');

        if (firstInvalidField) {
            setTimeout(() => {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        return false;
    }

    return true;
}

/**
 * Setup file upload listeners for loan form
 */
function setupLoanFormFileUploads() {
    const fileInputs = [
        { id: 'farmer-photo', preview: 'photo-preview' },
        { id: 'identity-proof', preview: 'identity-preview' },
        { id: 'land-proof', preview: 'land-preview' },
        { id: 'income-cert', preview: 'income-preview' }
    ];

    fileInputs.forEach(({ id, preview }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', (e) => handleLoanFileUpload(e, preview));
        }
    });
}

/**
 * Handle file upload with preview for loan form
 */
function handleLoanFileUpload(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;

    const fieldId = event.target.id;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showAlert('Please upload an image (JPG/PNG) or PDF file', 'error');
        event.target.value = '';
        return;
    }

    // Validate file size (max 5MB, 2MB for photos)
    const maxSize = fieldId === 'farmer-photo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024);
        showAlert(`File size must be less than ${maxMB}MB`, 'error');
        event.target.value = '';
        return;
    }

    // Store file data
    const reader = new FileReader();
    reader.onload = (e) => {
        loanFormFiles[fieldId] = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            timestamp: new Date().toISOString()
        };

        // Show preview
        const previewContainer = document.getElementById(previewId);
        if (previewContainer) {
            previewContainer.innerHTML = '';
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                previewItem.appendChild(img);
            } else {
                previewItem.innerHTML = `
                    <div style="padding: 1rem; background: #f5f5f5; text-align: center;">
                        <div style="font-size: 2rem;">📄</div>
                        <p style="font-size: 0.75rem; margin-top: 0.5rem;">${file.name}</p>
                    </div>
                `;
            }

            previewContainer.appendChild(previewItem);
        }

        // Reset border color on successful upload
        event.target.parentElement.style.borderColor = '';
    };

    reader.readAsDataURL(file);
}

/**
 * Update loan summary with EMI calculation
 */
function updateLoanSummary() {
    const amount = parseFloat(document.getElementById('loanAmount')?.value || 0);
    const tenure = parseInt(document.getElementById('loanTenure')?.value || 12);
    const rate = 8.5; // Annual interest rate in percentage

    if (amount > 0 && tenure > 0) {
        // EMI Calculation: P × r × (1 + r)^n / ((1 + r)^n - 1)
        const monthlyRate = rate / 12 / 100;
        const emi = amount * monthlyRate * Math.pow(1 + monthlyRate, tenure) /
            (Math.pow(1 + monthlyRate, tenure) - 1);

        document.getElementById('summary-amount').textContent = `₹${amount.toLocaleString()}`;
        document.getElementById('summary-rate').textContent = `${rate}% p.a.`;
        document.getElementById('summary-tenure').textContent = `${tenure} months`;
        document.getElementById('summary-emi').textContent = `₹${Math.round(emi).toLocaleString()}`;
        document.getElementById('loan-summary').style.display = 'block';
    } else {
        document.getElementById('loan-summary').style.display = 'none';
    }
}

/**
 * Reset loan form to step 1
 */
function resetLoanForm() {
    currentLoanStep = 1;
    showLoanStep(1);
    document.getElementById('loan-form').reset();
    loanFormFiles = {};

    // Clear all file previews
    ['photo-preview', 'identity-preview', 'land-preview', 'income-preview'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.innerHTML = '';
    });
}

// Expose multi-step form functions to global scope
window.nextLoanStep = nextLoanStep;
window.prevLoanStep = prevLoanStep;

/**
 * Show loan success popup with download button
 */
function showLoanSuccessPopup(loanId, loanData) {
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.id = 'loan-success-modal';
    overlay.style.display = 'flex';

    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <h2 style="color: var(--green-primary); margin-bottom: 1rem;">
                ✓ Application Submitted Successfully!
            </h2>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
                Your loan application has been submitted.
            </p>
            <p style="font-size: 0.9rem; color: var(--gray-medium); margin-bottom: 1.5rem;">
                Loan ID: <strong>${loanId}</strong>
            </p>
            <div style="background: var(--green-pale); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                <p style="margin: 0.25rem 0;"><strong>Status:</strong> ${loanData.status}</p>
                <p style="margin: 0.25rem 0;"><strong>Monthly EMI:</strong> ₹${loanData.monthlyEMI.toLocaleString()}</p>
                <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--gray-medium);">
                    Submitted on ${new Date(loanData.createdAt).toLocaleString()}
                </p>
            </div>
            <button class="btn btn-primary" onclick="downloadLoanPDF('${loanId}')" style="margin-right: 0.5rem;">
                <span class="btn-label">📄 Download PDF</span>
            </button>
            <button class="btn btn-secondary" onclick="closeLoanSuccessModal()">
                <span class="btn-label">Close</span>
            </button>
        </div>
    `;

    document.body.appendChild(overlay);
}

/**
 * Download loan application PDF
 */
async function downloadLoanPDF(loanId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Please login to download PDF', 'error');
            return;
        }

        showAlert('Generating PDF...', 'info');

        const response = await fetch(`http://localhost:3000/api/loans/${loanId}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to download PDF');
        }

        // Create blob from response
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loan-application-${loanId}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showAlert('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('PDF download error:', error);
        showAlert('Failed to download PDF. Please try again.', 'error');
    }
}

/**
 * Close loan success modal
 */
function closeLoanSuccessModal() {
    const modal = document.getElementById('loan-success-modal');
    if (modal) {
        modal.remove();
    }
}

// Expose download function to global scope
window.downloadLoanPDF = downloadLoanPDF;
window.closeLoanSuccessModal = closeLoanSuccessModal;

// ==================== Multi-Step Insurance Form Functions ====================

let currentInsuranceStep = 1;
const totalInsuranceSteps = 4;
let insuranceFormFiles = {};

/**
 * Navigate to next step in insurance form
 */
function nextInsuranceStep() {
    if (validateCurrentInsuranceStep()) {
        if (currentInsuranceStep < totalInsuranceSteps) {
            currentInsuranceStep++;
            showInsuranceStep(currentInsuranceStep);
        }
    }
}

/**
 * Navigate to previous step in insurance form
 */
function prevInsuranceStep() {
    if (currentInsuranceStep > 1) {
        currentInsuranceStep--;
        showInsuranceStep(currentInsuranceStep);
    }
}

/**
 * Show specific step and update UI for insurance form
 */
function showInsuranceStep(stepNumber) {
    const formSection = document.getElementById('insurance-form-section');
    if (!formSection) return;

    // Hide all steps
    formSection.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    const currentStep = formSection.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }

    // Update progress indicator
    formSection.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });

    // Update navigation buttons
    const prevBtn = formSection.querySelector('.btn-ins-prev');
    const nextBtn = formSection.querySelector('.btn-ins-next');
    const submitBtn = formSection.querySelector('.btn-ins-submit');

    if (prevBtn) prevBtn.style.display = stepNumber === 1 ? 'none' : 'inline-flex';
    if (nextBtn) nextBtn.style.display = stepNumber === totalInsuranceSteps ? 'none' : 'inline-flex';
    if (submitBtn) submitBtn.style.display = stepNumber === totalInsuranceSteps ? 'inline-flex' : 'none';

    // Update premium estimate on step 2
    if (stepNumber === 2) {
        updateInsurancePremiumEstimate();
    }

    // Update final summary on step 4
    if (stepNumber === totalInsuranceSteps) {
        updateInsuranceFinalSummary();
    }
}

/**
 * Validate current step fields for insurance form
 */
function validateCurrentInsuranceStep() {
    const formSection = document.getElementById('insurance-form-section');
    if (!formSection) return false;

    const currentStepElem = formSection.querySelector(`.form-step[data-step="${currentInsuranceStep}"]`);
    if (!currentStepElem) return false;

    const requiredFields = currentStepElem.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        if (!field.value.trim() && field.type !== 'file') {
            isValid = false;
            field.style.borderColor = '#f44336';
            if (!firstInvalidField) firstInvalidField = field;
        } else if (field.type === 'file' && !field.files.length && !insuranceFormFiles[field.id]) {
            isValid = false;
            const uploadDiv = field.previousElementSibling;
            if (uploadDiv) uploadDiv.style.borderColor = '#f44336';
            if (!firstInvalidField) firstInvalidField = field;
        } else {
            field.style.borderColor = '';
            if (field.type === 'file') {
                const uploadDiv = field.previousElementSibling;
                if (uploadDiv) uploadDiv.style.borderColor = '';
            }
        }
    });

    if (!isValid) {
        showAlert('Please fill in all required fields before proceeding', 'error');
        if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

/**
 * Setup file upload listeners for insurance form
 */
function setupInsuranceFormFileUploads() {
    const fileInputs = [
        { id: 'ins-aadhar', preview: 'ins-aadhar-preview' },
        { id: 'ins-land', preview: 'ins-land-preview' },
        { id: 'ins-sowing', preview: 'ins-sowing-preview' }
    ];

    fileInputs.forEach(({ id, preview }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', (e) => handleInsuranceFileUpload(e, preview));
        }
    });
}

/**
 * Handle file upload with preview for insurance form
 */
function handleInsuranceFileUpload(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;

    const fieldId = event.target.id;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showAlert('Please upload an image (JPG/PNG) or PDF file', 'error');
        event.target.value = '';
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size must be less than 5MB', 'error');
        event.target.value = '';
        return;
    }

    // Store file data
    const reader = new FileReader();
    reader.onload = (e) => {
        insuranceFormFiles[fieldId] = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            timestamp: new Date().toISOString()
        };

        // Show preview
        const previewContainer = document.getElementById(previewId);
        if (previewContainer) {
            previewContainer.innerHTML = '';
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                previewItem.appendChild(img);
            } else {
                previewItem.innerHTML = `
                    <div style="padding: 1rem; background: #f5f5f5; text-align: center;">
                        <div style="font-size: 2rem;">📄</div>
                        <p style="font-size: 0.75rem; margin-top: 0.5rem;">${file.name}</p>
                    </div>
                `;
            }

            previewContainer.appendChild(previewItem);
        }

        // Reset border color on successful upload
        const uploadDiv = event.target.previousElementSibling;
        if (uploadDiv) uploadDiv.style.borderColor = '';
    };

    reader.readAsDataURL(file);
}

/**
 * Update premium estimate based on form values
 */
function updateInsurancePremiumEstimate() {
    const farmArea = parseFloat(document.getElementById('ins-farmArea')?.value || 0);

    // Count selected coverage options
    let riskMultiplier = 1;
    const coverageOptions = ['yieldProtection', 'priceProtection', 'weatherRisk', 'pestDisease', 'flood', 'drought'];
    coverageOptions.forEach(option => {
        const checkbox = document.querySelector(`input[name="${option}"]`);
        if (checkbox && checkbox.checked) {
            riskMultiplier += 0.1;
        }
    });

    if (farmArea > 0) {
        const baseRate = 500; // ₹500 per acre base
        const premium = Math.round(farmArea * baseRate * riskMultiplier);
        const sumInsured = Math.round(farmArea * 50000); // ₹50,000 per acre

        document.getElementById('ins-summary-area').textContent = farmArea;
        document.getElementById('ins-summary-premium').textContent = `₹${premium.toLocaleString()}`;
        document.getElementById('ins-summary-coverage').textContent = `₹${sumInsured.toLocaleString()}`;
        document.getElementById('insurance-premium-estimate').style.display = 'block';
    } else {
        document.getElementById('insurance-premium-estimate').style.display = 'none';
    }
}

/**
 * Update final summary on step 4
 */
function updateInsuranceFinalSummary() {
    const farmerType = document.getElementById('ins-farmerType')?.value || '-';
    const cropType = document.getElementById('ins-cropType')?.value || '-';
    const farmArea = parseFloat(document.getElementById('ins-farmArea')?.value || 0);

    // Calculate premium
    let riskMultiplier = 1;
    const coverageOptions = ['yieldProtection', 'priceProtection', 'weatherRisk', 'pestDisease', 'flood', 'drought'];
    coverageOptions.forEach(option => {
        const checkbox = document.querySelector(`input[name="${option}"]`);
        if (checkbox && checkbox.checked) {
            riskMultiplier += 0.1;
        }
    });

    const baseRate = 500;
    const premium = Math.round(farmArea * baseRate * riskMultiplier);
    const sumInsured = Math.round(farmArea * 50000);

    document.getElementById('final-farmer-type').textContent = farmerType.charAt(0).toUpperCase() + farmerType.slice(1);
    document.getElementById('final-crop-type').textContent = cropType.charAt(0).toUpperCase() + cropType.slice(1);
    document.getElementById('final-farm-area').textContent = farmArea;
    document.getElementById('final-premium').textContent = `₹${premium.toLocaleString()}`;
    document.getElementById('final-coverage').textContent = `₹${sumInsured.toLocaleString()}`;
}

/**
 * Handle insurance application submission to backend
 */
async function handleInsuranceApplication(formData) {
    try {
        // Get the current user's token
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Please login to submit insurance application', 'error');
            window.location.href = 'index.html';
            return;
        }

        // Create FormData for file upload
        const submitData = new FormData();

        // Add all form fields
        for (const [key, value] of formData.entries()) {
            if (value instanceof File && value.size === 0) continue; // Skip empty file inputs
            submitData.append(key, value);
        }

        // Add files from insuranceFormFiles object
        const fileMapping = {
            'ins-aadhar': 'aadharCard',
            'ins-land': 'landRecords',
            'ins-sowing': 'sowingCertificate'
        };

        for (const [inputId, fieldName] of Object.entries(fileMapping)) {
            if (insuranceFormFiles[inputId]) {
                // Convert base64 to File object
                const fileData = insuranceFormFiles[inputId];
                const blob = await fetch(fileData.data).then(r => r.blob());
                const file = new File([blob], fileData.name, { type: fileData.type });
                submitData.append(fieldName, file);
            }
        }

        // Show loading message
        showAlert('Submitting your insurance application...', 'info');

        // Submit to backend
        const response = await fetch('http://localhost:3000/api/insurance/apply', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: submitData
        });

        const result = await response.json();

        if (result.success) {
            // Show success message with policy ID
            showInsuranceSuccessPopup(result.data);

            // Reset form
            hideInsuranceForm();
            resetInsuranceForm();
            loadDashboardData(); // Refresh stats
        } else {
            showAlert(`Error: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Insurance submission error:', error);
        showAlert('Failed to submit insurance application. Please try again.', 'error');
    }
}

/**
 * Show insurance success popup
 */
function showInsuranceSuccessPopup(data) {
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.id = 'insurance-success-modal';
    overlay.style.display = 'flex';

    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 500px; text-align: center;">
            <h2 style="color: var(--green-primary); margin-bottom: 1rem;">
                ✓ Insurance Application Submitted!
            </h2>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
                Your insurance application has been submitted successfully.
            </p>
            <div style="background: var(--green-pale); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                <p style="margin: 0.25rem 0; font-size: 1.2rem;"><strong>Policy ID:</strong> <span style="color: var(--green-primary); font-weight: bold;">${data.policyId}</span></p>
                <p style="margin: 0.25rem 0;"><strong>Status:</strong> ${data.status}</p>
                <p style="margin: 0.25rem 0;"><strong>Premium Amount:</strong> ₹${data.premiumAmount.toLocaleString()}</p>
                <p style="margin: 0.25rem 0;"><strong>Sum Insured:</strong> ₹${data.sumInsured.toLocaleString()}</p>
                <p style="margin: 0.25rem 0; font-size: 0.85rem; color: var(--gray-medium);">
                    Submitted on ${new Date(data.createdAt).toLocaleString()}
                </p>
            </div>
            <p style="font-size: 0.9rem; color: var(--gray-medium); margin-bottom: 1rem;">
                📋 Please save your Policy ID for future claims.
            </p>
            <button class="btn btn-primary" onclick="closeInsuranceSuccessModal()">
                <span class="btn-label">Close</span>
            </button>
        </div>
    `;

    document.body.appendChild(overlay);
}

/**
 * Close insurance success modal
 */
function closeInsuranceSuccessModal() {
    const modal = document.getElementById('insurance-success-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Reset insurance form to step 1
 */
function resetInsuranceForm() {
    currentInsuranceStep = 1;
    showInsuranceStep(1);
    const form = document.getElementById('insurance-form');
    if (form) form.reset();
    insuranceFormFiles = {};

    // Clear all file previews
    ['ins-aadhar-preview', 'ins-land-preview', 'ins-sowing-preview'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) elem.innerHTML = '';
    });
}

/**
 * Updated showInsuranceForm to initialize multi-step form
 */
const originalShowInsuranceForm = showInsuranceForm;
window.showInsuranceForm = function () {
    document.getElementById('insurance-form-section').style.display = 'block';
    document.getElementById('loan-form-section').style.display = 'none';
    document.getElementById('claim-form-section').style.display = 'none';

    // Initialize multi-step form to step 1
    currentInsuranceStep = 1;
    showInsuranceStep(1);

    // Setup file upload listeners
    setupInsuranceFormFileUploads();

    // Add listeners for premium calculation
    const farmAreaInput = document.getElementById('ins-farmArea');
    if (farmAreaInput) {
        farmAreaInput.addEventListener('input', updateInsurancePremiumEstimate);
    }

    // Add listeners for coverage checkboxes
    const coverageOptions = ['yieldProtection', 'priceProtection', 'weatherRisk', 'pestDisease', 'flood', 'drought'];
    coverageOptions.forEach(option => {
        const checkbox = document.querySelector(`input[name="${option}"]`);
        if (checkbox) {
            checkbox.addEventListener('change', updateInsurancePremiumEstimate);
        }
    });

    document.getElementById('insurance-form-section').scrollIntoView({ behavior: 'smooth' });
};

/**
 * Updated hideInsuranceForm to reset form
 */
window.hideInsuranceForm = function () {
    document.getElementById('insurance-form-section').style.display = 'none';
    resetInsuranceForm();
};

/**
 * Updated showPolicies to fetch from API
 */
async function showPoliciesFromAPI() {
    const dynamicContent = document.getElementById('dynamic-content');
    if (!dynamicContent) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            // Fallback to localStorage
            showPolicies();
            return;
        }

        const response = await fetch('http://localhost:3000/api/insurance/my-policies', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.data.length > 0) {
            dynamicContent.innerHTML = `
                <div class="card">
                    <h2>My Insurance Policies</h2>
                    <div class="tile-grid">
                        ${result.data.map(policy => `
                            <div class="card">
                                <h3>Policy ${policy.policyId}</h3>
                                <p><strong>Crop:</strong> ${policy.cropType}</p>
                                <p><strong>Farm Area:</strong> ${policy.farmArea} acres</p>
                                <p><strong>Premium:</strong> ₹${policy.premiumAmount?.toLocaleString() || 'N/A'}</p>
                                <p><strong>Sum Insured:</strong> ₹${policy.sumInsured?.toLocaleString() || 'N/A'}</p>
                                <p><strong>Status:</strong> <span class="badge badge-${policy.status}">${policy.status}</span></p>
                                <p><strong>Applied:</strong> ${new Date(policy.createdAt).toLocaleDateString()}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            // Fallback to localStorage if no API data
            showPolicies();
        }
        dynamicContent.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error fetching policies:', error);
        // Fallback to localStorage
        showPolicies();
    }
}

// Expose multi-step insurance form functions to global scope
window.nextInsuranceStep = nextInsuranceStep;
window.prevInsuranceStep = prevInsuranceStep;
window.closeInsuranceSuccessModal = closeInsuranceSuccessModal;
window.showPoliciesFromAPI = showPoliciesFromAPI;
window.showLoans = showLoans;

