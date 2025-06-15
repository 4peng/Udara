# Air Quality Backend API

This is a Node.js Express server that connects to your MongoDB database and provides API endpoints for the React Native app.

## Setup Instructions

1. **Install Dependencies**
   \`\`\`bash
   cd backend
   npm install
   \`\`\`

2. **Start the Server**
   \`\`\`bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   \`\`\`

3. **Test the API**
   - Health check: http://localhost:3001/health
   - Get all devices: http://localhost:3001/api/devices
   - Get specific device: http://localhost:3001/api/devices/AQM-001

## API Endpoints

### GET /health
Returns server health status and database connection status.

### GET /api/devices
Returns all active devices from the MongoDB collection.

Response format:
\`\`\`json
{
  "success": true,
  "devices": [
    {
      "id": "AQM-001",
      "deviceId": "AQM-001",
      "name": "Device AQM-001",
      "location": "FSKTM",
      "coordinates": {
        "latitude": 3.128296,
        "longitude": 101.650734
      },
      "aqi": 75,
      "isMonitored": false,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    }
  ]
}
\`\`\`

### GET /api/devices/:deviceId
Returns detailed information for a specific device.

## Configuration

### MongoDB Connection
The server connects to your MongoDB cluster using the connection string:
\`\`\`
mongodb+srv://u2101912:RWW0wZUHEAORYCuK@cluster0.zgpimuy.mongodb.net/
\`\`\`

Database: `UMUdara`
Collection: `devices_mobile`

### Environment Variables (Optional)
You can set these environment variables:
- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `DB_NAME`: Database name

## Deployment Options

### 1. Local Development
Run the server locally on your development machine.

### 2. Cloud Deployment
Deploy to platforms like:
- **Heroku**: Easy deployment with Git
- **Railway**: Modern deployment platform
- **Render**: Free tier available
- **DigitalOcean App Platform**: Scalable hosting
- **AWS/Google Cloud/Azure**: Enterprise solutions

### 3. Ngrok (for testing)
Use ngrok to expose your local server to the internet:
\`\`\`bash
# Install ngrok
npm install -g ngrok

# Start your server
npm run dev

# In another terminal, expose port 3001
ngrok http 3001
\`\`\`

Then update your React Native app to use the ngrok URL.

## React Native Configuration

Update the API base URL in your React Native app:

\`\`\`typescript
// For local development
const API_BASE_URL = 'http://localhost:3001';

// For deployed backend
const API_BASE_URL = 'https://your-backend-url.com';

// For ngrok testing
const API_BASE_URL = 'https://abc123.ngrok.io';
\`\`\`

## Security Notes

1. **Environment Variables**: Move sensitive data to environment variables
2. **CORS**: Configure CORS for production domains
3. **Rate Limiting**: Add rate limiting for production
4. **Authentication**: Add API authentication if needed
5. **HTTPS**: Use HTTPS in production

## Adding Real AQI Data

To integrate real sensor readings:

1. Create a `readings` collection in MongoDB
2. Update the API endpoints to fetch real data
3. Add endpoints for historical data
4. Implement real-time updates with WebSockets

Example readings collection structure:
\`\`\`json
{
  "deviceId": "AQM-001",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "aqi": 75,
  "pm25": 18.5,
  "pm10": 45.2,
  "temperature": 24.5,
  "humidity": 65.2
}
