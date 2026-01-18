/**
 * Service Guide Handler
 * Handles click events on service tiles and displays appropriate guides
 */

// Service guide data with instructions and navigation logic
const serviceGuides = {
    'quick-loans': {
        title: 'Quick Loans - How to Apply',
        instructions: `
            <p><strong>Get agricultural loans quickly and easily:</strong></p>
            <ol style="margin-left: 1.5rem; margin-top: 1rem;">
                <li style="margin-bottom: 0.75rem;">Complete your farmer profile with land details</li>
                <li style="margin-bottom: 0.75rem;">Select loan amount and purpose (seeds, equipment, etc.)</li>
                <li style="margin-bottom: 0.75rem;">Submit required documents (land records, ID proof)</li>
                <li style="margin-bottom: 0.75rem;">Get instant eligibility status</li>
                <li style="margin-bottom: 0.75rem;">Receive funds in your account within 48 hours</li>
            </ol>
            <p style="margin-top: 1.5rem;"><strong>Note:</strong> Loan amounts range from ₹10,000 to ₹5,00,000 with competitive interest rates</p>
        `,
        loggedInUrl: 'dashboard-farmer.html#apply-loan',
        loggedOutUrl: 'login.html'
    },
    'crop-insurance': {
        title: 'Crop Insurance - Protect Your Harvest',
        instructions: `
            <p><strong>Secure your crops against natural disasters:</strong></p>
            <ol style="margin-left: 1.5rem; margin-top: 1rem;">
                <li style="margin-bottom: 0.75rem;">Select your crop type and coverage amount</li>
                <li style="margin-bottom: 0.75rem;">Get instant premium quote</li>
                <li style="margin-bottom: 0.75rem;">Upload farm documentation</li>
                <li style="margin-bottom: 0.75rem;">Make secure payment online</li>
                <li style="margin-bottom: 0.75rem;">Receive digital policy certificate immediately</li>
            </ol>
            <p style="margin-top: 1.5rem;"><strong>Coverage includes:</strong> Drought, flood, pest attack, and extreme weather conditions</p>
        `,
        loggedInUrl: 'dashboard-farmer.html#insurance',
        loggedOutUrl: 'login.html'
    },
    'easy-claims': {
        title: 'Easy Claims - Quick Filing Process',
        instructions: `
            <p><strong>File insurance claims easily:</strong></p>
            <ol style="margin-left: 1.5rem; margin-top: 1rem;">
                <li style="margin-bottom: 0.75rem;">Report crop damage immediately</li>
                <li style="margin-bottom: 0.75rem;">Upload photos of damaged crops</li>
                <li style="margin-bottom: 0.75rem;">Fill online claim form with details</li>
                <li style="margin-bottom: 0.75rem;">Track claim status in real-time</li>
                <li style="margin-bottom: 0.75rem;">Receive settlement within 7-10 working days</li>
            </ol>
            <p style="margin-top: 1.5rem;"><strong>Important:</strong> File claims within 48 hours of damage for faster processing</p>
        `,
        loggedInUrl: 'dashboard-farmer.html#claims',
        loggedOutUrl: 'login.html'
    },
    'track-status': {
        title: 'Track Status - Monitor Your Applications',
        instructions: `
            <p><strong>Stay updated on all your applications:</strong></p>
            <ol style="margin-left: 1.5rem; margin-top: 1rem;">
                <li style="margin-bottom: 0.75rem;">View real-time status of loan applications</li>
                <li style="margin-bottom: 0.75rem;">Check insurance policy details</li>
                <li style="margin-bottom: 0.75rem;">Monitor claim processing stages</li>
                <li style="margin-bottom: 0.75rem;">Receive notifications for updates</li>
                <li style="margin-bottom: 0.75rem;">Download statements and certificates</li>
            </ol>
            <p style="margin-top: 1.5rem;"><strong>Access:</strong> 24/7 online tracking from any device</p>
        `,
        loggedInUrl: 'dashboard-farmer.html#status',
        loggedOutUrl: 'login.html'
    },
    'secure-payments': {
        title: 'Secure Payments - Safe Transactions',
        instructions: `
            <p><strong>Make payments securely online:</strong></p>
            <ol style="margin-left: 1.5rem; margin-top: 1rem;">
                <li style="margin-bottom: 0.75rem;">Pay insurance premiums online</li>
                <li style="margin-bottom: 0.75rem;">Setup auto-debit for EMI payments</li>
                <li style="margin-bottom: 0.75rem;">Use UPI, cards, or net banking</li>
                <li style="margin-bottom: 0.75rem;">Track payment history</li>
                <li style="margin-bottom: 0.75rem;">Download payment receipts instantly</li>
            </ol>
            <p style="margin-top: 1.5rem;"><strong>Security:</strong> All transactions are encrypted and PCI-DSS compliant</p>
        `,
        loggedInUrl: 'dashboard-farmer.html#payments',
        loggedOutUrl: 'login.html'
    },
    'mobile-friendly': {
        title: 'Mobile Friendly - Access Anywhere',
        instructions: `
            <p><strong>Full access from your mobile device:</strong></p>
            <ol style="margin-left: 1.5rem; margin-top: 1rem;">
                <li style="margin-bottom: 0.75rem;">Responsive design works on all screen sizes</li>
                <li style="margin-bottom: 0.75rem;">Apply for loans on-the-go</li>
                <li style="margin-bottom: 0.75rem;">Upload documents using your phone camera</li>
                <li style="margin-bottom: 0.75rem;">Receive instant notifications</li>
                <li style="margin-bottom: 0.75rem;">Access dashboard from anywhere</li>
            </ol>
            <p style="margin-top: 1.5rem;"><strong>Tip:</strong> Add to home screen for app-like experience</p>
        `,
        loggedInUrl: 'dashboard-farmer.html',
        loggedOutUrl: 'login.html'
    }
};

// Track current active service
let currentActiveService = null;

// Initialize service guide handlers
document.addEventListener('DOMContentLoaded', () => {
    initServiceGuides();
});

/**
 * Initialize service guide click handlers
 */
function initServiceGuides() {
    const serviceTiles = document.querySelectorAll('.service-tile');

    serviceTiles.forEach(tile => {
        tile.addEventListener('click', handleServiceClick);
    });
}

/**
 * Handle service tile click
 */
function handleServiceClick(event) {
    const serviceName = event.currentTarget.dataset.service;

    if (!serviceName || !serviceGuides[serviceName]) {
        console.error('Service not found:', serviceName);
        return;
    }

    // If clicking the same service, toggle it off
    if (currentActiveService === serviceName) {
        hideServiceGuide();
        currentActiveService = null;
        return;
    }

    // Show guide for the new service
    showServiceGuide(serviceName);
    currentActiveService = serviceName;

    // Smooth scroll to guide section
    setTimeout(() => {
        document.getElementById('serviceGuide').scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, 100);
}

/**
 * Show service guide section
 */
function showServiceGuide(serviceName) {
    const guide = serviceGuides[serviceName];
    const guideSection = document.getElementById('serviceGuide');
    const guideTitle = document.getElementById('guideTitle');
    const guideInstructions = document.getElementById('guideInstructions');
    const guideActionBtn = document.getElementById('guideActionBtn');

    // Update content
    guideTitle.textContent = guide.title;
    guideInstructions.innerHTML = guide.instructions;

    // Setup button  action
    guideActionBtn.onclick = () => {
        navigateToService(guide);
    };

    // Show section with animation
    guideSection.style.display = 'block';
    setTimeout(() => {
        guideSection.style.opacity = '1';
        guideSection.style.transform = 'translateY(0)';
    }, 10);
}

/**
 * Hide service guide section
 */
function hideServiceGuide() {
    const guideSection = document.getElementById('serviceGuide');
    guideSection.style.opacity = '0';
    guideSection.style.transform = 'translateY(-20px)';
    setTimeout(() => {
        guideSection.style.display = 'none';
    }, 300);
}

/**
 * Navigate to service based on login status
 */
function navigateToService(guide) {
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');

    if (currentUser && authToken) {
        // User is logged in, navigate to service page
        window.location.href = guide.loggedInUrl;
    } else {
        // User not logged in, open the login modal
        // Store intended destination for after login
        localStorage.setItem('intendedDestination', guide.loggedInUrl);

        // Open login modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('show');
            // Reset to role selection
            if (typeof backToRoles === 'function') {
                backToRoles();
            }
        }
    }
}

// Add CSS for smooth transitions
const style = document.createElement('style');
style.textContent = `
    .service-guide-section {
        transition: all 0.3s ease-in-out;
        opacity: 0;
        transform: translateY(-20px);
    }
    
    .service-tile {
        transition: all 0.3s ease;
    }
    
    .service-tile:active {
        transform: translateY(-2px) scale(0.98);
    }
`;
document.head.appendChild(style);
