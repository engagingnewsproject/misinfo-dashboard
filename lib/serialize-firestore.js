// Next props reject undefined, so undefined keys are dropped and undefined array items become null.
export function serializeFirestore(value) {
	if (value === null || typeof value !== 'object') {
		return value
	}

	if (typeof value.toMillis === 'function') {
		return value.toMillis()
	}

	if (Array.isArray(value)) {
		return value.map((item) =>
			item === undefined ? null : serializeFirestore(item),
		)
	}

	const proto = Object.getPrototypeOf(value)
	if (proto !== Object.prototype && proto !== null) {
		return value
	}

	const result = {}
	for (const [key, entry] of Object.entries(value)) {
		if (entry !== undefined) {
			result[key] = serializeFirestore(entry)
		}
	}
	return result
}
