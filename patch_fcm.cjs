const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const importTarget = `import { App as CapApp } from '@capacitor/app';`;
const newImport = `import { App as CapApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';`;

const target = `    setupSurvivalListener();`;

const replacement = `    setupSurvivalListener();

    // FCM Push Notification Setup
    const registerPush = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            PushNotifications.addListener('registration', (token) => {
              console.log('FCM Token:', token.value);
              if (currentUser) {
                useAppStore.getState().updateUserProfile(currentUser.id, { fcmToken: token.value } as any);
              }
            });
            PushNotifications.addListener('registrationError', (error) => {
              console.error('FCM Registration error: ', error.error);
            });
          }
        }
      } catch (e) {
        console.warn('FCM Registration skipped (not native or error):', e);
      }
    };
    registerPush();`;

if (content.includes(target) && content.includes(importTarget)) {
  content = content.replace(importTarget, newImport);
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content);
  console.log("App.tsx FCM patched successfully");
} else {
  console.log("Target not found in App.tsx FCM");
}
