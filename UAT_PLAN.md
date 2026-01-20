# User Acceptance Testing (UAT) Plan: Project UDARA

**Project Title:** UDARA: Development of a Low-Cost IoT-Enabled Personal Air Quality Monitoring Device
**Version:** 1.2
**Date:** January 20, 2026
**Status:** Ready for Execution

---

## 1. Introduction
### 1.1 Objective
The primary objective of this User Acceptance Testing (UAT) is to ensure that the UDARA system meets the business requirements and user needs of the University of Malaya community. This phase validates the end-to-end flow of air quality data from IoT sensors to the user interfaces (Mobile and Web).

### 1.2 Scope
This plan covers:
*   **UDARA Mobile Application:** Real-time monitoring, alerts, and educational modules.
*   **UDARA Web Dashboard:** Historical analytics, reporting, and device management.
*   **System Integration:** Accuracy of data transmission and notification delivery.

### 1.3 Testing Roles
| Role | Responsibility |
| :--- | :--- |
| **General User (Student/Staff)** | Validates the mobile app's usability and the relevance of alerts. |
| **Researcher/Admin (UMSDC)** | Validates data integrity, historical trends, and reporting tools. |
| **Project Developer** | Provides technical support and logs identified defects. |

---

## 2. Prerequisites & Environment
*   **Hardware:** Active ESP32/Raspberry Pi sensor nodes deployed on campus.
*   **Mobile:** Test devices running Android 8+ or iOS 14+.
*   **Web:** Access to UDARA URL via Chrome, Firefox, or Safari.
*   **Database:** MongoDB database active and seeded with test accounts.

---

## 3. Mobile Application System Testing

| No | Test Description |
| :--- | :--- |
| **1.0** | **Module 1: Registration** |
| 1.1 | Verify that a new user can register by entering valid details (Name, Email, Password) and completing email verification. |
| 1.2 | Verify that the system validates email formats and checks for uniqueness against the existing database. |
| **2.0** | **Module 2: Authentication** |
| 2.1 | Verify that the user can successfully log in using "Sign in with Google" (Native Google Auth). |
| 2.2 | Verify that the user remains logged in after closing and reopening the application (Session Persistence). |
| 2.3 | Verify that the user can successfully log out and the session is terminated. |
| 2.4 | Verify the 'Forgot Password' functionality sends a reset link to the registered email. |
| **3.0** | **Module 3: Profile Account and Management** |
| 3.1 | Verify that the user can view their profile details and update information (e.g., Name). |
| 3.2 | Verify that the user can request account deletion with a confirmation prompt. |
| **4.0** | **Module 4: Notification System** |
| 4.1 | Verify that users can set custom AQI thresholds for alerts in the settings. |
| 4.2 | Verify that push notifications are received instantly when AQI exceeds user-defined limits. |
| 4.3 | Verify that the system maintains a notification history accessible within the app. |
| **5.0** | **Module 5: Educational** |
| 5.1 | Verify that the educational module displays categorized pollutant information and health advice. |
| 5.2 | Verify that health recommendations are dynamically updated based on the current AQI level. |
| **6.0** | **Module 6: Real-time Data Operation** |
| 6.1 | Verify that the mobile dashboard displays live AQI, Temperature, and Humidity. |
| 6.2 | Verify that data auto-refreshes periodically to reflect the latest sensor readings. |
| 6.3 | Verify that the interactive map displays sensor locations with color-coded AQI pins. |

### 3.1 Non-Functional Requirements (Mobile)
| No | Requirement | Description |
| :--- | :--- | :--- |
| NFR-M-01 | **Performance** | App launch time should be under 3 seconds on standard 4G networks. |
| NFR-M-02 | **Usability** | All critical paths (view AQI, set alert) should be achievable within 3 taps. |
| NFR-M-03 | **Reliability** | App should handle network loss gracefully, showing cached data and an offline indicator. |
| NFR-M-04 | **Battery Usage** | Background monitoring should not consume more than 5% battery per hour. |

---

## 4. Web Application System Testing

| No | Test Description |
| :--- | :--- |
| **2.0** | **Module 2: Authentication** |
| 2.1 | Verify that the 'Admin Login' form accepts valid credentials (email/password) and redirects to the Dashboard. |
| 2.2 | Verify that the system displays an error message "Invalid credentials" when logging in with an incorrect password. |
| 2.3 | Verify that Role-Based Access Control (RBAC) prevents non-admin users from accessing protected routes. |
| 2.4 | Verify that accessing protected pages without a session redirects the user to the login page. |
| **6.0** | **Module 6: Real-time Data Operation** |
| 6.1 | Verify that the Dashboard main view loads and displays the real-time air quality index (AQI) summary. |
| 6.2 | Verify that the interactive Map component renders correctly and displays markers for active devices. |
| 6.3 | Verify that clicking a device marker on the Map opens a tooltip with that device's status. |
| 6.4 | Verify that the device search bar correctly filters devices by Name, ID, or Location Address. |
| **7.0** | **Module 7: Historical Data and Analytics** |
| 7.1 | Verify that the 'Analytics' page displays historical trend charts for sensor data. |
| 7.2 | Verify that the date range picker correctly filters the charts (e.g., "Last 7 Days", "Last 30 Days"). |
| 7.3 | Verify that comparative tools allow selecting two different devices and display their data side-by-side. |
| 7.4 | Verify that the default history view loads the last 24 hours of data for a selected device. |
| **8.0** | **Module 8: Data Management and Storage** |
| 8.1 | Verify that the 'Import Data' feature accepts valid CSV files and parses sensor records. |
| 8.2 | Verify that the CSV Validator rejects files missing required columns (e.g., Timestamp, PM2_5). |
| 8.3 | Verify that the Bulk Upload process provides a summary of results (Inserted, Duplicates, Failed). |
| 8.4 | Verify that 'Generate Report' creates a downloadable PDF/CSV summary of the selected data range. |
| **9.0** | **Module 9: Device and System Management** |
| 9.1 | Verify that the 'Add Device' form successfully creates a new device entry with validation. |
| 9.2 | Verify that existing device details (Location, Status) can be updated via the 'Edit Device' form. |
| 9.3 | Verify that the 'User Management' list allows filtering users by Role (Admin/Researcher/User). |
| 9.4 | Verify that System Logs can be filtered by Severity (e.g., Critical, High). |
| 9.5 | Verify that resolving a log entry allows adding an administrative note explaining the resolution. |

### 4.1 Non-Functional Requirements (Web)
| No | Requirement | Description |
| :--- | :--- | :--- |
| NFR-W-01 | **Performance** | Dashboard charts should render within 2 seconds for datasets under 1,000 records. |
| NFR-W-02 | **Security** | All data transmission must be encrypted via HTTPS/TLS 1.2+. |
| NFR-W-03 | **Compatibility** | The dashboard must be fully functional on Chrome (v90+), Firefox (v88+), and Safari (v14+). |
| NFR-W-04 | **Scalability** | The system must handle concurrent data streams from at least 50 active devices without lag. |

---

## 5. Acceptance Criteria
The system is ready for final deployment if:
1.  **Functional:** 100% of "High" priority requirements are executed successfully.
2.  **Accuracy:** Real-time data on Mobile/Web matches the raw sensor output.
3.  **Stability:** No system-wide crashes during concurrent multi-user testing (50+ users).
4.  **Performance:** Dashboard and reports load within 5-10 seconds.

---

## 6. Sign-off
*By signing below, stakeholders acknowledge that the system meets the requirements specified.*

| Name | Role | Signature | Date |
| :--- | :--- | :--- | :--- |
| Wan Ahmad Lutfi | Developer | | |
| Nor Farhan Fitri | Developer | | |
| Dr. Siti Hafizah | Supervisor | | |
| Dr. Fong Chng Saun | Collaborator | | |