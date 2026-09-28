import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const app =
	getApps()[0] ??
	initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID })

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
