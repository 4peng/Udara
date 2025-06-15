"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

// Mock data for all sensors
const allSensors = [
  { id: 1, name: "Main Library - Floor 1", location: "Library Plaza", aqi: 42, status: "good", isMonitored: true },
  { id: 2, name: "Student Center - West Wing", location: "Student Center", aqi: 45, status: "good", isMonitored: true },
  {
    id: 3,
    name: "Science Building - Lab Area",
    location: "Academic Buildings",
    aqi: 38,
    status: "good",
    isMonitored: false,
  },
  { id: 4, name: "Sports Complex - Indoor", location: "Sports Complex", aqi: 41, status: "good", isMonitored: false },
  {
    id: 5,
    name: "Engineering Building - Floor 2",
    location: "Academic Buildings",
    aqi: 125,
    status: "unhealthy",
    isMonitored: false,
  },
  {
    id: 6,
    name: "Dormitory Area - Common Room",
    location: "Dormitory Area",
    aqi: 35,
    status: "good",
    isMonitored: false,
  },
  { id: 7, name: "Parking Lot - North", location: "Parking Lots", aqi: 78, status: "moderate", isMonitored: false },
  { id: 8, name: "Cafeteria - Main Hall", location: "Student Center", aqi: 52, status: "moderate", isMonitored: false },
]

const categories = ["All", "Monitored", "Good", "Moderate", "Unhealthy"]

export default function SensorsScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sensors, setSensors] = useState(allSensors)

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

  const toggleMonitoring = (sensorId: number) => {
    setSensors(
      sensors.map((sensor) => (sensor.id === sensorId ? { ...sensor, isMonitored: !sensor.isMonitored } : sensor)),
    )
  }

  const getFilteredSensors = () => {
    let filtered = sensors

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
        filtered = filtered.filter((sensor) => sensor.isMonitored)
      } else {
        filtered = filtered.filter((sensor) => getStatusText(sensor.aqi) === selectedCategory)
      }
    }

    return filtered
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>All Sensors</Text>
      <TouchableOpacity style={styles.headerButton}>
        <Ionicons name="options-outline" size={24} color="#333" />
      </TouchableOpacity>
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

  const renderCategoryTabs = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollView}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryTab, selectedCategory === category && styles.categoryTabActive]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryTabText, selectedCategory === category && styles.categoryTabTextActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const renderSensorCard = (sensor: (typeof allSensors)[0]) => (
    <TouchableOpacity key={sensor.id} style={styles.sensorCard} onPress={() => router.push(`/sensor/${sensor.id}`)}>
      <View style={styles.sensorCardContent}>
        <View style={styles.sensorInfo}>
          <View style={[styles.sensorDot, { backgroundColor: getAQIColor(sensor.aqi) }]} />
          <View style={styles.sensorDetails}>
            <Text style={styles.sensorName}>{sensor.name}</Text>
            <Text style={styles.sensorLocation}>{sensor.location}</Text>
            <View style={styles.aqiContainer}>
              <Text style={styles.aqiLabel}>AQI: </Text>
              <Text style={[styles.aqiValue, { color: getAQIColor(sensor.aqi) }]}>{sensor.aqi}</Text>
              <Text style={[styles.statusText, { color: getAQIColor(sensor.aqi) }]}>{getStatusText(sensor.aqi)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.sensorActions}>
          <TouchableOpacity
            style={[styles.monitorButton, sensor.isMonitored && styles.monitorButtonActive]}
            onPress={() => toggleMonitoring(sensor.id)}
          >
            <Ionicons
              name={sensor.isMonitored ? "eye" : "eye-outline"}
              size={20}
              color={sensor.isMonitored ? "#4361EE" : "#666"}
            />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderSensorsList = () => {
    const filteredSensors = getFilteredSensors()

    if (filteredSensors.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No sensors found</Text>
          <Text style={styles.emptyStateSubtext}>Try adjusting your search or filter</Text>
        </View>
      )
    }

    return <View style={styles.sensorsList}>{filteredSensors.map((sensor) => renderSensorCard(sensor))}</View>
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      {renderSearchBar()}
      {renderCategoryTabs()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderSensorsList()}
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
})
