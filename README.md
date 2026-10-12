# SafetyLink Core

Contact-chain emergency alerts: sequential SMS, WhatsApp, and voice to people the user chose. This does not call SAPS 112, and it does not dispatch armed response or drones unless a real responder contract is connected.

## Android app

Signed release **v1.1.965**:

https://github.com/Charesmagna/SafetyLink-Core/releases/download/v1.1.965/SafetyLink-v1.1.965-Signed.apk

https://safetylink.online/download/apk redirects to that file.

## Setup

Copy `.env.example` to `.env` and fill in your own keys. Do not commit real secrets.

```
npm install
npm run dev
```

Android debug build:

```
npm run cap:sync
cd android && ./gradlew assembleDebug
```
