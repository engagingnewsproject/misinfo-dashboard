import React from 'react'
import { act, render } from '@testing-library/react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
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
jest.mock('firebase/firestore', () => ({}))
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
