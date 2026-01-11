# Udara - Air Quality Monitoring System

**Udara** ("Air" in Malay/Indonesian) is a comprehensive IoT-based Air Quality Monitoring system. It consists of a **React Native (Expo)** mobile application for visualization and user interaction, and a **Node.js/Express** backend for data processing and storage.

## 🚀 Project Overview

The system allows users to:
*   **Monitor Real-time Air Quality:** View AQI (Air Quality Index), PM2.5, PM10, CO2, NO2, and SO2 levels.
*   **Track Environmental Metrics:** Monitor temperature and humidity from connected IoT devices.
*   **Visualize Data:** Interactive charts for 24h, weekly, and monthly trends.
*   **Map Interface:** View device locations and their status on a map.
*   **Receive Alerts:** (Planned) Push notifications for hazardous air quality.

## 🛠 Tech Stack

### **Frontend (Mobile)**
*   **Framework:** React Native (Expo SDK 53)
*   **Language:** TypeScript
*   **Routing:** Expo Router v5 (File-based routing)
*   **Maps:** `react-native-maps` / `react-native-leaflet-view`
*   **Charts:** `react-native-chart-kit`
*   **Styling:** Standard React Native Stylesheets

### **Backend (API)**
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB (Atlas)
*   **Authentication:** Firebase Auth (Client-side)

---

## 📂 Project Structure

```
E:\udara\
├── .env                    # Frontend Environment Variables (API URL, Firebase keys)
├── app/                    # Frontend Source Code (Expo Router)
│   ├── (auth)/             # Authentication Routes (Login, Signup)
│   ├── (tabs)/             # Main Tab Navigation (Home, Map, Sensors, etc.)
│   ├── sensor/             # Dynamic Sensor Detail Routes
│   └── _layout.tsx         # Root Layout Configuration
├── assets/                 # Static Assets (Images, Fonts)
├── backend/                # Backend Source Code
│   ├── .env                # Backend Environment Variables (DB URI, Port)
│   ├── server.js           # Main Server Entry Point
│   └── utils/              # Helper Functions (AQI Calculation)
├── components/             # Reusable UI Components
├── config/                 # App Configuration (API, Firebase)
├── hooks/                  # Custom React Hooks (Data Fetching)
└── utils/                  # Frontend Utilities
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
*   **Node.js** (v18+ recommended)
*   **npm** or **yarn**
*   **MongoDB Atlas** Connection String
*   **Firebase Project** (for Authentication)

### 2. Backend Setup
The backend handles data fetching from MongoDB and AQI calculations.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend/` directory:
    ```ini
    PORT=3001
    MONGODB_URI=your_mongodb_connection_string_here
    DB_NAME=UMUdara
    ```
4.  Start the server:
    ```bash
    npm start
    # Backend API is hosted on Vercel
# https://udara-backend.vercel.app
    ```

### 3. Frontend Setup
The frontend is built with Expo.

1.  Navigate back to the root directory:
    ```bash
    cd ..
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the **root** directory:
    ```ini
# Use https://udara-backend.vercel.app for production and development
EXPO_PUBLIC_API_URL=https://udara-backend.vercel.app

    # Firebase Configuration
    EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
    EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
    ```
4.  Start the Expo development server:
    ```bash
    npx expo start
    ```
    *   Press **`a`** to open in Android Emulator.
    *   Press **`i`** to open in iOS Simulator (macOS only).
    *   Scan the QR code with the **Expo Go** app on your physical device.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/devices` | List all active devices with latest AQI |
| `GET` | `/api/devices/:id` | Get detailed data for a specific device |
| `GET` | `/api/devices/:id/history` | Get historical pollutant data |
| `GET` | `/health` | Server health check |

---

## 🧩 Key Components

*   **`backend/utils/aqiCalculator.js`**: Contains the logic for converting raw pollutant concentrations (PM2.5, PM10, etc.) into a standardized AQI score (0-300+ scale).
*   **`hooks/useDevices.ts`**: Custom hook that handles fetching device lists from the API.
*   **`app/(tabs)/map.tsx`**: Renders the interactive map using Leaflet/Mapbox.

## 🐛 Troubleshooting

*   **Network Error / Fetch Failed:**
    *   Ensure the backend is running (`npm start` in `backend/`).
    *   Check your `EXPO_PUBLIC_API_URL`. It should be set to `https://udara-backend.vercel.app` for the production backend.
*   **MongoDB Connection Error:**
    *   Check your `MONGODB_URI` in `backend/.env`.
    *   Ensure your IP address is whitelisted in MongoDB Atlas Network Access.

## 📝 License 

This project is for educational and development purposes.