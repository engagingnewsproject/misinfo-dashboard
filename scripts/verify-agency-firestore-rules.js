#!/usr/bin/env node
/**
 * Emulator checks for agency-scoped Firestore rules.
 *
 * Prerequisites:
 *   firebase emulators:start --only firestore,auth
 *   (or run via: firebase emulators:exec --only firestore,auth "node scripts/verify-agency-firestore-rules.js")
 *
 * Uses the Firestore Rules unit-testing pattern against the emulator.
 * Install once if needed: npm i -D @firebase/rules-unit-testing
 */

const fs = require('fs')
const path = require('path')
const {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} = require('@firebase/rules-unit-testing')
const { doc, getDoc, setDoc, collection, getDocs, query, where } = require('firebase/firestore')

const PROJECT_ID = 'misinfo-rules-test'
const RULES_PATH = path.resolve(__dirname, '../firestore.rules')

async function seed(testEnv) {
	await testEnv.withSecurityRulesDisabled(async (context) => {
		const db = context.firestore()
		await setDoc(doc(db, 'agency', 'agency-a'), {
			name: 'Agency A',
			agencyUsers: ['a@example.com'],
		})
		await setDoc(doc(db, 'agency', 'agency-b'), {
			name: 'Agency B',
			agencyUsers: ['b@example.com'],
		})
		await setDoc(doc(db, 'reports', 'report-a'), {
			agency: 'Agency A',
			agencyId: 'agency-a',
			userID: 'user-public',
			experimentId: '2026-main',
			archived: false,
			title: 'A report',
		})
		await setDoc(doc(db, 'reports', 'report-b'), {
			agency: 'Agency B',
			agencyId: 'agency-b',
			userID: 'other-user',
			experimentId: '2026-main',
			archived: false,
			title: 'B report',
		})
		await setDoc(doc(db, 'tags', 'agency-a'), {
			Topic: { list: ['Voting'], active: ['Voting'], labels: {} },
		})
	})
}

async function run() {
	const testEnv = await initializeTestEnvironment({
		projectId: PROJECT_ID,
		firestore: {
			rules: fs.readFileSync(RULES_PATH, 'utf8'),
			host: '127.0.0.1',
			port: 8080,
		},
	})

	try {
		await seed(testEnv)

		const agencyA = testEnv.authenticatedContext('uid-a', {
			agency: true,
			agencyId: 'agency-a',
			agencyName: 'Agency A',
		})
		const agencyB = testEnv.authenticatedContext('uid-b', {
			agency: true,
			agencyId: 'agency-b',
			agencyName: 'Agency B',
		})
		const admin = testEnv.authenticatedContext('uid-admin', { admin: true })
		const publicUser = testEnv.authenticatedContext('user-public', {})

		const dbA = agencyA.firestore()
		const dbB = agencyB.firestore()
		const dbAdmin = admin.firestore()
		const dbPublic = publicUser.firestore()

		console.log('1. Agency A reads own report…')
		await assertSucceeds(getDoc(doc(dbA, 'reports', 'report-a')))

		console.log('2. Agency A denied other agency report…')
		await assertFails(getDoc(doc(dbA, 'reports', 'report-b')))

		console.log('3. Admin reads all reports…')
		await assertSucceeds(getDoc(doc(dbAdmin, 'reports', 'report-a')))
		await assertSucceeds(getDoc(doc(dbAdmin, 'reports', 'report-b')))

		console.log('4. Public submitter reads own report…')
		await assertSucceeds(getDoc(doc(dbPublic, 'reports', 'report-a')))

		console.log('5. Agency A creates report for own agencyId…')
		await assertSucceeds(
			setDoc(doc(dbA, 'reports', 'report-a-new'), {
				agency: 'Agency A',
				agencyId: 'agency-a',
				userID: 'uid-a',
				experimentId: '2026-main',
				archived: false,
				title: 'New A',
			}),
		)

		console.log('6. Agency A denied create for agency B…')
		await assertFails(
			setDoc(doc(dbA, 'reports', 'report-cross'), {
				agency: 'Agency B',
				agencyId: 'agency-b',
				userID: 'uid-a',
				experimentId: '2026-main',
				archived: false,
				title: 'Cross',
			}),
		)

		console.log('7. Agency A deletes own report…')
		await assertSucceeds(
			setDoc(doc(dbA, 'reports', 'report-a-del'), {
				agency: 'Agency A',
				agencyId: 'agency-a',
				userID: 'uid-a',
				experimentId: '2026-main',
				archived: false,
				title: 'Del',
			}),
		)
		const { deleteDoc } = require('firebase/firestore')
		await assertSucceeds(deleteDoc(doc(dbA, 'reports', 'report-a-del')))

		console.log('8. Agency A denied delete on B report…')
		await assertFails(deleteDoc(doc(dbA, 'reports', 'report-b')))

		console.log('9. Agency A cannot list agency B doc…')
		await assertFails(getDoc(doc(dbA, 'agency', 'agency-b')))

		console.log('10. Public can list agencies (picker)…')
		await assertSucceeds(getDocs(collection(dbPublic, 'agency')))

		console.log('11. Public can read tags for picker…')
		await assertSucceeds(getDoc(doc(dbPublic, 'tags', 'agency-a')))

		console.log('12. Agency scoped list query by agencyId…')
		await assertSucceeds(
			getDocs(
				query(
					collection(dbA, 'reports'),
					where('agencyId', '==', 'agency-a'),
				),
			),
		)

		console.log('\nAll agency Firestore rules checks passed.')
	} finally {
		await testEnv.cleanup()
	}
}

run().catch((err) => {
	console.error('\nAgency rules verification failed:')
	console.error(err)
	process.exit(1)
})
