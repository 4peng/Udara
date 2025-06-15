"use client"

import { Ionicons } from "@expo/vector-icons"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { MAPBOX_STATUS } from "../config/mapbox"

interface Sensor {
  id: string
  name: string
  aqi: number
  coordinates: {
    latitude: number
    longitude: number
  }
  location?: string
  deviceId?: string
}

interface FallbackMapProps {
  sensors: Sensor[]
  onSensorPress?: (sensor: Sensor) => void
  style?: any
  showDebugInfo?: boolean
}

export default function FallbackMap({ sensors, onSensorPress, style, showDebugInfo = false }: FallbackMapProps) {
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "#4CAF50"
    if (aqi <= 100) return "#FF9800"
    if (aqi <= 150) return "#F44336"
    return "#9C27B0"
  }

  const getStatusText = (aqi: number) => {
    if (aqi <= 50) return "Good"
    if (aqi <= 100) return "Moderate"
    if (aqi <= 150) return "Unhealthy"
    return "Very Unhealthy"
  }

  const renderDebugInfo = () => {
    if (!showDebugInfo) return null

    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>🔍 Debug Information</Text>
        <ScrollView style={styles.debugScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Mapbox Available:</Text> {MAPBOX_STATUS.isAvailable ? "❌ No" : "✅ Yes"}
          </Text>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Valid Token:</Text> {MAPBOX_STATUS.hasValidToken ? "✅ Yes" : "❌ No"}
          </Text>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Package Importable:</Text>{" "}
            {MAPBOX_STATUS.mapboxImportable ? "✅ Yes" : "❌ No"}
          </Text>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Sensors Count:</Text> {sensors.length}
          </Text>

          {!MAPBOX_STATUS.isAvailable && (
            <View style={styles.reasonsContainer}>
              <Text style={styles.debugLabel}>Reasons for fallback:</Text>
              {MAPBOX_STATUS.reasons.noToken && <Text style={styles.reasonText}>• No valid Mapbox access token</Text>}
              {MAPBOX_STATUS.reasons.cantImport && (
                <Text style={styles.reasonText}>• Cannot import @rnmapbox/maps package</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Ionicons name="location-outline" size={24} color="#666" />
        <Text style={styles.headerText}>Campus Sensors</Text>
        {showDebugInfo && (
          <TouchableOpacity onPress={() => console.log("🗺️ Mapbox Status:", MAPBOX_STATUS)}>
            <Ionicons name="bug-outline" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {renderDebugInfo()}

      <View style={styles.sensorsGrid}>
        {sensors.slice(0, 6).map((sensor) => (
          <TouchableOpacity
            key={sensor.id}
            style={styles.sensorCard}
            onPress={() => {
              console.log(`🎯 Fallback map sensor pressed: ${sensor.name}`)
              onSensorPress && onSensorPress(sensor)
            }}
          >
            <View style={[styles.sensorDot, { backgroundColor: getAQIColor(sensor.aqi) }]} />
            <Text style={styles.sensorName} numberOfLines={1}>
              {sensor.name}
            </Text>
            <Text style={styles.sensorLocation} numberOfLines={1}>
              {sensor.location}
            </Text>
            <Text style={[styles.sensorAQI, { color: getAQIColor(sensor.aqi) }]}>{sensor.aqi}</Text>
            <Text style={[styles.sensorStatus, { color: getAQIColor(sensor.aqi) }]}>{getStatusText(sensor.aqi)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Map view temporarily unavailable</Text>
        <Text style={styles.footerSubtext}>Showing sensor list instead</Text>
        {showDebugInfo && <Text style={styles.debugFooter}>Check console for detailed logs</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  debugContainer: {
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  debugScroll: {
    maxHeight: 100,
  },
  debugText: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 4,
  },
  debugLabel: {
    fontWeight: "600",
  },
  reasonsContainer: {
    marginTop: 8,
  },
  reasonText: {
    fontSize: 11,
    color: "#856404",
    marginLeft: 8,
    marginBottom: 2,
  },
  sensorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sensorCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sensorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  sensorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  sensorLocation: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  sensorAQI: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  sensorStatus: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  footerSubtext: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    marginTop: 2,
  },
  debugFooter: {
    fontSize: 9,
    color: "#999",
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
})
