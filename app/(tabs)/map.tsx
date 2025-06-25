"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
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
import { useDevicesWithMonitoring } from "../../hooks/useDevicesWithMonitoring"
import { getAQIColor, getAQIStatus, SIMPLE_AQI_CATEGORIES } from "../../utils/aqiUtils"

export default function MapScreen() {
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedSensor, setSelectedSensor] = useState(null)
  const [filters, setFilters] = useState({
    healthy: true,
    moderate: true,
    hazardous: true,
  })

  const { devices, loading, error, refreshDevices } = useDevicesWithMonitoring()

  const getFilteredSensors = () => {
    if (!Array.isArray(devices)) return []

    return devices.filter((sensor) => {
      const status = getAQIStatus(sensor.aqi).toLowerCase()
      if (status === "healthy") return filters.healthy
      if (status === "moderate") return filters.moderate
      return filters.hazardous // Hazardous
    })
  }

  const handleSensorPress = (sensor: any) => {
    console.log(`🎯 Map: Sensor pressed: ${sensor.name} (${sensor.id})`)
    setSelectedSensor(sensor)
  }

  const handleSensorDetailPress = () => {
    if (selectedSensor && selectedSensor.id) {
      setSelectedSensor(null)
      router.push(`/sensor/${selectedSensor.id}`)
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Campus Map</Text>
      <TouchableOpacity style={styles.filterButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="options-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  )

  const renderMapContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Loading sensors...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load sensors</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshDevices}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    const filteredSensors = getFilteredSensors()

    if (filteredSensors.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={48} color="#ccc" />
          <Text style={styles.errorText}>No sensors to display</Text>
          <Text style={styles.errorSubtext}>Try adjusting your filters</Text>
        </View>
      )
    }

    return (
      <MapboxMap
        sensors={filteredSensors}
        onSensorPress={handleSensorPress}
        style={styles.map}
        interactive={true}
        showUserLocation={true}
      />
    )
  }

  const renderLegend = () => (
    <View style={styles.legend}>
      {SIMPLE_AQI_CATEGORIES.map((category, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: category.color }]} />
          <Text style={styles.legendText}>
            {category.name} ({category.range})
          </Text>
        </View>
      ))}
    </View>
  )

  const renderFiltersModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Air Quality</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.filterSectionTitle}>Air Quality Levels</Text>
            {SIMPLE_AQI_CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.filterItem}
                onPress={() => setFilters({ ...filters, [category.filter]: !filters[category.filter] })}
              >
                <View style={styles.filterLeft}>
                  <View style={[styles.filterDot, { backgroundColor: category.color }]} />
                  <Text style={styles.filterText}>
                    {category.name} ({category.range} AQI)
                  </Text>
                </View>
                <View style={[styles.checkbox, filters[category.filter] && styles.checkboxActive]}>
                  {filters[category.filter] && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalFooter} onPress={() => setModalVisible(false)}>
            <Text style={styles.modalFooterText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  const renderSensorInfoModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!selectedSensor}
      onRequestClose={() => setSelectedSensor(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sensorInfoContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSensor(null)}>
            <Ionicons name="close" size={24} color="#555" />
          </TouchableOpacity>

          {selectedSensor && (
            <View style={styles.sensorInfoContent}>
              <Text style={styles.sensorInfoTitle}>{selectedSensor.name}</Text>
              <Text style={styles.sensorLocation}>{selectedSensor.location}</Text>
              <Text style={[styles.aqiNumber, { color: getAQIColor(selectedSensor.aqi) }]}>{selectedSensor.aqi}</Text>
              <Text style={styles.aqiLabel}>AQI</Text>
              <Text style={[styles.aqiStatus, { color: getAQIColor(selectedSensor.aqi) }]}>
                {getAQIStatus(selectedSensor.aqi)}
              </Text>
              <TouchableOpacity style={styles.detailButton} onPress={handleSensorDetailPress}>
                <Text style={styles.detailButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}

      <View style={styles.mapContainer}>{renderMapContent()}</View>

      {renderLegend()}
      {renderFiltersModal()}
      {renderSensorInfoModal()}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
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
    fontSize: 18,
    color: "#F44336",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
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
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  legendItem: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    lineHeight: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "80%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: 15,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  filterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  filterText: {
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#4361EE",
    borderColor: "#4361EE",
  },
  modalFooter: {
    padding: 15,
    backgroundColor: "#4361EE",
    alignItems: "center",
  },
  modalFooterText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  sensorInfoContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "80%",
    padding: 20,
    alignItems: "center",
  },
  sensorInfoContent: {
    alignItems: "center",
    width: "100%",
  },
  sensorInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  sensorLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  aqiNumber: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 4,
  },
  aqiLabel: {
    fontSize: 16,
    color: "#555",
    marginBottom: 4,
  },
  aqiStatus: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  detailButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  detailButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
})
