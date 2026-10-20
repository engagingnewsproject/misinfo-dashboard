jest.mock('firebase/firestore', () => ({
	collection: jest.fn(),
	query: jest.fn(),
	where: jest.fn(),
	orderBy: jest.fn(),
	limit: jest.fn(),
	startAfter: jest.fn(),
	getDocs: jest.fn(),
	doc: jest.fn(),
	getDoc: jest.fn(),
	documentId: jest.fn(),
}))

jest.mock('../../config/firebase', () => ({ db: {} }))

const { searchUsers } = require('../firebase-helpers')

describe('searchUsers', () => {
	const users = [
		{ email: 'ada@newsroom.org', name: 'Ada Lovelace', prolificId: '' },
		{ email: 'study@prolific.com', name: '', prolificId: '5f3a9c12' },
	]

	it('matches a Prolific ID without treating it as a name', () => {
		expect(searchUsers(users, '5f3a9c12')).toEqual([users[1]])
		expect(searchUsers(users, 'Ada')).toEqual([users[0]])
	})

	it('returns everyone when the search is blank', () => {
		expect(searchUsers(users, '  ')).toEqual(users)
	})
})
