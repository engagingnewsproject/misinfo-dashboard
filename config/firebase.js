import { initializeApp } from 'firebase/app';

import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
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
export const app = initializeApp(firebaseConfig);
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
