/**
 * Nightly Truth Sleuth knobs stored in Firestore `settings/pipeline`.
 * Admin read/write from the Pipeline tab; the Cloud Run job applies overrides
 * at startup. Missing fields fall back to the job env (prod defaults below).
 */

import { doc, getDoc, setDoc } from 'firebase/firestore'

export const PIPELINE_SETTINGS_COLLECTION = 'settings'
export const PIPELINE_SETTINGS_DOC_ID = 'pipeline'

/**
 * Mirrors config/cloud-run-job.env.gcp-production-daily (display + UI seed).
 * @type {PipelineConfig}
 */
export const PROD_DEFAULTS = {
	importToFirestore: true,
	jobFilterProcessedUrls: true,
	publicationDateFreshnessFilter: true,
	firestoreImportForceSingleAgency: false,
	maxDomains: 6000,
	maxLinksPerDomain: 10,
	curatedArticleLimit: 200,
	minPublicationDate: '2026-01-01',
	firestoreImportUserId: '',
	firestoreImportAgencyName: 'Test Agency',
}

/**
 * @typedef {'switch' | 'number' | 'date' | 'text'} PipelineSettingType
 */

/**
 * @typedef {object} PipelineSettingField
 * @property {keyof PipelineConfig} key
 * @property {PipelineSettingType} type
 * @property {string} label
 * @property {string} description
 * @property {string} defaultLabel
 * @property {string} [group]
 */

/**
 * @typedef {object} PipelineConfig
 * @property {boolean} importToFirestore
 * @property {boolean} jobFilterProcessedUrls
 * @property {boolean} publicationDateFreshnessFilter
 * @property {boolean} firestoreImportForceSingleAgency
 * @property {number} maxDomains
 * @property {number} maxLinksPerDomain
 * @property {number} curatedArticleLimit
 * @property {string} minPublicationDate
 * @property {string} firestoreImportUserId
 * @property {string} firestoreImportAgencyName
 */

/** @type {PipelineSettingField[]} */
export const PIPELINE_SETTING_FIELDS = [
	{
		key: 'maxDomains',
		type: 'number',
		group: 'Scrape',
		label: 'Max domains',
		description:
			'How many domains to scrape this run. Lower = faster/cheaper; higher = broader coverage and longer runtime.',
		defaultLabel: '6000',
	},
	{
		key: 'maxLinksPerDomain',
		type: 'number',
		group: 'Scrape',
		label: 'Max links per domain',
		description:
			'Cap on homepage links kept per domain. Higher finds more articles but costs more scrape/extract time.',
		defaultLabel: '10',
	},
	{
		key: 'jobFilterProcessedUrls',
		type: 'switch',
		group: 'Scrape',
		label: 'Skip URLs already processed',
		description:
			'When on, skips links seen in prior runs (faster, fewer duplicates). Turn off only for deliberate re-scrapes/tests — can balloon runtime and re-import volume.',
		defaultLabel: 'true',
	},
	{
		key: 'publicationDateFreshnessFilter',
		type: 'switch',
		group: 'Freshness',
		label: 'Drop articles before min date',
		description:
			'When on, drops articles with a known publication date before the min date below. Turn off to keep older dated articles.',
		defaultLabel: 'true',
	},
	{
		key: 'minPublicationDate',
		type: 'date',
		group: 'Freshness',
		label: 'Min publication date',
		description:
			'With the freshness filter on, articles known to be published before this date are dropped.',
		defaultLabel: '2026-01-01',
	},
	{
		key: 'curatedArticleLimit',
		type: 'number',
		group: 'Curation',
		label: 'Curated article limit',
		description:
			'Hard cap on curated articles after clustering/dedupe — upper bound on what can reach the dashboard import.',
		defaultLabel: '200',
	},
	{
		key: 'importToFirestore',
		type: 'switch',
		group: 'Firestore import',
		label: 'Import curated articles to Firestore',
		description:
			'When off, the nightly job still runs scraping/classification but does not create dashboard reports from curated articles.',
		defaultLabel: 'true',
	},
	{
		key: 'firestoreImportForceSingleAgency',
		type: 'switch',
		group: 'Firestore import',
		label: 'Force single fallback agency',
		description:
			'Smoke/test mode: send every imported article to the fallback agency only (no state fan-out). Leave off in production.',
		defaultLabel: 'false',
	},
	{
		key: 'firestoreImportUserId',
		type: 'text',
		group: 'Firestore import',
		label: 'Import user ID',
		description:
			'Firebase Auth UID stamped on imported reports. Empty leaves userID null. Use a real admin/service user if the UI expects a submitter.',
		defaultLabel: '(empty → null userID)',
	},
	{
		key: 'firestoreImportAgencyName',
		type: 'text',
		group: 'Firestore import',
		label: 'Fallback agency name',
		description:
			'Exact agency name used when an article’s state has no newsroom match (and for force-single mode). Must match an agency document name.',
		defaultLabel: 'Test Agency',
	},
]

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * @param {unknown} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
function normalizeBool(value, fallback) {
	if (typeof value === 'boolean') return value
	return fallback
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function normalizePositiveInt(value, fallback) {
	const n = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(n) || n < 1) return fallback
	return Math.trunc(n)
}

/**
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
function normalizeDate(value, fallback) {
	if (typeof value !== 'string') return fallback
	const trimmed = value.trim()
	return DATE_RE.test(trimmed) ? trimmed : fallback
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeText(value) {
	return typeof value === 'string' ? value.trim() : ''
}

/**
 * Merges raw Firestore data with prod defaults so missing fields are safe for the UI.
 *
 * @param {unknown} raw
 * @returns {PipelineConfig}
 */
export function normalizePipelineConfig(raw) {
	const source =
		raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}

	const agencyRaw = normalizeText(source.firestoreImportAgencyName)
	return {
		importToFirestore: normalizeBool(
			source.importToFirestore,
			PROD_DEFAULTS.importToFirestore,
		),
		jobFilterProcessedUrls: normalizeBool(
			source.jobFilterProcessedUrls,
			PROD_DEFAULTS.jobFilterProcessedUrls,
		),
		publicationDateFreshnessFilter: normalizeBool(
			source.publicationDateFreshnessFilter,
			PROD_DEFAULTS.publicationDateFreshnessFilter,
		),
		firestoreImportForceSingleAgency: normalizeBool(
			source.firestoreImportForceSingleAgency,
			PROD_DEFAULTS.firestoreImportForceSingleAgency,
		),
		maxDomains: normalizePositiveInt(source.maxDomains, PROD_DEFAULTS.maxDomains),
		maxLinksPerDomain: normalizePositiveInt(
			source.maxLinksPerDomain,
			PROD_DEFAULTS.maxLinksPerDomain,
		),
		curatedArticleLimit: normalizePositiveInt(
			source.curatedArticleLimit,
			PROD_DEFAULTS.curatedArticleLimit,
		),
		minPublicationDate: normalizeDate(
			source.minPublicationDate,
			PROD_DEFAULTS.minPublicationDate,
		),
		firestoreImportUserId: normalizeText(source.firestoreImportUserId),
		firestoreImportAgencyName:
			agencyRaw || PROD_DEFAULTS.firestoreImportAgencyName,
	}
}

/**
 * Validates a config before save. Returns an error message or null.
 *
 * @param {Partial<PipelineConfig>} config
 * @returns {string | null}
 */
export function validatePipelineConfig(config) {
	const n = normalizePipelineConfig(config)
	if (n.maxDomains < 1) return 'Max domains must be at least 1.'
	if (n.maxLinksPerDomain < 1) return 'Max links per domain must be at least 1.'
	if (n.curatedArticleLimit < 1) return 'Curated article limit must be at least 1.'
	if (!DATE_RE.test(n.minPublicationDate)) {
		return 'Min publication date must be YYYY-MM-DD.'
	}
	if (!n.firestoreImportAgencyName.trim()) {
		return 'Fallback agency name cannot be empty.'
	}
	return null
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<PipelineConfig>}
 */
export async function getPipelineConfig(db) {
	const ref = doc(db, PIPELINE_SETTINGS_COLLECTION, PIPELINE_SETTINGS_DOC_ID)
	const snap = await getDoc(ref)
	if (!snap.exists()) {
		return normalizePipelineConfig(null)
	}
	return normalizePipelineConfig(snap.data())
}

/**
 * Writes the full allowlisted object (plus audit fields).
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {Partial<PipelineConfig>} config
 * @param {{ updatedBy?: string }} [meta]
 * @returns {Promise<PipelineConfig>}
 */
export async function savePipelineConfig(db, config, meta = {}) {
	const error = validatePipelineConfig(config)
	if (error) {
		throw new Error(error)
	}
	const normalized = normalizePipelineConfig(config)
	const ref = doc(db, PIPELINE_SETTINGS_COLLECTION, PIPELINE_SETTINGS_DOC_ID)
	await setDoc(
		ref,
		{
			...normalized,
			updatedAt: new Date().toISOString(),
			updatedBy: typeof meta.updatedBy === 'string' ? meta.updatedBy : '',
		},
		{ merge: true },
	)
	return normalized
}
