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
      backgroundColor: '#8B5CF6', // Purple de Clarity
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#8B5CF6',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#8B5CF6',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;

