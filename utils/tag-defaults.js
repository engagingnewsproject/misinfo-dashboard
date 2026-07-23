/**
 * Global Topic/Source tag defaults for all agencies.
 * Admins edit `tagSystems/defaults` with bilingual labels; newsrooms get English ids only.
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

export const TAG_LABEL_MAX_LENGTH = 40
export const TAG_ID_MAX_LENGTH = 40

/**
 * @typedef {{ en: string, es: string }} TagLabels
 * @typedef {{ id: string, labels: TagLabels }} LabeledTag
 * @typedef {{ Topic: { required: LabeledTag[] }, Source: { required: LabeledTag[] } }} TagDefaults
 */

/** @type {LabeledTag[]} */
export const FALLBACK_TOPIC_REQUIRED = [
	{ id: 'Voting', labels: { en: 'Voting', es: 'Votación' } },
	{ id: 'Senate', labels: { en: 'Senate', es: 'Senado' } },
	{
		id: 'Gubernatorial',
		labels: { en: 'Gubernatorial', es: 'Gobernatura' },
	},
	{ id: 'Mayoral', labels: { en: 'Mayoral', es: 'Alcaldía' } },
	{
		id: 'Election (general)',
		labels: { en: 'Election (general)', es: 'Elección (general)' },
	},
	{ id: 'Other', labels: { en: 'Other', es: 'Otro' } },
]

/** @type {LabeledTag[]} */
export const FALLBACK_SOURCE_REQUIRED = [
	{ id: 'Newspaper', labels: { en: 'Newspaper', es: 'Periódico' } },
	{ id: 'Social', labels: { en: 'Social', es: 'Social' } },
	{ id: 'Website', labels: { en: 'Website', es: 'Sitio web' } },
	{ id: 'Television', labels: { en: 'Television', es: 'Televisión' } },
	{ id: 'Radio', labels: { en: 'Radio', es: 'Radio' } },
	{ id: 'Podcast', labels: { en: 'Podcast', es: 'Podcast' } },
	{ id: 'Other', labels: { en: 'Other', es: 'Otro' } },
]

const MAX_ACTIVE_TOPICS = maxActiveTags[1]
const MAX_ACTIVE_SOURCES = maxActiveTags[2]

const OTHER_LABELED = { id: 'Other', labels: { en: 'Other', es: 'Otro' } }

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
 * Maps legacy / prefixed tag strings to a canonical English id.
 *
 * @param {string} name
 * @returns {string}
 */
export function canonicalizeTagId(name) {
	if (!name || typeof name !== 'string') return ''
	let id = name.trim()
	while (id.startsWith('topics.')) id = id.slice('topics.'.length)
	while (id.startsWith('sources.')) id = id.slice('sources.'.length)
	if (isOtherTagName(id)) return 'Other'
	return id
}

/**
 * Unique id list with a single trailing Other (collapses Other/Otro aliases).
 *
 * @param {string[]} tags
 * @returns {string[]}
 */
export function dedupeTagList(tags) {
	const seen = new Set()
	const out = []
	for (const raw of tags || []) {
		const id = canonicalizeTagId(typeof raw === 'string' ? raw : '')
		if (!id || id === 'Other') continue
		const key = id.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		out.push(id)
	}
	out.push('Other')
	return out
}

/**
 * Ensures Other is present and last in a string id list (agency arrays).
 *
 * @param {string[]} tags
 * @returns {string[]}
 */
export function ensureOtherInRequired(tags) {
	return dedupeTagList(tags)
}

/**
 * @param {unknown} entry
 * @returns {LabeledTag|null}
 */
function coerceLabeledTag(entry) {
	if (!entry) return null
	if (typeof entry === 'string') {
		const id = canonicalizeTagId(entry)
		if (!id) return null
		if (id === 'Other') return { ...OTHER_LABELED }
		return { id, labels: { en: id, es: id } }
	}
	if (typeof entry === 'object') {
		const id = canonicalizeTagId(
			typeof entry.id === 'string' ? entry.id : '',
		)
		if (!id) return null
		const en =
			typeof entry.labels?.en === 'string'
				? entry.labels.en.trim()
				: typeof entry.en === 'string'
					? entry.en.trim()
					: id
		const es =
			typeof entry.labels?.es === 'string'
				? entry.labels.es.trim()
				: typeof entry.es === 'string'
					? entry.es.trim()
					: en || id
		if (id === 'Other') {
			return {
				id: 'Other',
				labels: {
					en: en || 'Other',
					es: es || 'Otro',
				},
			}
		}
		return { id, labels: { en: en || id, es: es || en || id } }
	}
	return null
}

/**
 * Ensures Other is present and last among labeled required tags.
 *
 * @param {unknown[]} tags
 * @returns {LabeledTag[]}
 */
export function ensureOtherInLabeledRequired(tags) {
	const cleaned = []
	const seen = new Set()
	for (const raw of tags || []) {
		const entry = coerceLabeledTag(raw)
		if (!entry || entry.id === 'Other') continue
		const key = entry.id.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		cleaned.push(entry)
	}
	cleaned.push({
		id: 'Other',
		labels: { en: 'Other', es: 'Otro' },
	})
	return cleaned
}

/**
 * English ids from a defaults system list.
 *
 * @param {TagDefaults} defaults
 * @param {'Topic'|'Source'} system
 * @returns {string[]}
 */
export function getRequiredIds(defaults, system) {
	const list = defaults?.[system]?.required
	if (!Array.isArray(list)) return []
	return ensureOtherInRequired(
		list.map((entry) =>
			typeof entry === 'string' ? entry : entry?.id,
		),
	)
}

/**
 * True when a tag id is in the admin-required set (Other aliases match Other).
 *
 * @param {string} name
 * @param {Array<string|LabeledTag>} requiredList
 * @returns {boolean}
 */
export function isRequiredTag(name, requiredList) {
	if (!name || !Array.isArray(requiredList)) return false
	const ids = requiredList.map((entry) =>
		typeof entry === 'string' ? entry : entry?.id,
	)
	if (isOtherTagName(name) && ids.some(isOtherTagName)) return true
	const canonical = canonicalizeTagId(name)
	return ids.some((id) => canonicalizeTagId(id) === canonical)
}

/**
 * Returns code fallbacks shaped like the Firestore defaults document.
 *
 * @returns {TagDefaults}
 */
export function getFallbackTagDefaults() {
	return {
		Topic: { required: ensureOtherInLabeledRequired(FALLBACK_TOPIC_REQUIRED) },
		Source: {
			required: ensureOtherInLabeledRequired(FALLBACK_SOURCE_REQUIRED),
		},
	}
}

/**
 * Normalizes a raw Firestore defaults payload into labeled Topic/Source lists.
 *
 * @param {Record<string, unknown>|undefined|null} data
 * @returns {TagDefaults}
 */
export function normalizeTagDefaults(data) {
	const fallback = getFallbackTagDefaults()
	const topicRaw =
		data?.Topic?.required ?? data?.Topic?.tags ?? fallback.Topic.required
	const sourceRaw =
		data?.Source?.required ?? data?.Source?.tags ?? fallback.Source.required

	return {
		Topic: {
			required: ensureOtherInLabeledRequired(
				Array.isArray(topicRaw) ? topicRaw : fallback.Topic.required,
			),
		},
		Source: {
			required: ensureOtherInLabeledRequired(
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
 * Builds a flat id → labels map from defaults (both Topic and Source).
 *
 * @param {TagDefaults} defaults
 * @returns {Record<string, TagLabels>}
 */
export function buildTagLabelMap(defaults) {
	/** @type {Record<string, TagLabels>} */
	const map = {}
	for (const system of ['Topic', 'Source']) {
		for (const entry of defaults?.[system]?.required || []) {
			const id = canonicalizeTagId(entry?.id)
			if (!id) continue
			map[id] = {
				en: entry.labels?.en || id,
				es: entry.labels?.es || entry.labels?.en || id,
			}
		}
	}
	return map
}

/**
 * Normalizes a Firestore Topic.labels / Source.labels map into id → { en, es }.
 *
 * @param {Record<string, unknown>|undefined|null} agencyLabels
 * @returns {Record<string, TagLabels>}
 */
export function normalizeAgencyLabelMap(agencyLabels) {
	/** @type {Record<string, TagLabels>} */
	const map = {}
	if (!agencyLabels || typeof agencyLabels !== 'object') return map
	for (const [rawId, rawLabels] of Object.entries(agencyLabels)) {
		const id = canonicalizeTagId(rawId)
		if (!id || id === 'Other') continue
		const en =
			typeof rawLabels?.en === 'string'
				? rawLabels.en.trim()
				: typeof rawLabels === 'string'
					? rawLabels.trim()
					: id
		const es =
			typeof rawLabels?.es === 'string' ? rawLabels.es.trim() : en || id
		if (!en && !es) continue
		map[id] = { en: en || id, es: es || en || id }
	}
	return map
}

/**
 * Merges admin-default labels with agency custom labels.
 * Defaults always win for required ids; agency entries only apply to custom tags.
 *
 * @param {Record<string, TagLabels>|undefined|null} defaultsMap
 * @param {Record<string, TagLabels>|undefined|null} agencyLabels
 * @returns {Record<string, TagLabels>}
 */
export function mergeTagLabelMaps(defaultsMap, agencyLabels) {
	const defaults = defaultsMap || {}
	/** @type {Set<string>} */
	const requiredIds = new Set(
		Object.keys(defaults).map((id) => canonicalizeTagId(id)).filter(Boolean),
	)
	/** @type {Record<string, TagLabels>} */
	const customOnly = {}
	for (const [id, labels] of Object.entries(
		normalizeAgencyLabelMap(agencyLabels),
	)) {
		if (requiredIds.has(canonicalizeTagId(id))) continue
		customOnly[id] = labels
	}
	return { ...defaults, ...customOnly }
}

/**
 * Loads a display label map for an agency tags document id (defaults + custom).
 *
 * @param {string|undefined|null} agencyId
 * @returns {Promise<Record<string, TagLabels>>}
 */
export async function fetchMergedTagLabelMapForAgencyId(agencyId) {
	const defaults = await fetchTagDefaults()
	if (!agencyId) return buildTagLabelMap(defaults)
	const snap = await getDoc(doc(db, 'tags', agencyId))
	if (!snap.exists()) return buildTagLabelMap(defaults)
	return buildMergedAgencyTagLabelMap(defaults, snap.data())
}

/**
 * Builds a merged label map for one agency tags doc + global defaults.
 *
 * @param {TagDefaults} defaults
 * @param {{ Topic?: { labels?: Record<string, TagLabels> }, Source?: { labels?: Record<string, TagLabels> } }|undefined|null} agencyTagsDoc
 * @returns {Record<string, TagLabels>}
 */
export function buildMergedAgencyTagLabelMap(defaults, agencyTagsDoc) {
	const defaultsMap = buildTagLabelMap(defaults)
	const topicLabels = normalizeAgencyLabelMap(agencyTagsDoc?.Topic?.labels)
	const sourceLabels = normalizeAgencyLabelMap(agencyTagsDoc?.Source?.labels)
	return mergeTagLabelMaps(defaultsMap, { ...topicLabels, ...sourceLabels })
}

/**
 * Updates labels map when renaming a custom tag id.
 *
 * @param {Record<string, TagLabels>} labels
 * @param {string} oldId
 * @param {string} newId
 * @param {TagLabels} nextLabels
 * @returns {Record<string, TagLabels>}
 */
export function renameAgencyTagInLabelMap(labels, oldId, newId, nextLabels) {
	const next = { ...(labels || {}) }
	const from = canonicalizeTagId(oldId)
	const to = canonicalizeTagId(newId)
	if (from && from !== 'Other') delete next[from]
	if (to && to !== 'Other') {
		next[to] = {
			en: nextLabels?.en?.trim() || to,
			es: nextLabels?.es?.trim() || nextLabels?.en?.trim() || to,
		}
	}
	return next
}

/**
 * Removes a custom tag id from the labels map.
 *
 * @param {Record<string, TagLabels>} labels
 * @param {string} id
 * @returns {Record<string, TagLabels>}
 */
export function removeAgencyTagFromLabelMap(labels, id) {
	const next = { ...(labels || {}) }
	const key = canonicalizeTagId(id)
	if (key) delete next[key]
	return next
}

/**
 * Display label for a tag id.
 *
 * @param {{
 *   id: string,
 *   locale?: string,
 *   labelMap?: Record<string, TagLabels>,
 *   defaults?: TagDefaults,
 *   t?: (key: string, defaultValue?: string) => string,
 *   system?: 'topics'|'sources',
 * }} opts
 * @returns {string}
 */
export function getTagLabel({
	id,
	locale = 'en',
	labelMap,
	defaults,
	t,
	system = 'topics',
}) {
	const canonical = canonicalizeTagId(id)
	if (!canonical) return typeof id === 'string' ? id : ''

	const map = labelMap || (defaults ? buildTagLabelMap(defaults) : null)
	const labels = map?.[canonical]
	const lang = String(locale || 'en').toLowerCase().startsWith('es')
		? 'es'
		: 'en'
	if (labels?.[lang]) return labels[lang]
	if (labels?.en) return labels.en

	if (typeof t === 'function') {
		const group = t(system, { returnObjects: true })
		if (
			group &&
			typeof group === 'object' &&
			typeof group[canonical] === 'string' &&
			group[canonical]
		) {
			return group[canonical]
		}
	}

	return canonical === 'Other' && lang === 'es' ? 'Otro' : canonical
}

/**
 * Builds the full agency tags document payload from global defaults + labels.
 *
 * @param {TagDefaults} [defaults]
 * @returns {Promise<{ Topic: object, Source: object, Labels: object }>}
 */
export async function buildAgencyTagsPayload(defaults) {
	const resolved = defaults || (await fetchTagDefaults())
	const topics = getRequiredIds(resolved, 'Topic')
	const sources = getRequiredIds(resolved, 'Source')
	return {
		Topic: { list: [...topics], active: [...topics], labels: {} },
		Source: { list: [...sources], active: [...sources], labels: {} },
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
 * @returns {Promise<{ Topic: object, Source: object, Labels: object }|undefined>}
 */
export async function seedAgencyTagsDoc(agencyId, defaults) {
	if (!agencyId) return undefined
	const payload = await buildAgencyTagsPayload(defaults)
	await setDoc(doc(db, 'tags', agencyId), payload)
	return payload
}

/**
 * @param {LabeledTag} entry
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateLabeledTag(entry) {
	const id = typeof entry?.id === 'string' ? entry.id.trim() : ''
	const en =
		typeof entry?.labels?.en === 'string' ? entry.labels.en.trim() : ''
	const es =
		typeof entry?.labels?.es === 'string' ? entry.labels.es.trim() : ''
	if (!id) return { ok: false, error: 'English id is required.' }
	if (!en) return { ok: false, error: 'English label is required.' }
	if (id.length > TAG_ID_MAX_LENGTH) {
		return {
			ok: false,
			error: `Tag id cannot exceed ${TAG_ID_MAX_LENGTH} characters.`,
		}
	}
	if (en.length > TAG_LABEL_MAX_LENGTH || es.length > TAG_LABEL_MAX_LENGTH) {
		return {
			ok: false,
			error: `Labels cannot exceed ${TAG_LABEL_MAX_LENGTH} characters.`,
		}
	}
	return { ok: true }
}

/**
 * Validates admin-edited required lists before save.
 *
 * @param {LabeledTag[]} topicRequired
 * @param {LabeledTag[]} sourceRequired
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateTagDefaults(topicRequired, sourceRequired) {
	const topics = ensureOtherInLabeledRequired(topicRequired)
	const sources = ensureOtherInLabeledRequired(sourceRequired)

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
	if (!topics.some((t) => t.id === 'Other') || !sources.some((t) => t.id === 'Other')) {
		return { ok: false, error: 'Other must remain in both Topic and Source defaults.' }
	}

	for (const entry of [...topics, ...sources]) {
		const check = validateLabeledTag(entry)
		if (!check.ok) return check
	}

	return { ok: true }
}

/**
 * Writes the global defaults document.
 *
 * @param {{ topicRequired: LabeledTag[], sourceRequired: LabeledTag[], userId?: string }} params
 * @returns {Promise<TagDefaults>}
 */
export async function saveTagDefaults({ topicRequired, sourceRequired, userId }) {
	const topics = ensureOtherInLabeledRequired(topicRequired)
	const sources = ensureOtherInLabeledRequired(sourceRequired)
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
 * Normalizes Topic/Source list+active on one agency tags doc.
 *
 * @param {string} agencyId
 * @returns {Promise<boolean>} true if the document was updated
 */
export async function normalizeOtherAliasesForAgency(agencyId) {
	if (!agencyId || agencyId === 'defaults') return false
	const docRef = doc(db, 'tags', agencyId)
	const snap = await getDoc(docRef)
	if (!snap.exists()) return false

	const data = snap.data() || {}
	const topicList = dedupeTagList(data.Topic?.list || [])
	const topicActive = dedupeTagList(data.Topic?.active || [])
	const sourceList = dedupeTagList(data.Source?.list || [])
	const sourceActive = dedupeTagList(data.Source?.active || [])

	const same =
		JSON.stringify(data.Topic?.list || []) === JSON.stringify(topicList) &&
		JSON.stringify(data.Topic?.active || []) === JSON.stringify(topicActive) &&
		JSON.stringify(data.Source?.list || []) === JSON.stringify(sourceList) &&
		JSON.stringify(data.Source?.active || []) === JSON.stringify(sourceActive)

	if (same) return false

	await updateDoc(docRef, {
		'Topic.list': topicList,
		'Topic.active': topicActive,
		'Source.list': sourceList,
		'Source.active': sourceActive,
	})
	return true
}

/**
 * Unions required tag ids into one agency tags doc, then normalizes Other aliases.
 *
 * @param {string} agencyId
 * @param {TagDefaults} defaults
 * @returns {Promise<void>}
 */
export async function propagateRequiredToAgency(agencyId, defaults) {
	if (!agencyId || agencyId === 'defaults') return
	const topics = getRequiredIds(defaults, 'Topic')
	const sources = getRequiredIds(defaults, 'Source')
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

	await normalizeOtherAliasesForAgency(agencyId)
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

	const tagIds = new Set(
		tagsSnap.docs.map((d) => d.id).filter((id) => id !== 'defaults'),
	)
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
 * Collapses Other aliases on every agency tags document.
 *
 * @returns {Promise<{ updated: number, scanned: number }>}
 */
export async function normalizeOtherAliasesForAllAgencies() {
	const tagsSnap = await getDocs(collection(db, 'tags'))
	let updated = 0
	let scanned = 0
	for (const d of tagsSnap.docs) {
		if (d.id === 'defaults') continue
		scanned += 1
		const changed = await normalizeOtherAliasesForAgency(d.id)
		if (changed) updated += 1
	}
	return { updated, scanned }
}

/**
 * Saves global defaults and propagates required tags to all agencies.
 *
 * @param {{ topicRequired: LabeledTag[], sourceRequired: LabeledTag[], userId?: string }} params
 * @returns {Promise<{ defaults: TagDefaults, updated: number }>}
 */
export async function saveAndPropagateTagDefaults(params) {
	const defaults = await saveTagDefaults(params)
	const { updated } = await propagateRequiredToAllAgencies(defaults)
	return { defaults, updated }
}
