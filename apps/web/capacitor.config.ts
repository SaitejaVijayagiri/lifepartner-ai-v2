import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifepartner.ai',
  appName: 'LifePartner',
  webDir: 'out',
  appendUserAgent: 'LifePartnerApp/1.0.8 CapacitorApp NativeAndroidApp',
  backgroundColor: '#0F172A',
  android: {
    allowMixedContent: false,
    captureInput: true,
    backgroundColor: '#0F172A'
  },
  server: {
    url: 'https://www.lifepartnerai.in?app=native',
    cleartext: false,
    allowNavigation: [
      'lifepartnerai.in',
      '*.lifepartnerai.in',
      'www.lifepartnerai.in',
      '10.0.2.2',
      'localhost'
    ]
  }
};

export default config;
