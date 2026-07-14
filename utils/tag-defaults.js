/**
 * Global Topic/Source tag defaults for all agencies.
 * Admins edit `tagSystems/defaults`; newsrooms cannot remove required tags.
 */

import {
	collection,
	doc,
	getDoc,
	getDocs,
	setDoc,
	updateDoc,
	arrayUnion,
	serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { DEFAULT_AGENCY_LABELS } from '../config/labels'
import { maxActiveTags } from '../config/tagSystems'

export const TAG_DEFAULTS_DOC_PATH = ['tagSystems', 'defaults']

/** Fallback when Firestore defaults doc is missing. */
export const FALLBACK_TOPIC_REQUIRED = [
	'Voting',
	'Senate',
	'Gubernatorial',
	'Mayoral',
	'Election (general)',
	'Other',
]

/** Fallback when Firestore defaults doc is missing. */
export const FALLBACK_SOURCE_REQUIRED = [
	'Newspaper',
	'Social',
	'Website',
	'Television',
	'Radio',
	'Podcast',
	'Other',
]

const MAX_ACTIVE_TOPICS = maxActiveTags[1]
const MAX_ACTIVE_SOURCES = maxActiveTags[2]

/**
 * Ensures Other is present and last in a required tag list.
 *
 * @param {string[]} tags
 * @returns {string[]}
 */
export function ensureOtherInRequired(tags) {
	const cleaned = (tags || [])
		.map((t) => (typeof t === 'string' ? t.trim() : ''))
		.filter(Boolean)
		.filter((t) => {
			const lower = t.toLowerCase()
			return lower !== 'other' && lower !== 'other/otro'
		})
	return [...cleaned, 'Other']
}

/**
 * True when this tag is the locked Other slot (including legacy Other/Otro).
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isOtherTagName(name) {
	if (!name || typeof name !== 'string') return false
	const id = name.trim()
	return id === 'Other' || id === 'Other/Otro' || id.toLowerCase() === 'other'
}

/**
 * True when a tag is in the admin-required set (Other aliases match Other).
 *
 * @param {string} name
 * @param {string[]} requiredList
 * @returns {boolean}
 */
export function isRequiredTag(name, requiredList) {
	if (!name || !Array.isArray(requiredList)) return false
	if (isOtherTagName(name) && requiredList.some(isOtherTagName)) return true
	return requiredList.includes(name)
}

/**
 * @typedef {{ Topic: { required: string[] }, Source: { required: string[] } }} TagDefaults
 */

/**
 * Returns code fallbacks shaped like the Firestore defaults document.
 *
 * @returns {TagDefaults}
 */
export function getFallbackTagDefaults() {
	return {
		Topic: { required: [...FALLBACK_TOPIC_REQUIRED] },
		Source: { required: [...FALLBACK_SOURCE_REQUIRED] },
	}
}

/**
 * Normalizes a raw Firestore defaults payload into Topic/Source required lists.
 *
 * @param {Record<string, unknown>|undefined|null} data
 * @returns {TagDefaults}
 */
export function normalizeTagDefaults(data) {
	const fallback = getFallbackTagDefaults()
	const topicRaw = data?.Topic?.required ?? data?.Topic?.tags ?? fallback.Topic.required
	const sourceRaw =
		data?.Source?.required ?? data?.Source?.tags ?? fallback.Source.required

	return {
		Topic: {
			required: ensureOtherInRequired(
				Array.isArray(topicRaw) ? topicRaw : fallback.Topic.required,
			),
		},
		Source: {
			required: ensureOtherInRequired(
				Array.isArray(sourceRaw) ? sourceRaw : fallback.Source.required,
			),
		},
	}
}

/**
 * Loads global tag defaults from Firestore, or code fallbacks if missing.
 *
 * @returns {Promise<TagDefaults>}
 */
export async function fetchTagDefaults() {
	try {
		const snap = await getDoc(doc(db, ...TAG_DEFAULTS_DOC_PATH))
		if (!snap.exists()) return getFallbackTagDefaults()
		return normalizeTagDefaults(snap.data())
	} catch (err) {
		console.error('Error fetching tag defaults:', err)
		return getFallbackTagDefaults()
	}
}

/**
 * Builds the full agency tags document payload from global defaults + labels.
 *
 * @param {TagDefaults} [defaults]
 * @returns {Promise<{ Topic: object, Source: object, Labels: object }>}
 */
export async function buildAgencyTagsPayload(defaults) {
	const resolved = defaults || (await fetchTagDefaults())
	const topics = resolved.Topic.required
	const sources = resolved.Source.required
	return {
		Topic: { list: [...topics], active: [...topics] },
		Source: { list: [...sources], active: [...sources] },
		Labels: {
			list: [...DEFAULT_AGENCY_LABELS],
			active: [...DEFAULT_AGENCY_LABELS],
		},
	}
}

/**
 * Creates or overwrites an agency tags document seeded from global defaults.
 *
 * @param {string} agencyId
 * @param {TagDefaults} [defaults]
 * @returns {Promise<void>}
 */
export async function seedAgencyTagsDoc(agencyId, defaults) {
	if (!agencyId) return
	const payload = await buildAgencyTagsPayload(defaults)
	await setDoc(doc(db, 'tags', agencyId), payload)
}

/**
 * Validates admin-edited required lists before save.
 *
 * @param {string[]} topicRequired
 * @param {string[]} sourceRequired
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateTagDefaults(topicRequired, sourceRequired) {
	const topics = ensureOtherInRequired(topicRequired)
	const sources = ensureOtherInRequired(sourceRequired)

	if (topics.length > MAX_ACTIVE_TOPICS) {
		return {
			ok: false,
			error: `Topic defaults cannot exceed ${MAX_ACTIVE_TOPICS} tags (including Other).`,
		}
	}
	if (sources.length > MAX_ACTIVE_SOURCES) {
		return {
			ok: false,
			error: `Source defaults cannot exceed ${MAX_ACTIVE_SOURCES} tags (including Other).`,
		}
	}
	if (!topics.some(isOtherTagName) || !sources.some(isOtherTagName)) {
		return { ok: false, error: 'Other must remain in both Topic and Source defaults.' }
	}
	return { ok: true }
}

/**
 * Writes the global defaults document.
 *
 * @param {{ topicRequired: string[], sourceRequired: string[], userId?: string }} params
 * @returns {Promise<TagDefaults>}
 */
export async function saveTagDefaults({ topicRequired, sourceRequired, userId }) {
	const topics = ensureOtherInRequired(topicRequired)
	const sources = ensureOtherInRequired(sourceRequired)
	const validation = validateTagDefaults(topics, sources)
	if (!validation.ok) {
		throw new Error(validation.error)
	}

	const payload = {
		Topic: { required: topics },
		Source: { required: sources },
		updatedAt: serverTimestamp(),
		updatedBy: userId || null,
	}

	await setDoc(doc(db, ...TAG_DEFAULTS_DOC_PATH), payload, { merge: true })
	return normalizeTagDefaults(payload)
}

/**
 * Unions required tags into one agency tags doc (additive; leaves retired tags).
 *
 * @param {string} agencyId
 * @param {TagDefaults} defaults
 * @returns {Promise<void>}
 */
export async function propagateRequiredToAgency(agencyId, defaults) {
	if (!agencyId) return
	const topics = defaults.Topic.required
	const sources = defaults.Source.required
	const docRef = doc(db, 'tags', agencyId)
	const snap = await getDoc(docRef)

	if (!snap.exists()) {
		await seedAgencyTagsDoc(agencyId, defaults)
		return
	}

	await updateDoc(docRef, {
		'Topic.list': arrayUnion(...topics),
		'Topic.active': arrayUnion(...topics),
		'Source.list': arrayUnion(...sources),
		'Source.active': arrayUnion(...sources),
	})
}

/**
 * Pushes required defaults into every agency tags document (additive only).
 *
 * @param {TagDefaults} defaults
 * @returns {Promise<{ updated: number }>}
 */
export async function propagateRequiredToAllAgencies(defaults) {
	const tagsSnap = await getDocs(collection(db, 'tags'))
	const agencySnap = await getDocs(collection(db, 'agency'))

	const tagIds = new Set(tagsSnap.docs.map((d) => d.id))
	const agencyIds = agencySnap.docs.map((d) => d.id)

	let updated = 0
	for (const id of tagIds) {
		await propagateRequiredToAgency(id, defaults)
		updated += 1
	}
	for (const id of agencyIds) {
		if (tagIds.has(id)) continue
		await seedAgencyTagsDoc(id, defaults)
		updated += 1
	}

	return { updated }
}

/**
 * Saves global defaults and propagates required tags to all agencies.
 *
 * @param {{ topicRequired: string[], sourceRequired: string[], userId?: string }} params
 * @returns {Promise<{ defaults: TagDefaults, updated: number }>}
 */
export async function saveAndPropagateTagDefaults(params) {
	const defaults = await saveTagDefaults(params)
	const { updated } = await propagateRequiredToAllAgencies(defaults)
	return { defaults, updated }
}
