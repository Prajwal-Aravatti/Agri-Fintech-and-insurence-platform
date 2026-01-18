/**
 * Agri Fintech & Insurance - Admin Dashboard JavaScript
 * Handles admin stats, user management, and system overview.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadSystemStats();
});

async function loadSystemStats() {
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const policies = JSON.parse(localStorage.getItem('policies') || '[]');
    const claims = JSON.parse(localStorage.getItem('claims') || '[]');

    // Fetch loans from backend API
    let loans = [];
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
            const response = await fetch('http://localhost:3000/api/loans', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                loans = result.data;
            }
        }
    } catch (error) {
        console.error('Error fetching loans:', error);
    }

    const stats = {
        totalUsers: users.length,
        totalLoans: loans.length,
        totalPolicies: policies.length,
        totalClaims: claims.length,
        pendingLoans: loans.filter(l => l.status === 'pending').length,
        pendingClaims: claims.filter(c => c.status === 'pending').length
    };

    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Users</div>
                <div class="stat-value">${stats.totalUsers}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Loans</div>
                <div class="stat-value">${stats.totalLoans}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Policies</div>
                <div class="stat-value">${stats.totalPolicies}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Claims</div>
                <div class="stat-value">${stats.totalClaims}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Pending Loans</div>
                <div class="stat-value text-warning">${stats.pendingLoans}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Pending Claims</div>
                <div class="stat-value text-warning">${stats.pendingClaims}</div>
            </div>
        `;
    }
}

function showUserManagement() {
    const section = document.getElementById('user-management-section');
    if (section) {
        section.style.display = 'block';
        loadUsers();
    }
}

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const container = document.getElementById('users-list');

    if (container) {
        container.innerHTML = users.map(user => `
            <div class="card card-user">
                <h3>${user.name}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role}</p>
                <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                <span class="badge badge-${user.role === 'admin' ? 'success' : user.role === 'agent' ? 'pending' : 'approved'}">${user.role}</span>
            </div>
        `).join('');
    }
}

async function showAllLoans() {
    const section = document.getElementById('user-management-section');

    if (section) {
        section.style.display = 'block';
        const container = document.getElementById('users-list');
        container.innerHTML = '<p>Loading loans...</p>';

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            let loans = [];

            if (token) {
                const response = await fetch('http://localhost:3000/api/loans', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (result.success) {
                    loans = result.data;
                }
            }

            container.innerHTML = `
                <h2>All Loan Applications (${loans.length})</h2>
                ${loans.length === 0 ? '<p>No loan applications found</p>' : ''}
                ${loans.map(loan => `
                    <div class="card" style="margin-bottom: 1.5rem; border-left: 4px solid ${loan.status === 'approved' ? '#28a745' : loan.status === 'rejected' ? '#dc3545' : '#ffc107'};">
                        <h3 style="margin-bottom: 1rem;">
                            ${loan.firstName || 'N/A'} ${loan.middleName || ''} ${loan.lastName || ''}
                            <span class="badge" style="background: ${loan.status === 'approved' ? '#28a745' : loan.status === 'rejected' ? '#dc3545' : '#ffc107'}; color: white; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; font-size: 0.8rem; margin-left: 10px;">${loan.status}</span>
                        </h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem; color: #333;">Personal Details</h4>
                                <p><strong>ID Type:</strong> ${loan.identityType?.toUpperCase() || 'N/A'}</p>
                                <p><strong>ID Number:</strong> ${loan.identityNumber || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem; color: #333;">Bank Details</h4>
                                <p><strong>Bank:</strong> ${loan.bankName || 'N/A'}</p>
                                <p><strong>Account:</strong> ${loan.accountNumber || 'N/A'}</p>
                                <p><strong>IFSC:</strong> ${loan.ifscCode || 'N/A'}</p>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem; color: #333;">Farm Details</h4>
                                <p><strong>Area:</strong> ${loan.farmArea || 'N/A'} acres</p>
                                <p><strong>Crop:</strong> ${loan.cropType || 'N/A'}</p>
                                <p><strong>Location:</strong> ${loan.landLocation || 'N/A'}</p>
                                <p><strong>Income:</strong> ₹${loan.annualIncome?.toLocaleString() || 'N/A'}</p>
                            </div>
                            
                            <div style="background: ${loan.status === 'approved' ? '#e8f5e9' : loan.status === 'rejected' ? '#ffebee' : '#fff3e0'}; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem; color: #333;">Loan Details</h4>
                                <p><strong>Amount:</strong> ₹${loan.loanAmount?.toLocaleString() || 'N/A'}</p>
                                <p><strong>Purpose:</strong> ${loan.purpose || 'N/A'}</p>
                                <p><strong>Tenure:</strong> ${loan.loanTenure || 'N/A'} months</p>
                                <p><strong>EMI:</strong> ₹${loan.monthlyEMI?.toLocaleString() || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <p style="margin-top: 1rem; color: #666;"><strong>Applied:</strong> ${new Date(loan.createdAt).toLocaleDateString()}</p>
                        ${loan.comments ? `<p><strong>Comments:</strong> ${loan.comments}</p>` : ''}
                        
                        ${loan.status === 'pending' ? `
                            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                                <button class="btn btn-primary" onclick="approveLoanAdmin('${loan._id}')">Approve</button>
                                <button class="btn btn-secondary" onclick="rejectLoanAdmin('${loan._id}')" style="margin-left: 0.5rem;">Reject</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            `;
            section.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error loading loans:', error);
            container.innerHTML = `<p>Error loading loans: ${error.message}</p>`;
        }
    }
}

function showAllPolicies() {
    const policies = JSON.parse(localStorage.getItem('policies') || '[]');
    const section = document.getElementById('user-management-section');

    if (section) {
        section.style.display = 'block';
        const container = document.getElementById('users-list');
        container.innerHTML = `
            <h2>All Insurance Policies (${policies.length})</h2>
            ${policies.length === 0 ? '<p>No insurance policies found</p>' : ''}
            ${policies.map(policy => `
                <div class="card" style="margin-bottom: 1rem;">
                    <h3>Policy #${policy.id}</h3>
                    <p><strong>Farmer ID:</strong> ${policy.farmerId}</p>
                    <p><strong>Type:</strong> ${policy.insuranceType || 'N/A'}</p>
                    <p><strong>Coverage:</strong> ₹${policy.coverageAmount?.toLocaleString() || 'N/A'}</p>
                    <p><strong>Premium:</strong> ₹${policy.premium?.toLocaleString() || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${policy.status}">${policy.status}</span></p>
                </div>
            `).join('')}
        `;
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showAllClaims() {
    const claims = JSON.parse(localStorage.getItem('claims') || '[]');
    const section = document.getElementById('user-management-section');

    if (section) {
        section.style.display = 'block';
        const container = document.getElementById('users-list');
        container.innerHTML = `
            <h2>All Insurance Claims (${claims.length})</h2>
            ${claims.length === 0 ? '<p>No insurance claims found</p>' : ''}
            ${claims.map(claim => `
                <div class="card" style="margin-bottom: 1rem;">
                    <h3>Claim #${claim.id}</h3>
                    <p><strong>Policy ID:</strong> ${claim.policyId}</p>
                    <p><strong>Type:</strong> ${claim.claimType || 'N/A'}</p>
                    <p><strong>Amount:</strong> ₹${claim.claimedAmount?.toLocaleString() || 'N/A'}</p>
                    <p><strong>Description:</strong> ${claim.description || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="badge badge-${claim.status}">${claim.status}</span></p>
                    <p><strong>Filed:</strong> ${new Date(claim.createdAt).toLocaleDateString()}</p>
                </div>
            `).join('')}
        `;
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showAnalytics() {
    const loans = JSON.parse(localStorage.getItem('loans') || '[]');
    const policies = JSON.parse(localStorage.getItem('policies') || '[]');
    const claims = JSON.parse(localStorage.getItem('claims') || '[]');
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');

    const section = document.getElementById('user-management-section');

    if (section) {
        section.style.display = 'block';
        const container = document.getElementById('users-list');
        container.innerHTML = `
            <h2>System Analytics</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value">${users.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Farmers</div>
                    <div class="stat-value">${users.filter(u => u.role === 'farmer').length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Agents</div>
                    <div class="stat-value">${users.filter(u => u.role === 'agent').length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Loans</div>
                    <div class="stat-value">${loans.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Approved Loans</div>
                    <div class="stat-value text-success">${loans.filter(l => l.status === 'approved').length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Pending Loans</div>
                    <div class="stat-value text-warning">${loans.filter(l => l.status === 'pending').length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Policies</div>
                    <div class="stat-value">${policies.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Policies</div>
                    <div class="stat-value text-success">${policies.filter(p => p.status === 'approved').length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Claims</div>
                    <div class="stat-value">${claims.length}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Pending Claims</div>
                    <div class="stat-value text-warning">${claims.filter(c => c.status === 'pending').length}</div>
                </div>
            </div>
        `;
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showSettings() {
    const section = document.getElementById('user-management-section');

    if (section) {
        section.style.display = 'block';
        const container = document.getElementById('users-list');
        container.innerHTML = `
            <h2>System Settings</h2>
            <div class="card">
                <h3>Application Configuration</h3>
                <p><strong>App Name:</strong> Agri Fintech & Insurance</p>
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Environment:</strong> Development</p>
            </div>
            <div class="card" style="margin-top: 1rem;">
                <h3>Data Management</h3>
                <button class="btn btn-secondary" onclick="if(confirm('Clear all loan data?')) { localStorage.removeItem('loans'); showAlert('Loans cleared', 'success'); }">
                    Clear Loan Data
                </button>
                <button class="btn btn-secondary" onclick="if(confirm('Clear all policy data?')) { localStorage.removeItem('policies'); showAlert('Policies cleared', 'success'); }" style="margin-left: 0.5rem;">
                    Clear Policy Data
                </button>
                <button class="btn btn-secondary" onclick="if(confirm('Clear all claim data?')) { localStorage.removeItem('claims'); showAlert('Claims cleared', 'success'); }" style="margin-left: 0.5rem;">
                    Clear Claim Data
                </button>
            </div>
        `;
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Admin loan approval functions
async function approveLoanAdmin(loanId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            showAlert('Please login to approve loans', 'error');
            return;
        }

        const response = await fetch(`http://localhost:3000/api/loans/${loanId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                comments: 'Approved by admin'
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Loan approved successfully!', 'success');
            showAllLoans(); // Refresh the list
            loadSystemStats(); // Refresh stats
        } else {
            showAlert(`Error: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error approving loan:', error);
        showAlert(`Error approving loan: ${error.message}`, 'error');
    }
}

async function rejectLoanAdmin(loanId) {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            showAlert('Please login to reject loans', 'error');
            return;
        }

        const response = await fetch(`http://localhost:3000/api/loans/${loanId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'rejected',
                comments: 'Rejected by admin'
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Loan rejected', 'success');
            showAllLoans(); // Refresh the list
            loadSystemStats(); // Refresh stats
        } else {
            showAlert(`Error: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error rejecting loan:', error);
        showAlert(`Error rejecting loan: ${error.message}`, 'error');
    }
}

// Expose functions to global scope
window.showUserManagement = showUserManagement;
window.showAllLoans = showAllLoans;
window.showAllPolicies = showAllPolicies;
window.showAllClaims = showAllClaims;
window.showAnalytics = showAnalytics;
window.showSettings = showSettings;
window.approveLoanAdmin = approveLoanAdmin;
window.rejectLoanAdmin = rejectLoanAdmin;

