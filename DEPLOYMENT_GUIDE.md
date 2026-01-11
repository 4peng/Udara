# Udara Deployment Guide - Google Sign-In Setup

Since you are deploying the app (building an APK/AAB for the store), the setup is stricter than local development. You cannot use `com.anonymous.Udara`.

## 1. Update Package Name (CRITICAL)
You must change the generic package name to something unique.

1. Open `app.json`.
2. Find `android.package` and change `com.anonymous.Udara` to something unique (e.g., `com.fourpeng.udara`).
3. Find `ios.bundleIdentifier` (if it exists) or add it: `"bundleIdentifier": "com.fourpeng.udara"`.

## 2. Get Production Signing Credentials (SHA-1)
Google Sign-In requires the SHA-1 fingerprint of the **Keystore that signs your release app**. This is DIFFERENT from your local debug keystore.

### If you are using EAS Build (Recommended)
1. Run this command in your terminal:
   ```bash
   npx eas-cli credentials
   ```
2. Select **Android** > **production** > **Keystore: ...**
3. Look for **SHA-1 Fingerprint**. Copy this string.
   * *Note: If you haven't done a build yet, you might need to run `eas build --platform android` once to let EAS generate a keystore for you, or set one up manually in the credentials menu.*

### If you are uploading to Google Play Console
If you use **Play App Signing** (Google manages your key):
1. Go to **Google Play Console** > **Release** > **Setup** > **App integrity**.
2. Look for the **App signing key certificate**.
3. Copy the **SHA-1 certificate fingerprint**.

## 3. Configure Google Cloud Console (Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a **New OAuth Client ID** > **Android**.
3. **Package name**: Enter the NEW name you chose in Step 1 (e.g., `com.fourpeng.udara`).
4. **SHA-1 certificate fingerprint**: Paste the Production SHA-1 you got in Step 2.
5. Click **Create**.
6. **Copy the Client ID** (This is your `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`).

## 4. Configure Environment Variables for Build
For the deployed app to know these IDs, they must be available at build time.

### Option A: EAS Secrets (Recommended)
Run these commands to upload your secrets to EAS:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "YOUR_WEB_CLIENT_ID"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "YOUR_NEW_ANDROID_CLIENT_ID"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "YOUR_IOS_CLIENT_ID"
```

### Option B: eas.json
Alternatively, add them to the `env` block in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "...",
        "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "..."
      }
    }
  }
}
```

## 5. Build for Production
Now you can build your production app:
```bash
eas build --platform android --profile production
```
