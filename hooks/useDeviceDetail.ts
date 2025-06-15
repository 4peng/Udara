"use client"

import { useEffect, useState } from "react"
import { API_CONFIG, apiRequest, buildApiUrl } from "../config/api"

export interface DeviceDetail {
  id: string
  deviceId: string
  name: string
  fullName: string
  location: string
  aqi: number
  temperature: string
  humidity: string
  lastUpdated: string
  coordinates: {
    latitude: number
    longitude: number
  }
  pollutants: {
    [key: string]: {
      current: number
      average24h: number
      unit: string
      color: string
    }
  }
  chartData: {
    labels: string[]
    datasets: any[]
  }
}

export const useDeviceDetail = (deviceId: string) => {
  const [device, setDevice] = useState<DeviceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeviceDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const url = buildApiUrl(API_CONFIG.ENDPOINTS.DEVICE_DETAIL(deviceId))
      console.log("Fetching device detail for:", deviceId, "from:", url)

      const response = await apiRequest(url)
      console.log("Device detail response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Received device detail:", data)

      if (data.success) {
        setDevice(data.device)
        setError(null)
        console.log("Successfully set device detail:", data.device)
      } else {
        setError(data.error || "Failed to fetch device details")
        console.error("API returned error:", data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error occurred"
      setError(errorMessage)
      console.error("Error fetching device details:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (deviceId) {
      console.log("useDeviceDetail hook mounted for device:", deviceId)
      fetchDeviceDetail()
    }
  }, [deviceId])

  return {
    device,
    loading,
    error,
    refetch: fetchDeviceDetail,
  }
}
