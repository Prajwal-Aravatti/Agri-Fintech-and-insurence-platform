/**
 * Seed Users Script
 * Populates database with demo users from mock data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Read mock users data
    const mockUsersPath = path.join(__dirname, '../../frontend/data/mock-users.json');
    const mockUsers = JSON.parse(fs.readFileSync(mockUsersPath, 'utf8'));

    // Clear existing users (optional - comment out if you want to keep existing)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Seed users
    let seeded = 0;
    let skipped = 0;

    for (const userData of mockUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email.toLowerCase() });

        if (existingUser) {
          console.log(`⏭️  User ${userData.email} already exists, skipping...`);
          skipped++;
          continue;
        }

        // Create new user
        const user = new User({
          name: userData.name,
          email: userData.email.toLowerCase(),
          password: userData.password, // Will be hashed by pre-save hook
          role: userData.role,
          phone: userData.phone || '',
          address: userData.address || '',
          createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date()
        });

        await user.save();
        console.log(`✅ Seeded user: ${userData.email} (${userData.role})`);
        seeded++;
      } catch (error) {
        console.error(`❌ Error seeding user ${userData.email}:`, error.message);
      }
    }

    console.log(`\n📊 Seeding complete:`);
    console.log(`   ✅ Seeded: ${seeded} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users`);

    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

