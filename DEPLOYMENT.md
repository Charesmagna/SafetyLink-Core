# SafetyLink Core — Automated Deployment Guide

This guide details the steps to configure and execute automated builds and deployments for SafetyLink Core using Fastlane and GitHub Actions.

---

## 1. Prerequisites & Secrets

To run the pipeline successfully, you must register the following secrets in your GitHub Repository under **Settings > Secrets and variables > Actions**:

| Secret Key | Description | Example / Format |
| :--- | :--- | :--- |
| `KEYSTORE_BASE64` | Base64 encoded string of your Android release keystore (.jks) file | `MIIJQgIBAzADBgkqhkiG9w0BBw...` |
| `STORE_PASSWORD` | Password used to secure your keystore file | `YourKeystorePasswordHere` |
| `KEY_PASSWORD` | Key password for your upload key alias | `YourKeyAliasPasswordHere` |
| `FIREBASE_APP_ID` | Your unique Firebase Android App ID | `1:123456789012:android:abcdef1234567890` |
| `FIREBASE_CLI_TOKEN` | Token retrieved from running `firebase login:ci` | `1//0gS...` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Content of your Google Developer Console service account credentials file | `{ "type": "service_account", ... }` |

---

## 2. Generating Keystore Base64

To convert your existing `my-upload-key.jks` file into a Base64 string for GitHub secrets, run the following command in your terminal:

### On macOS / Linux:
```bash
base64 -i my-upload-key.jks -o keystore_base64.txt
# Copy the contents of keystore_base64.txt to GitHub secrets
```

### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("my-upload-key.jks")) > keystore_base64.txt
```

---

## 3. Fastlane Lane Execution

You can run Fastlane tasks locally if you have Ruby installed. Navigate to the project root and run:

### Local Debug APK Build:
```bash
bundle exec fastlane debug
```

### Internal Beta Distribution (Firebase App Distribution):
```bash
export KEYSTORE_PATH="path/to/my-upload-key.jks"
export STORE_PASSWORD="keystore_password"
export KEY_PASSWORD="key_password"
export FIREBASE_APP_ID="your_firebase_app_id"

bundle exec fastlane beta
```

### Google Play Production Build (AAB Bundle):
```bash
bundle exec fastlane release
```

---

## 4. Pipeline Triggering Rules

* **Debug Build**: Triggered automatically on every push or pull request to the `main` or `master` branches.
* **Beta Distribution**: Triggered by tagging a commit with a release tag matching `v*.*.*-beta*` (e.g. `git tag -a v1.0.0-beta1 -m "Internal Beta" && git push origin v1.0.0-beta1`).
