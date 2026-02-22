// scripts/resetCooldown.js
// Usage: node scripts/resetCooldown.js

const path = require('path');
// Load exclusively from root .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fetch = require('node-fetch');
const { setServers } = require('node:dns/promises');

// Set DNS servers to resolve records reliably
setServers(['1.1.1.1', '8.8.8.8']);

// Source of Truth for URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

async function reset() {
  console.log(`🔄 Requesting cooldown reset from ${API_URL}...`);

  try {
    const response = await fetch(`${API_URL}/api/test-notification/reset-cooldowns`, {
      method: 'POST',
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success:', data.message);
    } else {
      console.error('❌ Error:', data);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.log('Is the backend server running?');
  }
}

reset();
