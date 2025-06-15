"use client"

import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { LineChart } from "react-native-chart-kit"

const { width } = Dimensions.get("window")

// Mock data for the sensor detail
const mockSensorData = {
  id: "A238",
  name: "Downtown Air Monitor",
  fullName: "Downtown Air Monitor #A238",
  aqi: 75,
  status: "Moderate",
  lastUpdated: "2 mins ago",
  temperature: "24°C",
  humidity: "65%",
  coordinates: "34.0522°N, 118.2437°W",
  pollutants: {
    pm25: { current: 18, average24h: 17.5, unit: "μg/m³", color: "#FF6B6B" },
    pm10: { current: 45, average24h: 43.2, unit: "μg/m³", color: "#4ECDC4" },
    o3: { current: 52, average24h: 50.1, unit: "ppb", color: "#45B7D1" },
    no2: { current: 15, average24h: 14.2, unit: "ppb", color: "#96CEB4" },
    so2: { current: 8, average24h: 7.6, unit: "ppb", color: "#FFEAA7" },
    co: { current: 0.8, average24h: 0.78, unit: "ppm", color: "#DDA0DD" },
  },
  chartData: {
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
    datasets: [
      {
        data: [45, 48, 52, 55, 53, 50],
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [38, 42, 45, 48, 46, 43],
        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [48, 50, 52, 54, 52, 50],
        color: (opacity = 1) => `rgba(69, 183, 209, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [12, 14, 16, 18, 16, 14],
        color: (opacity = 1) => `rgba(150, 206, 180, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [6, 7, 8, 9, 8, 7],
        color: (opacity = 1) => `rgba(255, 234, 167, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  },
}

export default function SensorDetailScreen() {
  const { id } = useLocalSearchParams()
  const [selectedPeriod, setSelectedPeriod] = useState("24h")
  const [isFavorite, setIsFavorite] = useState(false)

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "#4CAF50"
    if (aqi <= 100) return "#FF9800"
    if (aqi <= 150) return "#F44336"
    return "#9C27B0"
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{mockSensorData.fullName}</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => setIsFavorite(!isFavorite)}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#FF6B6B" : "#333"} />
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderAQIDisplay = () => {
    const color = getAQIColor(mockSensorData.aqi)
    return (
      <View style={styles.aqiSection}>
        <View style={styles.aqiMain}>
          <Text style={[styles.aqiNumber, { color }]}>{mockSensorData.aqi}</Text>
          <Text style={[styles.aqiStatus, { color }]}>{mockSensorData.status}</Text>
        </View>
        <Text style={styles.lastUpdated}>Last updated</Text>
        <Text style={styles.updateTime}>{mockSensorData.lastUpdated}</Text>
      </View>
    )
  }

  const renderEnvironmentalData = () => (
    <View style={styles.environmentalSection}>
      <View style={styles.envItem}>
        <Ionicons name="thermometer-outline" size={16} color="#666" />
        <Text style={styles.envValue}>{mockSensorData.temperature}</Text>
      </View>
      <View style={styles.envItem}>
        <Ionicons name="water-outline" size={16} color="#666" />
        <Text style={styles.envValue}>{mockSensorData.humidity}</Text>
      </View>
      <View style={styles.envItem}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.envValue}>{mockSensorData.coordinates}</Text>
      </View>
    </View>
  )

  const renderTimePeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity
        style={[styles.periodButton, selectedPeriod === "24h" && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod("24h")}
      >
        <Text style={[styles.periodText, selectedPeriod === "24h" && styles.periodTextActive]}>24 Hours</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.periodButton, selectedPeriod === "1w" && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod("1w")}
      >
        <Text style={[styles.periodText, selectedPeriod === "1w" && styles.periodTextActive]}>1 Week</Text>
      </TouchableOpacity>
    </View>
  )

  const renderChart = () => (
    <View style={styles.chartSection}>
      <LineChart
        data={mockSensorData.chartData}
        width={width - 40}
        height={200}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.1})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "3",
            strokeWidth: "1",
          },
          propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: "#e3e3e3",
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
      />
      <View style={styles.chartLegend}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FF6B6B" }]} />
            <Text style={styles.legendText}>PM2.5</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4ECDC4" }]} />
            <Text style={styles.legendText}>PM10</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#45B7D1" }]} />
            <Text style={styles.legendText}>O3</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#96CEB4" }]} />
            <Text style={styles.legendText}>NO2</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#DDA0DD" }]} />
            <Text style={styles.legendText}>CO</Text>
          </View>
        </View>
      </View>
    </View>
  )

  const renderPollutantDetails = () => (
    <View style={styles.pollutantSection}>
      <Text style={styles.sectionTitle}>Pollutant Details</Text>
      {Object.entries(mockSensorData.pollutants).map(([key, pollutant]) => (
        <View key={key} style={styles.pollutantItem}>
          <View style={styles.pollutantHeader}>
            <Text style={styles.pollutantName}>{key.toUpperCase()}</Text>
            <Text style={[styles.pollutantCurrent, { color: pollutant.color }]}>
              {pollutant.current}
              {pollutant.unit}
            </Text>
          </View>
          <Text style={styles.pollutantAverage}>24h average: {pollutant.average24h}</Text>
          <View style={styles.pollutantChart}>
            <View style={[styles.pollutantLine, { backgroundColor: pollutant.color }]} />
          </View>
        </View>
      ))}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderAQIDisplay()}
        {renderEnvironmentalData()}
        {renderTimePeriodSelector()}
        {renderChart()}
        {renderPollutantDetails()}
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
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
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
  scrollView: {
    flex: 1,
  },
  aqiSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  aqiMain: {
    alignItems: "center",
    marginBottom: 16,
  },
  aqiNumber: {
    fontSize: 64,
    fontWeight: "bold",
  },
  aqiStatus: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#666",
  },
  updateTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
  },
  environmentalSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F8F9FA",
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  envItem: {
    alignItems: "center",
    flex: 1,
  },
  envValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 4,
    textAlign: "center",
  },
  periodSelector: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#333",
  },
  periodText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  periodTextActive: {
    color: "#FFFFFF",
  },
  chartSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  chart: {
    borderRadius: 16,
  },
  chartLegend: {
    marginTop: 16,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
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
  pollutantSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  pollutantItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  pollutantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  pollutantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  pollutantCurrent: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pollutantAverage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  pollutantChart: {
    height: 2,
    backgroundColor: "#F0F0F0",
    borderRadius: 1,
    overflow: "hidden",
  },
  pollutantLine: {
    height: "100%",
    width: "60%",
    borderRadius: 1,
  },
})
