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
  console.log(`🔍 [Debug] Checking reading for ${deviceId}...`);

  // 1. Get Device Details
  const device = await Device.findOne({ deviceId: deviceId });
  if (!device) { console.log(`❌ [Debug] Device ${deviceId} not found in DB`); return; }
  if (!device.isActive) { console.log(`❌ [Debug] Device ${deviceId} is inactive`); return; }

  // 2. Find users subscribed to this device
  const users = await User.find({
    'subscriptions.deviceId': deviceId,
    'subscriptions.isActive': true
  });
  
  console.log(`🔍 [Debug] Found ${users.length} active subscribers for ${deviceId}`);

  // 3. Process alerts for each user
  for (const user of users) {
    await processUserAlerts(user, device, reading);
  }
}

/**
 * Check thresholds for a single user
 */
async function processUserAlerts(user, device, reading) {
  console.log(`[Debug] Processing alerts for user ${user.email} on device ${device.deviceId}`);
  
  const subscription = user.subscriptions.find(
    s => s.deviceId.toUpperCase() === device.deviceId.toUpperCase() && s.isActive
  );
  
  if (!subscription) {
      console.log(`[Debug] Subscription not found in memory for ${user.email}`);
      return;
  }

  const thresholds = subscription.customThresholds;
  const voltages = reading.alphasense_voltages || {};
  
  const metricsToCheck = [
    { key: 'pm2_5', val: reading.pm2_5 },
    { key: 'pm10', val: reading.pm10 },
    { key: 'co', val: voltages.CO_ppm },
    { key: 'no2', val: voltages.NO2_ppb },
    { key: 'so2', val: voltages.SO2_ppb },
    { key: 'o3', val: voltages.O3_ppb },
    // Temperature/Humidity kept separate if needed, or excluded if you only want AQI
  ];

  let maxSeverity = 0; // 0:None, 1:Warning, 2:Critical
  let worstMetric = null;

  for (const m of metricsToCheck) {
    const config = thresholds[m.key];
    if (!config || !config.enabled || m.val === undefined || m.val === null) continue;

    // Logic for "Max" thresholds
    if (config.max !== undefined || config.critical !== undefined) {
       const critical = config.critical || config.max; 
       const warning = config.warning || (critical * 0.7); 

       if (m.val >= critical) {
         if (maxSeverity < 2) { maxSeverity = 2; worstMetric = { ...m, ...config, severity: 'critical' }; }
       } else if (m.val >= warning) {
         if (maxSeverity < 1) { maxSeverity = 1; worstMetric = { ...m, ...config, severity: 'warning' }; }
       }
    }
  }

  // If we have a violation, send ONE consolidated alert
  if (worstMetric) {
      console.log(`🔍 [Debug] Consolidated Alert for ${user.email}: ${worstMetric.severity.toUpperCase()} (Driven by ${worstMetric.key})`);
      
      // Use 'aqi' as the key for consolidated alerts to prevent spamming individual gases
      await sendAlert(
          user, 
          device, 
          'aqi', // metric key 
          worstMetric.val, // value of the worst pollutant
          worstMetric.critical || worstMetric.max, // threshold
          worstMetric.severity, 
          worstMetric.unit
      );
  }
}

/**
 * Send the actual notification
 */
async function sendAlert(user, device, metric, value, threshold, severity, unit) {
  const cooldownKey = `${user.userId || user.clerkUserId}_${device.deviceId}_${metric}_${severity}`;
  const lastSent = cooldowns.get(cooldownKey);

  // Check cooldown
  if (lastSent && (Date.now() - lastSent < COOLDOWN_MS)) {
    console.log(`⏳ [Debug] Cooldown active for ${user.email} (${metric})`);
    return; // Skip if sent recently
  }

  console.log(`⚠️ Alert: ${user.email} - ${metric} is ${value} (Threshold: ${threshold})`);

  // SAFETY: Ensure userId is never null (fallback to clerkUserId or random string if database is corrupted)
  const safeUserId = user.userId || user.clerkUserId || `Unknown-${Date.now()}`;

  // Create Notification DB Entry
  const notificationId = `NOTIF-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  const title = `Air Quality Alert: ${device.name}`;
  // Generic message for AQI
  const message = `Air Quality is ${severity.toUpperCase()}. Driven by ${formatMetricName(metric)} (${value} ${unit}).`;

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
      userId: safeUserId, // Use SAFE ID
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

    } catch (error) {
      console.error('Failed to send push:', error);
      notification.recipients[0].error = error.message;
      notification.recipients[0].status = 'failed';
    }
  } else {
      notification.recipients[0].status = 'sent'; // Delivered to in-app
      notification.recipients[0].sentAt = new Date();
  }

  // Set cooldown regardless of delivery method
  cooldowns.set(cooldownKey, Date.now());

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

/**
 * DEV TOOL: Reset all cooldowns
 */
function resetCooldowns() {
  console.log(`🔄 [DevTool] Clearing ${cooldowns.size} cooldown entries...`);
  cooldowns.clear();
  return { success: true, message: "Cooldowns cleared" };
}

module.exports = { startRealtimeMonitoring, resetCooldowns };
