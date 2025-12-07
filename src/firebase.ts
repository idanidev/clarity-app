// src/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
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
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicializar Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth: Auth = getAuth(app);
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
if (typeof window !== 'undefined') {
  console.log("✅ Persistencia offline habilitada mediante persistentLocalCache");
}

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