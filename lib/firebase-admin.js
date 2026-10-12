import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
// Hosts like Netlify store the key on one line with literal "\n"; cert() needs real newlines.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

// App Hosting supplies credentials automatically; other hosts (Netlify) must set both vars.
const app =
	getApps()[0] ??
	initializeApp(
		clientEmail && privateKey
			? { projectId, credential: cert({ projectId, clientEmail, privateKey }) }
			: { projectId },
	)

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
