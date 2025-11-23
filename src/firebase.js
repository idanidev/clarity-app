// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCFhaSfL2VGvSA0PtSCRISB7l_e9ig1kSI",
  authDomain: "clarity-gastos.firebaseapp.com",
  projectId: "clarity-gastos",
  storageBucket: "clarity-gastos.firebasestorage.app",
  messagingSenderId: "318846020421",
  appId: "1:318846020421:web:d55aadfbe492db8d29ec2c",
  measurementId: "G-WWTL6X7SV1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Analytics (solo en el cliente, no en SSR)
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Messaging (solo en el cliente, no en SSR)
let messaging = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging not available:", error);
  }
}

export { analytics, messaging, getToken as getMessagingToken, onMessage as onMessagingMessage };
export default app;
