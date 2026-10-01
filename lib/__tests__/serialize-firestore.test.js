/** @jest-environment node */
import { serializeFirestore } from '../serialize-firestore'

function timestamp(millis) {
	return {
		seconds: Math.floor(millis / 1000),
		nanoseconds: 0,
		toMillis: () => millis,
	}
}

describe('serializeFirestore', () => {
	it('converts Timestamp-like values nested in objects and arrays to millis', () => {
		expect(
			serializeFirestore({
				createdDate: timestamp(1000),
				meta: { archivedAt: timestamp(2000) },
				history: [timestamp(3000), { at: timestamp(4000) }],
			}),
		).toEqual({
			createdDate: 1000,
			meta: { archivedAt: 2000 },
			history: [3000, { at: 4000 }],
		})
	})

	it('leaves primitives and null untouched', () => {
		const input = { title: 'A', count: 0, archived: false, agencyId: null }
		expect(serializeFirestore(input)).toEqual(input)
		expect(serializeFirestore('text')).toBe('text')
		expect(serializeFirestore(null)).toBeNull()
	})

	it('drops undefined object keys and turns undefined array items into null', () => {
		const result = serializeFirestore({
			a: 1,
			b: undefined,
			list: [undefined, 2],
		})
		expect(result).toEqual({ a: 1, list: [null, 2] })
		expect(Object.keys(result)).toEqual(['a', 'list'])
	})

	it('does not mutate the input', () => {
		const createdDate = timestamp(1000)
		const input = { createdDate, nested: { b: undefined }, list: [createdDate] }
		serializeFirestore(input)
		expect(input.createdDate).toBe(createdDate)
		expect(input.list[0]).toBe(createdDate)
		expect('b' in input.nested).toBe(true)
	})
})
