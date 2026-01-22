"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState, useEffect } from "react"
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
import LeafletMap from "../../components/LeafletMap"
import { useDevicesWithMonitoring } from "../../hooks/useDevicesWithMonitoring"
import { getAQIColor, getAQIStatus, SIMPLE_AQI_CATEGORIES } from "../../utils/aqiUtils"
import { useConnectivity } from "../../context/ConnectivityContext"
import { ROUTES } from "../../constants/Routes"

export default function MapScreen() {
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedSensor, setSelectedSensor] = useState(null)
  const [filters, setFilters] = useState<{[key: string]: boolean}>({
    good: true,
    moderate: true,
    unhealthy: true,
    very_unhealthy: true,
    hazardous: true,
  })
  
  // Force map refresh on connection restore
  const { isConnected } = useConnectivity()
  const [mapKey, setMapKey] = useState(0)
  
  useEffect(() => {
    if (isConnected) {
       setMapKey(prev => prev + 1)
    }
  }, [isConnected])

  const { devices, loading, error, refreshDevices } = useDevicesWithMonitoring()

  const getFilteredSensors = () => {
    if (!Array.isArray(devices)) return []

    return devices.filter((sensor) => {
      // Find which category this sensor belongs to based on AQI
      const category = SIMPLE_AQI_CATEGORIES.find(c => 
        sensor.aqi >= c.minValue && sensor.aqi <= c.maxValue
      )
      
      // If we found a category, check if it's enabled in filters
      if (category) {
        return filters[category.filter]
      }
      
      // Fallback for unexpected values (treat as enabled or default to last category)
      return true
    })
  }

  const handleSensorPress = (sensor: any) => {
    setSelectedSensor(sensor)
  }

  const handleSensorDetailPress = () => {
    if (selectedSensor && selectedSensor.deviceId) {
      setSelectedSensor(null)
      router.push(ROUTES.SENSOR.DETAIL(selectedSensor.deviceId))
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
    // Filter sensors based on selected criteria
    const filteredSensors = getFilteredSensors();

    return (
      <View style={styles.mapContainer}>
        <LeafletMap
          key={mapKey}
          sensors={filteredSensors}
          onSensorPress={handleSensorPress}
          style={styles.map}
        />
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.loadingOverlayText}>Updating sensors...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorOverlay}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.errorOverlayText}>Offline</Text>
          </View>
        )}
      </View>
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
                onPress={() => setFilters(prev => ({ ...prev, [category.filter]: !prev[category.filter] }))}
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
  loadingOverlay: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlayText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#4361EE",
    fontWeight: "600",
  },
  errorOverlay: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
  },
  errorOverlayText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#fff",
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
