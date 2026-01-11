
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

  // Register token with backend when user is logged in and token is available
  useEffect(() => {
    if (user && expoPushToken) {
      fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          token: expoPushToken,
        }),
      }).catch(err => console.error("Failed to register push token:", err));
    }
  }, [user, expoPushToken]);

  return {
    expoPushToken,
    notification,
  };
}
