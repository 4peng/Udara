"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import MapboxMap from "../../components/MapboxMap"
import { SENSOR_LOCATIONS } from "../../config/mapbox"

const { width } = Dimensions.get("window")

// Mock data - replace with real data from your API
const mockData = {
  currentAQI: 42,
  status: "Good",
  temperature: "72°F",
  humidity: "45%",
  lastUpdated: "2m ago",
  keyLocations: [
    { name: "Main Library", aqi: 42, trend: "up" },
    { name: "Student Center", aqi: 38, trend: "down" },
  ],
}

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState("")

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

  const handleMapPress = () => {
    router.push("/(tabs)/map")
  }

  const handleSensorPress = (sensor: any) => {
    router.push(`/sensor/${sensor.id}`)
  }

  const renderAQICircle = () => {
    const color = getAQIColor(mockData.currentAQI)
    return (
      <View style={styles.aqiContainer}>
        <View style={[styles.aqiCircle, { borderColor: color }]}>
          <Text style={[styles.aqiNumber, { color }]}>{mockData.currentAQI}</Text>
          <Text style={[styles.aqiStatus, { color }]}>{mockData.status}</Text>
        </View>
      </View>
    )
  }

  const renderEnvironmentalData = () => (
    <View style={styles.environmentalData}>
      <View style={styles.dataItem}>
        <Ionicons name="thermometer-outline" size={16} color="#666" />
        <Text style={styles.dataLabel}>Temperature</Text>
        <Text style={styles.dataValue}>{mockData.temperature}</Text>
      </View>
      <View style={styles.dataItem}>
        <Ionicons name="water-outline" size={16} color="#666" />
        <Text style={styles.dataLabel}>Humidity</Text>
        <Text style={styles.dataValue}>{mockData.humidity}</Text>
      </View>
      <View style={styles.dataItem}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.dataLabel}>Updated</Text>
        <Text style={styles.dataValue}>{mockData.lastUpdated}</Text>
      </View>
    </View>
  )

  const renderMapSection = () => (
    <View style={styles.mapSection}>
      <TouchableOpacity style={styles.mapContainer} onPress={handleMapPress}>
        <MapboxMap
          sensors={SENSOR_LOCATIONS.filter((sensor) => sensor.isMonitored)}
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

  const renderKeyLocations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key Locations</Text>
      <View style={styles.keyLocationsContainer}>
        {mockData.keyLocations.map((location, index) => (
          <View key={index} style={styles.keyLocationItem}>
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAQI}>{location.aqi}</Text>
              </View>
            </View>
            <Ionicons
              name={location.trend === "up" ? "trending-up" : "trending-down"}
              size={20}
              color={location.trend === "up" ? "#4CAF50" : "#F44336"}
            />
          </View>
        ))}
      </View>
    </View>
  )

  const renderMonitoredSensors = () => {
    // Only show sensors that are being monitored (based on settings)
    const monitoredSensors = SENSOR_LOCATIONS.filter((sensor) => sensor.isMonitored)

    if (monitoredSensors.length === 0) {
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
        {monitoredSensors.map((sensor) => (
          <TouchableOpacity
            key={sensor.id}
            style={styles.sensorItem}
            onPress={() => router.push(`/sensor/${sensor.id}`)}
          >
            <View style={styles.sensorInfo}>
              <View style={[styles.sensorDot, { backgroundColor: getAQIColor(sensor.aqi) }]} />
              <View style={styles.sensorDetails}>
                <Text style={styles.sensorName}>{sensor.name}</Text>
                <Text style={styles.sensorAQI}>AQI: {sensor.aqi}</Text>
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
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="refresh-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

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
  sensorAQI: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
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
