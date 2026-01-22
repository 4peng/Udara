"use client"

import { Ionicons } from "@expo/vector-icons"
import { useState, useCallback } from "react"
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from "react-native"
import { router } from "expo-router"
import { getAQIColor, getAQIStatus, SIMPLE_AQI_CATEGORIES } from "../../utils/aqiUtils"
import { useNotificationContext, UINotification } from "../../context/NotificationContext"
import { ROUTES } from "../../constants/Routes"

const alertTypes = ["All", ...SIMPLE_AQI_CATEGORIES.map(c => c.name)]

export default function AlertsScreen() {
  const { notifications, clearNotifications, fetchNotifications, loading } = useNotificationContext()
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const getFilteredAlerts = () => {
    if (selectedFilter === "All") return notifications
    return notifications.filter((alert) => alert.level === selectedFilter)
  }

  const getRelativeDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupAlertsByDate = (alerts: UINotification[]) => {
    const grouped: { [key: string]: UINotification[] } = {}
    alerts.forEach((alert) => {
      const dateLabel = getRelativeDateLabel(alert.rawDate);
      if (!grouped[dateLabel]) {
        grouped[dateLabel] = []
      }
      grouped[dateLabel].push(alert)
    })
    return grouped
  }

  const handleAlertPress = (alert: UINotification) => {
    if (alert.deviceId) {
      router.push(ROUTES.SENSOR.DETAIL(alert.deviceId))
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notification History</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconButton} onPress={fetchNotifications} disabled={loading}>
          <Ionicons name="refresh" size={24} color={loading ? "#ccc" : "#333"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={clearNotifications}>
          <Ionicons name="trash-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollView}>
        {alertTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, selectedFilter === type && styles.filterTabActive]}
            onPress={() => setSelectedFilter(type)}
          >
            <Text style={[styles.filterTabText, selectedFilter === type && styles.filterTabTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderAlertCard = (alert: UINotification) => (
    <TouchableOpacity 
      key={alert.id} 
      style={styles.alertCard}
      onPress={() => handleAlertPress(alert)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertTimeContainer}>
          <View style={[styles.alertIcon, { backgroundColor: `${alert.color}20` }]}>
            <Ionicons name={alert.icon as any} size={16} color={alert.color} />
          </View>
          <Text style={styles.alertTime}>{alert.time}</Text>
        </View>
        <View style={[styles.alertLevelBadge, { backgroundColor: `${alert.color}20` }]}>
          <Text style={[styles.alertLevelText, { color: alert.color }]}>{alert.level}</Text>
        </View>
      </View>

      <View style={styles.alertContent}>
        <Text style={styles.alertLocation}>{alert.location}</Text>
        <Text style={styles.alertAQI}>AQI: {alert.aqi}</Text>
        <Text style={styles.alertMessage}>{alert.message}</Text>
      </View>
    </TouchableOpacity>
  )

  const renderAlertsByDate = () => {
    const filteredAlerts = getFilteredAlerts()
    
    if (filteredAlerts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No notifications found</Text>
        </View>
      )
    }

    const groupedAlerts = groupAlertsByDate(filteredAlerts)

    return Object.entries(groupedAlerts).map(([date, alerts]) => (
      <View key={date} style={styles.dateSection}>
        <Text style={styles.dateHeader}>{date}</Text>
        {alerts.map((alert) => renderAlertCard(alert))}
      </View>
    ))
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      {renderFilterTabs()}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />
        }
      >
        {renderAlertsByDate()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 12,
  },
  filterTabActive: {
    backgroundColor: "#333",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  dateSection: {
    marginTop: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  alertTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  alertTime: {
    fontSize: 14,
    color: "#666",
  },
  alertLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertLevelText: {
    fontSize: 12,
    fontWeight: "600",
  },
  alertContent: {
    marginLeft: 36,
  },
  alertLocation: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  alertAQI: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
})
