// Import the functions you need from the SDKs you need

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYhFFcr4T_odyxZZnD16niDrA16FopZ2w",
  authDomain: "aquago-c4de7.firebaseapp.com",
  projectId: "aquago-c4de7",
  storageBucket: "aquago-c4de7.firebasestorage.app",
  messagingSenderId: "305514793128",
  appId: "1:305514793128:web:37c65444e8b65382a11a9d",
  measurementId: "G-8JX6H7Y0NS",
};
const app = initializeApp(firebaseConfig);
let auth;

if (!global.firebaseAuthInitialized) {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    global.firebaseAuthInitialized = true;
    global.firebaseAuth = auth;
    console.log("Firebase Auth initialized successfully with persistence.");
  } catch (error) {
    console.warn("Failed to initialize auth with persistence, falling back to getAuth:", error);
    auth = getAuth(app); // Lấy instance Auth đã tồn tại
    global.firebaseAuthInitialized = true;
    global.firebaseAuth = auth;
  }
} else {
  auth = global.firebaseAuth || getAuth(app); // Sử dụng instance global hoặc lấy lại
  console.log("Firebase Auth already initialized, using existing instance.");
}


// Initialize Firestore & Storage
const firestore = getFirestore(app);
const storage = getStorage(app);

// Export instances
export { app, auth, firestore, storage };