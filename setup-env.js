/**
 * Quick Setup Script
 * Creates .env file from .env.example if it doesn't exist
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  process.exit(0);
}

// Check if .env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ .env.example file not found');
  process.exit(1);
}

// Read .env.example
let envContent = fs.readFileSync(envExamplePath, 'utf8');

// Generate a random JWT secret
const jwtSecret = crypto.randomBytes(32).toString('hex');
envContent = envContent.replace(
  'JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters',
  `JWT_SECRET=${jwtSecret}`
);

// Write .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ .env file created successfully!');
console.log('📝 Please update MONGODB_URI with your MongoDB connection string');
console.log('🔑 JWT_SECRET has been auto-generated');

