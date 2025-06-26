// app/(tabs)/settings.tsx
"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
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
import { useDevicesWithMonitoring } from "../../hooks/useDevicesWithMonitoring"

export default function SettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true)
  const [updateFrequency, setUpdateFrequency] = useState("Every 15 minutes")

  const { logout, user } = useAuth()
  const { 
    monitoringAreas, 
    loading, 
    toggleAreaMonitoring, 
    monitoringSummary,
    getAvailableAreas,
    clearMonitoringPreferences,
    initialized,
    forceCompleteReset, // NEW: Get the force refresh function
  } = useDevicesWithMonitoring()

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

  const handleClearPreferences = () => {
    Alert.alert(
      "Clear Monitoring Preferences", 
      "This will disable monitoring for all areas. Are you sure?", 
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearMonitoringPreferences()
            Alert.alert("Success", "All monitoring preferences have been cleared")
          },
        },
      ]
    )
  }

  // NEW: Enhanced toggle function that triggers refresh when going back to home
  const handleToggleAreaMonitoring = async (location: string) => {
    console.log(`⚙️ Settings: Toggling monitoring for ${location}`)
    
    // Toggle the area monitoring
    toggleAreaMonitoring(location)
    
    // Log the change for debugging
    console.log(`⚙️ Settings: ${location} monitoring toggled - changes will be applied when returning to Home`)
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => {
        console.log("⚙️ Settings: Going back to Home - changes will be applied via useFocusEffect")
        router.back()
      }}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Settings</Text>
      <View style={styles.headerSpacer} />
    </View>
  )

  const renderMonitoringSummary = () => {
    if (loading || !initialized) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitoring Overview</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.loadingText}>Loading monitoring data...</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monitoring Overview</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{monitoringSummary.monitoredAreas}</Text>
            <Text style={styles.summaryLabel}>Areas Monitored</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{monitoringSummary.monitoredDevices}</Text>
            <Text style={styles.summaryLabel}>Sensors Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{monitoringSummary.totalAreas}</Text>
            <Text style={styles.summaryLabel}>Total Areas</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderMonitoringAreas = () => {
    if (loading || !initialized) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Areas to Monitor</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.loadingText}>Loading available areas...</Text>
          </View>
        </View>
      )
    }

    if (monitoringAreas.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Areas to Monitor</Text>
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No areas available</Text>
            <Text style={styles.emptyStateSubtext}>Check your connection and try refreshing</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Available Areas to Monitor</Text>
            <Text style={styles.sectionDescription}>
              Select areas to monitor for air quality alerts and notifications. Only monitored areas will appear on your home screen.
            </Text>
          </View>
        </View>
        
        {monitoringAreas.map((area) => (
          <View key={area.location} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="location-outline" size={20} color="#666" style={styles.locationIcon} />
              <View style={styles.areaInfo}>
                <Text style={styles.settingLabel}>{area.location}</Text>
                <Text style={styles.deviceCount}>
                  {area.deviceCount} sensor{area.deviceCount !== 1 ? "s" : ""} available
                </Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <Switch
                value={area.enabled}
                onValueChange={() => handleToggleAreaMonitoring(area.location)}
                trackColor={{ false: "#E0E0E0", true: "#4361EE" }}
                thumbColor="#FFFFFF"
                style={styles.switch}
              />
              {area.enabled && (
                <View style={styles.activeIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Debug section - only show in development */}
        {__DEV__ && (
          <View style={styles.debugSection}>
            <TouchableOpacity style={styles.debugButton} onPress={handleClearPreferences}>
              <Ionicons name="trash-outline" size={16} color="#F44336" />
              <Text style={styles.debugButtonText}>Clear All Preferences (Debug)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.debugButton, { marginTop: 8, backgroundColor: "#E3F2FD", borderColor: "#BBDEFB" }]} 
              onPress={() => {
                console.log("🔄 Manual force refresh triggered from Settings")
                forceCompleteReset()
                Alert.alert("Debug", "Force refresh triggered - check console logs")
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#2196F3" />
              <Text style={[styles.debugButtonText, { color: "#2196F3" }]}>Force Refresh (Debug)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Settings</Text>
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

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name="warning-outline" size={20} color="#666" style={styles.settingIcon} />
          <Text style={styles.settingLabel}>Alert Thresholds</Text>
        </View>
        <View style={styles.settingRight}>
          <Text style={styles.settingValue}>Custom</Text>
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
        {renderMonitoringSummary()}
        {renderMonitoringAreas()}
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
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4361EE",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
  areaInfo: {
    flex: 1,
  },
  deviceCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switch: {
    marginLeft: 8,
  },
  activeIndicator: {
    marginLeft: 8,
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  debugSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFE6E6",
  },
  debugButtonText: {
    fontSize: 14,
    color: "#F44336",
    marginLeft: 8,
  },
})