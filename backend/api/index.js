// api/index.js - Serverless version for Vercel
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://udara-frontend.vercel.app',  
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB connection with caching for serverless
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    cachedDb = connection;
    console.log("MongoDB connected successfully");
    return connection;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// Connect to DB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
const logsRouter = require("../routes/logs");
const devicesRouter = require("../routes/devices");
const userProfileRouter = require("../routes/userRoute");
const airQualityRouter = require("../routes/airQualityData");
const sensorDataRoute = require('../routes/sensorData');
const notificationRoute = require('../routes/notificationRoute');
const csvUploadRoute = require('../routes/csvUpload');
const testNotificationRoute = require('../routes/testNotification');
const { startRealtimeMonitoring } = require('../jobs/realtimeMonitor');

app.use("/api/logs", logsRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/user", userProfileRouter);
app.use("/api/air-quality", airQualityRouter);
app.use("/api/sensor", sensorDataRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/csv-upload", csvUploadRoute);
app.use("/api/test-notification", testNotificationRoute);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Udara Air Quality API is running!",
    version: "1.0.0",
    endpoints: {
      devices: [
        "GET /api/devices - Get all devices",
        "GET /api/devices/active - Get active devices for map",
        "GET /api/devices/:deviceId - Get device details & latest reading",
        "GET /api/devices/:deviceId/history - Get historical data (24h/weekly/monthly charts)",
        "POST /api/devices - Create a new device",
        "PUT /api/devices/:id - Update device info",
        "DELETE /api/devices/:id - Delete a device"
      ],
      notifications: [
        "POST /api/notifications/register - Register device push tokens",
        "POST /api/notifications/subscribe - Subscribe to device alerts",
        "POST /api/notifications/unsubscribe - Unsubscribe from alerts",
        "GET /api/notifications/subscriptions/:userId - Get user's active subscriptions",
        "GET /api/notifications/:userId/notifications - Get notification history"
      ],
      sensorData: [
        "GET /api/sensor/dashboard - Latest data for all active sensors",
        "GET /api/sensor/:deviceId/latest - Latest reading for a device",
        "GET /api/sensor/:deviceId/trends - Hourly averages for charts",
        "GET /api/sensor/history - Filterable historical sensor data",
        "GET /api/sensor/history/export - Export history to JSON/CSV"
      ],
      user: [
        "POST /api/user - Create/Update user profile",
        "GET /api/user/:clerkUserId - Get user profile",
        "PATCH /api/user/:clerkUserId - Update user profile"
      ],
      logs: [
        "GET /api/logs - System & device logs",
        "GET /api/logs/stats/summary - Log statistics"
      ],
      dataManagement: [
        "POST /api/csv-upload/upload - Bulk upload sensor data from CSV",
        "POST /api/csv-upload/validate - Validate CSV structure"
      ]
    }
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start Realtime Monitoring once DB is connected
mongoose.connection.once('open', () => {
  startRealtimeMonitoring();
});

// Export for Vercel (optional, but harmless)
module.exports = app;

// Start Server (Compatible with Render & Local)
// Remove the NODE_VALUE restriction so it runs in Production too
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});