# GEMINI.md - Udara Project Context (Updated Jan 2026)

## Project Overview
**Udara** is an Air Quality Monitoring system featuring a React Native mobile app and a Node.js/Express backend. The system provides real-time AQI tracking, pollutant analysis, and instant threshold-based alerts.

## Architecture & Tech Stack

### Frontend (Mobile App)
*   **Framework:** React Native (Expo SDK 53, Native Build).
*   **Routing:** Expo Router (v5).
*   **Auth:** Firebase Auth with `@react-native-google-signin/google-signin` for native compliance.
*   **Persistence:** `AsyncStorage` for session persistence (no more forced re-logins).
*   **Notifications:** `expo-notifications` with backend registration and local/remote handling.

### Backend (API Service)
*   **Environment:** Persistent Node.js Server (Deployed on **Render**).
*   **Database:** MongoDB Atlas (Replica Set required for Change Streams).
*   **Real-time Engine:** **MongoDB Change Streams** integrated in `backend/jobs/realtimeMonitor.js`.
    *   Listens for new insertions in `sensor_data_readings`.
    *   Instantly matches data against User `subscriptions`.
    *   Triggers Push Notifications via `expo-server-sdk`.

## Recent Improvements & Fixes
*   **Native Auth:** Migrated from web-based `expo-auth-session` to native Google Sign-In to resolve security blocking and redirect issues.
*   **Session Persistence:** Fixed the bug where users were logged out on app restart by configuring `AsyncStorage` persistence in Firebase.
*   **Real-time Alerts:** Implemented a non-polling trigger system using MongoDB Change Streams. Alerts are now sub-second latency.
*   **Stability:** Resolved duplicate token registration calls and "400 Bad Request" race conditions in the frontend hooks.
*   **Deployment:** Successfully migrated backend from Vercel (Serverless) to Render (Persistent) to support background listeners.

## Key File Locations
*   `backend/api/index.js`: Main entry point (Render-compatible).
*   `backend/jobs/realtimeMonitor.js`: The "Engine" for real-time notifications.
*   `backend/scripts/simulateBadAir.js`: Test script for injecting hazardous data.
*   `hooks/usePushNotifications.ts`: Centralized, robust hook for notification handling.
*   `config/firebase.ts`: Firebase initialization with persistence.

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

### 3. Testing Alerts
Use the simulation script to trigger an alert for `Device_B`:
```bash
cd backend
node scripts/simulateBadAir.js
```

## Configuration Notes
*   **API Connection:** Configured in `config/api.ts`. Currently pointing to `https://udara.onrender.com`.
*   **Google Auth:** Requires valid SHA-1 in Google Cloud Console for the package `com.fourpeng.udara`.
*   **Change Streams:** Requires the MongoDB cluster to be a Replica Set (Atlas default).
