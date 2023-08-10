import { initializeApp } from 'firebase/app';

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";


const firebaseConfig = {
    /* apiKey: "AIzaSyBkD07zb1NS6J8Um617Bxz2O16E0IOgB0Y",
    authDomain: "misinfo-e2144.firebaseapp.com",
    projectId: "misinfo-e2144",
    storageBucket: "misinfo-e2144.appspot.com",
    messagingSenderId: "10043942539",
    appId: "1:10043942539:web:4d2ab14272000c38f4d68e",
    measurementId: "G-EJ0G2CVELW" */

    /* LIVE Misinfo (misinfo-5d004) app creds */
    // apiKey: "AIzaSyAsGCi7VgxuovHAbY4tRDAKDRN6sxw8MHo",
    // authDomain: "misinfo-5d004.firebaseapp.com",
    // projectId: "misinfo-5d004",
    // storageBucket: "misinfo-5d004.appspot.com",
    // messagingSenderId: "2581605663",
    // appId: "1:2581605663:web:5c1f1a43d80568fd5b542a",
    // measurementId: "G-L4GJJGV0V1"
    
    // DEV site (misinfo-dashboard-dev) app creds
    apiKey: "AIzaSyA_yhrMIO9lkS8ytjKTdNbPTWgoex09vCc",
    authDomain: "misinfo-dashboard-dev.firebaseapp.com",
    projectId: "misinfo-dashboard-dev",
    storageBucket: "misinfo-dashboard-dev.appspot.com",
    messagingSenderId: "1032537406721",
    appId: "1:1032537406721:web:12713268b158a7843a2f00"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const auth = getAuth(app);
export const functions = getFunctions(app);

