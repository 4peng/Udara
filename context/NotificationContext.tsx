import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { getAQIStatus, getAQIColor } from '../utils/aqiUtils';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../hooks/useAuth';
import { API_CONFIG, apiRequest, buildApiUrl } from '../config/api';
import { STORAGE_KEYS } from '../constants/StorageKeys';

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
  deviceId?: string;
}

interface NotificationContextType {
  notifications: UINotification[];
  expoPushToken: string | undefined;
  clearNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { expoPushToken, notification } = usePushNotifications();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Load notifications from storage on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Fetch from backend when user is available
  useEffect(() => {
    if (user?.uid) {
      fetchNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  const saveNotifications = async (newNotifications: UINotification[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(newNotifications));
    } catch (error) {
      console.error('Failed to save notifications', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      console.log(`📡 Fetching notifications for ${user.uid}...`);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/notifications/${user.uid}/notifications?limit=50`);
      const data = await response.json();
      
      console.log(`📥 Received ${data.notifications?.length || 0} notifications from backend`);

      if (data.success && Array.isArray(data.notifications)) {
        // Transform backend notifications to UI format
        const fetchedNotifications: UINotification[] = data.notifications.map((n: any) => {
           const severity = n.trigger?.severity || n.severity || 'unknown';
           const metric = n.trigger?.metric || n.metric || 'AQI';
           // Handle varying field names from different sources (DB vs User Profile)
           const dateVal = n.createdAt || n.sentAt || new Date().toISOString();
           let date: Date;
           try {
             date = new Date(dateVal);
             if (isNaN(date.getTime())) throw new Error("Invalid Date");
           } catch (e) {
             console.warn("Invalid date in notification:", dateVal);
             date = new Date();
           }

           // Robust AQI extraction: Use trigger value regardless of metric, as it represents the severity source
           const aqi = n.trigger?.value || n.value || 0;
           const deviceId = n.trigger?.deviceId || n.deviceId;

           return {
             id: n.notificationId || n._id || Math.random().toString(),
             time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             location: n.content?.subject || n.message || "Alert", 
             aqi: aqi,
             level: getAQIStatus(aqi),
             message: n.content?.message || n.message || "No details",
             date: "Today", 
             rawDate: date.toISOString(),
             color: getAQIColor(aqi),
             icon: severity === 'critical' ? 'warning' : 'notifications',
             timestamp: date.getTime(),
             deviceId: deviceId
           };
        })
        // Filter out ghost alerts (invalid data)
        .filter(n => !(n.aqi === 0 && n.message === "No details" && n.level === "Unknown"));
        
        setNotifications(fetchedNotifications);
        saveNotifications(fetchedNotifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications from backend', error);
    } finally {
      setLoading(false);
    }
  };

  const clearNotifications = async () => {
    if (!user?.uid) return;
    
    try {
        console.log(`🗑️ Clearing all notifications for ${user.uid}...`);
        
        // Optimistic UI update
        setNotifications([]);
        await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);

        // Call Backend
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/notifications/${user.uid}/notifications`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.error('Failed to clear notifications on server');
            // If failed, maybe refetch to restore state?
            fetchNotifications();
        } else {
            console.log('✅ History cleared on server');
        }

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
    
    // Robust AQI extraction for push notifications
    const aqi = data.aqi || data.value || 0;
    const deviceId = data.deviceId;
    
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
      timestamp: notifDate.getTime(),
      deviceId: deviceId
    };

    setNotifications(prev => {
        // 1. Strict Deduplication: Check ID
        if (prev.find(n => n.id === newNotif.id)) return prev;

        // 2. Fuzzy Deduplication: Check content similarity within time window
        const recentDuplicate = prev.find(n => 
            n.deviceId === newNotif.deviceId && 
            n.level === newNotif.level &&
            Math.abs(n.timestamp - newNotif.timestamp) < 60 * 1000 // 1 minute window
        );

        if (recentDuplicate) {
            console.log("🚫 Ignoring duplicate notification:", newNotif.id);
            return prev;
        }
        
        const updated = [newNotif, ...prev];
        saveNotifications(updated);
        return updated;
    });
    
    // Also fetch fresh list to sync "unread" status if needed
    fetchNotifications();
  };

  return (
    <NotificationContext.Provider value={{ notifications, expoPushToken, clearNotifications, fetchNotifications, loading }}>
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