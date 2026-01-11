import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/useColorScheme';
import { NotificationProvider } from '../context/NotificationContext';
import { MonitoringProvider } from '../context/MonitoringContext';
import { registerBackgroundMonitoring } from '../tasks/backgroundMonitoring';
import { API_CONFIG, buildApiUrl } from '../config/api';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  // Stand-in Notification Logic

  useEffect(() => {
    registerBackgroundMonitoring();

    // Foreground Poller for "Stand-in" notifications
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DEVICES));
        const data = await response.json();
        
        // Handle new API structure where data is the array
        const devices = Array.isArray(data) ? data : (data.devices || []);

        if (devices.length > 0) {
          const hazardousDevice = devices.find((d: any) => (d.aqi?.value || d.aqi || 0) >= 200);
          
          if (hazardousDevice) {
            
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "⚠️ Hazardous Air Quality!",
                body: `AQI is ${hazardousDevice.aqi?.value || hazardousDevice.aqi} at ${hazardousDevice.name || hazardousDevice.location}. Take precautions!`,
                data: { deviceId: hazardousDevice.deviceId },
              },
              trigger: null,
            });
          }
        }
      } catch (e) {
        console.error("Poller Error:", e);
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <MonitoringProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </MonitoringProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
