// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAi8auHjahGA-AFGWYW-Ig1kaF4FWwu6Cc",
  authDomain: "avalon-593e7.firebaseapp.com",
  projectId: "avalon-593e7",
  storageBucket: "avalon-593e7.firebasestorage.app",
  messagingSenderId: "469158636943",
  appId: "1:469158636943:web:2066f081ee7ce3bd29effa",
  measurementId: "G-DDQL245JG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);