/** @jest-environment node */
import { canReadReport, reportPageResult } from '../report-access'

const agencyA = { uid: 'uid-a', agency: true, agencyId: 'agency-a' }
const reportA = { agencyId: 'agency-a', userID: 'user-1' }

describe('canReadReport', () => {
	test.each([
		['admin, any report', { uid: 'uid-admin', admin: true }, reportA, true],
		[
			'admin, report without agencyId',
			{ uid: 'uid-admin', admin: true },
			{ userID: 'user-1' },
			true,
		],
		['agency, same agencyId', agencyA, reportA, true],
		[
			'agency, other agencyId',
			agencyA,
			{ agencyId: 'agency-b', userID: 'user-1' },
			false,
		],
		['agency, report without agencyId', agencyA, { userID: 'user-1' }, false],
		[
			'agency claim with empty agencyId, report agencyId empty',
			{ uid: 'uid-x', agency: true, agencyId: '' },
			{ agencyId: '', userID: 'user-1' },
			false,
		],
		[
			'agency claim without agencyId, report without agencyId',
			{ uid: 'uid-x', agency: true },
			{ userID: 'user-1' },
			false,
		],
		[
			'agencyId claim without agency flag',
			{ uid: 'uid-x', agencyId: 'agency-a' },
			reportA,
			false,
		],
		['submitter', { uid: 'user-1' }, reportA, true],
		[
			'agency user who submitted a report elsewhere',
			{ ...agencyA, uid: 'user-1' },
			{ agencyId: 'agency-b', userID: 'user-1' },
			true,
		],
		['stranger', { uid: 'user-2' }, reportA, false],
		[
			'empty uid vs empty userID',
			{ uid: '' },
			{ agencyId: 'agency-a', userID: '' },
			false,
		],
		['missing uid vs missing userID', {}, { agencyId: 'agency-a' }, false],
		['missing claims', null, reportA, false],
		['missing report', agencyA, undefined, false],
	])('%s -> %s', (_label, claims, report, expected) => {
		expect(canReadReport(claims, report)).toBe(expected)
	})
})

describe('reportPageResult', () => {
	const resolvedUrl = '/dashboard/reports/r1?tab=notes&x=a b'

	test('redirects a signed-out visitor to login and back', () => {
		expect(reportPageResult({ session: null, report: reportA, resolvedUrl })).toEqual({
			redirect: {
				destination:
					'/login?next=%2Fdashboard%2Freports%2Fr1%3Ftab%3Dnotes%26x%3Da%20b',
				permanent: false,
			},
		})
	})

	test('keeps a non-default locale on the login page', () => {
		expect(
			reportPageResult({
				session: null,
				report: reportA,
				resolvedUrl: '/dashboard/reports/r1',
				locale: 'es',
				defaultLocale: 'en',
			}).redirect.destination,
		).toBe('/es/login?next=%2Fdashboard%2Freports%2Fr1')
	})

	test('leaves the default locale unprefixed', () => {
		expect(
			reportPageResult({
				session: null,
				report: reportA,
				resolvedUrl: '/dashboard/reports/r1',
				locale: 'en',
				defaultLocale: 'en',
			}).redirect.destination,
		).toBe('/login?next=%2Fdashboard%2Freports%2Fr1')
	})

	test('redirects before revealing whether the report exists', () => {
		expect(
			reportPageResult({ session: null, report: undefined, resolvedUrl }),
		).toHaveProperty('redirect')
	})

	test.each([
		['a missing report', agencyA, undefined],
		['another agency', agencyA, { agencyId: 'agency-b', userID: 'user-1' }],
		['a stranger', { uid: 'user-2' }, reportA],
	])('404s %s', (_label, session, report) => {
		expect(reportPageResult({ session, report, resolvedUrl })).toEqual({
			notFound: true,
		})
	})

	test.each([
		['same agency', agencyA],
		['admin', { uid: 'uid-admin', admin: true }],
		['submitter', { uid: 'user-1' }],
	])('allows %s', (_label, session) => {
		expect(reportPageResult({ session, report: reportA, resolvedUrl })).toEqual({
			allowed: true,
		})
	})
})
