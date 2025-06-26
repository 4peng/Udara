// hooks/useDevicesWithMonitoring.ts
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDevices } from "./useDevices"
import { useMonitoring } from "./useMonitoring"

export const useDevicesWithMonitoring = () => {
  const devicesHook = useDevices()
  const monitoringHook = useMonitoring()

  // Add a state to force re-renders when monitoring changes
  const [monitoringVersion, setMonitoringVersion] = useState(0)
  // Add a force update counter for complete refresh
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0)

  const { devices, loading: devicesLoading, updateDeviceMonitoringStatus, refreshDevices } = devicesHook
  const { initialized, initializeMonitoringAreas, getMonitoredDeviceIds, monitoringAreas } = monitoringHook

  // Use refs to track if we've already initialized/updated
  const hasInitialized = useRef(false)
  const lastMonitoredDeviceIds = useRef<string>("")

  // Complete refresh function - resets everything to fresh state
  const forceCompleteReset = useCallback(async () => {
    console.log("🔄 FORCE COMPLETE RESET - Starting fresh state reload...")
    
    try {
      // 1. Reset all tracking refs
      hasInitialized.current = false
      lastMonitoredDeviceIds.current = ""
      
      // 2. Force monitoring hook to reload from MMKV
      monitoringHook.setInitialized(false)
      monitoringHook.setLoading(true)
      
      // 3. Refresh devices from API
      await refreshDevices()
      
      // 4. Force complete re-render
      setForceUpdateCounter(prev => prev + 1)
      setMonitoringVersion(prev => prev + 1)
      
      console.log("✅ FORCE COMPLETE RESET - Fresh state loaded successfully")
    } catch (error) {
      console.error("❌ FORCE COMPLETE RESET - Error during refresh:", error)
    }
  }, [refreshDevices, monitoringHook])

  // Initialize monitoring areas when devices are loaded (ONCE per reset)
  useEffect(() => {
    if (!devicesLoading && devices.length > 0 && !initialized && !hasInitialized.current) {
      console.log("🔄 Initializing monitoring with", devices.length, "devices (force counter:", forceUpdateCounter, ")")
      hasInitialized.current = true
      initializeMonitoringAreas(devices)
    }
  }, [devices, devicesLoading, initialized, initializeMonitoringAreas, forceUpdateCounter])

  // Update device monitoring status when monitoring areas change (ONLY if actually changed)
  useEffect(() => {
    if (initialized) {
      const monitoredDeviceIds = getMonitoredDeviceIds()
      const currentIds = monitoredDeviceIds.sort().join(",")

      // Only update if the monitored device IDs actually changed
      if (currentIds !== lastMonitoredDeviceIds.current) {
        console.log("📊 Device monitoring status changed:", {
          old: lastMonitoredDeviceIds.current,
          new: currentIds,
          ids: monitoredDeviceIds,
          forceCounter: forceUpdateCounter
        })
        lastMonitoredDeviceIds.current = currentIds
        updateDeviceMonitoringStatus(monitoredDeviceIds)

        // Force re-render by incrementing version
        setMonitoringVersion((prev) => prev + 1)
      }
    }
  }, [initialized, monitoringAreas, updateDeviceMonitoringStatus, getMonitoredDeviceIds, forceUpdateCounter])

  // Get monitored devices - ONLY return devices that are actually being monitored
  const monitoredDevices = useMemo(() => {
    if (!initialized) {
      console.log("🔍 Monitoring not initialized, returning empty array")
      return []
    }

    // Always get fresh monitored device IDs
    const currentMonitoredIds = getMonitoredDeviceIds()
    
    if (currentMonitoredIds.length === 0) {
      console.log("🔍 No areas are being monitored, returning empty array")
      return []
    }

    const filtered = devices.filter((device) => currentMonitoredIds.includes(device.deviceId))

    console.log("🔍 FRESH monitored devices calculation:", {
      totalDevices: devices.length,
      currentMonitoredIds,
      filteredCount: filtered.length,
      filtered: filtered.map((d) => ({ id: d.id, name: d.name, location: d.location })),
      version: monitoringVersion,
      forceCounter: forceUpdateCounter,
      areasHash: monitoringAreas.map(a => `${a.location}:${a.enabled}`).join(',')
    })

    return filtered
  }, [devices, initialized, monitoringAreas.map(a => `${a.location}:${a.enabled}`).join(','), monitoringVersion, forceUpdateCounter])

  // Memoize the getMonitoredDevices function to return the same reference
  const getMonitoredDevices = useCallback(() => {
    return monitoredDevices
  }, [monitoredDevices])

  // Memoize monitoring summary to trigger re-renders
  const monitoringSummary = useMemo(() => {
    const totalAreas = monitoringAreas.length
    const monitoredAreas = monitoringAreas.filter((area) => area.enabled).length
    const totalDevices = monitoringAreas.reduce((sum, area) => sum + area.deviceCount, 0)
    const monitoredDevicesCount = monitoredDevices.length

    return {
      totalAreas,
      monitoredAreas,
      totalDevices,
      monitoredDevices: monitoredDevicesCount,
    }
  }, [monitoringAreas, monitoredDevices])

  // Get available areas that can be monitored (from all devices)
  const getAvailableAreas = useCallback(() => {
    const locationGroups: { [key: string]: any[] } = {}
    devices.forEach((device) => {
      const location = device.location || "Unknown Location"
      if (!locationGroups[location]) {
        locationGroups[location] = []
      }
      locationGroups[location].push(device)
    })

    return Object.entries(locationGroups).map(([location, deviceList]) => ({
      location,
      deviceCount: deviceList.length,
      devices: deviceList.map((d) => d.deviceId),
    }))
  }, [devices])

  return {
    // Devices
    ...devicesHook,
    // Monitoring
    ...monitoringHook,
    // Combined - these are now properly memoized
    getMonitoredDevices,
    monitoredDevices,
    monitoringSummary,
    monitoringVersion, // Expose version for debugging
    forceUpdateCounter, // Expose force counter for debugging
    getAvailableAreas, // New function to get available areas
    forceCompleteReset, // NEW: Complete refresh function
    loading: devicesLoading || monitoringHook.loading,
  }
}