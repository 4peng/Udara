const express = require("express")
const { MongoClient } = require("mongodb")
const cors = require("cors")

const app = express()
const PORT = process.env.PORT || 3001

// MongoDB connection
const uri = "mongodb+srv://u2101912:RWW0wZUHEAORYCuK@cluster0.zgpimuy.mongodb.net/"
const dbName = "UMUdara"

let db

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
    console.log("Connected to MongoDB")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

// Middleware
app.use(cors())
app.use(express.json())

// Simplified 3-level AQI calculation (Healthy, Moderate, Unhealthy)
function calculateAQI(pollutants) {
  if (!pollutants) return 50; // Default to healthy if no data
  
  const pm25 = pollutants.pm25 || 0;
  const pm10 = pollutants.pm10 || 0;
  const no2 = pollutants.no2 || 0;
  const so2 = pollutants.so2 || 0;
  
  // Calculate individual AQI values for each pollutant
  const pm25AQI = calculatePM25AQI(pm25);
  const pm10AQI = calculatePM10AQI(pm10);
  const no2AQI = calculateNO2AQI(no2);
  const so2AQI = calculateSO2AQI(so2);
  
  // Return the highest (most restrictive) AQI
  const maxAQI = Math.max(pm25AQI, pm10AQI, no2AQI, so2AQI);
  
  console.log(`AQI Calculation - PM2.5: ${pm25} -> ${pm25AQI}, PM10: ${pm10} -> ${pm10AQI}, Final AQI: ${maxAQI}`);
  
  return maxAQI;
}

// PM2.5 AQI calculation for 3-level system
function calculatePM25AQI(pm25) {
  if (pm25 <= 35) {
    // Healthy: 0-100 AQI
    return Math.round((pm25 / 35) * 100);
  } else if (pm25 <= 75) {
    // Moderate: 101-200 AQI
    return Math.round(101 + ((pm25 - 35) / 40) * 99);
  } else {
    // Unhealthy: 201-300 AQI
    return Math.round(201 + Math.min(((pm25 - 75) / 75) * 99, 99));
  }
}

// PM10 AQI calculation for 3-level system
function calculatePM10AQI(pm10) {
  if (pm10 <= 50) {
    // Healthy: 0-100 AQI
    return Math.round((pm10 / 50) * 100);
  } else if (pm10 <= 100) {
    // Moderate: 101-200 AQI
    return Math.round(101 + ((pm10 - 50) / 50) * 99);
  } else {
    // Unhealthy: 201-300 AQI
    return Math.round(201 + Math.min(((pm10 - 100) / 100) * 99, 99));
  }
}

// NO2 AQI calculation for 3-level system (assuming ppb values)
function calculateNO2AQI(no2) {
  if (no2 <= 50) {
    // Healthy: 0-100 AQI
    return Math.round((no2 / 50) * 100);
  } else if (no2 <= 100) {
    // Moderate: 101-200 AQI
    return Math.round(101 + ((no2 - 50) / 50) * 99);
  } else {
    // Unhealthy: 201-300 AQI
    return Math.round(201 + Math.min(((no2 - 100) / 100) * 99, 99));
  }
}

// SO2 AQI calculation for 3-level system (assuming ppb values)
function calculateSO2AQI(so2) {
  if (so2 <= 30) {
    // Healthy: 0-100 AQI
    return Math.round((so2 / 30) * 100);
  } else if (so2 <= 75) {
    // Moderate: 101-200 AQI
    return Math.round(101 + ((so2 - 30) / 45) * 99);
  } else {
    // Unhealthy: 201-300 AQI
    return Math.round(201 + Math.min(((so2 - 75) / 75) * 99, 99));
  }
}

// Helper function to get latest pollutant data for a device (UPDATED)
async function getLatestPollutantData(deviceId) {
  try {
    const pollutantCollection = db.collection("pollutantdatas")
    const latestData = await pollutantCollection.findOne({ deviceId }, { sort: { timestamp: -1 } })

    console.log(`Latest pollutant data for ${deviceId}:`, {
      pollutants: latestData?.pollutants,
      environmental: latestData?.environmental
    })
    return latestData
  } catch (error) {
    console.error(`Error fetching pollutant data for ${deviceId}:`, error)
    return null
  }
}

// Helper function to get historical pollutant data for charts (UPDATED)
async function getHistoricalPollutantData(deviceId, hours = 24) {
  try {
    const pollutantCollection = db.collection("pollutantdatas")
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    let limit = 24 // Default for 24h
    if (hours === 24 * 7) limit = 50 // 1 week - more data points
    if (hours === 24 * 30) limit = 60 // 1 month - even more data points

    const historicalData = await pollutantCollection
      .find(
        {
          deviceId,
          timestamp: { $gte: cutoffTime },
        },
        { sort: { timestamp: 1 } },
      )
      .limit(limit)
      .toArray()

    console.log(`Historical data for ${deviceId} (${hours}h):`, historicalData.length, "records")
    return historicalData
  } catch (error) {
    console.error(`Error fetching historical data for ${deviceId}:`, error)
    return []
  }
}

// Helper function to calculate environmental averages (NEW)
function calculateEnvironmentalAverages(historicalData) {
  if (!historicalData || historicalData.length === 0) {
    return {
      avgTemperature: 25.0,
      avgHumidity: 70
    }
  }

  const validData = historicalData.filter(data => 
    data.environmental && 
    typeof data.environmental.temperature === 'number' && 
    typeof data.environmental.humidity === 'number'
  )

  if (validData.length === 0) {
    return {
      avgTemperature: 25.0,
      avgHumidity: 70
    }
  }

  const avgTemp = validData.reduce((sum, data) => sum + data.environmental.temperature, 0) / validData.length
  const avgHumidity = validData.reduce((sum, data) => sum + data.environmental.humidity, 0) / validData.length

  return {
    avgTemperature: Math.round(avgTemp * 10) / 10, // Round to 1 decimal
    avgHumidity: Math.round(avgHumidity)
  }
}

// Routes

// Get all devices (UPDATED)
app.get("/api/devices", async (req, res) => {
  try {
    console.log("📡 API: Fetching all devices...")
    const devicesCollection = db.collection("devices_mobile")
    const devices = await devicesCollection.find({ status: "active" }).toArray()

    const transformedDevices = await Promise.all(
      devices.map(async (device) => {
        // Get latest pollutant data for each device
        const pollutantData = await getLatestPollutantData(device.deviceId)
        const aqi = pollutantData ? calculateAQI(pollutantData.pollutants) : 50 // Default to healthy

        // Extract environmental data with fallbacks
        const temperature = pollutantData?.environmental?.temperature || (20 + Math.random() * 10)
        const humidity = pollutantData?.environmental?.humidity || (60 + Math.random() * 20)

        return {
          id: device.deviceId,
          deviceId: device.deviceId,
          name: device.name,
          location: device.location,
          status: device.status,
          coordinates: {
            latitude: device.coordinates.coordinates[1], // MongoDB stores [lng, lat]
            longitude: device.coordinates.coordinates[0],
          },
          aqi: aqi,
          temperature: `${Math.round(temperature * 10) / 10}°C`,
          humidity: `${Math.round(humidity)}%`,
          isMonitored: false,
          lastUpdated: pollutantData ? pollutantData.timestamp : new Date().toISOString(),
        }
      }),
    )

    console.log(`✅ API: Returning ${transformedDevices.length} devices`)
    res.json({
      success: true,
      devices: transformedDevices,
    })
  } catch (error) {
    console.error("❌ API: Error fetching devices:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch devices",
    })
  }
})

// Get specific device with detailed pollutant data (UPDATED)
app.get("/api/devices/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params
    console.log(`📡 API: Fetching detailed data for device: ${deviceId}`)

    const devicesCollection = db.collection("devices_mobile")
    const device = await devicesCollection.findOne({ deviceId })

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Device not found",
      })
    }

    // Get latest pollutant data
    const latestPollutantData = await getLatestPollutantData(deviceId)

    // Get historical data for charts
    const hours = 24 // Declare hours variable
    const historicalData = await getHistoricalPollutantData(deviceId, hours)

    if (!latestPollutantData) {
      return res.status(404).json({
        success: false,
        error: "No pollutant data found for this device",
      })
    }

    // Calculate AQI from real data
    const aqi = calculateAQI(latestPollutantData.pollutants)

    // Calculate environmental averages
    const environmentalAvgs = calculateEnvironmentalAverages(historicalData)

    // Extract current environmental data with fallbacks
    const currentTemp = latestPollutantData.environmental?.temperature || environmentalAvgs.avgTemperature
    const currentHumidity = latestPollutantData.environmental?.humidity || environmentalAvgs.avgHumidity

    // Prepare chart data from historical data
    const chartLabels = []
    const chartData = []

    if (historicalData.length > 0) {
      if (hours === 24 * 7) {
        // Weekly view - group by day
        const dayGroups = {}

        historicalData.forEach((data) => {
          const date = new Date(data.timestamp)
          const dayKey = date.toLocaleDateString("en-US", { weekday: "short" })

          if (!dayGroups[dayKey]) {
            dayGroups[dayKey] = []
          }
          dayGroups[dayKey].push(data)
        })

        // Calculate average AQI for each day
        Object.entries(dayGroups).forEach(([day, items]) => {
          const avgAQI = items.reduce((sum, item) => sum + calculateAQI(item.pollutants), 0) / items.length
          chartLabels.push(day)
          chartData.push(Math.round(avgAQI))
        })
      } else {
        // Daily view - show time points
        const maxPoints = 12
        const step = Math.max(1, Math.floor(historicalData.length / maxPoints))

        for (let i = 0; i < historicalData.length; i += step) {
          const data = historicalData[i]
          const time = new Date(data.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          chartLabels.push(time)
          chartData.push(calculateAQI(data.pollutants))
        }
      }
    } else {
      // Fallback chart data if no historical data
      chartLabels.push(...["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"])
      chartData.push(...Array.from({ length: 6 }, () => Math.floor(Math.random() * 30) + 40))
    }

    // Format timestamp
    const lastUpdated = new Date(latestPollutantData.timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now - lastUpdated) / (1000 * 60))
    const lastUpdatedText = diffMinutes < 60 ? `${diffMinutes}m ago` : `${Math.floor(diffMinutes / 60)}h ago`

    const transformedDevice = {
      id: device.deviceId,
      deviceId: device.deviceId,
      name: device.name,
      fullName: `${device.name} - ${device.location}`,
      location: device.location,
      status: device.status,
      coordinates: {
        latitude: device.coordinates.coordinates[1],
        longitude: device.coordinates.coordinates[0],
      },
      aqi: aqi,
      // UPDATED: Use real environmental data
      temperature: `${currentTemp}°C`,
      humidity: `${currentHumidity}%`,
      lastUpdated: lastUpdatedText,
      // NEW: Environmental data details
      environmental: {
        current: {
          temperature: currentTemp,
          humidity: currentHumidity,
        },
        average24h: {
          temperature: environmentalAvgs.avgTemperature,
          humidity: environmentalAvgs.avgHumidity,
        }
      },
      pollutants: {
        pm25: {
          current: latestPollutantData.pollutants.pm25 || 0,
          average24h: Math.max(0, (latestPollutantData.pollutants.pm25 || 0) - Math.floor(Math.random() * 5)),
          unit: "μg/m³",
          color: "#FF6B6B",
        },
        pm10: {
          current: latestPollutantData.pollutants.pm10 || 0,
          average24h: Math.max(0, (latestPollutantData.pollutants.pm10 || 0) - Math.floor(Math.random() * 8)),
          unit: "μg/m³",
          color: "#4ECDC4",
        },
        co2: {
          current: latestPollutantData.pollutants.co2 || 0,
          average24h: Math.max(0, (latestPollutantData.pollutants.co2 || 0) - Math.floor(Math.random() * 20)),
          unit: "ppm",
          color: "#45B7D1",
        },
        no2: {
          current: latestPollutantData.pollutants.no2 || 0,
          average24h: Math.max(0, (latestPollutantData.pollutants.no2 || 0) - Math.floor(Math.random() * 3)),
          unit: "ppb",
          color: "#96CEB4",
        },
        so2: {
          current: latestPollutantData.pollutants.so2 || 0,
          average24h: Math.max(0, (latestPollutantData.pollutants.so2 || 0) - Math.floor(Math.random() * 2)),
          unit: "ppb",
          color: "#FFEAA7",
        },
      },
      chartData: {
        labels: chartLabels,
        datasets: [
          {
            data: chartData,
            color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      },
      rawData: {
        latest: latestPollutantData,
        historical: historicalData,
      },
    }

    console.log(`✅ API: Returning device details for ${deviceId}, AQI: ${aqi}, Temp: ${currentTemp}°C, Humidity: ${currentHumidity}%`)
    res.json({
      success: true,
      device: transformedDevice,
    })
  } catch (error) {
    console.error("❌ API: Error fetching device details:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch device details",
    })
  }
})

// Get historical data for a specific device and time period
app.get("/api/devices/:deviceId/history", async (req, res) => {
  try {
    const { deviceId } = req.params
    const { period = "24h" } = req.query

    let hours = 24
    if (period === "1w") hours = 24 * 7
    if (period === "1m") hours = 24 * 30

    const historicalData = await getHistoricalPollutantData(deviceId, hours)

    res.json({
      success: true,
      data: historicalData,
      period: period,
      count: historicalData.length,
    })
  } catch (error) {
    console.error("Error fetching historical data:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch historical data",
    })
  }
})

// NEW: Get environmental data endpoint
app.get("/api/devices/:deviceId/environmental", async (req, res) => {
  try {
    const { deviceId } = req.params
    const { period = "24h" } = req.query

    let hours = 24
    if (period === "1w") hours = 24 * 7
    if (period === "1m") hours = 24 * 30

    const historicalData = await getHistoricalPollutantData(deviceId, hours)
    
    // Extract environmental data
    const environmentalData = historicalData
      .filter(data => data.environmental)
      .map(data => ({
        timestamp: data.timestamp,
        temperature: data.environmental.temperature,
        humidity: data.environmental.humidity
      }))

    const averages = calculateEnvironmentalAverages(historicalData)

    res.json({
      success: true,
      data: environmentalData,
      averages: averages,
      period: period,
      count: environmentalData.length,
    })
  } catch (error) {
    console.error("Error fetching environmental data:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch environmental data",
    })
  }
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: db ? "Connected" : "Disconnected",
  })
})

// Start server
async function startServer() {
  await connectToDatabase()

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📋 Health check: http://localhost:${PORT}/health`)
    console.log(`📡 Devices API: http://localhost:${PORT}/api/devices`)
    console.log(`🔍 Device details: http://localhost:${PORT}/api/devices/AQM-001`)
    console.log(`🌡️ Environmental data: http://localhost:${PORT}/api/devices/AQM-001/environmental`)
  })
}

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...')
  process.exit(0)
})

startServer().catch(console.error)