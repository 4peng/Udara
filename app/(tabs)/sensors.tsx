"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { SafeAreaView, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { useDevicesWithMonitoring } from "../../hooks/useDevicesWithMonitoring"
import { getAQIColor, getAQIStatus, SIMPLE_AQI_CATEGORIES } from "../../utils/aqiUtils"
import { ROUTES } from "../../constants/Routes"

const categories = ["All", "Monitored", "Good", "Moderate", "Unhealthy", "Very Unhealthy", "Hazardous"]

export default function SensorsScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  
  const { 
    devices, 
    monitoredDevices,
    toggleAreaMonitoring,
    monitoringAreas,
    initialized,
  } = useDevicesWithMonitoring()

  // Helper function to check if a device is monitored
  const isDeviceCurrentlyMonitored = (deviceId: string, location: string) => {
    // Check if the area/location is being monitored
    const area = monitoringAreas.find(area => area.location === location)
    return area ? area.enabled : false
  }

  // Helper function to toggle monitoring for a device's location
  const toggleDeviceLocationMonitoring = async (location: string) => {
    // This will toggle ALL devices in this location
    await toggleAreaMonitoring(location)
  }

  const getFilteredSensors = () => {
    let filtered = devices || []

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (sensor) =>
          sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sensor.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory !== "All") {
      if (selectedCategory === "Monitored") {
        // Filter to show only monitored devices
        filtered = filtered.filter((sensor) => isDeviceCurrentlyMonitored(sensor.deviceId, sensor.location))
      } else {
        // Find the category definition
        const categoryDef = SIMPLE_AQI_CATEGORIES.find(c => c.name === selectedCategory)
        if (categoryDef) {
          filtered = filtered.filter((sensor) => 
            sensor.aqi >= categoryDef.minValue && sensor.aqi <= categoryDef.maxValue
          )
        } else {
          // Fallback to string match (shouldn't happen with correct categories)
          filtered = filtered.filter((sensor) => getAQIStatus(sensor.aqi) === selectedCategory)
        }
      }
    }

    return filtered
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>All Sensors</Text>
    </View>
  )

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sensors or locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  )

  const renderCategoryTabs = () => {
    // Count monitored devices for the tab
    const monitoredCount = devices.filter(sensor => 
      isDeviceCurrentlyMonitored(sensor.deviceId, sensor.location)
    ).length

    return (
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={categories}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollView}
          keyExtractor={(item) => item}
          renderItem={({ item: category }) => (
            <TouchableOpacity
              style={[styles.categoryTab, selectedCategory === category && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryTabText, selectedCategory === category && styles.categoryTabTextActive]}>
                {category}
                {category === "Monitored" && monitoredCount > 0 && ` (${monitoredCount})`}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    )
  }

  const renderSensorCard = ({ item: sensor }: { item: any }) => {
    const isMonitored = isDeviceCurrentlyMonitored(sensor.deviceId, sensor.location)
    
    return (
      <TouchableOpacity style={styles.sensorCard} onPress={() => router.push(ROUTES.SENSOR.DETAIL(sensor.deviceId))}>
        <View style={styles.sensorCardContent}>
          <View style={styles.sensorInfo}>
            <View style={[styles.sensorDot, { backgroundColor: getAQIColor(sensor.aqi) }]} />
            <View style={styles.sensorDetails}>
              <Text style={styles.sensorName}>{sensor.name}</Text>
              <Text style={styles.sensorLocation}>{sensor.location}</Text>
              <View style={styles.aqiContainer}>
                <Text style={styles.aqiLabel}>AQI: </Text>
                <Text style={[styles.aqiValue, { color: getAQIColor(sensor.aqi) }]}>{sensor.aqi}</Text>
                <Text style={[styles.statusText, { color: getAQIColor(sensor.aqi) }]}>{getAQIStatus(sensor.aqi)}</Text>
              </View>
              {isMonitored && (
                <View style={styles.monitoringBadge}>
                  <Ionicons name="eye" size={12} color="#4361EE" />
                  <Text style={styles.monitoringBadgeText}>Monitored</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.sensorActions}>
            <TouchableOpacity
              style={[styles.monitorButton, isMonitored && styles.monitorButtonActive]}
              onPress={() => toggleDeviceLocationMonitoring(sensor.location)}
            >
              <Ionicons
                name={isMonitored ? "eye" : "eye-outline"}
                size={20}
                color={isMonitored ? "#4361EE" : "#666"}
              />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => {
    if (!initialized) {
      return (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading sensors...</Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={48} color="#ccc" />
        <Text style={styles.emptyStateText}>
          {selectedCategory === "Monitored" ? "No monitored sensors" : "No sensors found"}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {selectedCategory === "Monitored" 
            ? "Go to Settings to select areas to monitor" 
            : "Try adjusting your search or filter"}
        </Text>
        {selectedCategory === "Monitored" && (
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => router.push(ROUTES.TABS.SETTINGS)}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  const filteredSensors = getFilteredSensors()

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={filteredSensors}
        renderItem={renderSensorCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderSearchBar()}
            {renderCategoryTabs()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        stickyHeaderIndices={[0]} // Optional: makes header sticky? No, header component is complex.
      />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  categoryContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  categoryScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 12,
  },
  categoryTabActive: {
    backgroundColor: "#4361EE",
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  sensorsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sensorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sensorCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
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
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  sensorLocation: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  aqiContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  aqiLabel: {
    fontSize: 14,
    color: "#666",
  },
  aqiValue: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  monitoringBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6EFFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  monitoringBadgeText: {
    fontSize: 11,
    color: "#4361EE",
    fontWeight: "500",
    marginLeft: 4,
  },
  sensorActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  monitorButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
  },
  monitorButtonActive: {
    backgroundColor: "#E6EFFF",
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  settingsButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
})