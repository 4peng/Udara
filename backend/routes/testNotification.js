const express = require('express');
const router = express.Router();
const { Expo } = require('expo-server-sdk');
const User = require('../model/User');

const expo = new Expo();

router.post('/send', async (req, res) => {
  const { userId, title, body } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const user = await User.findOne({ 
      $or: [{ userId: userId }, { clerkUserId: userId }] 
    });
    
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return res.status(404).json({ error: 'User has no registered push tokens' });
    }

    const messages = [];
    for (const pushToken of user.pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: 'default',
        title: title || 'Test Notification',
        body: body || 'This is a test notification from Udara server!',
        data: { withSome: 'data' },
      });
    }

    if (messages.length === 0) {
        return res.status(400).json({ error: "No valid tokens found" });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }

    res.json({ success: true, tickets });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
