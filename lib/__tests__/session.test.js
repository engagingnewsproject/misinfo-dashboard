/** @jest-environment node */
import {
	SESSION_MAX_AGE_MS,
	checkSessionRequest,
	safeNextPath,
	sessionCookieHeader,
	toInitialAuth,
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

describe('toInitialAuth', () => {
	const base = { uid: 'u1', email: 'a@example.com', name: 'Ann' }
	const user = {
		uid: 'u1',
		accountId: 'u1',
		email: 'a@example.com',
		displayName: 'Ann',
	}

	test('admin wins and clears agency fields', () => {
		expect(
			toInitialAuth({ ...base, admin: true, agency: true, agencyId: 'ag1' }),
		).toEqual({
			user,
			claims: { admin: true, agency: false, agencyId: null, agencyName: null },
		})
	})

	test('agency keeps its id and name', () => {
		expect(
			toInitialAuth({
				...base,
				agency: true,
				agencyId: 'ag1',
				agencyName: 'PD',
			}).claims,
		).toEqual({ admin: false, agency: true, agencyId: 'ag1', agencyName: 'PD' })
	})

	test('agency without a usable id or name gets nulls', () => {
		expect(
			toInitialAuth({ ...base, agency: true, agencyId: '', agencyName: 7 })
				.claims,
		).toEqual({ admin: false, agency: true, agencyId: null, agencyName: null })
	})

	test('plain user gets no roles', () => {
		expect(toInitialAuth(base)).toEqual({
			user,
			claims: { admin: false, agency: false, agencyId: null, agencyName: null },
		})
	})

	test('missing email and name become null', () => {
		expect(toInitialAuth({ uid: 'u1' }).user).toEqual({
			uid: 'u1',
			accountId: 'u1',
			email: null,
			displayName: null,
		})
	})
})

describe('safeNextPath', () => {
	test.each([
		['/dashboard/reports/x?y=1'],
		['/'],
		['/dashboard/reports/x#notes'],
	])('keeps same-site path %s', (next) => {
		expect(safeNextPath(next)).toBe(next)
	})

	test.each([
		['protocol-relative', '//evil.com'],
		['absolute URL', 'https://evil.com'],
		['backslash', '/\\evil.com'],
		['backslash later on', '/x/..\\/\\evil.com'],
		['tab that browsers strip', '/\t/evil.com'],
		['newline', '/dashboard\n'],
		['javascript URL', 'javascript:alert(1)'],
		['relative path', 'dashboard'],
		['empty', ''],
		['array from a repeated query param', ['/a', '/b']],
		['undefined', undefined],
	])('rejects %s', (_label, next) => {
		expect(safeNextPath(next)).toBeNull()
	})
})
