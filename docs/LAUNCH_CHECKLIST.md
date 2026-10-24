# SafetyLink - Launch Checklist (private)

Owner: Tshilidzi Mukwevho (TM Media Solutions)

This file contains **no passwords, keys or tokens**. Secrets live only in GitHub Secrets and the Cloudflare Worker.

## 1. What works
- Rain SIM SMS gateway (SMSGate): delivered a test SMS to a real phone.
- "Please Call Me" forwarder (SMS to URL) reaches the server.
- Website, Android app and Worker build and deploy from GitHub.
- Firebase project `safetylink-99e56` and Android config are in place.
- Server can send loud alarm pushes once a phone has registered.

## 2. Not yet confirmed
- A real loud alarm ringing on a phone.
- Phone registration showing HTTP 200 in the app log.
- Full chain end to end: button, USSD, Rain, server, SMS and push to a contact.

## 3. Rotate before launch (these were visible in chat)
- [ ] Firebase service account key (delete old, create new, save as `FCM_SERVICE_ACCOUNT`)
- [ ] SMSGate password (Clear password in the app, save new as `SMSGATE_PASSWORD`)
- [ ] Upstash Redis token
- [ ] Twilio Auth Token
- [ ] Vapi private key
- [ ] GitHub personal access tokens (revoke and recreate)
- [ ] Cloudflare API tokens
- [ ] Any other key shown in chat

## 4. Privacy (South Africa, POPIA)
- [ ] Privacy notice in the app: what is stored, why, how long, who sees it
- [ ] Contacts told when added that they will receive alerts and their number is stored
- [ ] Delete-my-account option that removes profile, contacts and tokens
- [ ] Retention rule: inactive accounts deleted after an agreed period
- [ ] No permanent archive of everyone who has ever signed up
- [ ] Admin view of current users only, behind a login

## 5. Legal and protection
- [ ] Licence file for the app (all rights reserved) - review with a lawyer
- [ ] A private repository limits access but does not stop copying from the app itself
- [ ] The repository was public until recently: assume earlier clones exist

## 6. Service limits
- Rain SIM: 200 SMS per month, shared by all users. Set a warning before the limit.
- Twilio: trial account only reaches verified numbers. Upgrade before real use.
- Africa's Talking: not delivering. Not relied on.
- WhatsApp: token invalid. Not relied on.
- Live alerts are ON (`ALERTS_ENABLED = true`).

## 7. Tests before launch (in order)
- [ ] Sign in on the Android app with a real account; add one contact (your own number)
- [ ] App log shows "device token registration HTTP 200"
- [ ] No airtime or data: press panic, dial the USSD
- [ ] Rain phone forwards the "Please Call Me" (SMS to URL shows success)
- [ ] Contact receives the SMS through the Rain SIM
- [ ] Contact's phone rings with the loud alarm
- [ ] Second press within 10 seconds cancels the countdown
- [ ] Each provider's result appears in the audit trail

## 8. Contacts and hosting
- Data controller: Tshilidzi Mukwevho / TM Media Solutions
- Hosting: Cloudflare Workers (D1 database `safetylink-core`), GitHub Actions, Firebase (push)
