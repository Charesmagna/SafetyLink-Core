import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aistudio.safetylink.vqnztp',
  appName: 'SafetyLink Core',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'safetylink.online',
      '*.safetylink.online',
      'api.safetylink.online',
      'safetylink-99e56.firebaseapp.com',
      '*.firebaseapp.com',
      'accounts.google.com',
      '*.google.com',
      'checkout.paystack.com',
      'api.paystack.co'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#000000",
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_name',
      iconColor: '#0066cc',
      sound: 'beep.wav',
    },
  },
};

export default config;
