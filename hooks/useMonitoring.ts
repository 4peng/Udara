"use client"

import * as SecureStore from "expo-secure-store"
import { useCallback, useState } from "react"
import { Alert } from "react-native"
import { useAuth } from "./useAuth"
import { API_CONFIG, apiRequest, buildApiUrl } from "../config/api"

const MONITORING_AREAS_KEY = "monitoring_areas"

export interface MonitoringArea {
  location: string
  deviceCount: number
  enabled: boolean
  devices: string[]
}

export const useMonitoring = () => {
  const [monitoringAreas, setMonitoringAreas] = useState<MonitoringArea[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const { user } = useAuth()

  // 🔹 Load preferences from SecureStore
  const loadMonitoringPreferences = async () => {
    try {
      const stored = await SecureStore.getItemAsync(MONITORING_AREAS_KEY)
      if (stored) {
        const preferences = JSON.parse(stored)
        return preferences
      }
    } catch (error) {
      console.error("❌ Error loading monitoring preferences from SecureStore:", error)
    }
    return {}
  }

  // 🔹 Save preferences to SecureStore
  const saveMonitoringPreferences = async (areas: MonitoringArea[]) => {
    try {
      const preferences: { [key: string]: boolean } = {}
      areas.forEach((area) => {
        preferences[area.location] = area.enabled
      })
      await SecureStore.setItemAsync(MONITORING_AREAS_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error("❌ Error saving monitoring preferences to SecureStore:", error)
    }
  }

  // 🔹 Update Backend Subscriptions
  const updateBackendSubscriptions = async (deviceIds: string[], subscribe: boolean) => {
    if (!user) {
      return
    }

    try {
      const endpoint = subscribe 
        ? API_CONFIG.ENDPOINTS.NOTIFICATIONS.SUBSCRIBE 
        : API_CONFIG.ENDPOINTS.NOTIFICATIONS.UNSUBSCRIBE

      const promises = deviceIds.map(deviceId => 
        apiRequest(buildApiUrl(endpoint), {
          method: "POST",
          body: JSON.stringify({
            userId: user.uid,
            deviceId: deviceId
          })
        }).catch(err => {
          console.error(`❌ Failed to ${subscribe ? 'subscribe' : 'unsubscribe'} ${deviceId}:`, err);
          Alert.alert("Subscription Error", `Failed to update settings for device ${deviceId}. Please try again.`);
        })
      )

      await Promise.all(promises)
    } catch (error) {
      console.error("❌ Error updating backend subscriptions:", error)
      Alert.alert("Error", "Failed to update notification subscriptions.");
    }
  }

  // 🔹 Initialize monitoring areas from devices
  const initializeMonitoringAreas = useCallback(async (devices: any[]) => {
    try {
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

      // Load existing preferences from SecureStore
      const preferences = await loadMonitoringPreferences()

      // Create areas
      const areas: MonitoringArea[] = Object.entries(locationGroups).map(([location, deviceList]) => ({
        location,
        deviceCount: deviceList.length,
        enabled: preferences[location] || false,
        devices: deviceList.map((d) => d.deviceId),
      }))

      // Sort by name
      areas.sort((a, b) => a.location.localeCompare(b.location))

      setMonitoringAreas(areas)
      setInitialized(true)
    } catch (error) {
      console.error("❌ Error initializing monitoring areas:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔹 Toggle monitoring
  const toggleAreaMonitoring = useCallback(
    async (location: string) => {

      const updatedAreas = monitoringAreas.map((area) =>
        area.location === location ? { ...area, enabled: !area.enabled } : area,
      )

      setMonitoringAreas(updatedAreas)
      await saveMonitoringPreferences(updatedAreas)

      const toggledArea = updatedAreas.find((a) => a.location === location)
      const isEnabled = toggledArea?.enabled || false
      
      // Sync with backend
      if (toggledArea) {
        updateBackendSubscriptions(toggledArea.devices, isEnabled)
      }
    },
    [monitoringAreas, user],
  )

  // 🔹 Get monitored locations
  const getMonitoredLocations = useCallback(() => {
    const monitored = monitoringAreas.filter((area) => area.enabled)
    return monitored
  }, [monitoringAreas])

  // 🔹 Get monitored device IDs
  const getMonitoredDeviceIds = useCallback(() => {
    const monitoredAreas = getMonitoredLocations()
    const deviceIds: string[] = []
    monitoredAreas.forEach((area) => deviceIds.push(...area.devices))
    return deviceIds
  }, [getMonitoredLocations])


  // 🔹 Check if device is monitored
  const isDeviceMonitored = useCallback(
    (deviceId: string) => {
      if (!initialized) return false
      const monitoredDeviceIds = getMonitoredDeviceIds()
      return monitoredDeviceIds.includes(deviceId)
    },
    [initialized, getMonitoredDeviceIds],
  )

  // 🔹 Summary
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

  // 🔹 Clear all preferences
  const clearMonitoringPreferences = useCallback(async () => {
    try {
      // 1. Unsubscribe from all devices on backend first
      const allMonitoredDevices = getMonitoredDeviceIds()
      if (allMonitoredDevices.length > 0) {
        await updateBackendSubscriptions(allMonitoredDevices, false)
      }

      // 2. Clear local storage
      await SecureStore.deleteItemAsync(MONITORING_AREAS_KEY)

      // 3. Update state
      const clearedAreas = monitoringAreas.map((area) => ({ ...area, enabled: false }))
      setMonitoringAreas(clearedAreas)
    } catch (error) {
      console.error("❌ Error clearing monitoring preferences:", error)
    }
  }, [monitoringAreas, getMonitoredDeviceIds, user])

  return {
    monitoringAreas,
    loading,
    initialized,
    setLoading,
    setInitialized,
    initializeMonitoringAreas,
    toggleAreaMonitoring,
    getMonitoredLocations,
    getMonitoredDeviceIds,
    isDeviceMonitored,
    getMonitoringSummary,
    clearMonitoringPreferences,
  }
}