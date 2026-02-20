// scripts/debugDevice.js
require('dotenv').config();
const mongoose = require('mongoose');
const Device = require('../model/Device'); // Uses the local Model file

async function debug() {
  try {
    console.log('🔌 Connecting...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const targetId = 'Device_B';
    console.log(`🔍 Searching for '${targetId}'...`);

    // 1. Try Exact Match using Model
    const device = await Device.findOne({ deviceId: targetId });
    if (device) {
      console.log('✅ FOUND via Mongoose Model!');
      console.log('   Name:', device.name);
      console.log('   ID:', device.deviceId);
      console.log('   Status:', JSON.stringify(device.status));
    } else {
      console.log('❌ NOT FOUND via Mongoose Model.');
    }

    // 2. Try Raw Collection Access (Bypassing Schema)
    const rawDoc = await mongoose.connection.db
      .collection('devices')
      .findOne({ deviceId: targetId });
    if (rawDoc) {
      console.log('✅ FOUND via Raw MongoDB Driver!');
      console.log('   _id:', rawDoc._id);
      console.log('   ID:', rawDoc.deviceId);
    } else {
      console.log('❌ NOT FOUND via Raw Driver.');

      // List all device IDs to see what's actually there
      const all = await mongoose.connection.db
        .collection('devices')
        .find({})
        .project({ deviceId: 1 })
        .toArray();
      console.log(
            '   Available IDs in DB:',
            all.map((d) => d.deviceId)
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

debug();
