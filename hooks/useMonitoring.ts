// hooks/useMonitoring.ts
"use client"

import { useCallback, useState } from "react"
import { MMKV } from "react-native-mmkv"

// Initialize MMKV storage
const storage = new MMKV()

const MONITORING_AREAS_KEY = "monitoring_areas"

export interface MonitoringArea {
  location: string
  deviceCount: number
  enabled: boolean
  devices: string[] // Array of device IDs in this location
}

export const useMonitoring = () => {
  const [monitoringAreas, setMonitoringAreas] = useState<MonitoringArea[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Load monitoring preferences from MMKV
  const loadMonitoringPreferences = () => {
    try {
      const stored = storage.getString(MONITORING_AREAS_KEY)
      if (stored) {
        const preferences = JSON.parse(stored)
        console.log("✅ Loaded monitoring preferences from MMKV:", preferences)
        return preferences
      }
    } catch (error) {
      console.error("❌ Error loading monitoring preferences from MMKV:", error)
    }
    return {}
  }

  // Save monitoring preferences to MMKV
  const saveMonitoringPreferences = (areas: MonitoringArea[]) => {
    try {
      const preferences: { [key: string]: boolean } = {}
      areas.forEach((area) => {
        preferences[area.location] = area.enabled
      })
      storage.set(MONITORING_AREAS_KEY, JSON.stringify(preferences))
      console.log("💾 Saved monitoring preferences to MMKV:", preferences)
    } catch (error) {
      console.error("❌ Error saving monitoring preferences to MMKV:", error)
    }
  }

  // Initialize monitoring areas from devices
  const initializeMonitoringAreas = useCallback(async (devices: any[]) => {
    try {
      console.log("🔄 Initializing monitoring areas with", devices.length, "devices")
      setLoading(true)

      // Group devices by location to get available areas
      const locationGroups: { [key: string]: any[] } = {}
      devices.forEach((device) => {
        const location = device.location || "Unknown Location"
        if (!locationGroups[location]) {
          locationGroups[location] = []
        }
        locationGroups[location].push(device)
      })

      // Load existing preferences from MMKV (FRESH LOAD EVERY TIME)
      const preferences = loadMonitoringPreferences()
      console.log("📋 Fresh MMKV preferences loaded:", preferences)

      // Create monitoring areas from available locations
      const areas: MonitoringArea[] = Object.entries(locationGroups).map(([location, deviceList]) => ({
        location,
        deviceCount: deviceList.length,
        enabled: preferences[location] || false, // Use saved preference or default to false
        devices: deviceList.map((d) => d.deviceId),
      }))

      // Sort by location name for consistent ordering
      areas.sort((a, b) => a.location.localeCompare(b.location))

      setMonitoringAreas(areas)
      setInitialized(true)
      console.log("✅ Initialized monitoring areas with fresh MMKV data:", areas)

      // Log which areas are currently enabled
      const enabledAreas = areas.filter((area) => area.enabled)
      console.log(
        "📍 Currently monitored areas from MMKV:",
        enabledAreas.map((a) => a.location),
      )
    } catch (error) {
      console.error("❌ Error initializing monitoring areas:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Toggle monitoring for a specific area
  const toggleAreaMonitoring = useCallback(
    (location: string) => {
      console.log(`🔄 Toggling monitoring for: ${location}`)

      const updatedAreas = monitoringAreas.map((area) =>
        area.location === location ? { ...area, enabled: !area.enabled } : area,
      )

      setMonitoringAreas(updatedAreas)
      saveMonitoringPreferences(updatedAreas)

      const toggledArea = updatedAreas.find((a) => a.location === location)
      console.log(`✅ ${location} monitoring: ${toggledArea?.enabled ? "ENABLED" : "DISABLED"}`)

      // Log all currently enabled areas
      const enabledAreas = updatedAreas.filter((area) => area.enabled)
      console.log(
        "📍 All monitored areas after toggle:",
        enabledAreas.map((a) => a.location),
      )
    },
    [monitoringAreas],
  )

  // Get monitored locations
  const getMonitoredLocations = useCallback(() => {
    const monitored = monitoringAreas.filter((area) => area.enabled)
    console.log(
      "🔍 Getting monitored locations:",
      monitored.map((a) => a.location),
    )
    return monitored
  }, [monitoringAreas])

  // Get monitored device IDs
  const getMonitoredDeviceIds = useCallback(() => {
    const monitoredAreas = getMonitoredLocations()
    const deviceIds: string[] = []
    monitoredAreas.forEach((area) => {
      deviceIds.push(...area.devices)
    })
    console.log("🔍 Getting monitored device IDs:", deviceIds)
    return deviceIds
  }, [getMonitoredLocations])

  // Check if a device is being monitored
  const isDeviceMonitored = useCallback(
    (deviceId: string) => {
      if (!initialized) return false // Return false if not initialized yet
      const monitoredDeviceIds = getMonitoredDeviceIds()
      const isMonitored = monitoredDeviceIds.includes(deviceId)
      return isMonitored
    },
    [initialized, getMonitoredDeviceIds],
  )

  // Get monitoring summary
  const getMonitoringSummary = useCallback(() => {
    const totalAreas = monitoringAreas.length
    const monitoredAreas = getMonitoredLocations().length
    const totalDevices = monitoringAreas.reduce((sum, area) => sum + area.deviceCount, 0)
    const monitoredDevices = getMonitoredDeviceIds().length

    return {
      totalAreas,
      monitoredAreas,
      totalDevices,
      monitoredDevices,
    }
  }, [monitoringAreas, getMonitoredLocations, getMonitoredDeviceIds])

  // Clear all monitoring preferences (useful for debugging)
  const clearMonitoringPreferences = useCallback(() => {
    try {
      storage.delete(MONITORING_AREAS_KEY)
      console.log("🧹 Cleared all monitoring preferences")
      
      // Reset areas to disabled
      const clearedAreas = monitoringAreas.map(area => ({ ...area, enabled: false }))
      setMonitoringAreas(clearedAreas)
    } catch (error) {
      console.error("❌ Error clearing monitoring preferences:", error)
    }
  }, [monitoringAreas])

  return {
    monitoringAreas,
    loading,
    initialized,
    setLoading, // EXPOSE setLoading for force refresh
    setInitialized, // EXPOSE setInitialized for force refresh
    initializeMonitoringAreas,
    toggleAreaMonitoring,
    getMonitoredLocations,
    getMonitoredDeviceIds,
    isDeviceMonitored,
    getMonitoringSummary,
    clearMonitoringPreferences, // For debugging
  }
}