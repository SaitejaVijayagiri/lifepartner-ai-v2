import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifepartner.ai',
  appName: 'LifePartner',
  webDir: 'out',
  server: {
    url: 'https://lifepartnerai.in',
    cleartext: false,
    allowNavigation: [
      'lifepartnerai.in',
      '*.lifepartnerai.in',
      '10.0.2.2',
      'localhost'
    ]
  }
};

export default config;
