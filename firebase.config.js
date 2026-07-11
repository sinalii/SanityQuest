import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFZpaOgd_WOCF9WHT3FgJ5Yp4OqaeBa3g",
  authDomain: "clean-water-66585.firebaseapp.com",
  projectId: "clean-water-66585",
  storageBucket: "clean-water-66585.appspot.com",
  messagingSenderId: "143202666483",
  appId: "1:143202666483:web:clean-water-app",
  measurementId: "G-CLEANWATER"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (Analytics removed for React Native)
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
