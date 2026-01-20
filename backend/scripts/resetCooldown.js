// scripts/resetCooldown.js
// Usage: node scripts/resetCooldown.js

const fetch = require('node-fetch');

// Default to local, but allow environment override
const API_URL = process.env.API_URL || 'http://localhost:4000';

async function reset() {
  console.log(`🔄 Requesting cooldown reset from ${API_URL}...`);
  
  try {
    const response = await fetch(`${API_URL}/api/test-notification/reset-cooldowns`, {
      method: 'POST'
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
