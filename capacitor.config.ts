import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clarity.app',
  appName: 'Clarity',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // Permitir todas las conexiones para Firebase
    allowNavigation: [
      'https://*.firebaseapp.com',
      'https://*.googleapis.com',
      'https://*.google.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#8B5CF6',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#8B5CF6',
      sound: 'default',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#8B5CF6',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    minWebViewVersion: 60,
    backgroundColor: '#8B5CF6',
    allowMixedContent: true,
    // Optimizaciones de rendimiento
    webContentsDebuggingEnabled: false,
  },
};

export default config;

