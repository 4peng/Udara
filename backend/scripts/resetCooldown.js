// scripts/resetCooldown.js
// Usage: node scripts/resetCooldown.js

const fetch = require('node-fetch');

// Default to Render (Production), use 'http://localhost:4000' for local testing
const API_URL = process.env.API_URL || 'https://udara.onrender.com';

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
