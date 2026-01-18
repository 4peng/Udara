// scripts/simulateBadAir.js
require('dotenv').config();
const mongoose = require('mongoose');

// Define simplified schema for insertion only
const readingSchema = new mongoose.Schema({}, { strict: false, collection: 'sensor_data_readings' });
const SensorReading = mongoose.model('SensorReading', readingSchema);
const deviceSchema = new mongoose.Schema({ deviceId: String, name: String }, { strict: false });
const Device = mongoose.model('Device', deviceSchema);

async function runSimulation() {
  try {
    // 1. Connect to MongoDB (Use the same URI as your backend)
    console.log("🔌 Connecting to MongoDB...");
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing in .env file");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected!");

    // 2. Target specific device: Device_B
    const deviceId = "Device_B";
    const device = await Device.findOne({ deviceId: deviceId });

    if (!device) {
        console.error(`❌ Device with ID ${deviceId} not found.`);
        process.exit(1);
    }

    console.log(`🎯 Target Device: ${device.name || deviceId} (${device.deviceId})`);

    // 3. Create a Hazardous Reading
    const hazardousReading = {
      metadata: {
        device_id: device.deviceId,
        topic: `udara/sensor/${device.deviceId}`,
        timestamp_server: new Date(),
        timestamp_device: new Date().toISOString().replace('T', ' ').slice(0, 19),
        location: device.location?.address || 'Simulated Location'
      },
      // Hazardous PM2.5 (Threshold is usually ~75)
      pm2_5: 150.5, 
      pm10: 200.0,
      pm1_0: 100.0,
      
      // Hazardous Gas Levels
      alphasense_voltages: {
        CO_ppm: 25.0,  // High CO
        NO2_ppb: 300.0, // High NO2
        SO2_ppb: 400.0, // High SO2
        O3_ppb: 180.0   // High Ozone
      },
      
      temperature_c: 32.5,
      humidity_pct: 65.0,
      pressure_hpa: 1012.0
    };

    // 4. Insert the reading
    console.log("⚠️ Inserting HAZARDOUS reading...");
    await SensorReading.create(hazardousReading);
    
    console.log("✅ Data Injected Successfully!");
    console.log("👀 Watch your mobile app or Render logs for the notification trigger.");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

runSimulation();
