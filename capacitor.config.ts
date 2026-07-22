import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aistudio.safetylink.vqnztp',
  appName: 'SafetyLink Core',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_name',
      iconColor: '#0066cc',
      sound: 'beep.wav',
    },
  },
};

export default config;
