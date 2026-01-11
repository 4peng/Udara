import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { getAQIStatus, getAQIColor } from '../utils/aqiUtils';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG, apiRequest, buildApiUrl } from '../config/api';

export interface UINotification {
  id: string;
  time: string;
  location: string;
  aqi: number;
  level: string;
  message: string;
  date: string; // "Today", "Yesterday", or date string
  rawDate: string; // ISO string
  color: string;
  icon: string;
  timestamp: number;
}

interface NotificationContextType {
  notifications: UINotification[];
  expoPushToken: string | undefined;
  clearNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { expoPushToken, notification } = usePushNotifications();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UINotification[]>([]);

  // 🔹 Register token with backend when both token and user are available
  useEffect(() => {
    const registerToken = async () => {
      if (user && expoPushToken) {
        console.log(`📡 Registering Push Token for user ${user.uid}: ${expoPushToken}`);
        try {
          const response = await apiRequest(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.REGISTER), {
            method: 'POST',
            body: JSON.stringify({
              userId: user.uid,
              pushToken: expoPushToken
            })
          });
          
          if (response.ok) {
            console.log("✅ Push Token registered successfully with backend");
          } else {
            console.error("❌ Failed to register Push Token with backend", response.status);
          }
        } catch (error) {
          console.error("❌ Error registering Push Token with backend", error);
        }
      }
    };

    registerToken();
  }, [user, expoPushToken]);

  // Load notifications from storage on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  const saveNotifications = async (newNotifications: UINotification[]) => {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(newNotifications));
    } catch (error) {
      console.error('Failed to save notifications', error);
    }
  };

  const clearNotifications = async () => {
    try {
        await AsyncStorage.removeItem('notifications');
        setNotifications([]);
    } catch (error) {
        console.error('Failed to clear notifications', error);
    }
  }

  // Handle new incoming notification
  useEffect(() => {
    if (notification) {
      handleNewNotification(notification);
    }
  }, [notification]);

  const handleNewNotification = (notif: Notifications.Notification) => {
    const content = notif.request.content;
    const data = content.data || {};
    
    const now = new Date();
    // Use data.date if available (timestamp from server?), else use now
    const notifDate = notif.date ? new Date(notif.date) : now;
    
    const aqi = data.aqi || 0;
    
    const newNotif: UINotification = {
      id: notif.request.identifier,
      time: notifDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: (data.location as string) || (data.deviceId as string) || "Alert",
      aqi: aqi,
      level: getAQIStatus(aqi),
      message: content.body || "No message",
      date: "Today", 
      rawDate: notifDate.toISOString(),
      color: getAQIColor(aqi),
      icon: "warning",
      timestamp: notifDate.getTime()
    };

    setNotifications(prev => {
        // Prevent duplicates
        if (prev.find(n => n.id === newNotif.id)) return prev;
        
        const updated = [newNotif, ...prev];
        saveNotifications(updated);
        return updated;
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, expoPushToken, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};