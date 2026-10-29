# SafetyLink: version 1 (locked) and version 2 (in development)

## Rules
- **Version 1 is locked.** Tag `golden-v1` and branch `main`. No changes to version 1, ever.
- **All new work happens on `v2` only.**
- **Website download hub** shows two items:
  1. *SafetyLink version 1 (stable, recommended):* the golden APK. Uses native calls, SMS and the airtime and data route. No offline USSD.
  2. *SafetyLink version 2 (in development):* the latest v2 build, labelled as in development.
- Only `main` publishes version 1. v2 builds publish to their own address and version list.

## Version 2 requirements (to build)
1. **One dispatch only.** Turn off the old web-store dispatch on v2. Every panic goes through `PanicSequence` (native).
2. **Countdown and route choice.** The countdown screen already exists. Enforce it: during the countdown, pressing the button again cancels, and the route choice is shown.
3. **Dispatch order, one step at a time:**
   - Step 1: server (if there is data), with the alert and profile.
   - Step 2: SMS to every contact set to receive SMS, with the full details.
   - Step 3: native call to the first priority call contact. Failed if not connected within 7 s, including insufficient airtime. The call is hung up after 7 s.
   - Step 4: USSD Please Call Me to the Rain number. The Rain phone forwards it, and the server replies with the contact to message, sent from the Rain SIM.
   - The server contacts the rest through the AI voice route (Twilio, Africa's Talking, then Vapi).
4. **WhatsApp only** when a WhatsApp number is set for that contact. Never open WhatsApp by default.
5. **Press rules:** 200 ms debounce; first press starts the countdown; a press during the countdown cancels; a quick second press (configurable window) runs the double-press action; five presses dispatch immediately.
6. **Lock screen** (already exists): enforce it during a dispatch. Released only by the single PIN (the same PIN as the panic cancel).
7. **Auto-start after reboot:** the app starts after the phone is turned on, even after a power-off or battery saver, as long as the overlay permission was granted during setup.
8. **iTAG reconnect:** if the iTAG is disconnected while Bluetooth is on, the app reconnects on its own. It never requires setup again. If Bluetooth is off, show a reconnect notification that overlays every screen, including calls and WhatsApp.
9. **Superadmin login:** the sign-in fails for some users. Fix it, and confirm the admin list loads.

## Status
- Built on v2: `PanicSettings`, `PinManager`, `PanicSequence`, `DispatchRunner`, iTAG routed into `PanicSequence`.
- Not built yet: items 1, 2 (enforcement), 3 (wiring data), 6, 7, 8, 9, and the download hub split (version 1 and version 2).
