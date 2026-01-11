// app/sensor/[id].tsx
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
import { useAuth } from "../../hooks/useAuth"
import { usePushNotifications } from "../../hooks/usePushNotifications"
import { API_CONFIG, apiRequest } from "../../config/api"
import { getAQIColor, getAQIStatus } from "../../utils/aqiUtils"
import { getComfortLevel, getComfortLevelColor, calculateHeatIndex } from "../../utils/environmentalUtils"

const { width } = Dimensions.get("window")

export default function SensorDetailScreen() {
  const { id } = useLocalSearchParams()
  const [selectedPeriod, setSelectedPeriod] = useState("24h")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const { user } = useAuth()
  usePushNotifications() // Ensure token is registered

  const { device, loading, error, refetch, fetchHistoricalData, chartData } = useDeviceDetail(id as string)

  // Check subscription status
  useEffect(() => {
    if (user && id) {
      const url = `${API_CONFIG.BASE_URL}/api/notifications/subscriptions/${user.uid}`;
      apiRequest(url)
        .then(async (res) => {
           if (res.status === 404) return { success: true, subscriptions: [] }; // Handle 404 as no subscriptions
           if (!res.ok) throw new Error(`Status ${res.status}`);
           return res.json();
        })
        .then(data => {
            if (data.success && data.subscriptions.some((sub: any) => sub.deviceId === id)) {
                setIsSubscribed(true)
            }
        })
        .catch(err => {
            console.error("Error checking subscription:", err);
        })
    }
  }, [user, id])

  const handleToggleSubscription = async () => {
    if (!user) {
        alert("Please log in to save locations and get alerts.")
        return
    }
    
    const endpoint = isSubscribed ? 'unsubscribe' : 'subscribe'
    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/notifications/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, deviceId: id })
        })
        const data = await res.json()
        if (data.success) {
            setIsSubscribed(!isSubscribed)
        } else {
            alert("Failed to update subscription")
        }
    } catch (error) {
        console.error("Error toggling subscription:", error)
        alert("Error connecting to server")
    }
  }

  // Set the screen title dynamically when device data loads
  useEffect(() => {
    if (device) {
      router.setParams({ 
        title: device.name || `Sensor ${id}`,
        subtitle: device.location 
      })
    }
  }, [device, id])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period)
    if (device) {
      setRefreshing(true)
      await fetchHistoricalData(period)
      setRefreshing(false)
    }
  }

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true 
      });
    } catch (e) {
      return dateString;
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
        <TouchableOpacity style={styles.headerButton} onPress={handleToggleSubscription}>
          <Ionicons name={isSubscribed ? "heart" : "heart-outline"} size={24} color={isSubscribed ? "#FF6B6B" : "#333"} />
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
        <Text style={styles.updateTime}>{formatLastUpdated(device.lastUpdated)}</Text>
      </View>
    )
  }

  // Environmental details section (Cards)
  const renderEnvironmentalDetails = () => {
    if (!device.environmental) return null

    const currentTemp = device.environmental.current.temperature
    const currentHumidity = device.environmental.current.humidity
    const comfortLevel = getComfortLevel(currentTemp, currentHumidity)
    const comfortColor = getComfortLevelColor(currentTemp, currentHumidity)
    const heatIndex = calculateHeatIndex(currentTemp, currentHumidity)

    // Calculate chart widths
    const tempWidth = Math.min(100, Math.max(0, ((currentTemp || 0) / 50) * 100)); // Assumes 0-50 range
    const humidWidth = Math.min(100, Math.max(0, (currentHumidity || 0))); // 0-100 range

    return (
      <View style={styles.environmentalDetailsSection}>
        <Text style={styles.sectionTitle}>Environmental Conditions</Text>
        
        <View style={styles.environmentalGrid}>
          <View style={styles.environmentalCard}>
            <View style={styles.environmentalCardHeader}>
              <Ionicons name="thermometer" size={24} color="#FF6B6B" />
              <Text style={styles.environmentalCardTitle}>Temperature</Text>
            </View>
            <Text style={styles.environmentalCardValue}>
              {currentTemp !== undefined ? `${currentTemp.toFixed(1)}°C` : 'N/A'}
            </Text>
            <Text style={styles.environmentalCardSubtext}>
              24h avg: {device.environmental.average24h.temperature !== undefined ? `${device.environmental.average24h.temperature.toFixed(1)}°C` : 'N/A'}
            </Text>
            <View style={styles.environmentalCardChart}>
              <View 
                style={[
                  styles.environmentalBar, 
                  { 
                    backgroundColor: '#FF6B6B',
                    width: `${tempWidth}%`
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.environmentalCard}>
            <View style={styles.environmentalCardHeader}>
              <Ionicons name="water" size={24} color="#4ECDC4" />
              <Text style={styles.environmentalCardTitle}>Humidity</Text>
            </View>
            <Text style={styles.environmentalCardValue}>
              {currentHumidity !== undefined ? `${currentHumidity.toFixed(1)}%` : 'N/A'}
            </Text>
            <Text style={styles.environmentalCardSubtext}>
              24h avg: {device.environmental.average24h.humidity !== undefined ? `${device.environmental.average24h.humidity.toFixed(1)}%` : 'N/A'}
            </Text>
            <View style={styles.environmentalCardChart}>
              <View 
                style={[
                  styles.environmentalBar, 
                  { 
                    backgroundColor: '#4ECDC4',
                    width: `${humidWidth}%`
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Environmental trend indicators */}
        <View style={styles.environmentalTrends}>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Comfort Level</Text>
            <Text style={[styles.trendValue, { color: comfortColor }]}>
              {comfortLevel}
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Heat Index</Text>
            <Text style={styles.trendValue}>
              {heatIndex !== undefined ? `${heatIndex}°C` : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    )
  }

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
          // Hide some x-labels to prevent overcrowding
          formatXLabel={(label) => {
             // Only show every 3rd label or so if there are many points
             // But react-native-chart-kit doesn't have a direct 'step' prop for x-axis
             // We handle this by passing empty strings in data generation, OR
             // we accept they are long. The user said numbers are too long.
             // We will try to shorten them in the hook data generation.
             return label;
          }}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderAQIDisplay()}
        {renderEnvironmentalDetails()}
        {renderTimePeriodSelector()}
        {renderChart()}
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
  envAverage: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    textAlign: "center",
  },
  // NEW: Environmental details styles
  environmentalDetailsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  environmentalGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  environmentalCard: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  environmentalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  environmentalCardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
  },
  environmentalCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  environmentalCardSubtext: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  environmentalCardChart: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  environmentalBar: {
    height: "100%",
    borderRadius: 2,
  },
  environmentalTrends: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginTop: 8,
  },
  trendItem: {
    alignItems: "center",
  },
  trendLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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