"use client"

import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { getAQIColor, getAQIStatus } from "../../utils/aqiUtils"

const alertTypes = ["All", "Hazardous", "Moderate", "Healthy"]

const mockAlerts = [
  {
    id: 1,
    time: "2:30 PM",
    location: "Engineering Building",
    aqi: 301,
    level: getAQIStatus(301),
    message: "Air quality levels have reached hazardous levels. Avoid outdoor activities.",
    date: "Today",
    color: getAQIColor(301),
    icon: "warning",
  },
  {
    id: 2,
    time: "11:45 AM",
    location: "Student Center",
    aqi: 180,
    level: getAQIStatus(180),
    message: "Air quality is moderate. Sensitive individuals should limit outdoor exposure.",
    date: "Today",
    color: getAQIColor(180),
    icon: "warning",
  },
  {
    id: 3,
    time: "4:15 PM",
    location: "Library",
    aqi: 250,
    level: getAQIStatus(250),
    message: "Dangerous air quality levels detected. Indoor activities advised.",
    date: "Yesterday",
    color: getAQIColor(250),
    icon: "warning",
  },
  {
    id: 4,
    time: "2:10 PM",
    location: "Science Building",
    aqi: 85,
    level: getAQIStatus(85),
    message: "Air quality is healthy. Safe for all outdoor activities.",
    date: "Yesterday",
    color: getAQIColor(85),
    icon: "checkmark-circle",
  },
]

export default function AlertsScreen() {
  const [selectedFilter, setSelectedFilter] = useState("All")

  const getFilteredAlerts = () => {
    if (selectedFilter === "All") return mockAlerts
    return mockAlerts.filter((alert) => alert.level === selectedFilter)
  }

  const groupAlertsByDate = (alerts: typeof mockAlerts) => {
    const grouped: { [key: string]: typeof mockAlerts } = {}
    alerts.forEach((alert) => {
      if (!grouped[alert.date]) {
        grouped[alert.date] = []
      }
      grouped[alert.date].push(alert)
    })
    return grouped
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notification History</Text>
      <TouchableOpacity style={styles.filterButton}>
        <Ionicons name="options-outline" size={24} color="#333" />
      </TouchableOpacity>
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

  const renderAlertCard = (alert: (typeof mockAlerts)[0]) => (
    <TouchableOpacity key={alert.id} style={styles.alertCard}>
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  filterButton: {
    padding: 8,
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
})
