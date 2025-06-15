const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// API Routes
app.get('/api/devices', async (req, res) => {
  try {
    const db = client.db(process.env.DB_NAME);
    const devicesCollection = db.collection('devices_mobile');

    // Get all active devices
    const devices = await devicesCollection.find({ status: 'active' }).toArray();

    // Transform the data
    const transformedDevices = devices.map(device => ({
      id: device.deviceId,
      deviceId: device.deviceId,
      name: device.name,
      location: device.location,
      status: device.status,
      coordinates: {
        latitude: device.coordinates.coordinates[1],
        longitude: device.coordinates.coordinates[0],
      },
      aqi: Math.floor(Math.random() * 200) + 1,
      isMonitored: false,
      lastUpdated: new Date().toISOString(),
    }));

    res.json({
      success: true,
      devices: transformedDevices,
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch devices' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  connectToMongo();
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
}); 