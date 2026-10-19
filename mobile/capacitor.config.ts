import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: process.env.APP_ID || 'com.totalappgt.aulapro',
  appName: process.env.APP_NAME || 'AulaPro',
  webDir: 'www',
  server: {
    url: process.env.APP_URL || 'https://aulapro.totalappgt.com',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
