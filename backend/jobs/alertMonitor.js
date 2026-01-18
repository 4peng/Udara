const cron = require('node-cron');
const SensorReading = require('../model/SensorReading');
const User = require('../model/User');
const Notification = require('../model/Notification');
const Device = require('../model/Device');
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

// Cache to prevent spamming (Map<userId_deviceId_metric, lastSentTimestamp>)
const cooldowns = new Map();
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown per specific alert type

/**
 * Main monitoring function
 */
async function checkAlerts() {
  console.log('🔍 [Monitor] Checking sensor data for alerts...');
  
  try {
    // 1. Get all active devices
    const devices = await Device.findActive();
    
    for (const device of devices) {
      // 2. Get latest reading for this device (within last 20 mins to ensure it's "live")
      const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
      const reading = await SensorReading.findOne({
        'metadata.device_id': device.deviceId,
        'metadata.timestamp_server': { $gte: twentyMinsAgo }
      }).sort({ 'metadata.timestamp_server': -1 });

      if (!reading) {
        // Device might be offline - could trigger "Device Offline" alert here
        continue;
      }

      // 3. Find users subscribed to this device
      const users = await User.find({
        'subscriptions.deviceId': device.deviceId,
        'subscriptions.isActive': true
      });

      for (const user of users) {
        await processUserAlerts(user, device, reading);
      }
    }
  } catch (error) {
    console.error('❌ [Monitor] Error checking alerts:', error);
  }
}

/**
 * Check thresholds for a single user
 */
async function processUserAlerts(user, device, reading) {
  const subscription = user.subscriptions.find(
    s => s.deviceId === device.deviceId && s.isActive
  );
  if (!subscription) return;

  const thresholds = subscription.customThresholds;
  const metricsToCheck = [
    { key: 'pm2_5', val: reading.pm2_5 },
    { key: 'pm10', val: reading.pm10 },
    { key: 'co', val: reading.alphasense_voltages?.CO_ppm || 0 }, // Simplified access
    { key: 'no2', val: reading.alphasense_voltages?.NO2_ppb || 0 },
    { key: 'so2', val: reading.alphasense_voltages?.SO2_ppb || 0 },
    { key: 'o3', val: reading.alphasense_voltages?.O3_ppb || 0 }
  ];

  for (const m of metricsToCheck) {
    const config = thresholds[m.key];
    if (!config || !config.enabled || m.val === undefined || m.val === null) continue;

    // Determine severity
    let severity = null;
    let thresholdValue = 0;

    if (m.val >= config.critical) {
      severity = 'critical';
      thresholdValue = config.critical;
    } else if (m.val >= config.warning) {
      severity = 'warning';
      thresholdValue = config.warning;
    }

    if (severity) {
      await sendAlert(user, device, m.key, m.val, thresholdValue, severity, config.unit);
    }
  }
}

/**
 * Send the actual notification
 */
async function sendAlert(user, device, metric, value, threshold, severity, unit) {
  const cooldownKey = `${user.userId}_${device.deviceId}_${metric}_${severity}`;
  const lastSent = cooldowns.get(cooldownKey);

  // Check cooldown
  if (lastSent && (Date.now() - lastSent < COOLDOWN_MS)) {
    return; // Skip if sent recently
  }

  console.log(`⚠️ Alert: ${user.email} - ${metric} is ${value} (Threshold: ${threshold})`);

  // Create Notification DB Entry
  const notificationId = `NOTIF-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  const title = `Air Quality Alert: ${device.name}`;
  const message = `${metric.toUpperCase()} is ${severity} (${value} ${unit}). Limit is ${threshold}.`;

  const notification = new Notification({
    notificationId,
    trigger: {
      type: 'threshold_exceeded',
      deviceId: device.deviceId,
      metric,
      value,
      threshold,
      severity
    },
    recipients: [{
      userId: user.userId,
      email: user.email,
      name: user.name,
      sentVia: ['inApp'], // Start with inApp, add push if successful
      status: 'pending'
    }],
    content: {
      subject: title,
      message: message,
      violations: [{ metric, value, threshold, severity, unit, message }]
    }
  });

  // Send Push Notification
  const pushTokens = user.pushTokens || [];
  const expoMessages = [];

  for (const token of pushTokens) {
    if (Expo.isExpoPushToken(token)) {
      expoMessages.push({
        to: token,
        sound: 'default',
        title: title,
        body: message,
        data: { notificationId, deviceId: device.deviceId }
      });
    }
  }

  if (expoMessages.length > 0) {
    try {
      // Send to Expo
      let chunks = expo.chunkPushNotifications(expoMessages);
      for (let chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
      
      // Update Notification Record
      notification.recipients[0].sentVia.push('push'); // Add 'sms' here if implemented
      notification.recipients[0].status = 'sent';
      notification.recipients[0].sentAt = new Date();
      
      // Update Cooldown
      cooldowns.set(cooldownKey, Date.now());

    } catch (error) {
      console.error('Failed to send push:', error);
      notification.recipients[0].error = error.message;
      notification.recipients[0].status = 'failed';
    }
  } else {
      // No tokens, just save as in-app
      notification.recipients[0].status = 'sent'; // "Sent" to in-app inbox
      notification.recipients[0].sentAt = new Date();
  }

  // Save to DB
  await notification.save();
  
  // Push to User's recentNotifications array
  await User.updateOne(
    { userId: user.userId },
    {
      $push: {
        recentNotifications: {
          $each: [{
             notificationId,
             deviceId: device.deviceId,
             type: 'threshold_exceeded',
             severity,
             metric,
             value,
             threshold,
             message,
             sentAt: new Date(),
             read: false
          }],
          $slice: -50 // Keep only last 50
        }
      }
    }
  );
}

// Start the cron job
function startMonitoring() {
  console.log('✅ Background Alert Monitoring started (Every 5 minutes)');
  
  // Run every 5 minutes: "*/5 * * * *"
  cron.schedule('*/5 * * * *', () => {
    checkAlerts();
  });
  
  // Run once immediately on startup for testing
  // checkAlerts();
}

module.exports = { startMonitoring };
