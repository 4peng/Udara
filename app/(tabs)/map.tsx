"use client"

import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { Dimensions, Image, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"

const { width, height } = Dimensions.get("window")

const mapSensors = [
  { id: 1, name: "Library Plaza", aqi: 42, lat: 0.3, lng: 0.4, status: "good" },
  { id: 2, name: "Student Center", aqi: 38, lat: 0.6, lng: 0.7, status: "good" },
  { id: 3, name: "Sports Complex", aqi: 75, lat: 0.45, lng: 0.6, status: "moderate" },
  { id: 4, name: "Engineering Building", aqi: 125, lat: 0.2, lng: 0.8, status: "unhealthy" },
]

export default function MapScreen() {
  const [selectedSensor, setSelectedSensor] = useState<(typeof mapSensors)[0] | null>(null)

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "#4CAF50"
    if (aqi <= 100) return "#FF9800"
    if (aqi <= 150) return "#F44336"
    return "#9C27B0"
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Campus Air Quality Map</Text>
      <TouchableOpacity style={styles.headerButton}>
        <Ionicons name="layers-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  )

  const renderMap = () => (
    <View style={styles.mapContainer}>
      <Image
        source={{
          uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%7B139030A9-CA1A-4A1C-B4FD-CC04E6F84838%7D-eBT9VntwUT7kWDKNf3QaQaC2eKJLTk.png",
        }}
        style={styles.mapImage}
        resizeMode="cover"
      />
      <View style={styles.mapOverlay}>
        {mapSensors.map((sensor) => (
          <TouchableOpacity
            key={sensor.id}
            style={[
              styles.sensorDot,
              {
                backgroundColor: getAQIColor(sensor.aqi),
                top: `${sensor.lat * 100}%`,
                left: `${sensor.lng * 100}%`,
              },
            ]}
            onPress={() => setSelectedSensor(sensor)}
          >
            <Text style={styles.sensorAQI}>{sensor.aqi}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderLegend = () => (
    <View style={styles.legend}>
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
  )

  const renderSensorInfo = () => {
    if (!selectedSensor) return null

    return (
      <View style={styles.sensorInfo}>
        <View style={styles.sensorInfoHeader}>
          <Text style={styles.sensorInfoTitle}>{selectedSensor.name}</Text>
          <TouchableOpacity onPress={() => setSelectedSensor(null)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.sensorInfoContent}>
          <View style={styles.aqiDisplay}>
            <Text style={[styles.aqiNumber, { color: getAQIColor(selectedSensor.aqi) }]}>{selectedSensor.aqi}</Text>
            <Text style={styles.aqiLabel}>AQI</Text>
          </View>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <View style={styles.content}>
        {renderMap()}
        {renderLegend()}
        {renderSensorInfo()}
      </View>
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
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sensorDot: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sensorAQI: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  sensorInfo: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sensorInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sensorInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sensorInfoContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aqiDisplay: {
    alignItems: "center",
  },
  aqiNumber: {
    fontSize: 32,
    fontWeight: "bold",
  },
  aqiLabel: {
    fontSize: 12,
    color: "#666",
  },
  detailsButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
})
