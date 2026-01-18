/**
 * Agri Fintech & Insurance - Index Page JavaScript
 * Handles landing page interactions, slider, and login modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSlider();
    initModal();

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Sign Up Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
});

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
    const loginBtns = [document.getElementById('loginBtn'), document.getElementById('heroLoginBtn'), document.getElementById('ctaLoginBtn')];
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
    const signupLinkContainer = document.getElementById('signupLinkContainer');

    if (roleSelectionStep && loginFormStep && selectedRoleInput) {
        roleSelectionStep.style.display = 'none';
        loginFormStep.style.display = 'block';
        selectedRoleInput.value = role;

        if (loginTitle) {
            loginTitle.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Login`;
        }

        // Hide sign-up link for admin, show for farmers and agents
        if (signupLinkContainer) {
            if (role === 'admin') {
                signupLinkContainer.style.display = 'none';
            } else {
                signupLinkContainer.style.display = 'block';
            }
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

/**
 * Handle Login Submission
 */
function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const roleInput = document.getElementById('selectedRole');

    const data = {
        email: emailInput.value,
        password: passwordInput.value,
        role: roleInput.value
    };

    // Call the API-based login from common.js
    if (window.handleLogin) {
        window.handleLogin(data);
    }
}

/**
 * Show Sign Up Form
 */
function showSignupForm() {
    const loginFormStep = document.getElementById('loginFormStep');
    const signupFormStep = document.getElementById('signupFormStep');
    const signupRoleInput = document.getElementById('signupRole');
    const selectedRole = document.getElementById('selectedRole').value;
    const signupTitle = document.getElementById('signupTitle');

    if (loginFormStep && signupFormStep) {
        loginFormStep.style.display = 'none';
        signupFormStep.style.display = 'block';

        if (signupRoleInput) {
            signupRoleInput.value = selectedRole;
        }

        if (signupTitle) {
            signupTitle.textContent = `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Sign Up`;
        }
    }
}

/**
 * Show Login Form
 */
function showLoginForm() {
    const loginFormStep = document.getElementById('loginFormStep');
    const signupFormStep = document.getElementById('signupFormStep');

    if (loginFormStep && signupFormStep) {
        signupFormStep.style.display = 'none';
        loginFormStep.style.display = 'block';
    }
}

/**
 * Handle Sign Up Submission
 */
function handleSignupSubmit(event) {
    event.preventDefault();
    const form = event.target;

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const address = document.getElementById('signupAddress').value;
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    const role = document.getElementById('signupRole').value;

    // Validate name
    if (!name || name.trim() === '') {
        showAlert('Full name is required', 'error');
        return;
    }
    if (name.trim().length < 2) {
        showAlert('Name must be at least 2 characters long', 'error');
        return;
    }

    // Validate email using common.js function
    const emailValidation = window.validateEmail ? window.validateEmail(email) : { valid: email && email.includes('@') };
    if (!emailValidation.valid) {
        showAlert(emailValidation.message || 'Please enter a valid email address', 'error');
        return;
    }

    // Validate phone (optional but if provided, validate format)
    if (phone && phone.trim() !== '') {
        const phoneRegex = /^[0-9]{10,15}$/;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            showAlert('Please enter a valid phone number (10-15 digits)', 'error');
            return;
        }
    }

    // Validate password using common.js function
    const passwordValidation = window.validatePassword ? window.validatePassword(password) : { valid: password && password.length >= 6 };
    if (!passwordValidation.valid) {
        showAlert(passwordValidation.message || 'Password must be at least 6 characters', 'error');
        return;
    }

    // Validate password match
    if (password !== passwordConfirm) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    const data = {
        name,
        email,
        phone,
        address,
        password,
        role
    };

    handleSignup(data);
}

/**
 * Handle user signup - calls backend API
 */
async function handleSignup(data) {
    try {
        const { name, email, phone, address, password, role } = data;

        if (!name || !email || !password || !role) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }

        // Show loading state
        const submitButton = document.querySelector('#signupForm button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Creating Account...</span>';
        }

        // Call backend API
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000/api';
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role,
                phone: phone || '',
                address: address || ''
            })
        });

        const result = await response.json();

        // Restore button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }

        if (!response.ok || !result.success) {
            showAlert(result.message || 'Registration failed. Please try again.', 'error');
            return;
        }

        // Store user data and token
        const currentUser = result.data.user;
        const authToken = result.data.token;

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('authToken', authToken);

        showAlert('Account created successfully! Redirecting...', 'success');

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
        console.error('Signup error:', error);
        showAlert('Network error. Please check if the backend server is running.', 'error');

        // Restore button state
        const submitButton = document.querySelector('#signupForm button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

// Expose functions to global scope for HTML onclick handlers
window.selectRole = selectRole;
window.backToRoles = backToRoles;
window.showSignupForm = showSignupForm;
window.showLoginForm = showLoginForm;
