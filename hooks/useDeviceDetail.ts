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
  environmental?: {
    current: {
        temperature: number
        humidity: number
    }
    average24h: {
        temperature: number
        humidity: number
    }
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

      const response = await apiRequest(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle new API structure
      if (data.reading || data.device) {
        const deviceData = data.device || {}
        const readingData = data.reading || {}
        const aqiData = data.aqi || {}
        
        // Map to app's expected structure
        const mappedDevice: DeviceDetail = {
          id: deviceData._id || deviceData.id || deviceId,
          deviceId: deviceData.deviceId || deviceId,
          name: deviceData.name || `Device ${deviceId}`,
          fullName: deviceData.name || `Device ${deviceId}`,
          location: readingData.location || deviceData.location?.name || "Unknown Location",
          aqi: aqiData.value || 0,
          temperature: readingData.environmental?.temperature ? `${readingData.environmental.temperature}°C` : "N/A",
          humidity: readingData.environmental?.humidity ? `${readingData.environmental.humidity}%` : "N/A",
          lastUpdated: readingData.timestamp || new Date().toISOString(),
          coordinates: {
            latitude: deviceData.location?.coordinates?.latitude || 0,
            longitude: deviceData.location?.coordinates?.longitude || 0
          },
          pollutants: {
            pm25: {
              current: readingData.airQuality?.pm2_5 || 0,
              average24h: 0, // Not provided in latest reading
              unit: "μg/m³",
              color: "#4ECDC4"
            },
            pm10: {
              current: readingData.airQuality?.pm10 || 0,
              average24h: 0,
              unit: "μg/m³",
              color: "#FF6B6B"
            },
            co2: {
              current: 0, // Not in sample response
              average24h: 0,
              unit: "ppm",
              color: "#45B7D1"
            },
            no2: {
              current: data.gasData?.NO2_ppb || 0,
              average24h: 0,
              unit: "ppb",
              color: "#96CEB4"
            },
            so2: {
              current: data.gasData?.SO2_ppb || 0,
              average24h: 0,
              unit: "ppb",
              color: "#FFEAA7"
            }
          },
          // Environmental detail for detailed view
          environmental: {
            current: {
                temperature: readingData.environmental?.temperature || 0,
                humidity: readingData.environmental?.humidity || 0
            },
            average24h: {
                temperature: 0, // Will be filled by history fetch
                humidity: 0
            }
          },
          chartData: { labels: [], datasets: [] }, // Will be filled by history fetch
          rawData: data
        }

        setDevice(mappedDevice)
        setError(null)
        
        // Fetch historical data immediately for the default period (24h)
        fetchHistoricalData("24h")
        
      } else if (data.success) {
         // Fallback for old structure if mixed
         setDevice(data.device)
         setError(null)
         fetchHistoricalData("24h")
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
      // Convert period to hours for the API
      let hours = period.replace('h', '');
      if (period === '1w') {
        hours = '168';
      }
      
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.DEVICE_HISTORY(deviceId, hours))

      const response = await apiRequest(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle /trends endpoint response which returns { data: [...] } without success property
      if (data.data && Array.isArray(data.data)) {
        // Map flat trend data to expected structure with pollutants object
        const mappedData = data.data.map((item: any) => ({
            ...item,
            pollutants: {
                pm25: item.pm25 || 0,
                pm10: item.pm10 || 0,
                // Add other pollutants if needed for future use
            }
        }))

        setHistoricalData(mappedData)

        // Calculate averages from historical data
        if (period === "24h" && mappedData.length > 0) {
            const avgTemp = mappedData.reduce((sum, item) => sum + (item.temperature || 0), 0) / mappedData.length
            const avgHumid = mappedData.reduce((sum, item) => sum + (item.humidity || 0), 0) / mappedData.length
            
            setDevice(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    environmental: {
                        ...prev.environmental,
                        current: prev.environmental?.current || { temperature: 0, humidity: 0 },
                        average24h: {
                            temperature: Math.round(avgTemp * 10) / 10,
                            humidity: Math.round(avgHumid)
                        }
                    }
                }
            })
        }

        // Generate new chart data from historical data
        const newChartData = generateChartData(mappedData, period)
        setChartData(newChartData)

        return mappedData
      } else if (data.success && Array.isArray(data.data)) {
         // Fallback for old/other endpoints
         setHistoricalData(data.data)
         const newChartData = generateChartData(data.data, period)
         setChartData(newChartData)
         return data.data
      } else {
        console.error("Failed to fetch historical data:", data)
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
    // Simplified deterministic AQI calculation
    // This is a rough approximation for display purposes only
    if (pm25 <= 35) return Math.round((pm25 / 35) * 50) 
    if (pm25 <= 75) return Math.round(((pm25 - 35) / 40) * 50 + 50)
    return Math.round(((pm25 - 75) / 75) * 100 + 100)
  }

  // Helper function to generate chart data from historical data
  const generateChartData = (historicalData: any[], period: string) => {
    if (!historicalData || historicalData.length === 0) {
      // Return empty chart data instead of random fallback
      return {
        labels: [],
        datasets: [
          {
            data: [],
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
      const maxPoints = 6 // Reduced points to prevent crowding
      const step = Math.max(1, Math.floor(historicalData.length / maxPoints))

      for (let i = 0; i < historicalData.length; i += step) {
        const item = historicalData[i]
        const date = new Date(item.timestamp)
        // Super short format: "14" (just the hour)
        const time = `${date.getHours()}`

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
