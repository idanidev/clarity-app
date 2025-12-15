// src/firebase.ts
import { initializeApp, FirebaseApp, getApps } from "firebase/app";
import { getAuth, initializeAuth, Auth, GoogleAuthProvider, OAuthProvider, indexedDBLocalPersistence } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { 
  Firestore,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getMessaging, Messaging, isSupported } from "firebase/messaging";

// Tu configuración de Firebase
// En iOS nativo, las variables de entorno pueden no estar disponibles
// Usamos valores por defecto desde GoogleService-Info.plist si están disponibles
const getFirebaseConfig = () => {
  // Valores por defecto desde GoogleService-Info.plist (iOS)
  const defaultConfig = {
    apiKey: "AIzaSyB_TputkxE2423A5KsCoKoCe9O5NUT-m6U",
    authDomain: "clarity-gastos.firebaseapp.com",
    projectId: "clarity-gastos",
    storageBucket: "clarity-gastos.firebasestorage.app",
    messagingSenderId: "318846020421",
    appId: "1:318846020421:ios:0a7f99d417735b6529ec2c",
    measurementId: undefined, // Opcional
  };

  // Intentar usar variables de entorno primero (web/dev)
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId,
  };

  // Validar configuración
  if (!config.apiKey || !config.projectId) {
    console.error("❌ Firebase: Configuración incompleta", config);
    throw new Error("Firebase configuration is missing required fields");
  }

  return config;
};

const firebaseConfig = getFirebaseConfig();

// Inicializar Firebase
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  console.error("❌ Firebase initialization error:", error);
  // Si ya está inicializado (iOS nativo), obtener la instancia existente
  if (error.code === 'app/duplicate-app') {
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
    } else {
      throw error;
    }
  } else {
    throw error;
  }
}

// Inicializar Auth con persistencia correcta para plataformas nativas
// En iOS/Android nativo, necesitamos usar initializeAuth con indexedDBLocalPersistence
// En web, usamos getAuth (configuración por defecto)
let auth: Auth;
if (Capacitor.isNativePlatform()) {
  // En plataformas nativas, usar initializeAuth con indexedDBLocalPersistence
  // Esto resuelve el problema de timeout en signInWithEmailAndPassword
  try {
    auth = initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    });
  } catch (error: any) {
    // Si ya está inicializado, obtener la instancia existente
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
} else {
  // Web: usar getAuth (configuración por defecto)
  auth = getAuth(app);
}

// Configurar Auth
if (typeof window !== 'undefined') {
  auth.settings.appVerificationDisabledForTesting = false;
}

export { auth };

export const appleProvider = new OAuthProvider('apple.com');

// Firestore con configuración optimizada para PWAs
// persistentLocalCache ya maneja la persistencia offline automáticamente
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
});

// Nota: NO llamar enableIndexedDbPersistence() porque persistentLocalCache ya lo maneja
// Hacerlo causaría el error "SDK cache is already specified"

// Analytics solo en el cliente
export const analytics: Analytics | null = 
  typeof window !== 'undefined'
    ? (() => {
        try {
          return getAnalytics(app);
        } catch (error) {
          console.warn('Firebase Analytics no disponible:', error);
          return null;
        }
      })()
    : null;

// Messaging solo en el cliente y si está disponible
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    })
    .catch((err) => {
      console.warn("Firebase Messaging no disponible:", err);
    });
}
export { messaging };

// Provider de Google
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;