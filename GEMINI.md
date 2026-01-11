# GEMINI.md - Udara Project Context

## Project Overview

**Udara** ("Air" in Malay/Indonesian) is a comprehensive Air Quality Monitoring system consisting of a React Native mobile application and a Node.js/Express backend. The system tracks real-time air quality data from IoT devices, calculates AQI (Air Quality Index), and visualizes pollutant levels and environmental metrics.

### Key Features
*   **Real-time Monitoring:** Displays AQI, Temperature, and Humidity from connected devices.
*   **Pollutant Tracking:** detailed breakdown of PM2.5, PM10, NO2, SO2, and CO2 levels.
*   **Interactive Maps:** Uses Leaflet (via WebView) to visualize device locations and status.
*   **Historical Data:** Visualizes 24h, weekly, and monthly trends using `react-native-chart-kit`.
*   **AI Integration:** Includes Google Gemini (`@google/generative-ai`) integration, likely for data analysis or user assistance.

## Architecture & Tech Stack

### Frontend (Mobile App)
*   **Framework:** React Native (Expo SDK 53).
*   **Routing:** Expo Router (v5) with file-based routing in `app/`.
*   **Language:** TypeScript.
*   **UI/UX:** Custom components in `components/`, styled with standard React Native stylesheets.
*   **State/Data:** Uses `fetch` for API calls (configured in `config/api.ts`).

### Backend (API Service)
*   **Framework:** Express.js on Node.js.
*   **Database:** MongoDB (Atlas) - Database name: `UMUdara`.
*   **Collections:** `devices_mobile` (device registry), `pollutantdatas` (time-series data).
*   **Port:** 3001 (default).

## Directory Structure

*   `app/`: Application source code (screens and routing).
    *   `(tabs)/`: Main tab-based navigation (Home, Map, Sensors, Learn, Alerts).
    *   `(auth)/`: Authentication screens (Login, Signup).
*   `backend/` & `server/`: Backend API source code (appear to contain similar logic).
    *   `server.js` / `index.js`: Main entry point, handles MongoDB connection and API routes.
*   `components/`: Reusable UI components (Charts, Maps, Text).
*   `config/`: App-wide configuration.
    *   `api.ts`: API base URL and networking helpers.
    *   `mapbox.ts`: Mapbox configuration.
*   `assets/`: Images and fonts.

## Development Workflow

### Prerequisites
*   Node.js & npm
*   MongoDB connection string (embedded in `server.js` currently).

### 1. Start the Backend
The backend must be running for the app to fetch data.

```bash
cd backend
# or cd server
npm install
node server.js
```
*Server runs on Vercel at `https://udara-backend.vercel.app`.*

### 2. Start the Frontend (Expo)
In the root directory:

```bash
npm install
npx expo start
```
*   Press `a` for Android (requires Android Studio/Emulator).
*   Press `i` for iOS (requires Xcode/Simulator - macOS only).
*   Press `w` for Web.

### Configuration Notes
*   **API Connection:** The app is configured in `config/api.ts` to connect to `https://udara-backend.vercel.app` by default.

## Key Commands

| Task | Command |
| :--- | :--- |
| Start Expo | `npx expo start` |
| Run Android | `npx expo run:android` |
| Start Backend | `node backend/server.js` |
| Linting | `npm run lint` |
| Reset Project | `npm run reset-project` |

## Current Status & Observations
*   **Backend Duplication:** Both `backend/` and `server/` directories exist. `backend/server.js` and `server/index.js` appear to contain identical or very similar logic. Standardize on one if possible.
*   **Hardcoded Credentials:** MongoDB connection string is hardcoded in `server.js`. **Security Risk**: Should be moved to environment variables (`.env`).
*   **API Logic:** The backend performs AQI calculations on-the-fly based on raw pollutant data.
