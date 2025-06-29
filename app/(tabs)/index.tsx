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
import MapboxMap from "../../components/MapboxMap"
import { useDevicesWithMonitoring } from "../../hooks/useDevicesWithMonitoring"
import { getAQIColor, getAQIStatus, SIMPLE_AQI_CATEGORIES } from "../../utils/aqiUtils"

const { width } = Dimensions.get("window")

// Enable debug mode for development
const DEBUG_MODE = __DEV__

// Auto-refresh interval: 5 minutes (300,000 milliseconds)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000

// Helper functions for environmental analysis
const getComfortLevel = (temp, humidity) => {
  if (!temp || !humidity) return 'Unknown'
  
  if (temp >= 20 && temp <= 26 && humidity >= 40 && humidity <= 70) {
    return 'Comfortable'
  } else if (temp > 30 || humidity > 80) {
    return 'Uncomfortable'
  } else if (temp < 18 || humidity < 30) {
    return 'Too Dry/Cold'
  } else {
    return 'Moderate'
  }
}

const getComfortLevelColor = (temp, humidity) => {
  const level = getComfortLevel(temp, humidity)
  switch (level) {
    case 'Comfortable': return '#4CAF50'
    case 'Moderate': return '#FFC107'
    case 'Uncomfortable': return '#FF5722'
    case 'Too Dry/Cold': return '#2196F3'
    default: return '#666'
  }
}

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
      console.log("🔄 Home screen focused - triggering simple refresh...")
      
      // Small delay to ensure any navigation state changes are complete
      const timeoutId = setTimeout(() => {
        if (isComponentMounted.current) {
          console.log("🔄 Home screen focus - refreshing devices")
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
      console.log("🔄 Starting auto-refresh - will refresh every 5 minutes")
      
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
        
        console.log("🔄 Auto-refreshing data (5-minute interval)...")
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

      console.log("✅ Auto-refresh intervals started")
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
      console.log("🧹 Auto-refresh intervals cleared")
    }
  }, [refreshDevices])

  // Debug logging
  useEffect(() => {
    if (DEBUG_MODE) {
      console.log("🏠 HomeScreen: Component re-rendered")
      console.log("📊 HomeScreen: State:", {
        devicesCount: devices.length,
        monitoredDevicesCount: monitoredDevices.length,
        loading,
        error,
        initialized,
        monitoringVersion,
        monitoredDeviceIds: getMonitoredDeviceIds(),
        lastRefresh: lastRefreshTime.toLocaleTimeString(),
        nextRefreshIn: Math.ceil(timeUntilNextRefresh / 60000) + "min",
      })
    }
  }, [devices, monitoredDevices, loading, error, initialized, monitoringVersion, getMonitoredDeviceIds, lastRefreshTime, timeUntilNextRefresh])

  // Add safety check for devices - FORCE FRESH CALCULATION
  const safeDevices = Array.isArray(devices) ? devices : []
  const safeMonitoredDevices = useMemo(() => {
    const monitored = Array.isArray(monitoredDevices) ? monitoredDevices : []
    console.log("🏠 safeMonitoredDevices recalculated:", {
      monitoredDevicesLength: monitored.length,
      monitoredDevices: monitored.map(d => ({ id: d.id, name: d.name, location: d.location })),
      monitoringVersion,
    })
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
    console.log("🗺️ HomeScreen: Map pressed, navigating to map tab")
    router.push("/(tabs)/map")
  }

  const handleSensorPress = (sensor: any) => {
    if (sensor && sensor.id) {
      console.log(`🎯 HomeScreen: Sensor pressed: ${sensor.name} (${sensor.id})`)
      router.push(`/sensor/${sensor.id}`)
    } else {
      console.warn("⚠️ HomeScreen: Invalid sensor pressed:", sensor)
    }
  }

  // FIXED: Manual refresh - keeps functionality but doesn't get stuck
  const handleManualRefresh = async () => {
    console.log("🔄 HomeScreen: Manual refresh requested")
    
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
          
          console.log("🔄 Auto-refreshing data (5-minute interval)...")
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
      
      console.log("✅ HomeScreen: Manual refresh completed successfully")
    } catch (error) {
      console.error("❌ HomeScreen: Manual refresh failed:", error)
    }
  }

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo)
    console.log(`🐛 HomeScreen: Debug info ${!showDebugInfo ? "enabled" : "disabled"}`)
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

  // UPDATED: Enhanced environmental data display with real data
  const renderEnvironmentalData = () => {
    const avgEnvironmental = getAverageEnvironmental()

    return (
      <View style={styles.environmentalData}>
        <View style={styles.dataItem}>
          <Ionicons name="thermometer-outline" size={16} color="#666" />
          <Text style={styles.dataLabel}>Temperature</Text>
          <Text style={styles.dataValue}>{avgEnvironmental.temp}</Text>
        </View>
        <View style={styles.dataItem}>
          <Ionicons name="water-outline" size={16} color="#666" />
          <Text style={styles.dataLabel}>Humidity</Text>
          <Text style={styles.dataValue}>{avgEnvironmental.humidity}</Text>
        </View>
        <View style={styles.dataItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.dataLabel}>Updated</Text>
          <Text style={styles.dataValue}>
            {lastRefreshTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
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
    if (loading) {
      return (
        <View style={[styles.mapSection, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#4361EE" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={[styles.mapSection, styles.errorContainer]}>
          <Ionicons name="warning-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Failed to load map data</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleManualRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )
    }

    // Use monitored devices for home screen map, or all devices if none monitored
    const mapSensors = safeMonitoredDevices.length > 0 ? safeMonitoredDevices : safeDevices

    if (mapSensors.length === 0) {
      return (
        <View style={[styles.mapSection, styles.errorContainer]}>
          <Ionicons name="location-outline" size={48} color="#ccc" />
          <Text style={styles.errorText}>No sensors to display</Text>
          <Text style={styles.errorSubtext}>
            {safeDevices.length === 0 ? "No sensors available" : "No areas being monitored"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.push("/(tabs)/settings")}>
            <Text style={styles.retryButtonText}>{safeDevices.length === 0 ? "Refresh" : "Select Areas"}</Text>
          </TouchableOpacity>
        </View>
      )
    }

    console.log(
      `🗺️ HomeScreen: Rendering map with ${mapSensors.length} sensors (${safeMonitoredDevices.length > 0 ? "monitored only" : "all sensors"})`,
    )

    return (
      <View style={styles.mapSection}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>
            {safeMonitoredDevices.length > 0 ? "Monitored Areas" : "All Campus Sensors"}
          </Text>
          <Text style={styles.mapSubtitle}>
            {mapSensors.length} sensor{mapSensors.length !== 1 ? "s" : ""} shown
          </Text>
        </View>
        <TouchableOpacity style={styles.mapContainer} onPress={handleMapPress}>
          <MapboxMap
            sensors={mapSensors}
            onSensorPress={handleSensorPress}
            style={styles.mapView}
            interactive={false}
          />
          <View style={styles.mapOverlay}>
            <View style={styles.mapOverlayContent}>
              <Text style={styles.mapOverlayText}>Tap to view full map</Text>
              <Ionicons name="expand-outline" size={20} color="#FFFFFF" />
            </View>
          </View>
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

    console.log("🏠 HomeScreen: Rendering monitored areas:", Object.keys(locationGroups))

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
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push("/(tabs)/settings")}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto-refresh status - Remove the stuck "Refreshing..." state */}
      <View style={styles.refreshStatus}>
        <View style={styles.refreshStatusLeft}>
          <Ionicons 
            name={isAutoRefreshing ? "sync" : "time-outline"} 
            size={14} 
            color={isAutoRefreshing ? "#4361EE" : "#666"} 
          />
          <Text style={[styles.refreshStatusText, isAutoRefreshing && styles.refreshStatusTextActive]}>
            {isAutoRefreshing 
              ? "Refreshing..." 
              : `Next auto-refresh in ${formatTimeUntilRefresh(timeUntilNextRefresh)}`
            }
          </Text>
        </View>
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

        {/* Environmental Data */}
        {renderEnvironmentalData()}

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
  environmentalData: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#F8F9FA",
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  dataItem: {
    alignItems: "center",
  },
  dataLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 2,
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