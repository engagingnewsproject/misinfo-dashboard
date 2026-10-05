/** @jest-environment node */
import { canReadReport } from '../report-access'

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
