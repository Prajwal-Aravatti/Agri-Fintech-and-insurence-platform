/**
 * Agri Fintech & Insurance - Login Page JavaScript
 * Handles role selection and login form submission.
 */

let selectedRole = null;

function selectRole(role) {
    selectedRole = role;

    // Update UI
    document.querySelectorAll('.role-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`[data-role="${role}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }

    // Show login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.classList.add('active');
        const roleInput = document.getElementById('selected-role');
        if (roleInput) {
            roleInput.value = role;
        }
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!selectedRole) {
                alert('Please select a role first');
                return;
            }

            const formData = new FormData(this);
            // Assuming handleLogin is defined in common.js or main.js
            if (typeof handleLogin === 'function') {
                handleLogin(Object.fromEntries(formData));
            } else {
                console.error('handleLogin function not found');
                alert('Login functionality is currently unavailable.');
            }
        });
    }
});

// Expose selectRole to global scope for onclick handlers
window.selectRole = selectRole;
