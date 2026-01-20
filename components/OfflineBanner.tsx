// components/OfflineBanner.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { useConnectivity } from '../context/ConnectivityContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OfflineBanner() {
  const { isConnected, isInternetReachable } = useConnectivity();
  const insets = useSafeAreaInsets();
  
  // Show banner if not connected OR if connected but internet not reachable
  // (ignoring initial null state)
  const isOffline = isConnected === false || isInternetReachable === false;
  
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isOffline ? 40 + insets.top : 0,
      duration: 300,
      useNativeDriver: false, // Height layout animation
    }).start();
  }, [isOffline, insets.top]);

  if (!isOffline && heightAnim._value === 0) return null;

  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <Text style={styles.text}>No Internet Connection</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#CC3300',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    width: '100%',
  },
  content: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
