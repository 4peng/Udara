import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { API_CONFIG, buildApiUrl } from '../config/api';

const BACKGROUND_MONITORING_TASK = 'BACKGROUND_MONITORING_TASK';

// Define the task
TaskManager.defineTask(BACKGROUND_MONITORING_TASK, async () => {
  try {
    console.log('⏰ Running background monitoring task...');
    
    // Fetch devices
    // Note: We can't use hooks here, so we use standard fetch
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DEVICES));
    if (!response.ok) {
        throw new Error('Failed to fetch devices');
    }
    
    const data = await response.json();
    if (!data.success || !data.devices) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    let hasHazard = false;

    // Check for hazardous devices
    // In a real app, we would filter by the user's monitored devices from AsyncStorage
    // For this demo/test, we check ALL devices
    for (const device of data.devices) {
        if (device.aqi >= 200) {
            console.log(`🚨 BACKGROUND ALERT: ${device.name} is Hazardous (${device.aqi})`);
            
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "High Air Pollution Alert",
                    body: `Hazardous AQI (${device.aqi}) detected at ${device.location}.`,
                    sound: 'default',
                    data: { deviceId: device.deviceId, aqi: device.aqi }
                },
                trigger: null, // Immediate
            });
            
            hasHazard = true;
        }
    }

    return hasHazard 
        ? BackgroundFetch.BackgroundFetchResult.NewData 
        : BackgroundFetch.BackgroundFetchResult.NoData;

  } catch (error) {
    console.error('❌ Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the task
export async function registerBackgroundMonitoring() {
  try {
    console.log('📋 Registering background monitoring task...');
    await BackgroundFetch.registerTaskAsync(BACKGROUND_MONITORING_TASK, {
      minimumInterval: 60 * 15, // 15 minutes (minimum allowed by iOS/Android)
      stopOnTerminate: false, // Continue even if app is closed
      startOnBoot: true, // Restart on device reboot
    });
    console.log('✅ Background monitoring registered');
  } catch (err) {
    console.log('❌ Task Register failed:', err);
  }
}

export async function unregisterBackgroundMonitoring() {
    return BackgroundFetch.unregisterTaskAsync(BACKGROUND_MONITORING_TASK);
}
