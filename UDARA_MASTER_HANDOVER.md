# UDARA Master Handover Document

**Date:** February 4, 2026  
**Project:** Udara (Air Quality Monitoring System)  
**Stakeholders:** PhD Research Team & Development Team  

---

## 1. Project Overview & Roles
Udara is an end-to-end IoT solution for real-time air quality monitoring, data visualization, and hazardous event alerting.

*   **Farhan (Implementation Lead):** Mobile App Development (React Native/Expo).
*   **Lutfi (Web/Design Lead):** Web App Development (Next.js) and 3D Modeling/Enclosure Design.

---

## 2. System Architecture
The system is divided into four primary layers to ensure modularity and scalability.

### A. Edge Layer (Hardware)
*   **Main Controller:** Raspberry Pi 3b (Connected via Ethernet) + Geekworm X728 UPS (Short Auto turn on pins).
*   **Sensor Interface:** Arduino Mega (Handles analog signals, requires at least 8 analog pins).
*   **Air Quality Sensors:** 
    *   **PMS5003:** Laser scattering for PM1.0, PM2.5, PM10.
    *   **BME280:** Meteorological data (Temperature, Humidity, Pressure).
    *   **Alphasense 4-way AFE:** Specialized sensors for CO, SO2, NO2, and O3 (See Limitations).
*   **Communication:** MQTT (with TLS) for sending raw data to the backend.

### B. Data Layer (Storage)
*   **Database:** MongoDB Atlas (M0 Free Tier - 512MB).
*   **URI:** `mongodb+srv://tester1:tester123@cluster0.zgpimuy.mongodb.net/UMUdara?appName=Cluster0`
*   **Capacity:** Roughly 2031 days of storage for one device at current frequency.
*   **Local Storage (Mobile):** `AsyncStorage` (Session) and MMKV (Data cache).

### C. Application Layer (Backend)
*   **Platform:** Node.js/Express hosted on **Render** (Persistent Instance).
*   **Service URL:** `https://udara.onrender.com`
*   **Real-time Engine:** MongoDB Change Streams integrated to trigger sub-second push notifications via `expo-server-sdk`.

### D. Presentation Layer (Apps)
*   **Mobile App (Main Interface):** React Native / Expo.
    *   **Latest Build:** [Expo Build Link](https://expo.dev/accounts/4peng/projects/Udara/builds/cfa116ac-a719-4282-b1ee-81c6d1731a3a)
*   **Web Dashboard:** Next.js hosted on **Vercel**.
    *   **URL:** `https://udara-frontend.vercel.app/`

---

## 3. Data Schema Example
Data is stored in the `sensor_data_readings` collection. Below is a sample document structure:

```json
{
  "_id": "698322f7444d651d971e289a",
  "metadata": {
    "device_id": "Device_A",
    "topic": "lutfis/device_A_Test",
    "timestamp_server": "2026-02-04T10:44:07.952Z",
    "timestamp_device": "2026-02-04 18:44:07",
    "location": "FSKTM"
  },
  "temperature_c": 31.75,
  "pressure_hpa": 1006.06,
  "humidity_pct": 47.15,
  "pm1_0": 5,
  "pm2_5": 13,
  "pm10": 14,
  "alphasense_voltages": {
    "SN4_AE_V": 0.469,
    "SN2_AE_V": 0.425,
    "SN1_WE_V": 0.445
  }
}
```

---

## 4. Hardware Inventory & Costs
| Part Number | Description | Unit Price |
| :--- | :--- | :--- |
| CO-A4F | Carbon Monoxide (CO) Sensor | $87.50 |
| SO2-A4F | Sulfur Dioxide (SO2) Sensor | $80.00 |
| NO2-A43F | Nitrogen Dioxide (NO2) Sensor | $66.20 |
| OX-A431 | Ozone + Nitrogen Dioxide (O3+NO2) | $66.20 |
| 810-0023-00 | 4-way AFE for 4-pin A Series Sensors | $211.90 |

---

## 5. Current Limitations & Challenges (CRITICAL)
The following issues are identified as priorities for the research and development team:

1.  **Alphasense Sensor Reliability:** Currently not working properly, preventing accurate AQI calculation for specific gases.
    *   *Action:* Contact Mr. Khor (+60 16-438 9523) for calibration/troubleshooting.
2.  **Thermal Management:** Heat is trapped inside the enclosure, causing the BME280 to report inaccurate (inflated) temperature data.
    *   *Action:* Lutfi to revise the 3D print files to improve ventilation.
3.  **Connectivity Stability:** Intermittent data transmission issues where sensor data is not sent for periods, then suddenly resumes.
4.  **Scaling Constraints:** Dependency on multiple free-tier cloud services (Render, Vercel, MongoDB Free Tier) may limit performance if the number of users or devices increases significantly.

---

## 6. Resources & Contacts
*   **3D Print Files:** To be updated by Lutfi in the project repository.
*   **Sensor Datasheet:** [Alphasense 4-way AFE Catalog](https://pdf.directindustry.com/viewerCatalog/alphasense/afe-sensor-board/16860-592341.html#open)
*   **Technical Support:** 
    *   Hardware/Sensors: Mr. Khor (+60 16-438 9523)
    *   Mobile/Backend: Farhan (Implementation Lead)

---
**Document Status:** Finalized Organization.  
**Action Required:** Lutfi to upload 3D print files to the `assets/` directory.
