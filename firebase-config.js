// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQ5MAGIx6yr9EuB1H87L7kcxMpDB1LsUE",
  authDomain: "diwalicrackers-4fd9b.firebaseapp.com",
  projectId: "diwalicrackers-4fd9b",
  storageBucket: "diwalicrackers-4fd9b.firebasestorage.app",
  messagingSenderId: "152551928567",
  appId: "1:152551928567:web:e6cb721da26ee3ae5859f2",
  measurementId: "G-3XNVVHMV11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);