// model/Device.js - Refactored to match existing database structure
const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Removed uppercase: true to support "Device_B" mixed case
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String, // Added field
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number], // [longitude, latitude]
    },
    city: String,
    state: String,
    country: String,
    floor: String,
    room: String
  },
  // Refactored Status to match Object structure
  status: {
    operational: { type: String, default: "active" }, // active, inactive, etc
    connection: String, // online, offline
    lastSeen: Date,
    lastDataReceived: Date,
    mqttConnected: Boolean,
    minutesOffline: Number
  },
  hardware: {
    model: String,
    boardSerial: String,
    installationDate: Date,
    lastMaintenance: Date
  },
  sensors: {
    environmental: {
        type: Object,
        default: {} 
    },
    particulate: {
        type: Object,
        default: {}
    },
    gas: {
        type: Object,
        default: {}
    }
  },
  settings: {
    measurementInterval: Number,
    dataTransmissionInterval: Number,
    csvFallbackEnabled: Boolean,
    autoRecoveryEnabled: Boolean,
    alertThresholds: {
        type: Object, // Flexible thresholds (pm2_5 vs pm25)
        default: {}
    }
  },
  metadata: {
      owner: String,
      contact: Object,
      purpose: String,
      notes: String,
      tags: [String]
  },
  system: {
      firmware: Object,
      mqttConfig: Object,
      database: Object
  },
  statistics: Object,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { strict: false }); // Allow extra fields to prevent query failures

// Indexes
deviceSchema.index({ deviceId: 1 }, { unique: true });
deviceSchema.index({ "location.geoLocation": "2dsphere" });

module.exports = mongoose.model("Device", deviceSchema);
