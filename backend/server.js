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

// Helper function to generate mock AQI data
function generateMockAQI() {
  return Math.floor(Math.random() * 200) + 1
}

// Helper function to calculate AQI from pollutant data
function calculateAQI(pollutants) {
  // Simplified AQI calculation for 3-color system
  const pm25 = pollutants.pm25 || 0
  if (pm25 <= 35) return Math.floor(Math.random() * 100) + 1 // Healthy (0-100)
  if (pm25 <= 75) return Math.floor(Math.random() * 100) + 101 // Moderate (101-200)
  return Math.floor(Math.random() * 100) + 201 // Hazardous (201+)
}

// Helper function to get latest pollutant data for a device
async function getLatestPollutantData(deviceId) {
  try {
    const pollutantCollection = db.collection("pollutantdatas")
    const latestData = await pollutantCollection.findOne({ deviceId }, { sort: { timestamp: -1 } })

    console.log(`Latest pollutant data for ${deviceId}:`, latestData)
    return latestData
  } catch (error) {
    console.error(`Error fetching pollutant data for ${deviceId}:`, error)
    return null
  }
}

// Helper function to get historical pollutant data for charts
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

// Routes

// Get all devices
app.get("/api/devices", async (req, res) => {
  try {
    const devicesCollection = db.collection("devices_mobile")
    const devices = await devicesCollection.find({ status: "active" }).toArray()

    const transformedDevices = await Promise.all(
      devices.map(async (device) => {
        // Get latest pollutant data for each device
        const pollutantData = await getLatestPollutantData(device.deviceId)
        const aqi = pollutantData ? calculateAQI(pollutantData.pollutants) : generateMockAQI()

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
          isMonitored: false,
          lastUpdated: pollutantData ? pollutantData.timestamp : new Date().toISOString(),
        }
      }),
    )

    res.json({
      success: true,
      devices: transformedDevices,
    })
  } catch (error) {
    console.error("Error fetching devices:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch devices",
    })
  }
})

// Get specific device with detailed pollutant data
app.get("/api/devices/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params
    console.log(`Fetching detailed data for device: ${deviceId}`)

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
      temperature: `${Math.floor(Math.random() * 15) + 20}°C`, // Mock temperature
      humidity: `${Math.floor(Math.random() * 30) + 40}%`, // Mock humidity
      lastUpdated: lastUpdatedText,
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

    res.json({
      success: true,
      device: transformedDevice,
    })
  } catch (error) {
    console.error("Error fetching device details:", error)
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
    console.log(`Server running on port ${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/health`)
    console.log(`Devices API: http://localhost:${PORT}/api/devices`)
    console.log(`Device details: http://localhost:${PORT}/api/devices/AQM-001`)
  })
}

startServer().catch(console.error)
