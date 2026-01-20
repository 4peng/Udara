// scripts/registerDevices.js
require('dotenv').config();
const mongoose = require('mongoose');

// Define Schema
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: String,
  location: String,
  isActive: { type: Boolean, default: true },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  lastUpdated: Date
}, { strict: false });

const Device = mongoose.model('Device', deviceSchema);

async function register() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);

    const devices = [
      {
        deviceId: 'Device_A',
        name: 'Main Campus Sensor',
        location: 'Universiti Malaya',
        isActive: true,
        coordinates: { latitude: 3.1209, longitude: 101.6538 }
      },
      {
        deviceId: 'Device_B',
        name: 'Library Sensor',
        location: 'UM Library',
        isActive: true,
        coordinates: { latitude: 3.1220, longitude: 101.6550 }
      }
    ];

    for (const dev of devices) {
      const exists = await Device.findOne({ deviceId: dev.deviceId });
      if (exists) {
        console.log(`⚠️ ${dev.deviceId} already exists. Updating...`);
        await Device.updateOne({ deviceId: dev.deviceId }, { $set: dev });
      } else {
        console.log(`✅ Creating ${dev.deviceId}...`);
        await Device.create(dev);
      }
    }

    console.log("🎉 Devices registered successfully!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

register();
