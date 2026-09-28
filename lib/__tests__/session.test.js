/** @jest-environment node */
import {
	SESSION_MAX_AGE_MS,
	checkSessionRequest,
	sessionCookieHeader,
} from '../session'

describe('sessionCookieHeader', () => {
	test('sets the HttpOnly session cookie with Max-Age in seconds', () => {
		expect(
			sessionCookieHeader('abc', {
				maxAgeMs: SESSION_MAX_AGE_MS,
				secure: false,
			}),
		).toBe('__session=abc; Path=/; HttpOnly; SameSite=Lax; Max-Age=432000')
	})
})

describe('checkSessionRequest', () => {
	const post = (headers) => ({
		method: 'POST',
		headers: { 'content-type': 'application/json', ...headers },
	})

	test.each([
		[
			'same origin via host',
			post({ host: 'app.test', origin: 'https://app.test' }),
			{ ok: true },
		],
		[
			'same origin via x-forwarded-host behind a proxy',
			post({
				host: 'internal:8080',
				'x-forwarded-host': 'app.test',
				origin: 'https://app.test',
			}),
			{ ok: true },
		],
		[
			'JSON content type with charset',
			post({
				host: 'app.test',
				origin: 'https://app.test',
				'content-type': 'application/json; charset=utf-8',
			}),
			{ ok: true },
		],
		[
			'cross origin',
			post({ host: 'app.test', origin: 'https://evil.test' }),
			{ ok: false, status: 403 },
		],
		[
			'origin matching only the internal host behind a proxy',
			post({
				host: 'internal:8080',
				'x-forwarded-host': 'app.test',
				origin: 'http://internal:8080',
			}),
			{ ok: false, status: 403 },
		],
		['missing origin', post({ host: 'app.test' }), { ok: false, status: 403 }],
		[
			'malformed origin',
			post({ host: 'app.test', origin: 'null' }),
			{ ok: false, status: 403 },
		],
		[
			'non-JSON POST',
			post({
				host: 'app.test',
				origin: 'https://app.test',
				'content-type': 'text/plain',
			}),
			{ ok: false, status: 400 },
		],
		[
			'same-origin DELETE without a body',
			{
				method: 'DELETE',
				headers: { host: 'app.test', origin: 'https://app.test' },
			},
			{ ok: true },
		],
		[
			'cross-origin DELETE',
			{
				method: 'DELETE',
				headers: { host: 'app.test', origin: 'https://evil.test' },
			},
			{ ok: false, status: 403 },
		],
	])('%s', (_name, req, expected) => {
		expect(checkSessionRequest(req)).toEqual(expected)
	})
})
