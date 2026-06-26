import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tmml.safetylink',
  appName: 'SafetyLink Core',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
