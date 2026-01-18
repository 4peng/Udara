
import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';
import { useAuth } from './useAuth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // if (Device.isDevice) { // Removed to allow Emulator testing
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    
    // Get Project ID specifically
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) {
        console.error("❌ Project ID not found in app.json! Check 'extra.eas.projectId'");
    }

    try {
        token = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        });
    } catch (e) {
        console.error("❌ ERROR generating push token:", e);
    }
  /* } else {
    // Must use physical device for Push Notifications
  } */

  return token?.data;
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);
  const { user } = useAuth();
  const isRegistered = useRef(false);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    });

    return () => {
      if(notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if(responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Reset registration flag when user changes (e.g. logout/login)
  useEffect(() => {
    isRegistered.current = false;
  }, [user?.uid]);

  // Register token with backend when user is logged in and token is available
  useEffect(() => {
    const isValidToken = typeof expoPushToken === 'string' && expoPushToken.length > 0;
    const isValidUser = user && user.uid;

    if (isValidUser && isValidToken && !isRegistered.current) {
      console.log(`🚀 Attempting to register Push Token...`);
      console.log(`   User ID: ${user.uid}`);
      console.log(`   Token: ${expoPushToken}`);
      
      isRegistered.current = true; // Mark as attempting to register
      
      fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          token: expoPushToken,
        }),
      })
      .then(async (response) => {
        if (!response.ok) {
           isRegistered.current = false; // Retry on failure
           const errorText = await response.text();
           console.error(`❌ Failed to register Push Token with backend ${response.status}: ${errorText}`);
        } else {
           console.log("✅ Push Token registered successfully");
        }
      })
      .catch(err => {
        isRegistered.current = false; // Retry on failure
        console.error("Failed to register push token:", err);
      });
    } else if (!isValidUser && isValidToken) {
       // Token ready but waiting for user login - normal state, do nothing
    } else if (isValidUser && !isValidToken) {
       // User logged in but token not ready - normal state, do nothing
    }
  }, [user, expoPushToken]);

  return {
    expoPushToken,
    notification,
  };
}
