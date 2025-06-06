
// config/firebaseConfig.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCYhFFcr4T_odyxZZnD16niDrA16FopZ2w",
  authDomain: "aquago-c4de7.firebaseapp.com",
  projectId: "aquago-c4de7",
  storageBucket: "aquago-c4de7.appspot.com",
  messagingSenderId: "305514793128",
  appId: "1:305514793128:web:37c65444e8b65382a11a9d",
  measurementId: "G-8JX6H7Y0NS",
};

// Initialize Firebase app once
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage once (only if not already initialized)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Auth was already initialized
  auth = getAuth(app);
}

const db = getFirestore(app); 

export { app, auth, db };