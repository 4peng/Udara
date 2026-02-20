import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import OfflineBanner from '../components/OfflineBanner';
import { ConnectivityProvider } from '../context/ConnectivityContext';
import { MonitoringProvider } from '../context/MonitoringContext';
import { NotificationProvider } from '../context/NotificationContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

function PushNotificationRegistrar() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ConnectivityProvider>
      <NotificationProvider>
        <MonitoringProvider>
          <PushNotificationRegistrar />
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <OfflineBanner />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="sensor/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="learn/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </MonitoringProvider>
      </NotificationProvider>
    </ConnectivityProvider>
  );
}