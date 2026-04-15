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
import {
	getFirestore,
	initializeFirestore,
	connectFirestoreEmulator,
} from 'firebase/firestore'
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

/** True when this build should wire the client SDK to local emulators. */
const useEmulators =
	process.env.NODE_ENV === 'development' &&
	process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

/**
 * Creates the Firestore client for this JS realm.
 * Uses long-polling auto-detect in the browser when not on emulators so `next dev` is less likely to hit flaky WebChannel streams to the real backend.
 */
function createFirestore() {
	if (typeof window === 'undefined') {
		return getFirestore(app)
	}
	if (useEmulators) {
		return getFirestore(app)
	}
	try {
		return initializeFirestore(app, {
			experimentalAutoDetectLongPolling: true,
		})
	} catch {
		return getFirestore(app)
	}
}

// Auth + Firestore must exist (and emulators must be attached) before Analytics / App Check
// so the Firestore client is not pre-configured with a production host.
export const auth = getAuth(app)
export const db = createFirestore()

if (useEmulators && typeof globalThis !== 'undefined') {
	if (!globalThis.__MISINFO_AUTH_FIRESTORE_EMULATOR__) {
		globalThis.__MISINFO_AUTH_FIRESTORE_EMULATOR__ = true
		console.log('Running Emulator')
		connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
			disableWarnings: true,
		})
		connectFirestoreEmulator(db, '127.0.0.1', 8080)
	}
}

// Initialize Analytics and Performance Monitoring if running in the browser
let analytics = null // Initialize to null
let perf = null
let appCheck = null

// Initialize Analytics, Performance, and App Check only in the browser
if (typeof window !== 'undefined') {
	// Initialize Analytics
	try {
		analytics = getAnalytics(app)
	} catch (e) {
		analytics = null
	}
	// Initialize Performance Monitoring
	try {
		perf = getPerformance(app)
	} catch (e) {
		perf = null
	}
	// App Check on localhost + real Firebase: without a valid debug token, Firestore often returns
	// “Missing or insufficient permissions” even when signed in. If NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN
	// is unset, use `true` so Firebase logs a token once per load (development + not on emulators).
	// Register it under Firebase Console → App Check → your web app → Manage debug tokens.
	const liveLocalDev =
		process.env.NODE_ENV === 'development' &&
		process.env.NEXT_PUBLIC_USE_EMULATORS !== 'true'
	if (process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN) {
		self.FIREBASE_APPCHECK_DEBUG_TOKEN =
			process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN
	} else if (liveLocalDev) {
		self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
	}
	// Initialize App Check with ReCaptcha Enterprise
	// Docs: https://firebase.google.com/docs/app-check/web/debug-provider?authuser=0
	try {
		initializeAppCheck(app, {
			provider: new ReCaptchaEnterpriseProvider(
				process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY,
			),
			isTokenAutoRefreshEnabled: true, // Set to true to allow token auto-refresh.
		})
		appCheck = true // optional: signal success
	} catch (e) {
		appCheck = null
	}
}

export { app, analytics, perf, appCheck }

// Storage: init only in browser when storageBucket is set; otherwise getStorage() throws "Service storage is not available"
let storage = null
if (typeof window !== 'undefined') {
	if (firebaseConfig.storageBucket) {
		try {
			const bucketUrl = firebaseConfig.storageBucket.startsWith('gs://')
				? firebaseConfig.storageBucket
				: `gs://${firebaseConfig.storageBucket}`
			storage = getStorage(app, bucketUrl)
		} catch {
			storage = null
		}
	} else {
		console.warn(
			'Firebase Storage skipped: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set. Set it in .env to enable uploads.',
		)
	}
}
export { storage }

// Functions: init only in browser; try/catch so any SDK throw (build, SSR, edge) yields null instead of crash
let functions = null
if (typeof window !== 'undefined') {
	try {
		functions = getFunctions(app)
	} catch {
		functions = null
	}
}
export { functions }

// Storage / Functions emulators (after instances exist). Separate global flags so a null storage
// on first SSR pass does not skip browser-only emulator wiring on the client.
if (useEmulators && typeof globalThis !== 'undefined') {
	if (storage && !globalThis.__MISINFO_STORAGE_EMULATOR__) {
		globalThis.__MISINFO_STORAGE_EMULATOR__ = true
		connectStorageEmulator(storage, '127.0.0.1', 9199)
	}
	if (functions && !globalThis.__MISINFO_FUNCTIONS_EMULATOR__) {
		globalThis.__MISINFO_FUNCTIONS_EMULATOR__ = true
		connectFunctionsEmulator(functions, '127.0.0.1', 5001)
	}
}
