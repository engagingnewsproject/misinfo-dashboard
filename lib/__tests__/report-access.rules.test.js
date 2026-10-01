/** @jest-environment node */
import fs from 'fs'
import path from 'path'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { canReadReport } from '../report-access'

// Needs the Firestore emulator; runs via `npm run test:rules-parity`.
const describeWithEmulator = process.env.FIRESTORE_EMULATOR_HOST
	? describe
	: describe.skip

const REPORTS = {
	'report-a': { agencyId: 'agency-a', userID: 'user-1' },
	'report-b': { agencyId: 'agency-b', userID: 'user-2' },
	'report-empty-agency': { agencyId: '', userID: 'user-3' },
	'report-no-agency': { userID: 'user-1' },
}

const CLAIMS = {
	'signed out': null,
	admin: { uid: 'uid-admin', admin: true },
	'admin: false': { uid: 'uid-x', admin: false },
	'agency a': { uid: 'uid-a', agency: true, agencyId: 'agency-a' },
	'agency b': { uid: 'uid-b', agency: true, agencyId: 'agency-b' },
	'agency with empty agencyId': { uid: 'uid-x', agency: true, agencyId: '' },
	'agency without agencyId': { uid: 'uid-x', agency: true },
	'agency with non-string agencyId': {
		uid: 'uid-x',
		agency: true,
		agencyId: 1,
	},
	'agency: "true" string': {
		uid: 'uid-x',
		agency: 'true',
		agencyId: 'agency-a',
	},
	'agencyId without agency flag': { uid: 'uid-x', agencyId: 'agency-a' },
	'agency a user who submitted report-b': {
		uid: 'user-2',
		agency: true,
		agencyId: 'agency-a',
	},
	'submitter user-1': { uid: 'user-1' },
	'submitter user-3': { uid: 'user-3' },
	stranger: { uid: 'user-9' },
}

const cases = Object.entries(CLAIMS).flatMap(([claimsLabel, claims]) =>
	Object.keys(REPORTS).map((reportId) => [claimsLabel, reportId, claims]),
)

describeWithEmulator('canReadReport matches firestore.rules', () => {
	let testEnv

	beforeAll(async () => {
		testEnv = await initializeTestEnvironment({
			projectId: 'misinfo-rules-parity',
			firestore: {
				rules: fs.readFileSync(
					path.resolve(__dirname, '../../firestore.rules'),
					'utf8',
				),
			},
		})
		await testEnv.clearFirestore()
		await testEnv.withSecurityRulesDisabled(async (context) => {
			const db = context.firestore()
			for (const [reportId, data] of Object.entries(REPORTS)) {
				await setDoc(doc(db, 'reports', reportId), data)
			}
		})
	})

	afterAll(async () => {
		await testEnv?.cleanup()
	})

	test.each(cases)('%s reading %s', async (_label, reportId, claims) => {
		let context
		if (claims) {
			const { uid, ...token } = claims
			context = testEnv.authenticatedContext(uid, token)
		} else {
			context = testEnv.unauthenticatedContext()
		}
		let allowed = true
		try {
			await getDoc(doc(context.firestore(), 'reports', reportId))
		} catch (err) {
			if (err?.code !== 'permission-denied') {
				throw err
			}
			allowed = false
		}
		expect(canReadReport(claims, REPORTS[reportId])).toBe(allowed)
	})
})
