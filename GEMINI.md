# GEMINI.md - Udara Project Context

## Project Overview

**Udara** ("Air" in Malay/Indonesian) is a comprehensive Air Quality Monitoring system consisting of a React Native mobile application and a Node.js/Express backend. The system tracks real-time air quality data from IoT devices, calculates AQI (Air Quality Index), and visualizes pollutant levels and environmental metrics.

### Key Features
*   **Real-time Monitoring:** Displays AQI, Temperature, and Humidity from connected devices via a unified dashboard.
*   **Pollutant Tracking:** Detailed breakdown of PM2.5, PM10, NO2, SO2, and CO2 levels with gas conversion utilities.
*   **Interactive Maps:** Uses Leaflet (via WebView) to visualize device locations and real-time status.
*   **Historical Data:** Visualizes trends (24h, weekly, monthly) using `react-native-chart-kit`.
*   **Push Notifications:** Integrated with Expo Notifications for real-time alerts on air quality changes.
*   **AI Integration:** Includes Google Gemini (`@google/generative-ai`) integration for data analysis and assistance.

## Architecture & Tech Stack

### Frontend (Mobile App)
*   **Framework:** React Native (Expo SDK 53).
*   **Routing:** Expo Router (v5) with file-based routing in `app/`.
*   **Language:** TypeScript.
*   **State/Data:** Context API (`MonitoringContext`, `NotificationContext`) and custom hooks for data fetching.
*   **Authentication:** Integrated with Firebase (configured in `config/firebase.ts`).
*   **Background Tasks:** Uses `expo-task-manager` and `expo-background-fetch` for background monitoring.

### Backend (API Service)
*   **Framework:** Express.js on Node.js (v5.1.0).
*   **Deployment:** Vercel (Serverless Functions).
*   **Database:** MongoDB (Atlas) using Mongoose ODM.
*   **User Management:** Clerk SDK for backend user profiles.
*   **Push Notifications:** `expo-server-sdk` for sending notifications to mobile devices.
*   **Port:** 4000 (local default).

## Directory Structure

*   `app/`: Application source code (screens and routing).
    *   `(tabs)/`: Main tab-based navigation (Home, Map, Sensors, Learn, Alerts, Settings).
    *   `(auth)/`: Authentication screens (Login, Signup, Forgot Password).
    *   `learn/`: Educational content about air quality.
    *   `sensor/`: Detailed views for individual sensor devices.
*   `backend/`: Backend API source code.
    *   `api/index.js`: Main entry point (Vercel serverless function).
    *   `model/`: Mongoose schemas (Device, SensorReading, User, Notification, etc.).
    *   `routes/`: API route definitions.
    *   `utils/`: Server-side utilities (gas conversion, external APIs).
*   `components/`: Reusable UI components.
*   `context/`: React Context providers for global state.
*   `hooks/`: Custom React hooks for business logic and data fetching.
*   `config/`: App-wide configuration (API, Firebase).
*   `tasks/`: Background task definitions for Expo.
*   `utils/`: Shared frontend utilities (AQI calculations, formatting).

## Development Workflow

### Prerequisites
*   Node.js & npm
*   MongoDB Atlas account
*   Firebase project (for frontend auth)
*   Clerk account (for backend user management)

### 1. Start the Backend
The backend uses environment variables for configuration. Ensure `backend/.env` exists with `MONGODB_URI`.

```bash
cd backend
npm install
npm run dev
```
*Local server runs on `http://localhost:4000`.*

### 2. Start the Frontend (Expo)
In the root directory:

```bash
npm install
npx expo start
```
*   **Android:** Press `a` (requires Emulator).
*   **iOS:** Press `i` (requires Simulator).
*   **Web:** Press `w`.

### Configuration Notes
*   **API Connection:** Configured in `config/api.ts`. Defaults to `http://10.0.2.2:4000` for Android emulators.
*   **Vercel:** The backend is configured for Vercel via `backend/vercel.json`.

## Key Commands

| Task | Command |
| :--- | :--- |
| Start Expo | `npx expo start` |
| Start Backend (Dev) | `cd backend && npm run dev` |
| Run Android | `npx expo run:android` |
| Linting | `npm run lint` |
| Format Backend | `cd backend && npm run format` |

## Current Status & Observations
*   **Modernized Backend:** The backend has been migrated to a serverless-friendly structure in `backend/api/index.js` and uses environment variables.
*   **Robust State Management:** The app uses specialized contexts and hooks for monitoring and notifications.
*   **Background Monitoring:** Implemented background tasks to keep users informed even when the app is closed.
*   **Data Visualization:** Extensive use of charts and maps for intuitive data representation.