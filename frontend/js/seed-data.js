/**
 * Seed mock data into localStorage for demo purposes
 * Run this script once to initialize demo data
 */

function seedMockData() {
  // Load JSON files and store in localStorage
  fetch('data/mock-users.json')
    .then(response => response.json())
    .then(data => {
      localStorage.setItem('mockUsers', JSON.stringify(data));
      console.log('✓ Users data seeded');
    })
    .catch(err => console.error('Error loading users:', err));

  fetch('data/mock-farms.json')
    .then(response => response.json())
    .then(data => {
      localStorage.setItem('farms', JSON.stringify(data));
      console.log('✓ Farms data seeded');
    })
    .catch(err => console.error('Error loading farms:', err));

  fetch('data/mock-loans.json')
    .then(response => response.json())
    .then(data => {
      localStorage.setItem('loans', JSON.stringify(data));
      console.log('✓ Loans data seeded');
    })
    .catch(err => console.error('Error loading loans:', err));

  fetch('data/mock-policies.json')
    .then(response => response.json())
    .then(data => {
      localStorage.setItem('policies', JSON.stringify(data));
      console.log('✓ Policies data seeded');
    })
    .catch(err => console.error('Error loading policies:', err));

  fetch('data/mock-claims.json')
    .then(response => response.json())
    .then(data => {
      localStorage.setItem('claims', JSON.stringify(data));
      console.log('✓ Claims data seeded');
    })
    .catch(err => console.error('Error loading claims:', err));
}

// Auto-seed on page load if data doesn't exist
if (typeof window !== 'undefined') {
  window.seedMockData = seedMockData;
  
  // Check if data already exists
  if (!localStorage.getItem('mockUsers')) {
    // Only seed if running from a server (not file://)
    if (window.location.protocol !== 'file:') {
      document.addEventListener('DOMContentLoaded', seedMockData);
    }
  }
}

