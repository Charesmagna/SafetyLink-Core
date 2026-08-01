const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/LocalNotificationService.ts');
let content = fs.readFileSync(file, 'utf8');

// replace the HTML5 notification logic
const oldHtml5 = `    // 1. Browser HTML5 Notifications API
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        try {
          new window.Notification(title, {
            body: body,
            tag: 'safetylink-status',
            icon: logoPolish,
            requireInteraction: isRunning && (activeSOSState !== 'IDLE'),
            silent: silent
          });
        } catch (err) {
          console.warn('[LocalNotificationService] Failed to show HTML5 notification:', err);
        }
      }
    }`;
const newHtml5 = `    // 1. Browser HTML5 Notifications API - Only alert if SOS is active to avoid spamming the user on desktop
    if (activeSOSState !== 'IDLE' && typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') {
        try {
          new window.Notification(title, {
            body: body,
            tag: 'safetylink-status-sos',
            icon: logoPolish,
            requireInteraction: true,
            silent: false
          });
        } catch (err) {
          console.warn('[LocalNotificationService] Failed to show HTML5 notification:', err);
        }
      }
    }`;

content = content.replace(oldHtml5, newHtml5);

const oldLog = `      console.log(
        \`[LocalNotificationService:web-sim] Device tray notification update (Real Device Notification Pushed): running=\${isRunning}, tick=\${tickCount}, SOS=\${activeSOSState}, location=\${locationStr}, paired=\${activeBleDevicesCount}\`
      );`;
const newLog = `      // Throttle logging to avoid console spam every 4 seconds, or only log if SOS is active
      if (tickCount % 15 === 0 || activeSOSState !== 'IDLE') {
        console.log(
          \`[LocalNotificationService:web-sim] Device tray notification update (Real Device Notification Pushed): running=\${isRunning}, tick=\${tickCount}, SOS=\${activeSOSState}, location=\${locationStr}, paired=\${activeBleDevicesCount}\`
        );
      }`;
content = content.replace(oldLog, newLog);

fs.writeFileSync(file, content);
