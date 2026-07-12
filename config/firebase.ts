import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as { firebase?: Partial<FirebaseConfig> };

// Debug: Log the configuration to see what's being loaded
console.log('Firebase config from Constants:', extra.firebase);

const firebaseConfig: FirebaseConfig = {
  apiKey: extra.firebase?.apiKey ?? 'AIzaSyAFZpaOgd_WOCF9WHT3FgJ5Yp4OqaeBa3g',
  authDomain: extra.firebase?.authDomain ?? 'clean-water-66585.firebaseapp.com',
  projectId: extra.firebase?.projectId ?? 'clean-water-66585',
  storageBucket: extra.firebase?.storageBucket ?? 'clean-water-66585.firebasestorage.app',
  messagingSenderId: extra.firebase?.messagingSenderId ?? '143202666483',
  appId: extra.firebase?.appId ?? '1:143202666483:web:fae34115dd6ce98f177486',
};

// Debug: Log the final config
console.log('Final Firebase config:', firebaseConfig);
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth - Firebase v12 handles persistence automatically
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// AI Service Configuration
export const REPLICATE_API_TOKEN = '';
export const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

// CORS Proxy for development (web only)
export const CORS_PROXY = 'https://corsproxy.io/?';
export const USE_CORS_PROXY = true; // Set to false for production

// Replicate Model Configurations
export const REPLICATE_AVATAR_MODEL = "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4";

// Service Selection - Only using Replicate now
export const AI_SERVICE = 'replicate';

