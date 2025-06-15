"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { useAuth } from "../../hooks/useAuth"

const monitoringAreas = [
  { id: 1, name: "Main Campus Square", enabled: true },
  { id: 2, name: "Library Zone", enabled: false },
  { id: 3, name: "Sports Complex", enabled: false },
  { id: 4, name: "Student Center", enabled: false },
  { id: 5, name: "Research Buildings", enabled: false },
  { id: 6, name: "Dormitory Area", enabled: false },
]

const thresholdSettings = [
  {
    id: "healthy",
    title: "Healthy AQI Threshold",
    value: 25,
    default: 50,
    backgroundColor: "#E8F5E8",
    color: "#4CAF50",
  },
  {
    id: "unhealthy",
    title: "Unhealthy AQI Threshold",
    value: 100,
    default: 100,
    backgroundColor: "#FFF8E1",
    color: "#FF9800",
  },
  {
    id: "hazardous",
    title: "Hazardous AQI Threshold",
    value: 300,
    default: 300,
    backgroundColor: "#FFEBEE",
    color: "#F44336",
  },
]

export default function SettingsScreen() {
  const [areas, setAreas] = useState(monitoringAreas)
  const [thresholds, setThresholds] = useState(thresholdSettings)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [updateFrequency, setUpdateFrequency] = useState("Every 15 minutes")

  const { logout, user } = useAuth()

  const toggleArea = (id: number) => {
    setAreas(areas.map((area) => (area.id === id ? { ...area, enabled: !area.enabled } : area)))
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          const result = await logout()
          if (result.success) {
            router.replace("/(auth)/login")
          } else {
            Alert.alert("Error", "Failed to logout")
          }
        },
      },
    ])
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Settings</Text>
      <View style={styles.headerSpacer} />
    </View>
  )

  const renderMonitoringAreas = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Monitoring Areas</Text>
      {areas.map((area) => (
        <View key={area.id} style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="location-outline" size={20} color="#666" style={styles.locationIcon} />
            <Text style={styles.settingLabel}>{area.name}</Text>
          </View>
          <Switch
            value={area.enabled}
            onValueChange={() => toggleArea(area.id)}
            trackColor={{ false: "#E0E0E0", true: "#4361EE" }}
            thumbColor="#FFFFFF"
          />
        </View>
      ))}
    </View>
  )

  const renderCustomAlertSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Custom Alert Settings</Text>
      {thresholds.map((threshold) => (
        <View key={threshold.id} style={[styles.thresholdCard, { backgroundColor: threshold.backgroundColor }]}>
          <View style={styles.thresholdHeader}>
            <Text style={styles.thresholdTitle}>{threshold.title}</Text>
            <Text style={[styles.thresholdValue, { color: threshold.color }]}>{threshold.value}</Text>
          </View>
          <Text style={styles.thresholdDefault}>Default: {threshold.default}</Text>
        </View>
      ))}
    </View>
  )

  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="notifications-outline" size={20} color="#666" style={styles.settingIcon} />
          <Text style={styles.settingLabel}>Push Notifications</Text>
        </View>
        <Switch
          value={pushNotifications}
          onValueChange={setPushNotifications}
          trackColor={{ false: "#E0E0E0", true: "#4361EE" }}
          thumbColor="#FFFFFF"
        />
      </View>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="time-outline" size={20} color="#666" style={styles.settingIcon} />
          <Text style={styles.settingLabel}>Update Frequency</Text>
        </View>
        <View style={styles.settingRight}>
          <Text style={styles.settingValue}>{updateFrequency}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </TouchableOpacity>
    </View>
  )

  const renderAccountSection = () => (
    <View style={styles.section}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user?.email || "User"}</Text>
          <Text style={styles.userEmail}>Signed in</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#F44336" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderMonitoringAreas()}
        {renderCustomAlertSettings()}
        {renderNotificationSettings()}
        {renderAccountSection()}
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
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    color: "#666",
    marginRight: 8,
  },
  settingIcon: {
    marginRight: 12,
  },
  locationIcon: {
    marginRight: 12,
  },
  thresholdCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  thresholdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  thresholdTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  thresholdValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  thresholdDefault: {
    fontSize: 14,
    color: "#666",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    color: "#F44336",
    fontWeight: "500",
  },
})
