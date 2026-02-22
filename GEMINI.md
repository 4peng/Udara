# GEMINI.md - Udara Project Context (Updated Feb 2026)

## Project Overview
**Udara** is an Air Quality Monitoring system featuring a React Native mobile app and a Node.js/Express backend. The system provides real-time AQI tracking, pollutant analysis, and instant threshold-based alerts.

## Architecture & Tech Stack

### Frontend (Mobile App)
*   **Framework:** React Native (Expo SDK 53, Native Build).
*   **Routing:** Expo Router (v5).
*   **Auth:** Firebase Auth with `@react-native-google-signin/google-signin` for native compliance.
*   **Persistence:** `AsyncStorage` for session persistence (no more forced re-logins).
*   **Notifications:** `expo-notifications` with backend registration and local/remote handling.
*   **Connectivity:** `@react-native-community/netinfo` for offline detection and `OfflineBanner` UI.
*   **State Management:** React Context API for `Connectivity`, `Monitoring`, and `Notifications`.

### Backend (API Service)
*   **Environment:** Persistent Node.js Server (Deployed on **Render**).
*   **Database:** MongoDB Atlas (Replica Set required for Change Streams).
*   **Real-time Engine:** **MongoDB Change Streams** integrated in `backend/jobs/realtimeMonitor.js`.
    *   Listens for new insertions in `sensor_data_readings`.
    *   Instantly matches data against User `subscriptions`.
    *   Triggers Consolidated Push Notifications via `expo-server-sdk`.
*   **Data Management:** CSV bulk upload with validation and preview capabilities.

## Recent Improvements & Fixes
*   **Consolidated Alerts:** The realtime monitor now groups multiple pollutant violations into a single "AQI Alert" to prevent notification fatigue.
*   **CSV Bulk Upload:** Implemented `csv-upload` routes in the backend for efficient data ingestion from external sources.
*   **Offline Resilience:** Added a `ConnectivityProvider` and `OfflineBanner` to gracefully handle network interruptions.
*   **Monitoring Areas:** Introduced location-based monitoring areas in the frontend (`useDevicesWithMonitoring`) for better user control over which sensors trigger alerts.
*   **System Logging:** Added dedicated logging routes and models to track device status and system events.

## Key File Locations
*   `backend/api/index.js`: Main entry point (Render/Local compatible).
*   `backend/jobs/realtimeMonitor.js`: The "Engine" for real-time notifications.
*   `backend/routes/csvUpload.js`: Routes for CSV data management.
*   `backend/scripts/simulateBadAir.js`: Script to trigger hazardous air quality alerts.
*   `backend/scripts/registerDevices.js`: Script to setup initial mock devices.
*   `context/ConnectivityContext.tsx`: Global connectivity state.
*   `context/MonitoringContext.tsx`: Manages active monitoring areas.
*   `hooks/useDevicesWithMonitoring.ts`: Hook for managing devices within monitored areas.
*   `hooks/usePushNotifications.ts`: Centralized, robust hook for notification handling.
*   `config/api.ts`: Centralized API configuration and endpoint definitions.

## Development Workflow

### 1. Start the Backend (Local)
```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend (Expo)
Ensure you are using the native build for Firebase/Google Sign-In to work.
```bash
npx expo run:android
# or
npx expo run:ios
```

### 3. Setup Mock Devices
```bash
cd backend
node scripts/registerDevices.js
```

### 4. Testing Alerts
Use the simulation script to trigger an alert for `Device_B`:
```bash
cd backend
node scripts/simulateBadAir.js
```

## Configuration Notes
*   **API Connection:** Configured in `config/api.ts`. Currently pointing to `https://udara.onrender.com` by default.
*   **Google Auth:** Requires valid SHA-1 in Google Cloud Console for the package `com.fourpeng.udara` and a `google-services.json` file.
*   **Change Streams:** Requires the MongoDB cluster to be a Replica Set (Atlas default).
