"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useState } from "react"

const MONITORING_AREAS_KEY = "@monitoring_areas"

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

  // Load monitoring preferences from storage
  const loadMonitoringPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(MONITORING_AREAS_KEY)
      if (stored) {
        const preferences = JSON.parse(stored)
        console.log("✅ Loaded monitoring preferences:", preferences)
        return preferences
      }
    } catch (error) {
      console.error("❌ Error loading monitoring preferences:", error)
    }
    return {}
  }

  // Save monitoring preferences to storage
  const saveMonitoringPreferences = async (areas: MonitoringArea[]) => {
    try {
      const preferences: { [key: string]: boolean } = {}
      areas.forEach((area) => {
        preferences[area.location] = area.enabled
      })
      await AsyncStorage.setItem(MONITORING_AREAS_KEY, JSON.stringify(preferences))
      console.log("💾 Saved monitoring preferences:", preferences)
    } catch (error) {
      console.error("❌ Error saving monitoring preferences:", error)
    }
  }

  // Initialize monitoring areas from devices
  const initializeMonitoringAreas = useCallback(async (devices: any[]) => {
    try {
      console.log("🔄 Initializing monitoring areas with", devices.length, "devices")
      setLoading(true)

      // Group devices by location
      const locationGroups: { [key: string]: any[] } = {}
      devices.forEach((device) => {
        const location = device.location || "Unknown Location"
        if (!locationGroups[location]) {
          locationGroups[location] = []
        }
        locationGroups[location].push(device)
      })

      // Load existing preferences
      const preferences = await loadMonitoringPreferences()

      // Create monitoring areas
      const areas: MonitoringArea[] = Object.entries(locationGroups).map(([location, deviceList]) => ({
        location,
        deviceCount: deviceList.length,
        enabled: preferences[location] || false, // Use saved preference or default to false
        devices: deviceList.map((d) => d.deviceId),
      }))

      // Sort by location name
      areas.sort((a, b) => a.location.localeCompare(b.location))

      setMonitoringAreas(areas)
      setInitialized(true)
      console.log("✅ Initialized monitoring areas:", areas)

      // Log which areas are currently enabled
      const enabledAreas = areas.filter((area) => area.enabled)
      console.log(
        "📍 Currently monitored areas:",
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
    async (location: string) => {
      console.log(`🔄 Toggling monitoring for: ${location}`)

      const updatedAreas = monitoringAreas.map((area) =>
        area.location === location ? { ...area, enabled: !area.enabled } : area,
      )

      setMonitoringAreas(updatedAreas)
      await saveMonitoringPreferences(updatedAreas)

      const toggledArea = updatedAreas.find((a) => a.location === location)
      console.log(`✅ ${location} monitoring: ${toggledArea?.enabled ? "ENABLED" : "DISABLED"}`)

      // Log all currently enabled areas
      const enabledAreas = updatedAreas.filter((area) => area.enabled)
      console.log(
        "📍 All monitored areas:",
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

  return {
    monitoringAreas,
    loading,
    initialized,
    initializeMonitoringAreas,
    toggleAreaMonitoring,
    getMonitoredLocations,
    getMonitoredDeviceIds,
    isDeviceMonitored,
    getMonitoringSummary,
  }
}
