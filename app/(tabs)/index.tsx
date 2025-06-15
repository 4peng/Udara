"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import {
  __DEV__,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import MapboxMap from "../../components/MapboxMap"
import { useDevices } from "../../hooks/useDevices"

const { width } = Dimensions.get("window")

// Enable debug mode for development
const DEBUG_MODE = __DEV__

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState("")
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const { devices, loading, error, refreshDevices, getMonitoredDevices } = useDevices()

  useEffect(() => {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    setCurrentDate(date.toLocaleDateString("en-US", options))
  }, [])

  useEffect(() => {
    if (DEBUG_MODE) {
      console.log("🏠 HomeScreen: Component mounted")
      console.log("📊 HomeScreen: Devices state:", {
        count: devices.length,
        loading,
        error,
        devices: devices.map((d) => ({ id: d.id, name: d.name, aqi: d.aqi })),
      })
    }
  }, [devices, loading, error])

  // Add safety check for devices
  const safeDevices = Array.isArray(devices) ? devices : []

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "#4CAF50" // Good - Green
    if (aqi <= 100) return "#FF9800" // Moderate - Orange
    if (aqi <= 150) return "#F44336" // Unhealthy - Red
    return "#9C27B0" // Very Unhealthy - Purple
  }

  const getStatusText = (aqi: number) => {
    if (aqi <= 50) return "Good"
    if (aqi <= 100) return "Moderate"
    if (aqi <= 150) return "Unhealthy"
    return "Very Unhealthy"
  }

  const getOverallAQI = () => {
    const monitoredDevices = getMonitoredDevices()
    if (monitoredDevices.length === 0) return 42 // Default fallback

    const totalAQI = monitoredDevices.reduce((sum, device) => sum + (device.aqi || 0), 0)
    return Math.round(totalAQI / monitoredDevices.length)
  }

  const handleMapPress = () => {
    console.log("🗺️ HomeScreen: Map pressed, navigating to map tab")
    router.push("/(tabs)/map")
  }

  const handleSensorPress = (sensor: any) => {
    if (sensor && sensor.id) {
      console.log(`🎯 HomeScreen: Sensor pressed: ${sensor.name} (${sensor.id})`)
      router.push(`/sensor/${sensor.id}`)
    } else {
      console.warn("⚠️ HomeScreen: Invalid sensor pressed:", sensor)
    }
  }

  const handleRefresh = () => {
    console.log("🔄 HomeScreen: Refresh requested")
    refreshDevices()
  }

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo)
    console.log(`🐛 HomeScreen: Debug info ${!showDebugInfo ? "enabled" : "disabled"}`)
  }

  const renderAQICircle = () => {
    const currentAQI = getOverallAQI()
    const color = getAQIColor(currentAQI)
    const status = getStatusText(currentAQI)

    return (
      <View style={styles.aqiContainer}>
        <View style={[styles.aqiCircle, { borderColor: color }]}>
          <Text style={[styles.aqiNumber, { color }]}>{currentAQI}</Text>
          <Text style={[styles.aqiStatus, { color }]}>{status}</Text>
        </View>
      </View>
    )
  }

  const renderEnvironmentalData = () => (
    <View style={styles.environmentalData}>
      <View style={styles.dataItem}>
        <Ionicons name="thermometer-outline" size={16} color="#666" />
        <Text style={styles.dataLabel}>Temperature</Text>
        <Text style={styles.dataValue}>24°C</Text>
      </View>
      <View style={styles.dataItem}>
        <Ionicons name="water-outline" size={16} color="#666" />
        <Text style={styles.dataLabel}>Humidity</Text>
        <Text style={styles.dataValue}>65%</Text>
      </View>
      <View style={styles.dataItem}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.dataLabel}>Updated</Text>
        <Text style={styles.dataValue}>2m ago</Text>
      </View>
    </View>
  )

  const renderMapSection = () => {
    if (loading) {
      return (
        <View style={[styles.mapSection, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={[styles.mapSection, styles.errorContainer]}>
          <Ionicons name="warning-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load map data</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (safeDevices.length === 0) {
      return (
        <View style={[styles.mapSection, styles.errorContainer]}>
          <Ionicons name="location-outline" size={48} color="#ccc" />
          <Text style={styles.errorText}>No sensors available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )
    }

    console.log(`🗺️ HomeScreen: Rendering map with ${safeDevices.length} sensors`)

    return (
      <View style={styles.mapSection}>
        <TouchableOpacity style={styles.mapContainer} onPress={handleMapPress}>
          <MapboxMap
            sensors={safeDevices}
            onSensorPress={handleSensorPress}
            style={styles.mapView}
            interactive={false}
          />
          <View style={styles.mapOverlay}>
            <View style={styles.mapOverlayContent}>
              <Text style={styles.mapOverlayText}>Tap to view full map</Text>
              <Ionicons name="expand-outline" size={20} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
            <Text style={styles.legendText}>Good (0-50)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF9800" }]} />
            <Text style={styles.legendText}>Moderate (51-100)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F44336" }]} />
            <Text style={styles.legendText}>Unhealthy (101-150)</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderKeyLocations = () => {
    const monitoredDevices = safeDevices.filter((device) => device.isMonitored)
    const topLocations = monitoredDevices.slice(0, 2)

    if (topLocations.length === 0) {
      return null
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Locations</Text>
        <View style={styles.keyLocationsContainer}>
          {topLocations.map((device, index) => (
            <View key={device.id} style={styles.keyLocationItem}>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <View style={styles.locationDetails}>
                  <Text style={styles.locationName}>{device.location}</Text>
                  <Text style={styles.locationAQI}>{device.aqi}</Text>
                </View>
              </View>
              <Ionicons name="trending-up" size={20} color={getAQIColor(device.aqi)} />
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderMonitoredSensors = () => {
    const monitoredDevices = getMonitoredDevices()

    if (loading) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored Sensors</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.loadingText}>Loading sensors...</Text>
          </View>
        </View>
      )
    }

    if (monitoredDevices.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored Sensors</Text>
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No sensors being monitored</Text>
            <Text style={styles.emptyStateSubtext}>Go to Settings to select areas to monitor</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monitored Sensors</Text>
        {monitoredDevices.map((device) => (
          <TouchableOpacity
            key={device.id}
            style={styles.sensorItem}
            onPress={() => router.push(`/sensor/${device.id}`)}
          >
            <View style={styles.sensorInfo}>
              <View style={[styles.sensorDot, { backgroundColor: getAQIColor(device.aqi) }]} />
              <View style={styles.sensorDetails}>
                <Text style={styles.sensorName}>{device.name}</Text>
                <Text style={styles.sensorLocation}>{device.location}</Text>
                <Text style={styles.sensorAQI}>AQI: {device.aqi}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Campus Air Quality</Text>
          <Text style={styles.headerDate}>{currentDate}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={24} color="#666" />
          </TouchableOpacity>
          {DEBUG_MODE && (
            <TouchableOpacity style={styles.headerButton} onPress={toggleDebugInfo}>
              <Ionicons name="bug-outline" size={24} color={showDebugInfo ? "#4361EE" : "#666"} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/(tabs)/settings")}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug Info */}
      {DEBUG_MODE && showDebugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🐛 Debug Information</Text>
          <Text style={styles.debugText}>Devices: {safeDevices.length}</Text>
          <Text style={styles.debugText}>Loading: {loading ? "Yes" : "No"}</Text>
          <Text style={styles.debugText}>Error: {error || "None"}</Text>
          <Text style={styles.debugText}>Monitored: {getMonitoredDevices().length}</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* AQI Display */}
        {renderAQICircle()}

        {/* Environmental Data */}
        {renderEnvironmentalData()}

        {/* Map Section */}
        {renderMapSection()}

        {/* Key Locations */}
        {renderKeyLocations()}

        {/* Monitored Sensors */}
        {renderMonitoredSensors()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  debugContainer: {
    backgroundColor: "#FFF3CD",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 2,
  },
  scrollView: {
    flex: 1,
  },
  aqiContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  aqiCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  aqiNumber: {
    fontSize: 48,
    fontWeight: "bold",
  },
  aqiStatus: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  environmentalData: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#F8F9FA",
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  dataItem: {
    alignItems: "center",
  },
  dataLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },
  mapSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mapView: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlayContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapOverlayText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  mapLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  keyLocationsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  keyLocationItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationDetails: {
    marginLeft: 8,
  },
  locationName: {
    fontSize: 14,
    color: "#666",
  },
  locationAQI: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  sensorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sensorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sensorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  sensorDetails: {
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  sensorLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  sensorAQI: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    marginTop: 12,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
})
