import React from 'react'
import { act, render } from '@testing-library/react'
import {
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
} from 'firebase/auth'
import { toInitialAuth } from '../../lib/session'
import {
	AuthContextProvider,
	SESSION_SYNC_FAILED,
	useAuth,
} from '../AuthContext'

jest.mock('firebase/auth', () => ({
	onAuthStateChanged: jest.fn((_auth, callback) => {
		callback(null)
		return () => {}
	}),
	onIdTokenChanged: jest.fn(() => () => {}),
	signInWithEmailAndPassword: jest.fn(),
	signOut: jest.fn(() => Promise.resolve()),
}))
jest.mock('firebase/functions', () => ({ httpsCallable: jest.fn() }))
jest.mock('firebase/firestore', () => ({
	doc: jest.fn(),
	getDoc: jest.fn(() => new Promise(() => {})),
}))
jest.mock('../../config/firebase', () => ({ auth: {}, app: {}, db: {} }))

let tokenCount = 0

function signInAs() {
	const idToken = `token-${++tokenCount}`
	const credential = { user: { getIdToken: () => Promise.resolve(idToken) } }
	signInWithEmailAndPassword.mockResolvedValue(credential)
	return { idToken, credential }
}

function renderAuth() {
	const ctx = {}
	function Capture() {
		Object.assign(ctx, useAuth())
		return null
	}
	render(
		<AuthContextProvider>
			<Capture />
		</AuthContextProvider>,
	)
	return ctx
}

beforeEach(() => {
	global.fetch = jest.fn()
})

test('login resolves only after the server session is created', async () => {
	const { idToken, credential } = signInAs()
	let respond
	global.fetch.mockReturnValue(new Promise((resolve) => (respond = resolve)))
	const auth = renderAuth()

	let settled = false
	const pending = auth.login('a@example.com', 'pw').then((result) => {
		settled = true
		return result
	})
	await act(() => Promise.resolve())

	expect(global.fetch).toHaveBeenCalledWith('/api/session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ idToken }),
	})
	expect(settled).toBe(false)

	respond({ ok: true, status: 204 })
	await expect(pending).resolves.toBe(credential)
	expect(signOut).not.toHaveBeenCalled()
})

test.each([
	['an error response', () => Promise.resolve({ ok: false, status: 500 })],
	['a network failure', () => Promise.reject(new TypeError('Failed to fetch'))],
])(
	'login signs back out and rejects when session sync gets %s',
	async (_name, response) => {
		signInAs()
		global.fetch.mockImplementation(response)
		const auth = renderAuth()

		await expect(auth.login('a@example.com', 'pw')).rejects.toMatchObject({
			code: SESSION_SYNC_FAILED,
		})
		expect(signOut).toHaveBeenCalledTimes(1)
	},
)

describe('seeding from initialAuth', () => {
	const seed = toInitialAuth({
		uid: 'u1',
		email: 'a@example.com',
		name: 'Ann',
		agency: true,
		agencyId: 'ag1',
		agencyName: 'PD',
	})

	let emitAuth
	beforeEach(() => {
		onAuthStateChanged.mockImplementationOnce((_auth, callback) => {
			emitAuth = (user) => act(() => callback(user))
			return () => {}
		})
	})

	function renderSeeded(initialAuth) {
		const renders = []
		function Capture() {
			renders.push(useAuth())
			return <p>page</p>
		}
		const view = render(
			<AuthContextProvider initialAuth={initialAuth}>
				<Capture />
			</AuthContextProvider>,
		)
		const latest = () => renders[renders.length - 1]
		return { view, renders, latest }
	}

	function clientUser(claims) {
		let resolveClaims
		const user = {
			uid: 'u1',
			email: 'a@example.com',
			displayName: 'Ann',
			getIdTokenResult: () =>
				new Promise((resolve) => (resolveClaims = () => resolve({ claims }))),
		}
		return { user, resolveClaims: () => act(() => resolveClaims()) }
	}

	test('renders children on the first render with the seeded user and claims', () => {
		const { view, renders } = renderSeeded(seed)

		expect(view.getByText('page')).toBeTruthy()
		expect(renders[0]).toMatchObject({
			user: seed.user,
			loading: false,
			claimsReady: true,
			customClaims: seed.claims,
			clientAuthReady: false,
		})
	})

	test('without a seed it shows the spinner until the client reports', () => {
		const { view, latest } = renderSeeded(undefined)

		expect(view.queryByText('page')).toBeNull()
		expect(view.getByText('Loading…')).toBeTruthy()

		emitAuth(null)
		expect(latest()).toMatchObject({ user: null, clientAuthReady: true })
	})

	test('keeps seeded claims ready while the same client user re-reads them', async () => {
		const { renders, latest } = renderSeeded(seed)
		const { user, resolveClaims } = clientUser({ admin: true })

		emitAuth(user)
		expect(renders.every((r) => r.claimsReady && !r.loading)).toBe(true)
		expect(latest().customClaims).toEqual(seed.claims)

		await resolveClaims()
		expect(latest().customClaims).toEqual({
			admin: true,
			agency: false,
			agencyId: null,
			agencyName: null,
		})
	})

	test('a different client user waits for fresh claims', () => {
		const { latest } = renderSeeded(seed)

		emitAuth({ ...clientUser({}).user, uid: 'u2' })
		expect(latest().claimsReady).toBe(false)
	})

	test('clears the seeded user when the client has no session', () => {
		const { latest } = renderSeeded(seed)

		emitAuth(null)
		expect(latest()).toMatchObject({
			user: null,
			customClaims: { admin: false, agency: false },
		})
	})
})
