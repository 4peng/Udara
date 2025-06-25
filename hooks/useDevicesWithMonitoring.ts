"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDevices } from "./useDevices"
import { useMonitoring } from "./useMonitoring"

export const useDevicesWithMonitoring = () => {
  const devicesHook = useDevices()
  const monitoringHook = useMonitoring()

  // Add a state to force re-renders when monitoring changes
  const [monitoringVersion, setMonitoringVersion] = useState(0)

  const { devices, loading: devicesLoading, updateDeviceMonitoringStatus } = devicesHook
  const { initialized, initializeMonitoringAreas, getMonitoredDeviceIds, monitoringAreas } = monitoringHook

  // Use refs to track if we've already initialized/updated
  const hasInitialized = useRef(false)
  const lastMonitoredDeviceIds = useRef<string>("")

  // Initialize monitoring areas when devices are loaded (ONCE)
  useEffect(() => {
    if (!devicesLoading && devices.length > 0 && !initialized && !hasInitialized.current) {
      console.log("🔄 Initializing monitoring with", devices.length, "devices")
      hasInitialized.current = true
      initializeMonitoringAreas(devices)
    }
  }, [devices, devicesLoading, initialized, initializeMonitoringAreas])

  // Update device monitoring status when monitoring areas change (ONLY if actually changed)
  useEffect(() => {
    if (initialized) {
      const monitoredDeviceIds = getMonitoredDeviceIds()
      const currentIds = monitoredDeviceIds.sort().join(",")

      // Only update if the monitored device IDs actually changed
      if (currentIds !== lastMonitoredDeviceIds.current) {
        console.log("📊 Updating device monitoring status:", monitoredDeviceIds)
        lastMonitoredDeviceIds.current = currentIds
        updateDeviceMonitoringStatus(monitoredDeviceIds)

        // Force re-render by incrementing version
        setMonitoringVersion((prev) => prev + 1)
      }
    }
  }, [initialized, monitoringAreas, updateDeviceMonitoringStatus, getMonitoredDeviceIds])

  // Memoize monitored devices to ensure proper re-renders
  const monitoredDevices = useMemo(() => {
    if (!initialized) return []

    const monitoredDeviceIds = getMonitoredDeviceIds()
    const filtered = devices.filter((device) => monitoredDeviceIds.includes(device.deviceId))

    console.log("🔍 Recalculating monitored devices:", {
      totalDevices: devices.length,
      monitoredIds: monitoredDeviceIds,
      filteredCount: filtered.length,
      filtered: filtered.map((d) => ({ id: d.id, name: d.name, location: d.location })),
      version: monitoringVersion, // Include version in log
    })

    return filtered
  }, [devices, initialized, getMonitoredDeviceIds, monitoringAreas, monitoringVersion])

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
    loading: devicesLoading || monitoringHook.loading,
  }
}
