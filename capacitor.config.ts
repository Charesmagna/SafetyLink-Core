import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safetylink.app',
  appName: 'SafetyLink',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
