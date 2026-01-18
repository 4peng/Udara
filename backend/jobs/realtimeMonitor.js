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
 * Initialize the Real-Time Watcher (Change Stream)
 */
function startRealtimeMonitoring() {
  console.log('⚡ [Realtime] Initializing MongoDB Change Stream...');

  // Watch for 'insert' events on the SensorReading collection
  const changeStream = SensorReading.watch([
    { $match: { operationType: 'insert' } }
  ]);

  changeStream.on('change', async (change) => {
    try {
      // 'fullDocument' contains the new data that was just inserted
      const reading = change.fullDocument;
      
      if (!reading || !reading.metadata || !reading.metadata.device_id) {
        return;
      }

      console.log(`⚡ [Realtime] New data received for ${reading.metadata.device_id}`);
      
      // Trigger the alert check logic immediately
      await checkSingleReading(reading);

    } catch (error) {
      console.error('❌ [Realtime] Error processing change stream:', error);
    }
  });

  changeStream.on('error', (error) => {
    console.error('❌ [Realtime] Change Stream error:', error);
    // In production, you might want to restart the stream here
  });

  console.log('✅ [Realtime] Listening for new sensor data...');
}

/**
 * Check a single new reading against all subscriptions
 */
async function checkSingleReading(reading) {
  const deviceId = reading.metadata.device_id;

  // 1. Get Device Details
  const device = await Device.findOne({ deviceId: deviceId });
  if (!device || !device.isActive) return; // Ignore unknown/inactive devices

  // 2. Find users subscribed to this device
  const users = await User.find({
    'subscriptions.deviceId': deviceId,
    'subscriptions.isActive': true
  });

  // 3. Process alerts for each user
  for (const user of users) {
    await processUserAlerts(user, device, reading);
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
  
  // Normalize data access (handle potentially missing fields)
  const voltages = reading.alphasense_voltages || {};
  
  const metricsToCheck = [
    { key: 'pm2_5', val: reading.pm2_5 },
    { key: 'pm10', val: reading.pm10 },
    { key: 'co', val: voltages.CO_ppm },
    { key: 'no2', val: voltages.NO2_ppb },
    { key: 'so2', val: voltages.SO2_ppb },
    { key: 'o3', val: voltages.O3_ppb },
    { key: 'temperature_c', val: reading.temperature_c },
    { key: 'humidity_pct', val: reading.humidity_pct }
  ];

  for (const m of metricsToCheck) {
    const config = thresholds[m.key];
    
    // Skip if metric is missing in reading OR disabled in config
    if (!config || !config.enabled || m.val === undefined || m.val === null) continue;

    // Determine severity
    let severity = null;
    let thresholdValue = 0;

    // Logic for "Max" thresholds (Pollutants, Temp Max)
    if (config.max !== undefined || config.critical !== undefined) {
       const critical = config.critical || config.max; // Handle different naming
       const warning = config.warning || (critical * 0.7); // Fallback

       if (m.val >= critical) {
         severity = 'critical';
         thresholdValue = critical;
       } else if (m.val >= warning) {
         severity = 'warning';
         thresholdValue = warning;
       }
    }
    
    // Logic for "Min" thresholds (Temp Min)
    if (config.min !== undefined) {
        if (m.val <= config.min) {
            severity = 'warning'; // Usually low temp is just warning
            thresholdValue = config.min;
        }
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
  const message = `${formatMetricName(metric)} is ${severity} (${value} ${unit}). Limit is ${threshold}.`;

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
      sentVia: ['inApp'],
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
      let chunks = expo.chunkPushNotifications(expoMessages);
      for (let chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
      
      notification.recipients[0].sentVia.push('push');
      notification.recipients[0].status = 'sent';
      notification.recipients[0].sentAt = new Date();
      
      cooldowns.set(cooldownKey, Date.now());

    } catch (error) {
      console.error('Failed to send push:', error);
      notification.recipients[0].error = error.message;
      notification.recipients[0].status = 'failed';
    }
  } else {
      notification.recipients[0].status = 'sent'; // Delivered to in-app
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
          $slice: -50 
        }
      }
    }
  );
}

function formatMetricName(key) {
    const names = {
        pm2_5: 'PM2.5',
        pm10: 'PM10',
        co: 'CO',
        no2: 'NO2',
        so2: 'SO2',
        o3: 'Ozone',
        temperature_c: 'Temperature',
        humidity_pct: 'Humidity'
    };
    return names[key] || key.toUpperCase();
}

module.exports = { startRealtimeMonitoring };
