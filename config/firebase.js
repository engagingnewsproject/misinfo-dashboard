import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyBkD07zb1NS6J8Um617Bxz2O16E0IOgB0Y",
    authDomain: "misinfo-e2144.firebaseapp.com",
    projectId: "misinfo-e2144",
    storageBucket: "misinfo-e2144.appspot.com",
    messagingSenderId: "10043942539",
    appId: "1:10043942539:web:4d2ab14272000c38f4d68e",
    measurementId: "G-EJ0G2CVELW"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const auth = getAuth()
