// scripts/checkSubscriptions.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../model/User'); // Uses your local User model

async function check() {
  try {
    console.log("🔌 Connecting...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected.");

    // Find all users with ANY subscriptions
    const users = await User.find({ 'subscriptions.0': { $exists: true } });

    console.log(`\n📋 Found ${users.length} users with subscriptions:\n`);

    users.forEach(u => {
      console.log(`👤 User: ${u.email} (${u.userId})`);
      if (u.subscriptions.length === 0) {
        console.log("   (No subscriptions)");
      } else {
        u.subscriptions.forEach(sub => {
          const statusIcon = sub.isActive ? '✅' : '❌';
          console.log(`   ${statusIcon} Device: "${sub.deviceId}" (Active: ${sub.isActive})`);
        });
      }
      console.log('---');
    });

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

check();
