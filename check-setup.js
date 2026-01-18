/**
 * Setup Checker Script
 * Verifies if the application is ready to run
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking application setup...\n');

let allGood = true;

// Check 1: package.json exists
console.log('1. Checking package.json...');
if (fs.existsSync('package.json')) {
  console.log('   ✅ package.json found');
} else {
  console.log('   ❌ package.json not found');
  allGood = false;
}

// Check 2: node_modules exists
console.log('\n2. Checking dependencies...');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ Dependencies installed (node_modules exists)');
} else {
  console.log('   ⚠️  Dependencies not installed');
  console.log('   → Run: npm install');
  allGood = false;
}

// Check 3: .env file exists
console.log('\n3. Checking .env file...');
if (fs.existsSync('.env')) {
  console.log('   ✅ .env file found');
  
  // Check if .env has required variables
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(v => !envContent.includes(v));
  
  if (missingVars.length === 0) {
    console.log('   ✅ Required environment variables found');
  } else {
    console.log('   ⚠️  Missing variables:', missingVars.join(', '));
    allGood = false;
  }
} else {
  console.log('   ❌ .env file not found');
  console.log('   → Create .env file with MongoDB URI and JWT_SECRET');
  console.log('   → See CREATE_ENV.md or START_HERE.md for template');
  allGood = false;
}

// Check 4: Backend files exist
console.log('\n4. Checking backend files...');
const backendFiles = [
  'backend/server.js',
  'backend/models/User.js',
  'backend/routes/auth.js',
  'backend/middleware/auth.js'
];

let backendOk = true;
backendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} missing`);
    backendOk = false;
    allGood = false;
  }
});

// Check 5: Frontend integration
console.log('\n5. Checking frontend integration...');
if (fs.existsSync('js/common.js')) {
  const commonJs = fs.readFileSync('js/common.js', 'utf8');
  if (commonJs.includes('handleLogin') && commonJs.includes('API_BASE_URL')) {
    console.log('   ✅ Frontend is integrated with backend');
  } else {
    console.log('   ⚠️  Frontend may not be fully integrated');
  }
} else {
  console.log('   ⚠️  js/common.js not found');
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ Application is READY TO RUN!');
  console.log('\nNext steps:');
  console.log('1. Start backend: npm run dev');
  console.log('2. Start frontend: python -m http.server 8000');
  console.log('3. Open: http://localhost:8000/login.html');
} else {
  console.log('⚠️  Application is NOT ready yet');
  console.log('\nPlease complete the missing setup steps above.');
  console.log('See START_HERE.md for detailed instructions.');
}
console.log('='.repeat(50));

process.exit(allGood ? 0 : 1);

