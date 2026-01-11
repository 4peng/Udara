"use client"

import { useEffect, useState } from "react"
import { Alert } from "react-native"
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

interface ApiDevice {
  id?: string
  _id?: string
  deviceId: string
  name: string
  status?: string
  lat?: number
  lng?: number
  coordinates?: {
    latitude: number
    longitude: number
  }
  aqi?: { value: number } | number
  temperature?: number
  humidity?: number
  lastUpdate?: string
  lastUpdated?: string
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

      const response = await apiRequest(url)
      // apiRequest handles response.ok checks now

      const data = await response.json()

      // Handle new API structure: data is the array itself
      const deviceList = Array.isArray(data) ? data : (data.devices || [])

      if (Array.isArray(deviceList)) {
        // Validate and sanitize device data
        const validDevices = (deviceList as ApiDevice[])
          .map((device) => ({
            id: device.id || device._id || device.deviceId,
            deviceId: device.deviceId,
            name: device.name,
            location: device.name, // Use name as location for now
            status: device.status || 'active',
            coordinates: {
              latitude: device.lat || device.coordinates?.latitude || 0,
              longitude: device.lng || device.coordinates?.longitude || 0
            },
            aqi: typeof device.aqi === 'object' ? (device.aqi?.value || 0) : (device.aqi || 0),
            temperature: device.temperature ? `${device.temperature}°C` : null,
            humidity: device.humidity ? `${device.humidity}%` : null,
            isMonitored: false, // Will be updated later by monitoring hook
            lastUpdated: device.lastUpdate || device.lastUpdated || new Date().toISOString(),
          }))
          .filter((device) => device.deviceId && device.coordinates.latitude !== 0)

        setDevices(validDevices)
        setError(null)
      } else {
        console.error("Invalid API response structure:", data)
        throw new Error("Invalid response format from server")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error occurred"
      setError(errorMessage)
      console.error("Error fetching devices:", err)
      
      // Visual feedback for the error
      Alert.alert("Connection Error", errorMessage);

      // Set empty array on error to prevent crashes
      setDevices([])
    } finally {
      setLoading(false)
    }
  }

  const refreshDevices = () => {
    fetchDevices()
  }

  const toggleDeviceMonitoring = (deviceId: string) => {
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
