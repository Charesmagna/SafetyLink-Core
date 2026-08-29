# SafetyLink Core

SafetyLink is a unified, highly optimized **Sequential Emergency Alert Network** designed to function seamlessly under restrictive offline, hardware-constrained, or distress scenarios. 

This repository operates under strict architectural guidelines defined in `AGENTS.md`.

## Features
* **Background Worker**: Fully decoupled BullMQ dispatch engine for triggering SMS and Voice through Twilio APIs. (Runs concurrently with the web server)
* **WebRTC Video**: High-priority real-time video feeds over ConnectyCube for active Distress situations.
* **Supabase Integration**: Native bindings pulling configuration credentials from the existing Supabase storage without manual user proxy mapping.

## Setup
All configurations for Twilio and ConnectyCube use your persistent cloud environment credentials automatically.

`npm install`
`npm run dev` 

Build Android locally:
`npm run cap:sync`
`cd android && ./gradlew assembleDebug`


## Mobile Application (APK)
* **Download Android App**: [SafetyLink.apk at www.safetylink.online 
