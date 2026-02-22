// backend/scripts/testDb.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: false });
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 Attempting to connect to MongoDB...');
  console.log(`📍 URI: ${process.env.MONGODB_URI ? 'FOUND' : 'MISSING'}`);

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in your .env file!');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ SUCCESS: Connected to MongoDB!');
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);

    // List collections to verify access
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('\n📦 Available Collections:');
    if (collections.length === 0) {
      console.log('   (No collections found in this database)');
    } else {
      collections.forEach((c) => console.log(`   - ${c.name}`));
    }
  } catch (err) {
    console.error('\n❌ CONNECTION FAILED:');
    console.error(err.message);

    if (err.message.includes('IP not whitelisted')) {
      console.log(
        '\n💡 HINT: Check your MongoDB Atlas Network Access settings to ensure your current IP is allowed.'
      );
    }
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testConnection();
