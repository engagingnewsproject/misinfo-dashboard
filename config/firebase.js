import { initializeApp } from 'firebase/app';

import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage,connectStorageEmulator } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// UNCOMMENT "connectFunctionsEmulator" BELOW: enable connection to firebase functions emulator
// connectFunctionsEmulator
import {
  getFunctions,
  connectFunctionsEmulator
} from "firebase/functions";
  
const firebaseConfig = {
    // Values found at /.env file. 
    // If this file is not present create a .env file in the root directory
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Create a ReCaptchaEnterpriseProvider instance using your reCAPTCHA Enterprise
// site key and pass it to initializeAppCheck().
// Docs: https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider?authuser=0&hl=en#initialize
// Check if we're running in a browser environment
if (typeof window !== 'undefined') {
  // Use App Check with the debug provider in web apps
  // Docs: https://firebase.google.com/docs/app-check/web/debug-provider?authuser=0
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
  // Initialize Firebase App Check with ReCaptcha Enterprise
  const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY),
      isTokenAutoRefreshEnabled: true // Set to true to allow auto-refresh.
  });
}

// Initialize Analytics and get a reference to the service
let analytics = null; // Initialize to null
let perf = null;
// Check if window object is defined (client-side)
if (typeof window !== 'undefined') {
  // Initialize Analytics if running in the browser
  analytics = getAnalytics(app);
  perf = getPerformance(app);
}

export { app, analytics, perf }

export const db = getFirestore(app);
export const storage = getStorage(app);

export const auth = getAuth(app);
export const functions = getFunctions(app);


// UNCOMMENT BELOW: enable connection to firebase functions emulator
// connectFunctionsEmulator(functions,"127.0.0.1",5001)


if (process.env.NODE_ENV === 'development') {
  console.log("Running Emulator");
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
