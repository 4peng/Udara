# ✦ Comprehensive Setup Guide: Udara Air Quality System & Android Emulator

This guide provides the exact steps needed to replicate the Udara air quality monitoring system from scratch, including setting up an Android emulator via the command line. The system consists of a Node.js/Express backend and a React Native (Expo) frontend.

---

## Part 1: Android Emulator Command-Line Setup

This section explains how to install and run the Android Emulator using only the command line, without installing the full Android Studio. 

### Prerequisites
* **Java (JDK) 17:** Must be installed and in your system PATH (ensure override `JAVA_HOME` is checked).
* **Node.js:** v18 or higher.
* **Internet connection:** To download SDK components (~2-4GB).

### Step 1: Create Directory and Download Tools
Download the Command Line Tools from the Android Developers website and structure your folders exactly like this:

```text
C:\Android\
└── cmdline-tools\
    └── latest\
        ├── bin\
        ├── lib\
        └── [other files]

```

### Step 2: Set Environment Variables

Open PowerShell as Administrator and run the following to set your paths:

```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android', 'User')
[System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', 'C:\Android', 'User')
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
[System.Environment]::SetEnvironmentVariable('Path', "$currentPath;C:\Android\cmdline-tools\latest\bin;C:\Android\platform-tools;C:\Android\emulator", 'User')

```

### Step 3: Install SDK Components & Hypervisor

In PowerShell, run this command to download the emulator, platform tools, and system image (accept licenses when prompted):

```powershell
echo y | C:\Android\cmdline-tools\latest\bin\sdkmanager.bat --sdk_root=C:\Android "platform-tools" "platforms;android-35" "build-tools;35.0.0" "system-images;android-35;google_apis;x86_64" "emulator"

```

To prevent lagging, download and install the Hypervisor driver (requires Admin permission):

```powershell
echo y | C:\Android\cmdline-tools\latest\bin\sdkmanager.bat --sdk_root=C:\Android "extras;google;Android_Emulator_Hypervisor_Driver"

Start-Process -FilePath "C:\Android\extras\google\Android_Emulator_Hypervisor_Driver\silent_install.bat" -Verb RunAs

```

### Step 4: Create and Start your Virtual Phone (AVD)

Create a specific device configuration (we will call it `MyPixel`):

```powershell
echo no | C:\Android\cmdline-tools\latest\bin\avdmanager.bat create avd -n MyPixel -k "system-images;android-35;google_apis;x86_64" --device "pixel_8"

```

**Important:** Fix the "Path" bug where the tool sometimes adds an extra folder name to the config file:

```powershell
(Get-Content -Path $env:USERPROFILE\.android\avd\MyPixel.avd\config.ini) -replace 'image.sysdir.1=Android\\system-images', 'image.sysdir.1=system-images' | Set-Content -Path $env:USERPROFILE\.android\avd\MyPixel.avd\config.ini

```

Start the emulator:

```powershell
emulator -avd MyPixel

# If that doesn't work, try forcing software rendering:
# emulator -avd MyPixel -gpu swiftshader

```

---

## Part 2: Udara Cloud Infrastructure Setup

Udara uses Firebase as the Identity Manager and Google Cloud as the OAuth Credential Provider for Native Google Sign-In, alongside MongoDB Atlas for real-time data.

### Phase 1: Firebase & Google Cloud Setup

1. **Create a Firebase Project:** Go to the Firebase Console, click Add Project, and name it `Udara`.
2. **Register the Android App:**
* Package Name: `com.fourpeng.udara` (Must match `app.json`).
* SHA-1 Fingerprint: Get this by running `cd android && ./gradlew signingReport`. Copy the SHA-1 from the debug variant.
* Download `google-services.json` and move it to the root directory (ensure `app.json` points to it) and `android\app\`.


3. **Enable Authentication:** In Firebase Sidebar, go to **Build > Authentication > Get Started**. Enable Email/Password and Google.
4. **Configure Google Cloud Console:**
* Go to the Google Cloud Console and select your Firebase project.
* Navigate to **APIs & Services > Credentials**. Ensure an Android Client ID exists with your SHA-1.
* Note the Web Client ID (Auto-created) for the frontend `.env`.



### Phase 2: MongoDB Atlas Setup

The backend requires MongoDB Change Streams for real-time alerts, which necessitates a Replica Set (standard on all Atlas tiers).

1. **Deploy a Cluster:** Sign up at MongoDB Atlas and select the M0 (Free) tier.
2. **Database Access:** Create a user with a strong password.
3. **Network Access:** Add IP `0.0.0.0/0` (Allow access from anywhere) for development.
4. **Get Connection String:** Click **Connect > Drivers** and copy the `mongodb+srv://...` URI.

---

## Part 3: Udara Project Setup

The frontend is the source of truth for the API URL used by both the app and maintenance scripts. The backend handles data ingestion, real-time monitoring, and notifications.

### Backend Setup

1. Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install

```


2. Create a `.env` file in the `backend/` directory:
```env
PORT=4000
MONGODB_URI=your_mongodb_atlas_connection_string
CLERK_SECRET_KEY=your_clerk_secret_if_applicable

```


3. Seed your MongoDB with mock sensors for the map:
```bash
node scripts/registerDevices.js

```


4. Start the Backend:
```bash
npm run dev

```


*Verify: "MongoDB connected successfully"*

### Frontend (React Native) Setup

1. Navigate to the root directory and install dependencies:
```bash
npm install expo
npm install

```


2. Create a `.env` file in the root directory:
```env
# ONE place to change for local vs production (App and Scripts follow this)
# Change to '[https://udara.onrender.com](https://udara.onrender.com)' for production, 'http://localhost:4000' for local
EXPO_PUBLIC_API_URL=http://localhost:4000

# Firebase Configuration (From Firebase Project Settings)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=1:your_app_id

# Google Sign-In (From Google Cloud Credentials)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id

```


3. Setup Expo Project ID (Required for Push Notifications):
```bash
npx expo login
npx eas project:init

```


4. Start the Frontend:
```bash
npx expo run:android

```



> **Note:** If the Android Emulator app cannot connect to the backend, ensure `EXPO_PUBLIC_API_URL` is set to `http://localhost:4000`. The app logic automatically maps this to `10.0.2.2:4000` for Android.

---

## Part 4: EAS Build & Push Notifications

To develop and test Firebase Cloud Messaging (FCM), you must use EAS Build to create a Development Client, as standard Expo Go cannot handle custom native code.

1. **Configure FCM Key:** In Firebase Console > **Project Settings > Service Accounts**, Generate a New Private Key (`.json`).
2. **Upload Key to Expo:** Run `eas credentials:add --platform android` globally and upload the `.json` file when prompted for the FCM Server Key.
3. **Build the Client:** Log in (`eas login`) and run:
```bash
eas build --profile development --platform android

```


4. **Install & Run:** Download the resulting APK to your device/emulator. Start the server with `npx expo start --dev-client` and open the app to connect.

---

## Part 5: Udara Script & Command Reference

All backend scripts in `backend/scripts/` are "Smart Clients": they automatically load secrets from `backend/.env` and the API URL from the root `.env`.

| Command / Script | Category | Description |
| --- | --- | --- |
| `npm run dev` *(in /backend)* | Server | Starts the Node.js API with Nodemon. |
| `npx expo run:android` | Server | Builds and runs the Android app locally. |
| `testDb.js` | Utility | Verifies MongoDB Atlas connectivity and lists collections. |
| `registerDevices.js` | Setup | Seeds MongoDB with mock sensors (Device_A, Device_B). Essential for fresh installs. |
| `debugDevice.js` | Debug | Troubleshoots specific device visibility bypassing Mongoose schema if necessary. |
| `checkSubscriptions.js` | Logic | Validates which users are monitoring which sensors for alerts. |
| `checkNotifications.js` | Audit | Compares In-App notification history with global Push notification logs. |
| `simulateBadAir.js` | Test | Triggers a full End-to-End alert by injecting a PM2.5 = 150.5 reading for Device_B. |
| `resetCooldown.js` | Test | Bypasses the 1-hour anti-spam cooldown, allowing instant consecutive testing. |
| `testPushNotifications.js` | Test | Direct test of the Expo Push service bypassing air quality logic. |

**To run an End-to-End Alert Test:**

1. Ensure the app is running and your user is subscribed to `Device_B`.
2. Reset Cooldowns: `node backend/scripts/resetCooldown.js`
3. Simulate Bad Air: `node backend/scripts/simulateBadAir.js`
4. *Result: A push notification should appear instantly.*

```
