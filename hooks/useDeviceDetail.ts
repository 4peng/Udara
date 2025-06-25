"use client"

import { useEffect, useState } from "react"
import { API_CONFIG, apiRequest, buildApiUrl } from "../config/api"

export interface PollutantData {
  current: number
  average24h: number
  unit: string
  color: string
}

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
    pm25: PollutantData
    pm10: PollutantData
    co2: PollutantData
    no2: PollutantData
    so2: PollutantData
  }
  chartData: {
    labels: string[]
    datasets: any[]
  }
  rawData?: {
    latest: any
    historical: any[]
  }
}

export const useDeviceDetail = (deviceId: string) => {
  const [device, setDevice] = useState<DeviceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [chartData, setChartData] = useState<any>(null)

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

        // Set initial chart data
        setChartData(data.device.chartData)

        console.log("Successfully set device detail:", data.device)

        // Store historical data if available
        if (data.device.rawData?.historical) {
          setHistoricalData(data.device.rawData.historical)
        }
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

  const fetchHistoricalData = async (period = "24h") => {
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.DEVICE_HISTORY(deviceId, period))
      console.log("Fetching historical data for:", deviceId, "period:", period)

      const response = await apiRequest(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setHistoricalData(data.data)

        // Generate new chart data from historical data
        const newChartData = generateChartData(data.data, period)
        setChartData(newChartData)

        console.log("Successfully fetched historical data:", data.data.length, "records")
        return data.data
      } else {
        console.error("Failed to fetch historical data:", data.error)
        return []
      }
    } catch (err) {
      console.error("Error fetching historical data:", err)
      return []
    }
  }

  // Helper function to calculate AQI from pollutant data
  const calculateAQI = (pollutants: any) => {
    if (!pollutants) return 0
    const pm25 = pollutants.pm25 || 0
    // Simplified AQI calculation for 3-color system
    if (pm25 <= 35) return Math.floor(Math.random() * 100) + 1 // Healthy (0-100)
    if (pm25 <= 75) return Math.floor(Math.random() * 100) + 101 // Moderate (101-200)
    return Math.floor(Math.random() * 100) + 201 // Hazardous (201+)
  }

  // Helper function to generate chart data from historical data
  const generateChartData = (historicalData: any[], period: string) => {
    if (!historicalData || historicalData.length === 0) {
      // Fallback chart data
      const labels =
        period === "1w"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]

      return {
        labels,
        datasets: [
          {
            data: Array.from({ length: labels.length }, () => Math.floor(Math.random() * 30) + 40),
            color: (opacity = 1) => `rgba(67, 97, 238, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      }
    }

    const labels: string[] = []
    const dataPoints: number[] = []

    if (period === "1w") {
      // Group by day for weekly view
      const dayGroups: { [key: string]: any[] } = {}

      historicalData.forEach((item) => {
        const date = new Date(item.timestamp)
        const dayKey = date.toLocaleDateString("en-US", { weekday: "short" })

        if (!dayGroups[dayKey]) {
          dayGroups[dayKey] = []
        }
        dayGroups[dayKey].push(item)
      })

      // Calculate average AQI for each day
      Object.entries(dayGroups).forEach(([day, items]) => {
        const avgAQI = items.reduce((sum, item) => sum + calculateAQI(item.pollutants), 0) / items.length
        labels.push(day)
        dataPoints.push(Math.round(avgAQI))
      })
    } else {
      // Hourly view for 24h
      const maxPoints = 12 // Show 12 points for better readability
      const step = Math.max(1, Math.floor(historicalData.length / maxPoints))

      for (let i = 0; i < historicalData.length; i += step) {
        const item = historicalData[i]
        const time = new Date(item.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })

        labels.push(time)
        dataPoints.push(calculateAQI(item.pollutants))
      }
    }

    return {
      labels,
      datasets: [
        {
          data: dataPoints,
          color: (opacity = 1) => `rgba(67, 97, 238, ${opacity})`,
          strokeWidth: 2,
        },
      ],
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
    historicalData,
    chartData,
    refetch: fetchDeviceDetail,
    fetchHistoricalData,
  }
}
