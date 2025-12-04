// src/firebase.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getMessaging, Messaging } from "firebase/messaging";

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
export const db: Firestore = getFirestore(app);

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
export const messaging: Messaging | null = 
  typeof window !== 'undefined' && 
  'serviceWorker' in navigator &&
  typeof navigator !== 'undefined'
    ? (() => {
        try {
          return getMessaging(app);
        } catch (error) {
          console.warn('Firebase Messaging no disponible:', error);
          return null;
        }
      })()
    : null;

// Provider de Google
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;