// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
