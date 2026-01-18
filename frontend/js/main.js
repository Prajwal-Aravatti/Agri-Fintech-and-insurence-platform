/**
 * Agri Fintech & Insurance - Main JavaScript
 * Handles navigation, authentication, and UI interactions
 */

// Mock authentication state
let currentUser = null;
let authToken = null;

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

/**
 * Initialize application
 */
function initializeApp() {
  // Check for stored authentication
  const storedUser = localStorage.getItem('currentUser');
  const storedToken = localStorage.getItem('authToken');

  if (storedUser && storedToken) {
    currentUser = JSON.parse(storedUser);
    authToken = storedToken;
    updateUIForUser();
  }

  // Setup event listeners
  setupEventListeners();

  // Load dashboard data if on dashboard page
  if (window.location.pathname.includes('dashboard.html')) {
    loadDashboardData();
  }

  // Initialize Slider
  initSlider();

  // Initialize Modal
  initModal();

  // Initialize Sidebar
  initSidebar();
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  // File upload handlers
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', handleFileUpload);
  });

  // Form submission handlers
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
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

/**
 * Handle form submissions
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Handle login form
  if (form.id === 'loginForm' || form.id === 'login-form') {
    // Map new form fields to expected data structure
    if (form.id === 'loginForm') {
      // The new modal form uses inputs without name attributes in the example, 
      // but FormData needs name attributes. 
      // I should have added name attributes in HTML. 
      // I will handle it by manually reading values if FormData is empty or fix HTML.
      // Let's assume I'll fix HTML or read by querySelector here for robustness.
      const usernameInput = form.querySelector('input[type="text"]');
      const passwordInput = form.querySelector('input[type="password"]');
      data.username = usernameInput.value;
      data.password = passwordInput.value;
    }
    handleLogin(data);
    return;
  }

  // Handle loan application
  if (form.id === 'loan-form') {
    handleLoanApplication(data);
    return;
  }

  // Handle insurance quote
  if (form.id === 'insurance-form') {
    handleInsuranceQuote(data);
    return;
  }

  // Handle claim form
  if (form.id === 'claim-form') {
    handleClaimSubmission(data);
    return;
  }

  // Default: show success message
  showAlert('Form submitted successfully!', 'success');
  form.reset();
}

/**
 * Handle user login
 */
/**
 * Handle user login
 */
function handleLogin(data) {
  const { email, password, role } = data; // Note: email/password might be just username/password from new form

  // Simplified login for demo: Accept any non-empty credentials
  // Default to farmer role if not specified
  const userRole = role || 'farmer';

  // Create a mock user session
  currentUser = {
    id: `USER_${Date.now()}`,
    name: data.username || email || 'Demo User',
    email: email || 'demo@agrifintech.com',
    role: userRole
  };

  // Generate mock JWT token
  authToken = `mock_jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  localStorage.setItem('authToken', authToken);
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  showAlert('Login successful! Redirecting...', 'success');

  // Redirect to role-specific dashboard
  setTimeout(() => {
    const dashboardMap = {
      'farmer': 'dashboard-farmer.html',
      'agent': 'dashboard-agent.html',
      'admin': 'dashboard-admin.html'
    };
    window.location.href = dashboardMap[userRole] || 'dashboard-farmer.html';
  }, 1000);
}

/**
 * Handle loan application
 */
function handleLoanApplication(data) {
  // Get loan eligibility
  const eligibility = calculateLoanEligibility(data);

  if (eligibility.eligible) {
    // Create loan application
    const loan = {
      id: `LOAN_${Date.now()}`,
      farmerId: currentUser.id,
      amount: parseFloat(data.loanAmount),
      purpose: data.purpose,
      farmArea: parseFloat(data.farmArea),
      cropType: data.cropType,
      status: 'pending',
      eligibility: eligibility,
      createdAt: new Date().toISOString()
    };

    const loans = JSON.parse(localStorage.getItem('loans') || '[]');
    loans.push(loan);
    localStorage.setItem('loans', JSON.stringify(loans));

    showAlert(`Loan application submitted! Your Loan ID: ${loan.id}`, 'success');

    // Redirect to loan status page
    setTimeout(() => {
      window.location.href = 'dashboard.html#loans';
    }, 1500);
  } else {
    showAlert(`Loan not eligible: ${eligibility.reason}`, 'error');
  }
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
}

/**
 * Load dashboard data
 */
function loadDashboardData() {
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Load user-specific data
  const loans = JSON.parse(localStorage.getItem('loans') || '[]')
    .filter(loan => loan.farmerId === currentUser.id);

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
}

/**
 * Update UI based on current user
 */
function updateUIForUser() {
  const userNameElement = document.getElementById('user-name');
  if (userNameElement && currentUser) {
    userNameElement.textContent = currentUser.name;
  }

  const userRoleElement = document.getElementById('user-role');
  if (userRoleElement && currentUser) {
    userRoleElement.textContent = currentUser.role;
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');

  showAlert('Logged out successfully', 'success');

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

/**
 * Show alert message
 */
function showAlert(message, type = 'success') {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());

  // Create new alert
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;

  const iconSrc = type === 'success' ? 'assets/images/status-icon.png' :
    type === 'error' ? 'assets/images/claim-icon.png' :
      'assets/images/status-icon.png';
  alert.innerHTML = `
    <img src="${iconSrc}" alt="${type}" class="alert-icon-img" style="width: 24px; height: 24px;" onerror="this.style.display='none';">
    <span>${message}</span>
  `;

  // Insert at top of main content or body
  const mainContent = document.querySelector('.main-content') || document.body;
  mainContent.insertBefore(alert, mainContent.firstChild);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

/**
 * Calculate loan eligibility (calls TypeScript module)
 */
function calculateLoanEligibility(data) {
  // This will be implemented by the TypeScript module
  // For now, return a simple mock calculation
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
 * Initialize Background Slider
 */
function initSlider() {
  const slides = document.querySelectorAll('.bg-slide');
  if (!slides.length) return;

  let currentSlide = 0;
  const slideInterval = 5000; // 5 seconds

  setInterval(() => {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, slideInterval);
}

/**
 * Initialize Login Modal
 */
function initModal() {
  const modal = document.getElementById('loginModal');
  const loginBtns = [document.getElementById('loginBtn'), document.getElementById('heroLoginBtn')];
  const closeBtn = document.querySelector('.close-modal');

  if (!modal) return;

  loginBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('show');
        // Reset to role selection
        backToRoles();
      });
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}

/**
 * Select Role
 */
function selectRole(role) {
  const roleSelectionStep = document.getElementById('roleSelectionStep');
  const loginFormStep = document.getElementById('loginFormStep');
  const selectedRoleInput = document.getElementById('selectedRole');
  const loginTitle = document.getElementById('loginTitle');

  if (roleSelectionStep && loginFormStep && selectedRoleInput) {
    roleSelectionStep.style.display = 'none';
    loginFormStep.style.display = 'block';
    selectedRoleInput.value = role;

    if (loginTitle) {
      loginTitle.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Login`;
    }
  }
}

/**
 * Back to Role Selection
 */
function backToRoles() {
  const roleSelectionStep = document.getElementById('roleSelectionStep');
  const loginFormStep = document.getElementById('loginFormStep');

  if (roleSelectionStep && loginFormStep) {
    roleSelectionStep.style.display = 'block';
    loginFormStep.style.display = 'none';
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  window.selectRole = selectRole; // Expose to global scope for onclick handlers
  window.backToRoles = backToRoles;
  module.exports = {
    calculateLoanEligibility,
    calculateInsurancePremium,
    showAlert,
    selectRole,
    backToRoles
  };
}


/**
 * Initialize Sidebar Toggle
 */
function initSidebar() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const body = document.body;

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      body.classList.toggle('sidebar-hidden');
    });
  }
}
