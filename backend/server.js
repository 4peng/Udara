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

// Helper function to generate mock readings
function generateMockReadings() {
  return {
    pm25: Math.floor(Math.random() * 50) + 10,
    pm10: Math.floor(Math.random() * 80) + 20,
    o3: Math.floor(Math.random() * 60) + 30,
    no2: Math.floor(Math.random() * 25) + 5,
    so2: Math.floor(Math.random() * 15) + 3,
    co: Math.random() * 2 + 0.5,
    temperature: Math.floor(Math.random() * 15) + 20,
    humidity: Math.floor(Math.random() * 30) + 40,
  }
}

// Routes

// Get all devices
app.get("/api/devices", async (req, res) => {
  try {
    const devicesCollection = db.collection("devices_mobile")
    const devices = await devicesCollection.find({ status: "active" }).toArray()

    const transformedDevices = devices.map((device) => ({
      id: device.deviceId,
      deviceId: device.deviceId,
      name: device.name,
      location: device.location,
      status: device.status,
      coordinates: {
        latitude: device.coordinates.coordinates[1], // MongoDB stores [lng, lat]
        longitude: device.coordinates.coordinates[0],
      },
      aqi: generateMockAQI(),
      isMonitored: false,
      lastUpdated: new Date().toISOString(),
    }))

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

// Get specific device
app.get("/api/devices/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params
    const devicesCollection = db.collection("devices_mobile")

    const device = await devicesCollection.findOne({ deviceId })

    if (!device) {
      return res.status(404).json({
        success: false,
        error: "Device not found",
      })
    }

    const mockReadings = generateMockReadings()
    const aqi = generateMockAQI()

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
      temperature: `${mockReadings.temperature}°C`,
      humidity: `${mockReadings.humidity}%`,
      lastUpdated: "2 mins ago",
      pollutants: {
        pm25: {
          current: mockReadings.pm25,
          average24h: mockReadings.pm25 - 2,
          unit: "μg/m³",
          color: "#FF6B6B",
        },
        pm10: {
          current: mockReadings.pm10,
          average24h: mockReadings.pm10 - 3,
          unit: "μg/m³",
          color: "#4ECDC4",
        },
        o3: {
          current: mockReadings.o3,
          average24h: mockReadings.o3 - 2,
          unit: "ppb",
          color: "#45B7D1",
        },
        no2: {
          current: mockReadings.no2,
          average24h: mockReadings.no2 - 1,
          unit: "ppb",
          color: "#96CEB4",
        },
        so2: {
          current: mockReadings.so2,
          average24h: mockReadings.so2 - 1,
          unit: "ppb",
          color: "#FFEAA7",
        },
        co: {
          current: Number.parseFloat(mockReadings.co.toFixed(2)),
          average24h: Number.parseFloat((mockReadings.co - 0.1).toFixed(2)),
          unit: "ppm",
          color: "#DDA0DD",
        },
      },
      chartData: {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        datasets: [
          {
            data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 30) + 40),
            color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      },
    }

    res.json({
      success: true,
      device: transformedDevice,
    })
  } catch (error) {
    console.error("Error fetching device:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch device",
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
  })
}

startServer().catch(console.error)
