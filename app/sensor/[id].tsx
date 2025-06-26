"use client"

import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
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
import { LineChart } from "react-native-chart-kit"
import { useDeviceDetail } from "../../hooks/useDeviceDetail"

const { width } = Dimensions.get("window")

export default function SensorDetailScreen() {
  const { id } = useLocalSearchParams()
  const [selectedPeriod, setSelectedPeriod] = useState("24h")
  const [isFavorite, setIsFavorite] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { device, loading, error, refetch, fetchHistoricalData, chartData } = useDeviceDetail(id as string)

  // Set the screen title dynamically when device data loads
  useEffect(() => {
    if (device) {
      // This will update the tab/screen title
      router.setParams({ 
        title: device.name || `Sensor ${id}`,
        subtitle: device.location 
      })
    }
  }, [device, id])

  const getAQIColor = (aqi: number) => {
    if (aqi <= 100) return "#4CAF50"
    if (aqi <= 200) return "#FFC107"
    return "#F44336"
  }

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 100) return "Healthy"
    if (aqi <= 200) return "Moderate"
    return "Hazardous"
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period)
    if (device) {
      console.log("Fetching data for period:", period)
      setRefreshing(true)
      await fetchHistoricalData(period)
      setRefreshing(false)
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>
          {device?.name || `Sensor ${id}`}
        </Text>
        <Text style={styles.headerSubtitle}>{device?.location}</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton} onPress={handleRefresh} disabled={refreshing}>
          <Ionicons name="refresh-outline" size={24} color={refreshing ? "#ccc" : "#333"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => setIsFavorite(!isFavorite)}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#FF6B6B" : "#333"} />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Loading sensor details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !device) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error || "Sensor not found"}</Text>
          <Text style={styles.errorSubtext}>
            {error?.includes("No pollutant data")
              ? "This sensor doesn't have any recorded data yet."
              : "Please check your connection and try again."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const renderAQIDisplay = () => {
    const color = getAQIColor(device.aqi)
    const status = getAQIStatus(device.aqi)

    return (
      <View style={styles.aqiSection}>
        <View style={styles.aqiMain}>
          <Text style={[styles.aqiNumber, { color }]}>{device.aqi}</Text>
          <Text style={[styles.aqiStatus, { color }]}>{status}</Text>
        </View>
        <Text style={styles.lastUpdated}>Last updated</Text>
        <Text style={styles.updateTime}>{device.lastUpdated}</Text>
      </View>
    )
  }

  const renderEnvironmentalData = () => (
    <View style={styles.environmentalSection}>
      <View style={styles.envItem}>
        <Ionicons name="thermometer-outline" size={16} color="#666" />
        <Text style={styles.envLabel}>Temperature</Text>
        <Text style={styles.envValue}>{device.temperature}</Text>
      </View>
      <View style={styles.envItem}>
        <Ionicons name="water-outline" size={16} color="#666" />
        <Text style={styles.envLabel}>Humidity</Text>
        <Text style={styles.envValue}>{device.humidity}</Text>
      </View>
      <View style={styles.envItem}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <Text style={styles.envLabel}>Location</Text>
        <Text style={styles.envValue}>{device.location}</Text>
      </View>
    </View>
  )

  const renderTimePeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity
        style={[styles.periodButton, selectedPeriod === "24h" && styles.periodButtonActive]}
        onPress={() => handlePeriodChange("24h")}
      >
        <Text style={[styles.periodText, selectedPeriod === "24h" && styles.periodTextActive]}>24 Hours</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.periodButton, selectedPeriod === "1w" && styles.periodButtonActive]}
        onPress={() => handlePeriodChange("1w")}
      >
        <Text style={[styles.periodText, selectedPeriod === "1w" && styles.periodTextActive]}>1 Week</Text>
      </TouchableOpacity>
    </View>
  )

  const renderChart = () => {
    const currentChartData = chartData || device?.chartData

    if (!currentChartData || !currentChartData.labels || currentChartData.labels.length === 0) {
      return (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>AQI Trend ({selectedPeriod})</Text>
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>No chart data available</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>AQI Trend ({selectedPeriod})</Text>
        {refreshing && (
          <View style={styles.chartLoadingOverlay}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.chartLoadingText}>Updating chart...</Text>
          </View>
        )}
        <LineChart
          data={currentChartData}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(67, 97, 238, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#4361EE",
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
      </View>
    )
  }

  const renderPollutantDetails = () => (
    <View style={styles.pollutantSection}>
      <Text style={styles.sectionTitle}>Pollutant Details</Text>
      {Object.entries(device.pollutants).map(([key, pollutant]) => (
        <View key={key} style={styles.pollutantItem}>
          <View style={styles.pollutantHeader}>
            <View style={styles.pollutantNameContainer}>
              <Text style={styles.pollutantName}>{key.toUpperCase()}</Text>
              <Text style={styles.pollutantUnit}>({pollutant.unit})</Text>
            </View>
            <Text style={[styles.pollutantCurrent, { color: pollutant.color }]}>{pollutant.current}</Text>
          </View>
          <Text style={styles.pollutantAverage}>
            24h average: {pollutant.average24h} {pollutant.unit}
          </Text>
          <View style={styles.pollutantChart}>
            <View
              style={[
                styles.pollutantLine,
                {
                  backgroundColor: pollutant.color,
                  width: `${Math.min(100, (pollutant.current / Math.max(pollutant.current, pollutant.average24h)) * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  )

  const renderDataInfo = () => (
    <View style={styles.dataInfoSection}>
      <Text style={styles.sectionTitle}>Data Information</Text>
      <View style={styles.dataInfoItem}>
        <Ionicons name="server-outline" size={16} color="#666" />
        <Text style={styles.dataInfoText}>Device ID: {device.deviceId}</Text>
      </View>
      <View style={styles.dataInfoItem}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.dataInfoText}>Last reading: {device.lastUpdated}</Text>
      </View>
      <View style={styles.dataInfoItem}>
        <Ionicons name="analytics-outline" size={16} color="#666" />
        <Text style={styles.dataInfoText}>Data source: Real-time sensor</Text>
      </View>
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
        {renderDataInfo()}
      </ScrollView>
    </SafeAreaView>
  )
}

// Rest of your styles remain the same...
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
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
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
  envLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
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
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
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
  pollutantNameContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  pollutantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  pollutantUnit: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  pollutantCurrent: {
    fontSize: 18,
    fontWeight: "bold",
  },
  pollutantAverage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  pollutantChart: {
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  pollutantLine: {
    height: "100%",
    borderRadius: 2,
  },
  dataInfoSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  dataInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dataInfoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
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
    lineHeight: 20,
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
  chartLoadingOverlay: {
    position: "absolute",
    top: 40,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1,
  },
  chartLoadingText: {
    fontSize: 12,
    color: "#4361EE",
    marginLeft: 6,
  },
})