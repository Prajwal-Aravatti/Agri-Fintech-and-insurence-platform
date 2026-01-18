/**
 * Error Diagnostic Script
 * Helps identify npm install issues
 */

console.log('🔍 Diagnosing npm install issues...\n');

// Check Node version
console.log('1. Node.js Version:');
try {
  const nodeVersion = process.version;
  console.log(`   ✅ Node.js: ${nodeVersion}`);
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 14) {
    console.log('   ⚠️  Warning: Node.js v14+ recommended');
  } else {
    console.log('   ✅ Version is compatible');
  }
} catch (e) {
  console.log('   ❌ Cannot detect Node.js version');
}

// Check npm version
console.log('\n2. npm Version:');
const { execSync } = require('child_process');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`   ✅ npm: ${npmVersion}`);
} catch (e) {
  console.log('   ❌ Cannot detect npm version');
}

// Check if node_modules exists
console.log('\n3. Installation Status:');
const fs = require('fs');
if (fs.existsSync('node_modules')) {
  console.log('   ✅ node_modules directory exists');
  
  // Check key packages
  const packages = ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'cors', 'dotenv'];
  const missing = [];
  packages.forEach(pkg => {
    if (!fs.existsSync(`node_modules/${pkg}`)) {
      missing.push(pkg);
    }
  });
  
  if (missing.length === 0) {
    console.log('   ✅ All required packages are installed');
  } else {
    console.log(`   ⚠️  Missing packages: ${missing.join(', ')}`);
  }
} else {
  console.log('   ❌ node_modules not found - installation incomplete');
}

// Check package.json
console.log('\n4. package.json:');
if (fs.existsSync('package.json')) {
  console.log('   ✅ package.json exists');
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`   ✅ Valid JSON`);
    console.log(`   ✅ Dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
    console.log(`   ✅ DevDependencies: ${Object.keys(pkg.devDependencies || {}).length}`);
  } catch (e) {
    console.log('   ❌ Invalid JSON in package.json');
    console.log(`   Error: ${e.message}`);
  }
} else {
  console.log('   ❌ package.json not found');
}

// Check disk space (basic check)
console.log('\n5. System Info:');
try {
  const os = require('os');
  const freeGB = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
  const totalGB = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
  console.log(`   💾 Free Memory: ${freeGB} GB / ${totalGB} GB`);
  if (parseFloat(freeGB) < 1) {
    console.log('   ⚠️  Low memory - may cause installation issues');
  }
} catch (e) {
  console.log('   ⚠️  Cannot check system info');
}

console.log('\n' + '='.repeat(50));
console.log('💡 Common Solutions:');
console.log('1. Clear cache: npm cache clean --force');
console.log('2. Remove node_modules: rm -rf node_modules');
console.log('3. Reinstall: npm install');
console.log('4. Try: npm install --legacy-peer-deps');
console.log('5. Check TROUBLESHOOTING.md for detailed solutions');
console.log('='.repeat(50));

