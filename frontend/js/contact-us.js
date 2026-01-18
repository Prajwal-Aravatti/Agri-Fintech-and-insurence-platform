// Contact Us Page JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            document.body.classList.toggle('sidebar-hidden');
        });
    }

    // Contact form submission
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const phone = document.getElementById('contactPhone').value.trim();
            const subject = document.getElementById('contactSubject').value;
            const message = document.getElementById('contactMessage').value.trim();

            // Validation
            if (!name || name.length < 2) {
                showPopup('Please enter a valid name (at least 2 characters)', 'error');
                return;
            }

            if (!email || !isValidEmail(email)) {
                showPopup('Please enter a valid email address', 'error');
                return;
            }

            if (phone && !isValidPhone(phone)) {
                showPopup('Please enter a valid phone number (10-15 digits)', 'error');
                return;
            }

            if (!subject) {
                showPopup('Please select a subject', 'error');
                return;
            }

            if (!message || message.length < 10) {
                showPopup('Please enter a message (at least 10 characters)', 'error');
                return;
            }

            // Form is valid - simulate submission
            const formData = {
                name,
                email,
                phone,
                subject,
                message,
                timestamp: new Date().toISOString()
            };

            console.log('Contact form submitted:', formData);

            // Show success message
            showPopup('Thank you for contacting us! We will get back to you within 24 hours.', 'success');

            // Reset form
            contactForm.reset();
        });
    }

    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Phone validation
    function isValidPhone(phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        return phoneDigits.length >= 10 && phoneDigits.length <= 15;
    }

    // Popup notification function
    function showPopup(message, type) {
        // Remove any existing popups
        const existingPopup = document.querySelector('.contact-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create popup element
        const popup = document.createElement('div');
        popup.className = `contact-popup contact-popup-${type}`;
        popup.innerHTML = `
            <div class="popup-content">
                <span class="popup-message">${message}</span>
                <button class="popup-close">&times;</button>
            </div>
        `;

        // Add styles dynamically
        popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            background: ${type === 'success' ? '#e8f5e9' : '#ffebee'};
            border: 2px solid ${type === 'success' ? '#4caf50' : '#f44336'};
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;

        const popupContent = popup.querySelector('.popup-content');
        popupContent.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        const popupMessage = popup.querySelector('.popup-message');
        popupMessage.style.cssText = `
            color: ${type === 'success' ? '#2e7d32' : '#c62828'};
            font-weight: 500;
            flex: 1;
        `;

        const popupClose = popup.querySelector('.popup-close');
        popupClose.style.cssText = `
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: ${type === 'success' ? '#4caf50' : '#f44336'};
            padding: 0;
            line-height: 1;
        `;

        // Add to document
        document.body.appendChild(popup);

        // Close button functionality
        popupClose.addEventListener('click', function () {
            popup.remove();
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => popup.remove(), 300);
            }
        }, 5000);
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
