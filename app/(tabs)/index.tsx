// app/(tabs)/index.tsx
"use client"

import { Ionicons } from "@expo/vector-icons"
import { router, useFocusEffect } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  __DEV__,
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
import LeafletMap from "../../components/LeafletMap"
import { useDevicesWithMonitoring } from "../../hooks/useDevicesWithMonitoring"
import { getAQIColor, getAQIStatus, SIMPLE_AQI_CATEGORIES } from "../../utils/aqiUtils"
import { getComfortLevel, getComfortLevelColor } from "../../utils/environmentalUtils"

const { width } = Dimensions.get("window")

// Enable debug mode for development
const DEBUG_MODE = __DEV__

// Auto-refresh interval: 5 minutes (300,000 milliseconds)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState("")
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState<number>(AUTO_REFRESH_INTERVAL)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)

  // Use refs to manage intervals and avoid memory leaks
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null)
  const countdownInterval = useRef<NodeJS.Timeout | null>(null)
  const isComponentMounted = useRef(true)

  const {
    devices,
    loading,
    error,
    refreshDevices,
    monitoredDevices,
    getMonitoredDeviceIds,
    monitoringSummary,
    initialized,
    monitoringVersion,
    forceCompleteReset
  } = useDevicesWithMonitoring()

  // SIMPLE REFRESH when returning from Settings
  useFocusEffect(
    useCallback(() => {
      
      // Small delay to ensure any navigation state changes are complete
      const timeoutId = setTimeout(() => {
        if (isComponentMounted.current) {
          forceCompleteReset()
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }, [forceCompleteReset])
  )

  // Initialize current date
  useEffect(() => {
    const updateDate = () => {
      const date = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
      setCurrentDate(date.toLocaleDateString("en-US", options))
    }

    updateDate()
    // Update date every minute
    const dateInterval = setInterval(updateDate, 60000)

    return () => clearInterval(dateInterval)
  }, [])

  // Auto-refresh functionality - FIXED to only run every 5 minutes
  useEffect(() => {
    const startAutoRefresh = () => {
      
      // Clear existing intervals
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current)
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current)
      }

      // Reset countdown
      setTimeUntilNextRefresh(AUTO_REFRESH_INTERVAL)

      // Set up auto-refresh interval (every 5 minutes)
      autoRefreshInterval.current = setInterval(() => {
        if (!isComponentMounted.current) return
        
        setIsAutoRefreshing(true)
        forceCompleteReset()
        setLastRefreshTime(new Date())
        setTimeUntilNextRefresh(AUTO_REFRESH_INTERVAL)
        
        // Reset auto-refresh flag after 2 seconds
        setTimeout(() => {
          if (isComponentMounted.current) {
            setIsAutoRefreshing(false)
          }
        }, 2000)
      }, AUTO_REFRESH_INTERVAL)

      // Set up countdown timer (updates every 30 seconds to avoid excessive updates)
      countdownInterval.current = setInterval(() => {
        if (!isComponentMounted.current) return
        
        setTimeUntilNextRefresh((prev) => {
          const newTime = Math.max(0, prev - 30000) // Decrease by 30 seconds
          return newTime <= 0 ? AUTO_REFRESH_INTERVAL : newTime
        })
      }, 30000) // Update every 30 seconds instead of every second
    }

    // Start auto-refresh when component mounts
    if (isComponentMounted.current) {
      startAutoRefresh()
    }

    // Cleanup intervals on unmount
    return () => {
      isComponentMounted.current = false
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current)
        autoRefreshInterval.current = null
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current)
        countdownInterval.current = null
      }
    }
  }, [refreshDevices])

  // Debug logging - Removed

  // Add safety check for devices - FORCE FRESH CALCULATION
  const safeDevices = Array.isArray(devices) ? devices : []
  const safeMonitoredDevices = useMemo(() => {
    const monitored = Array.isArray(monitoredDevices) ? monitoredDevices : []
    return monitored
  }, [monitoredDevices, monitoringVersion])

  const getOverallAQI = () => {
    if (safeMonitoredDevices.length === 0) {
      // If no devices are monitored, show average of all devices
      if (safeDevices.length === 0) return 42 // Default fallback
      const totalAQI = safeDevices.reduce((sum, device) => sum + (device.aqi || 0), 0)
      return Math.round(totalAQI / safeDevices.length)
    }

    const totalAQI = safeMonitoredDevices.reduce((sum, device) => sum + (device.aqi || 0), 0)
    return Math.round(totalAQI / safeMonitoredDevices.length)
  }

  // UPDATED: Calculate average environmental conditions from actual device data
  const getAverageEnvironmental = () => {
    const devices = safeMonitoredDevices.length > 0 ? safeMonitoredDevices : safeDevices
    if (devices.length === 0) return { temp: '24°C', humidity: '65%', tempValue: 24, humidityValue: 65 }
    
    // Extract numeric values from temperature and humidity strings
    const temps = devices.map(d => {
      const tempMatch = d.temperature?.match(/(\d+\.?\d*)/)
      return tempMatch ? parseFloat(tempMatch[1]) : 25
    })
    
    const humidities = devices.map(d => {
      const humidityMatch = d.humidity?.match(/(\d+)/)
      return humidityMatch ? parseInt(humidityMatch[1]) : 65
    })
    
    const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length
    const avgHumidity = humidities.reduce((sum, humidity) => sum + humidity, 0) / humidities.length
    
    return {
      temp: `${Math.round(avgTemp)}°C`,
      humidity: `${Math.round(avgHumidity)}%`,
      tempValue: avgTemp,
      humidityValue: avgHumidity
    }
  }

  const handleMapPress = () => {
    router.push("/(tabs)/map")
  }

  const handleSensorPress = (sensor: any) => {
    if (sensor && sensor.id) {
      router.push(`/sensor/${sensor.id}`)
    } else {
      console.warn("⚠️ HomeScreen: Invalid sensor pressed:", sensor)
    }
  }

  // FIXED: Manual refresh - keeps functionality but doesn't get stuck
  const handleManualRefresh = async () => {
    
    try {
      // Use refreshDevices and update timing
      forceCompleteReset()
      setLastRefreshTime(new Date())
      setTimeUntilNextRefresh(AUTO_REFRESH_INTERVAL)
      
      // Reset the auto-refresh timer to start fresh 5-minute cycle
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current)
        autoRefreshInterval.current = setInterval(() => {
          if (!isComponentMounted.current) return
          
          setIsAutoRefreshing(true)
          forceCompleteReset()
          setLastRefreshTime(new Date())
          setTimeUntilNextRefresh(AUTO_REFRESH_INTERVAL)
          setTimeout(() => {
            if (isComponentMounted.current) {
              setIsAutoRefreshing(false)
            }
          }, 2000)
        }, AUTO_REFRESH_INTERVAL)
      }

      // Reset countdown timer
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current)
        countdownInterval.current = setInterval(() => {
          if (!isComponentMounted.current) return
          
          setTimeUntilNextRefresh((prev) => {
            const newTime = Math.max(0, prev - 30000)
            return newTime <= 0 ? AUTO_REFRESH_INTERVAL : newTime
          })
        }, 30000)
      }
      
    } catch (error) {
      console.error("❌ HomeScreen: Manual refresh failed:", error)
    }
  }

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo)
  }

  const formatTimeUntilRefresh = (timeMs: number): string => {
    const minutes = Math.floor(timeMs / 60000)
    const seconds = Math.floor((timeMs % 60000) / 1000)
    if (minutes > 0) {
      return `${minutes}m`
    }
    return `${seconds}s`
  }

  const renderAQICircle = () => {
    const currentAQI = getOverallAQI()
    const color = getAQIColor(currentAQI)
    const status = getAQIStatus(currentAQI)

    return (
      <View style={styles.aqiContainer}>
        <View style={[styles.aqiCircle, { borderColor: color }]}>
          <Text style={[styles.aqiNumber, { color }]}>{currentAQI}</Text>
          <Text style={[styles.aqiStatus, { color }]}>{status}</Text>
        </View>
        <Text style={styles.aqiDescription}>
          {safeMonitoredDevices.length > 0
            ? `Based on ${safeMonitoredDevices.length} monitored sensor${safeMonitoredDevices.length !== 1 ? "s" : ""}`
            : `Based on all ${safeDevices.length} sensors`}
        </Text>
      </View>
    )
  }

  // NEW: Environmental summary card for home screen
  const renderEnvironmentalSummary = () => {
    const devices = safeMonitoredDevices.length > 0 ? safeMonitoredDevices : safeDevices
    
    if (devices.length === 0) {
      return null
    }

    const avgEnvironmental = getAverageEnvironmental()
    const comfortLevel = getComfortLevel(avgEnvironmental.tempValue, avgEnvironmental.humidityValue)
    const comfortColor = getComfortLevelColor(avgEnvironmental.tempValue, avgEnvironmental.humidityValue)

    return (
      <View style={styles.environmentalSummary}>
        <Text style={styles.environmentalSummaryTitle}>Campus Climate</Text>
        <View style={styles.environmentalSummaryContent}>
          <View style={styles.environmentalMetric}>
            <Text style={styles.environmentalMetricValue}>{avgEnvironmental.temp}</Text>
            <Text style={styles.environmentalMetricLabel}>Average Temperature</Text>
          </View>
          <View style={styles.environmentalMetric}>
            <Text style={styles.environmentalMetricValue}>{avgEnvironmental.humidity}</Text>
            <Text style={styles.environmentalMetricLabel}>Average Humidity</Text>
          </View>
          <View style={styles.environmentalMetric}>
            <Text style={[styles.environmentalMetricValue, { color: comfortColor }]}>
              {comfortLevel}
            </Text>
            <Text style={styles.environmentalMetricLabel}>Comfort Level</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderMapSection = () => {
    
    // Use monitored devices for home screen map, or all devices if none monitored
    const mapSensors = safeMonitoredDevices.length > 0 ? safeMonitoredDevices : safeDevices

    return (
      <View style={styles.mapSection}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>
            {safeMonitoredDevices.length > 0 ? "Monitored Areas" : "All Campus Sensors"}
          </Text>
          <Text style={styles.mapSubtitle}>
            {loading ? "Updating..." : `${mapSensors.length} sensor${mapSensors.length !== 1 ? "s" : ""} shown`}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.mapContainer} onPress={handleMapPress}>
          <LeafletMap
            sensors={mapSensors}
            onSensorPress={handleSensorPress}
            style={styles.mapView}
          />
          
          <View style={styles.mapOverlay}>
            <View style={styles.mapOverlayContent}>
              <Text style={styles.mapOverlayText}>Tap to view full map</Text>
              <Ionicons name="expand-outline" size={20} color="#FFFFFF" />
            </View>
          </View>

          {/* Status Overlay */}
          {loading && (
             <View style={styles.statusPill}>
               <ActivityIndicator size="small" color="#4361EE" />
             </View>
          )}
        </TouchableOpacity>

        <View style={styles.mapLegend}>
          {SIMPLE_AQI_CATEGORIES.map((category, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: category.color }]} />
              <Text style={styles.legendText}>
                {category.name} ({category.range})
              </Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  // Memoize the location groups to prevent unnecessary recalculations
  const locationGroups = useMemo(() => {
    const groups: { [key: string]: any[] } = {}
    safeMonitoredDevices.forEach((device) => {
      const location = device.location
      if (!groups[location]) {
        groups[location] = []
      }
      groups[location].push(device)
    })
    return groups
  }, [safeMonitoredDevices])

  const renderMonitoredAreas = () => {
    if (loading) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored Areas</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4361EE" />
            <Text style={styles.loadingText}>Loading monitored areas...</Text>
          </View>
        </View>
      )
    }

    if (safeMonitoredDevices.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored Areas</Text>
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No areas being monitored</Text>
            <Text style={styles.emptyStateSubtext}>Go to Settings to select areas to monitor</Text>
            <TouchableOpacity style={styles.settingsButton} onPress={() => router.push("/(tabs)/settings")}>
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monitored Areas ({safeMonitoredDevices.length} sensors)</Text>
        {Object.entries(locationGroups).map(([location, devices]) => {
          const avgAQI = Math.round(devices.reduce((sum, device) => sum + device.aqi, 0) / devices.length)
          const color = getAQIColor(avgAQI)

          return (
            <TouchableOpacity
              key={location}
              style={styles.areaItem}
              onPress={() => {
                // Navigate to the first device in this location
                if (devices.length > 0) {
                  router.push(`/sensor/${devices[0].id}`)
                }
              }}
            >
              <View style={styles.areaInfo}>
                <View style={[styles.areaDot, { backgroundColor: color }]} />
                <View style={styles.areaDetails}>
                  <Text style={styles.areaName}>{location}</Text>
                  <Text style={styles.areaDeviceCount}>
                    {devices.length} sensor{devices.length !== 1 ? "s" : ""} • Monitoring active
                  </Text>
                </View>
              </View>
              <View style={styles.areaAQI}>
                <Text style={[styles.aqiValue, { color }]}>{avgAQI}</Text>
                <Text style={styles.aqiLabel}>AQI</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Campus Air Quality</Text>
          <Text style={styles.headerDate}>{currentDate}</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Keep refresh button always clickable, just show visual feedback */}
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleManualRefresh}
          >
            <Ionicons 
              name="refresh-outline"
              size={24} 
              color="#666"
            />
          </TouchableOpacity>
          {DEBUG_MODE && (
            <TouchableOpacity style={styles.headerButton} onPress={toggleDebugInfo}>
              <Ionicons name="bug-outline" size={24} color={showDebugInfo ? "#4361EE" : "#666"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Last Updated Status */}
      <View style={styles.refreshStatus}>
        <Text style={styles.lastRefreshText}>
          Last updated: {lastRefreshTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      {/* Debug Info */}
      {DEBUG_MODE && showDebugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🐛 Debug Information</Text>
          <Text style={styles.debugText}>Total Devices: {safeDevices.length}</Text>
          <Text style={styles.debugText}>Monitored Devices: {safeMonitoredDevices.length}</Text>
          <Text style={styles.debugText}>Loading: {loading ? "Yes" : "No"}</Text>
          <Text style={styles.debugText}>Auto-refreshing: {isAutoRefreshing ? "Yes" : "No"}</Text>
          <Text style={styles.debugText}>Initialized: {initialized ? "Yes" : "No"}</Text>
          <Text style={styles.debugText}>Monitoring Version: {monitoringVersion}</Text>
          <Text style={styles.debugText}>Error: {error || "None"}</Text>
          <Text style={styles.debugText}>Monitored IDs: {getMonitoredDeviceIds().join(", ")}</Text>
          <Text style={styles.debugText}>Location Groups: {Object.keys(locationGroups).join(", ")}</Text>
          <Text style={styles.debugText}>Next Refresh: {formatTimeUntilRefresh(timeUntilNextRefresh)}</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* AQI Display */}
        {renderAQICircle()}

        {/* NEW: Environmental Summary */}
        {renderEnvironmentalSummary()}

        {/* Map Section */}
        {renderMapSection()}

        {/* Monitored Areas */}
        {renderMonitoredAreas()}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerButton: {
    marginLeft: 16,
  },
  refreshStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  refreshStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshStatusText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  refreshStatusTextActive: {
    color: "#4361EE",
    fontWeight: "500",
  },
  lastRefreshText: {
    fontSize: 11,
    color: "#999",
  },
  debugContainer: {
    backgroundColor: "#FFF3CD",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 2,
  },
  scrollView: {
    flex: 1,
  },
  aqiContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  aqiCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  aqiNumber: {
    fontSize: 48,
    fontWeight: "bold",
  },
  aqiStatus: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  aqiDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
  // NEW: Environmental summary styles
  environmentalSummary: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
  },
  environmentalSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  environmentalSummaryContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  environmentalMetric: {
    alignItems: "center",
    flex: 1,
  },
  environmentalMetricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  environmentalMetricLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  mapSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  mapHeader: {
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  mapSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    backgroundColor: '#eee', // Placeholder color
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mapView: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlayContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapOverlayText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  statusPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    lineHeight: 12,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  areaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  areaInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  areaDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  areaDetails: {
    flex: 1,
  },
  areaName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  areaDeviceCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  areaAQI: {
    alignItems: "center",
    marginRight: 12,
  },
  aqiValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  aqiLabel: {
    fontSize: 12,
    color: "#666",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    marginTop: 12,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4361EE",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
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