// scripts/checkNotifications.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../model/User');
const Notification = require('../model/Notification');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find your user
    const email = "farhanfitri1@gmail.com"; 
    const user = await User.findOne({ email });

    if (!user) {
        console.log("User not found!");
        return;
    }

    console.log(`\n🔔 Checking notifications for ${user.email} (${user.userId})`);
    console.log(`   Push Tokens: ${JSON.stringify(user.pushTokens)}`);

    // Check User's recentNotifications array
    console.log(`\n📂 User Profile (Recent Notifications: ${user.recentNotifications.length})`);
    user.recentNotifications.slice(-3).forEach(n => {
        console.log(`   - [${n.sentAt ? n.sentAt.toISOString() : 'No Date'}] ${n.message}`);
    });

    // Check Notifications Collection
    const dbNotifs = await Notification.find({ 'recipients.userId': user.userId })
        .sort({ createdAt: -1 })
        .limit(3);

    console.log(`\n🗄️  Notification Collection (Last 3):`);
    dbNotifs.forEach(n => {
        console.log(`   - [${n.createdAt.toISOString()}] ${n.content.message} (Status: ${n.recipients[0].status})`);
    });

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

check();
