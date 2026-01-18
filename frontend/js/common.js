/**
 * Agri Fintech & Insurance - Common JavaScript
 * Shared logic for authentication, UI utilities, and navigation.
 */

// Global State
let currentUser = null;
let authToken = null;

// API Configuration
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeCommon();
});

function initializeCommon() {
    // Check for stored authentication
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');

    if (storedUser && storedToken) {
        currentUser = JSON.parse(storedUser);
        authToken = storedToken;
        updateUIForUser();
    }

    // Initialize Sidebar
    initSidebar();

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
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
 * Handle login - calls backend API
 */
async function handleLogin(data) {
    try {
        const { email, password, role } = data;

        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            showAlert(emailValidation.message, 'error');
            return;
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            showAlert(passwordValidation.message, 'error');
            return;
        }

        if (!role) {
            showAlert('Please select a role first', 'error');
            return;
        }

        // Show loading state
        const submitButton = document.querySelector('#login-form button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Logging in...</span>';
        }

        // Call backend API
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                role
            })
        });

        const result = await response.json();

        // Restore button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }

        if (!response.ok || !result.success) {
            showAlert(result.message || 'Login failed. Please check your credentials.', 'error');
            return;
        }

        // Store user data and token
        currentUser = result.data.user;
        authToken = result.data.token;

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', authToken);

        showAlert('Login successful! Redirecting...', 'success');

        // Redirect to role-specific dashboard
        setTimeout(() => {
            const dashboardMap = {
                'farmer': 'dashboard-farmer.html',
                'agent': 'dashboard-agent.html',
                'admin': 'dashboard-admin.html'
            };
            window.location.href = dashboardMap[role] || 'dashboard-farmer.html';
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please check if the backend server is running.', 'error');

        // Restore button state
        const submitButton = document.querySelector('#login-form button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
        }
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
 * Email validation
 */
function validateEmail(email) {
    if (!email || email.trim() === '') {
        return { valid: false, message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true };
}

/**
 * Password validation
 */
function validatePassword(password) {
    if (!password || password.trim() === '') {
        return { valid: false, message: 'Password is required' };
    }
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true };
}

/**
 * Show alert message as a centered popup modal
 */
function showAlert(message, type = 'success') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.popup-alert-overlay');
    existingAlerts.forEach(alert => alert.remove());

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-alert-overlay';

    // Create popup container
    const popup = document.createElement('div');
    popup.className = `popup-alert popup-alert-${type}`;

    // Icon based on type
    const iconMap = {
        'success': '✓',
        'error': '✕',
        'warning': '⚠',
        'info': 'ℹ'
    };

    // Title based on type
    const titleMap = {
        'success': 'Success!',
        'error': 'Error!',
        'warning': 'Warning!',
        'info': 'Information'
    };

    popup.innerHTML = `
        <div class="popup-alert-icon">${iconMap[type] || iconMap['info']}</div>
        <div class="popup-alert-title">${titleMap[type] || titleMap['info']}</div>
        <div class="popup-alert-message">${message}</div>
        <button class="popup-alert-btn" onclick="this.closest('.popup-alert-overlay').remove()">OK</button>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Add styles if not already added
    if (!document.getElementById('popup-alert-styles')) {
        const style = document.createElement('style');
        style.id = 'popup-alert-styles';
        style.textContent = `
            .popup-alert-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.2s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from { transform: scale(0.8) translateY(-20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            
            .popup-alert {
                background: white;
                border-radius: 16px;
                padding: 2rem 2.5rem;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
                animation: slideIn 0.3s ease;
            }
            
            .popup-alert-icon {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                margin: 0 auto 1rem;
                color: white;
                font-weight: bold;
            }
            
            .popup-alert-success .popup-alert-icon {
                background: linear-gradient(135deg, #4CAF50, #2d8659);
            }
            
            .popup-alert-error .popup-alert-icon {
                background: linear-gradient(135deg, #f44336, #c62828);
            }
            
            .popup-alert-warning .popup-alert-icon {
                background: linear-gradient(135deg, #ff9800, #f57c00);
            }
            
            .popup-alert-info .popup-alert-icon {
                background: linear-gradient(135deg, #2196F3, #1565C0);
            }
            
            .popup-alert-title {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }
            
            .popup-alert-success .popup-alert-title {
                color: #2d8659;
            }
            
            .popup-alert-error .popup-alert-title {
                color: #c62828;
            }
            
            .popup-alert-warning .popup-alert-title {
                color: #f57c00;
            }
            
            .popup-alert-info .popup-alert-title {
                color: #1565C0;
            }
            
            .popup-alert-message {
                color: #666;
                margin-bottom: 1.5rem;
                line-height: 1.5;
                font-size: 1rem;
            }
            
            .popup-alert-btn {
                padding: 0.75rem 2.5rem;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                color: white;
            }
            
            .popup-alert-success .popup-alert-btn {
                background: linear-gradient(135deg, #4CAF50, #2d8659);
            }
            
            .popup-alert-success .popup-alert-btn:hover {
                background: linear-gradient(135deg, #2d8659, #1f5d3f);
                transform: translateY(-2px);
            }
            
            .popup-alert-error .popup-alert-btn {
                background: linear-gradient(135deg, #f44336, #c62828);
            }
            
            .popup-alert-error .popup-alert-btn:hover {
                background: linear-gradient(135deg, #c62828, #b71c1c);
                transform: translateY(-2px);
            }
            
            .popup-alert-warning .popup-alert-btn {
                background: linear-gradient(135deg, #ff9800, #f57c00);
            }
            
            .popup-alert-warning .popup-alert-btn:hover {
                background: linear-gradient(135deg, #f57c00, #e65100);
                transform: translateY(-2px);
            }
            
            .popup-alert-info .popup-alert-btn {
                background: linear-gradient(135deg, #2196F3, #1565C0);
            }
            
            .popup-alert-info .popup-alert-btn:hover {
                background: linear-gradient(135deg, #1565C0, #0D47A1);
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    // Auto-remove after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 3000);
    }
}

// Export for other scripts if needed (though we rely on global scope for simple inclusion)
window.currentUser = currentUser;
window.showAlert = showAlert;
window.updateUIForUser = updateUIForUser;
window.handleLogin = handleLogin;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;

/**
 * Smooth scroll to section
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

window.scrollToSection = scrollToSection;
