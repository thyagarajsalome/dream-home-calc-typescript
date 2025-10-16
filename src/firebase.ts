// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOzdXVr6WRbDWYLo65_1im_hoGdKtPhfo",
  authDomain: "dream-home-calculator.firebaseapp.com",
  projectId: "dream-home-calculator",
  storageBucket: "dream-home-calculator.firebasestorage.app", // Corrected this line, was .firebasestorage.app
  messagingSenderId: "902006029611",
  appId: "1:902006029611:web:a2a6f13910cfcb1837596e",
  measurementId: "G-QWKJ5MRLPW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore and export them
export const auth = getAuth(app);
export const db = getFirestore(app);
