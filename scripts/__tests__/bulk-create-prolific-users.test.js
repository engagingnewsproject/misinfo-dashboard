/**
 * @fileoverview Parse/dedupe helpers for Prolific bulk account import.
 */

const {
	DEFAULT_PASSWORD,
	parseEmailList,
	applyLimit,
	buildNewMobileUserFields,
	parseArgs,
} = require('../bulk-create-prolific-users')

describe('parseEmailList', () => {
	it('trims, skips blanks and comments, keeps emails', () => {
		const text = `
# header
  a@email.prolific.com  
b@email.prolific.com

not-an-email
c@email.prolific.com
`
		expect(parseEmailList(text)).toEqual([
			'a@email.prolific.com',
			'b@email.prolific.com',
			'c@email.prolific.com',
		])
	})

	it('dedupes case-insensitively and keeps the first form lowercased', () => {
		expect(
			parseEmailList(`
Foo@Email.Prolific.com
foo@email.prolific.com
FOO@EMAIL.PROLIFIC.COM
`),
		).toEqual(['foo@email.prolific.com'])
	})

	it('returns empty for empty input', () => {
		expect(parseEmailList('')).toEqual([])
		expect(parseEmailList(null)).toEqual([])
	})
})

describe('applyLimit', () => {
	it('returns all when limit is 0', () => {
		expect(applyLimit(['a', 'b'], 0)).toEqual(['a', 'b'])
	})

	it('slices when limit is positive', () => {
		expect(applyLimit(['a', 'b', 'c'], 2)).toEqual(['a', 'b'])
	})
})

describe('buildNewMobileUserFields', () => {
	it('sets study-shaped fields and mustChangePassword', () => {
		const fields = buildNewMobileUserFields(
			'x@email.prolific.com',
			'truthsleuth-study',
		)
		expect(fields).toMatchObject({
			name: '',
			email: 'x@email.prolific.com',
			city: null,
			state: null,
			isBanned: false,
			userRole: 'User',
			contact: false,
			signupSource: 'truthsleuth-study',
			mustChangePassword: true,
		})
		expect(typeof fields.joiningDate).toBe('number')
	})
})

describe('parseArgs', () => {
	it('requires --file', () => {
		expect(() => parseArgs([])).toThrow(/--file/)
	})

	it('parses flags with defaults', () => {
		const opts = parseArgs(['--file=list.md', '--dry-run', '--emulator', '--limit=3'])
		expect(opts).toMatchObject({
			file: 'list.md',
			password: DEFAULT_PASSWORD,
			dryRun: true,
			emulator: true,
			limit: 3,
		})
	})

	it('accepts password and signup-source overrides', () => {
		const opts = parseArgs([
			'--file=list.md',
			'--password=otherPass1!',
			'--signup-source=caffeine-study',
		])
		expect(opts.password).toBe('otherPass1!')
		expect(opts.signupSource).toBe('caffeine-study')
	})
})
