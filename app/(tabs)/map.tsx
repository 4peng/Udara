"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Modal,
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

export default function MapScreen() {
  const [selectedSensor, setSelectedSensor] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    good: true,
    moderate: true,
    unhealthy: true,
    hazardous: true,
  })

  const { devices, loading, error, refreshDevices } = useDevices()

  // Add this after the useDevices hook call
  useEffect(() => {
    console.log("Map screen - devices loaded:", devices.length)
    console.log("Map screen - filtered sensors:", getFilteredSensors().length)
  }, [devices])

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

  const getFilteredSensors = () => {
    return devices.filter((sensor) => {
      const status = getStatusText(sensor.aqi).toLowerCase()
      if (status === "good") return activeFilters.good
      if (status === "moderate") return activeFilters.moderate
      if (status === "unhealthy") return activeFilters.unhealthy
      return activeFilters.hazardous
    })
  }

  const handleSensorPress = (sensor: any) => {
    setSelectedSensor(sensor)
  }

  const handleSensorDetailPress = () => {
    if (selectedSensor) {
      setSelectedSensor(null)
      router.push(`/sensor/${selectedSensor.id}`)
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Campus Air Quality Map</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={refreshDevices}>
          <Ionicons name="refresh-outline" size={24} color="#333" />
        </TouchableOpacity>
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
          <View style={styles.sensorInfoTitle}>
            <Text style={styles.sensorInfoName}>{selectedSensor.name}</Text>
            <Text style={styles.sensorInfoLocation}>{selectedSensor.location}</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedSensor(null)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.sensorInfoContent}>
          <View style={styles.aqiDisplay}>
            <Text style={[styles.aqiNumber, { color: getAQIColor(selectedSensor.aqi) }]}>{selectedSensor.aqi}</Text>
            <Text style={styles.aqiLabel}>AQI</Text>
            <Text style={[styles.aqiStatus, { color: getAQIColor(selectedSensor.aqi) }]}>
              {getStatusText(selectedSensor.aqi)}
            </Text>
          </View>
          <TouchableOpacity style={styles.detailsButton} onPress={handleSensorDetailPress}>
            <Text style={styles.detailsButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderFiltersModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Sensors</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.filterSectionTitle}>Air Quality Levels</Text>
            {Object.entries(activeFilters).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={styles.filterItem}
                onPress={() => setActiveFilters({ ...activeFilters, [key]: !value })}
              >
                <View style={styles.filterLeft}>
                  <View
                    style={[
                      styles.filterDot,
                      {
                        backgroundColor:
                          key === "good"
                            ? "#4CAF50"
                            : key === "moderate"
                              ? "#FF9800"
                              : key === "unhealthy"
                                ? "#F44336"
                                : "#9C27B0",
                      },
                    ]}
                  />
                  <Text style={styles.filterText}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                </View>
                <View style={[styles.checkbox, value && styles.checkboxActive]}>
                  {value && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load map data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshDevices}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <View style={styles.content}>
        <MapboxMap
          sensors={getFilteredSensors()}
          onSensorPress={handleSensorPress}
          showUserLocation={true}
          style={styles.map}
        />
        {renderLegend()}
        {renderSensorInfo()}
      </View>
      {renderFiltersModal()}
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
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  map: {
    flex: 1,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sensorInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sensorInfoTitle: {
    flex: 1,
  },
  sensorInfoName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  sensorInfoLocation: {
    fontSize: 14,
    color: "#666",
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
    fontSize: 36,
    fontWeight: "bold",
  },
  aqiLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  aqiStatus: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  detailsButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  filterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  filterLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  filterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  filterText: {
    fontSize: 16,
    color: "#333",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#4361EE",
    borderColor: "#4361EE",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  applyButton: {
    backgroundColor: "#4361EE",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
