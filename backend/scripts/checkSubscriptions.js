// scripts/checkSubscriptions.js
process.env.TZ = 'Asia/Kuala_Lumpur';
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../model/User');
const { setServers } = require('node:dns/promises');

// Set DNS servers to resolve SRV records reliably
setServers(['1.1.1.1', '8.8.8.8']); // Uses your local User model

async function check() {
  try {
    console.log('🔌 Connecting...');
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });
    console.log('✅ Connected.');

    // Find all users with ANY subscriptions
    const users = await User.find({ 'subscriptions.0': { $exists: true } });

    console.log(`\n📋 Found ${users.length} users with subscriptions:\n`);

    users.forEach((u) => {
      console.log(`👤 User: ${u.email} (${u.userId})`);
      if (u.subscriptions.length === 0) {
        console.log('   (No subscriptions)');
      } else {
        u.subscriptions.forEach((sub) => {
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
