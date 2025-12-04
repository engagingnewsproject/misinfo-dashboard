/**
 * @fileoverview Firebase Configuration - Initializes Firebase services and emulators
 *
 * This file sets up and exports the Firebase app, Firestore, Auth, Storage, Functions, Analytics, and Performance.
 * Features include:
 * - Loads configuration from environment variables
 * - Initializes Firebase app and services
 * - Connects to local emulators in development mode
 * - Sets up App Check with ReCaptcha Enterprise
 * - Exports initialized services for use throughout the app
 *
 * Integrates with:
 * - Firebase JS SDK (modular)
 * - .env environment variables for configuration
 * - Firebase emulators for local development
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import { initializeApp } from 'firebase/app'

import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'
import { getPerformance } from 'firebase/performance'
import {
	initializeAppCheck,
	ReCaptchaEnterpriseProvider,
} from 'firebase/app-check'

// UNCOMMENT "connectFunctionsEmulator" BELOW: enable connection to firebase functions emulator
// connectFunctionsEmulator
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

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
}

// Firebase configuration loaded from environment variables

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Analytics and Performance Monitoring if running in the browser
let analytics = null // Initialize to null
let perf = null

// Initialize Analytics, Performance, and App Check only in the browser
if (typeof window !== 'undefined') {
	// Initialize Analytics
	analytics = getAnalytics(app)
	// Initialize Performance Monitoring
	perf = getPerformance(app)
	// Initialize App Check with ReCaptcha Enterprise
	// Docs: https://firebase.google.com/docs/app-check/web/debug-provider?authuser=0
	self.FIREBASE_APPCHECK_DEBUG_TOKEN =
		process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN
	initializeAppCheck(app, {
		provider: new ReCaptchaEnterpriseProvider(
			process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY,
		),
		isTokenAutoRefreshEnabled: true, // Set to true to allow auto-refresh.
	})
}

export { app, analytics, perf }

export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export const functions = getFunctions(app)

// UNCOMMENT BELOW: enable connection to firebase functions emulator
// connectFunctionsEmulator(functions,"127.0.0.1",5001)

// Connect to Firebase emulators in development mode
// Only connect if USE_EMULATORS environment variable is set to 'true'
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
	console.log('Running Emulator')
	connectAuthEmulator(auth, 'http://127.0.0.1:9099')
	connectFirestoreEmulator(db, 'localhost', 8080)
	connectStorageEmulator(storage, '127.0.0.1', 9199)
	connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}
