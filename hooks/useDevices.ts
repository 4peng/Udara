"use client"

import { useEffect, useState } from "react"
import { API_CONFIG, apiRequest, buildApiUrl } from "../config/api"

export interface Device {
  id: string
  deviceId: string
  name: string
  location: string
  status: string
  coordinates: {
    latitude: number
    longitude: number
  }
  aqi: number
  isMonitored: boolean
  lastUpdated: string
}

export const useDevices = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = buildApiUrl(API_CONFIG.ENDPOINTS.DEVICES)
      console.log("Fetching devices from:", url)

      const response = await apiRequest(url)
      console.log("Response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Received data:", data)

      if (data.success && Array.isArray(data.devices)) {
        // Validate and sanitize device data
        const validDevices = data.devices
          .filter((device: any) => {
            const isValid =
              device &&
              typeof device.id === "string" &&
              typeof device.name === "string" &&
              typeof device.location === "string" &&
              typeof device.aqi === "number" &&
              device.coordinates &&
              typeof device.coordinates.latitude === "number" &&
              typeof device.coordinates.longitude === "number"

            if (!isValid) {
              console.warn("Invalid device data:", device)
            }
            return isValid
          })
          .map((device: any) => ({
            ...device,
            isMonitored: false, // Will be updated later by monitoring hook
            lastUpdated: device.lastUpdated || new Date().toISOString(),
          }))

        setDevices(validDevices)
        setError(null)

        console.log("Successfully set devices:", validDevices.length, "valid devices")
      } else {
        console.error("Invalid API response structure:", data)
        setError(data.error || "Invalid response format")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error occurred"
      setError(errorMessage)
      console.error("Error fetching devices:", err)

      // Set empty array on error to prevent crashes
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  const refreshDevices = () => {
    console.log("Refreshing devices...")
    fetchDevices()
  }

  const toggleDeviceMonitoring = (deviceId: string) => {
    console.log("Toggling monitoring for device:", deviceId)
    setDevices((prevDevices) =>
      prevDevices.map((device) => (device.id === deviceId ? { ...device, isMonitored: !device.isMonitored } : device)),
    )
  }

  const updateDeviceMonitoringStatus = (monitoredDeviceIds: string[]) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) => ({
        ...device,
        isMonitored: monitoredDeviceIds.includes(device.deviceId),
      })),
    )
  }

  const getDeviceById = (deviceId: string) => {
    return devices.find((device) => device.id === deviceId)
  }

  const getDevicesByLocation = (location: string) => {
    return devices.filter((device) => device.location === location)
  }

  useEffect(() => {
    console.log("useDevices hook mounted, fetching devices...")
    fetchDevices()
  }, [])

  return {
    devices,
    loading,
    error,
    refreshDevices,
    toggleDeviceMonitoring,
    updateDeviceMonitoringStatus,
    getDeviceById,
    getDevicesByLocation,
  }
}
