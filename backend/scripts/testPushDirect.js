// scripts/testPushDirect.js
require('dotenv').config();
const { Expo } = require('expo-server-sdk');
const mongoose = require('mongoose');
const User = require('../model/User');

const expo = new Expo();

async function run() {
  try {
    console.log("🔌 Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 1. Find the user
    const email = "farhanfitri1@gmail.com"; // Your email
    const user = await User.findOne({ email });

    if (!user) {
        console.error("❌ User not found");
        return;
    }

    console.log(`👤 User: ${user.email}`);
    console.log(`🎫 Tokens: ${JSON.stringify(user.pushTokens)}`);

    if (!user.pushTokens || user.pushTokens.length === 0) {
        console.error("❌ No tokens found!");
        return;
    }

    // 2. Construct Message
    const messages = [];
    for (const token of user.pushTokens) {
        if (!Expo.isExpoPushToken(token)) {
            console.error(`⚠️ Invalid Token: ${token}`);
            continue;
        }
        
        messages.push({
            to: token,
            sound: 'default',
            title: "🔔 Test Push",
            body: "This is a direct test from the backend script.",
            data: { test: true },
            priority: 'high', // Important for Android
            channelId: 'default', // Important for Android Expo
        });
    }

    // 3. Send
    console.log(`🚀 Sending ${messages.length} messages...`);
    const chunks = expo.chunkPushNotifications(messages);
    
    for (let chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log("✅ Expo Response:", ticketChunk);
            
            // Check for specific errors in the ticket
            ticketChunk.forEach((ticket, i) => {
                if (ticket.status === 'error') {
                    console.error(`❌ Error sending to ${chunk[i].to}: ${ticket.message}`);
                    if (ticket.details && ticket.details.error) {
                        console.error(`   Details: ${ticket.details.error}`);
                    }
                }
            });

        } catch (error) {
            console.error("❌ Transmission Error:", error);
        }
    }

  } catch (e) {
      console.error(e);
  } finally {
      await mongoose.disconnect();
      process.exit();
  }
}

run();
