/**
 * Firebase Client SDK Configuration
 * Initializes Firebase client SDK for frontend authentication
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is valid
const isFirebaseConfigValid = () => {
  // Debug: Log what we're receiving from environment
  if (import.meta.env.DEV) {
    console.log('🔍 Debug - Firebase config values received:');
    console.log('   apiKey:', firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'undefined');
    console.log('   authDomain:', firebaseConfig.authDomain || 'undefined');
    console.log('   projectId:', firebaseConfig.projectId || 'undefined');
  }
  
  const required = [
    { key: 'apiKey', value: firebaseConfig.apiKey },
    { key: 'authDomain', value: firebaseConfig.authDomain },
    { key: 'projectId', value: firebaseConfig.projectId },
    { key: 'storageBucket', value: firebaseConfig.storageBucket },
    { key: 'messagingSenderId', value: firebaseConfig.messagingSenderId },
    { key: 'appId', value: firebaseConfig.appId },
  ];
  
  const missing = required.filter(item => {
    if (!item.value) return true;
    const value = item.value.toString().toLowerCase();
    return value.includes('your-') || 
           value.includes('placeholder') ||
           value === 'your-firebase-api-key-here' ||
           value === 'your-project-id.firebaseapp.com' ||
           value === 'your-firebase-project-id' ||
           value === 'your-project-id' ||
           value === 'your-project-id.appspot.com' ||
           value === 'your-messaging-sender-id' ||
           value === 'your-firebase-app-id';
  });
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing or invalid Firebase configuration:');
    missing.forEach(item => {
      const displayValue = item.value && item.value.length > 30 
        ? `${item.value.substring(0, 20)}...` 
        : item.value || 'not set';
      console.warn(`   - ${item.key}: ${displayValue}`);
    });
    console.warn('');
    console.warn('📝 To fix this:');
    console.warn('   1. Get your Firebase config from: https://console.firebase.google.com/');
    console.warn('   2. Open your .env file in the root directory');
    console.warn('   3. Replace the placeholder values (like "your-firebase-api-key-here") with your actual Firebase credentials');
    console.warn('   4. Make sure values do NOT have quotes around them');
    console.warn('   5. Restart your dev server (stop with Ctrl+C, then run: npm run dev)');
    console.warn('');
    console.warn('   💡 Run "node diagnose-env.mjs" to check your .env file');
    console.warn('   See UPDATE_ENV.md for detailed step-by-step instructions.');
    console.warn('');
    return false;
  }
  
  return true;
};

// Initialize Firebase app (only if not already initialized)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

try {
  if (!isFirebaseConfigValid()) {
    console.warn('⚠️  Firebase configuration is missing. Please set up your .env file with Firebase credentials.');
    console.warn('   See FIREBASE_SETUP.md for instructions.');
    console.warn('   The app will continue to run but authentication features will not work.');
  } else {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
    } else {
      app = getApps()[0];
    }
    
    // Initialize Firebase Auth
    auth = getAuth(app);
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('   The app will continue to run but authentication features will not work.');
}

// Export Firebase Auth (may be null if not configured)
export { auth };

// Export Firebase functions with error handling
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
};

// Export types
export type { FirebaseUser };

export default app;

