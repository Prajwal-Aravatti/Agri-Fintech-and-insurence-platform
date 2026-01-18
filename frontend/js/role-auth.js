/**
 * Role-based Authentication JavaScript
 * Handles login and signup for role-specific pages
 */

const API_URL = window.API_BASE_URL || 'http://localhost:3000/api';

// Dashboard mapping
const dashboardMap = {
    farmer: 'dashboard-farmer.html',
    agent: 'dashboard-agent.html',
    admin: 'dashboard-admin.html'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleRoleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleRoleSignup);
    }
});

// Handle Login
async function handleRoleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    
    const email = formData.get('email');
    const password = formData.get('password');
    const role = formData.get('role');

    // Validate email
    if (!email || email.trim() === '') {
        showAlert('Email is required', 'error');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    // Validate password
    if (!password || password.trim() === '') {
        showAlert('Password is required', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-label">Logging in...</span>';
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (data.success) {
            // Store using same keys as common.js
            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.data.user));
            if (data.data.roleData) {
                localStorage.setItem('roleData', JSON.stringify(data.data.roleData));
            }

            showAlert('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = dashboardMap[role] || 'dashboard.html';
            }, 1500);
        } else {
            showAlert(data.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please check if the backend server is running.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Handle Signup
async function handleRoleSignup(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const address = formData.get('address');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const role = formData.get('role');

    // Validations
    if (!name || name.trim() === '') {
        showAlert('Full name is required', 'error');
        return;
    }

    if (!email || email.trim() === '') {
        showAlert('Email is required', 'error');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    if (!password || password.trim() === '') {
        showAlert('Password is required', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-label">Creating Account...</span>';
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, address, password, role })
        });

        const data = await response.json();

        if (data.success) {
            // Store using same keys as common.js
            localStorage.setItem('authToken', data.data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.data.user));
            if (data.data.roleData) {
                localStorage.setItem('roleData', JSON.stringify(data.data.roleData));
            }

            showAlert('Account created successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = dashboardMap[role] || 'dashboard.html';
            }, 1500);
        } else {
            showAlert(data.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('Network error. Please check if the backend server is running.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}
