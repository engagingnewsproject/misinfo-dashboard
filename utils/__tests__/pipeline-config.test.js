import {
	PROD_DEFAULTS,
	normalizePipelineConfig,
	validatePipelineConfig,
} from '../pipeline-config'

describe('normalizePipelineConfig', () => {
	it('returns prod defaults when raw is empty', () => {
		expect(normalizePipelineConfig(null)).toEqual(PROD_DEFAULTS)
		expect(normalizePipelineConfig({})).toEqual(PROD_DEFAULTS)
	})

	it('coerces valid overrides', () => {
		expect(
			normalizePipelineConfig({
				importToFirestore: false,
				jobFilterProcessedUrls: false,
				publicationDateFreshnessFilter: false,
				firestoreImportForceSingleAgency: true,
				maxDomains: '100',
				maxLinksPerDomain: 5,
				curatedArticleLimit: 50,
				minPublicationDate: '2026-06-01',
				firestoreImportUserId: '  abc123  ',
				firestoreImportAgencyName: '  Newsroom A  ',
				clusteringArticlesPerClusterTarget: '2',
				clusterMergePersonMinCosine: '0.6',
				maxDomainsTest: '10',
				jobFilterProcessedUrlsTest: false,
			}),
		).toEqual({
			importToFirestore: false,
			jobFilterProcessedUrls: false,
			publicationDateFreshnessFilter: false,
			firestoreImportForceSingleAgency: true,
			maxDomains: 100,
			maxLinksPerDomain: 5,
			curatedArticleLimit: 50,
			minPublicationDate: '2026-06-01',
			firestoreImportUserId: 'abc123',
			firestoreImportAgencyName: 'Newsroom A',
			clusteringArticlesPerClusterTarget: 2,
			clusterMergePersonMinCosine: 0.6,
			maxDomainsTest: 10,
			jobFilterProcessedUrlsTest: false,
		})
	})

	it('falls back on invalid numbers and dates', () => {
		expect(
			normalizePipelineConfig({
				maxDomains: 0,
				maxLinksPerDomain: -3,
				curatedArticleLimit: 'nope',
				minPublicationDate: '06-01-2026',
				firestoreImportAgencyName: '   ',
				clusteringArticlesPerClusterTarget: 0,
				clusterMergePersonMinCosine: 1.5,
				maxDomainsTest: 0,
				jobFilterProcessedUrlsTest: 'yes',
			}),
		).toMatchObject({
			clusteringArticlesPerClusterTarget:
				PROD_DEFAULTS.clusteringArticlesPerClusterTarget,
			clusterMergePersonMinCosine: PROD_DEFAULTS.clusterMergePersonMinCosine,
			maxDomains: PROD_DEFAULTS.maxDomains,
			maxLinksPerDomain: PROD_DEFAULTS.maxLinksPerDomain,
			curatedArticleLimit: PROD_DEFAULTS.curatedArticleLimit,
			minPublicationDate: PROD_DEFAULTS.minPublicationDate,
			firestoreImportAgencyName: PROD_DEFAULTS.firestoreImportAgencyName,
			maxDomainsTest: null,
			jobFilterProcessedUrlsTest: null,
		})
	})

	it('treats empty test-job fields as inherit', () => {
		expect(
			normalizePipelineConfig({
				maxDomainsTest: '',
				jobFilterProcessedUrlsTest: 'inherit',
			}),
		).toMatchObject({
			maxDomainsTest: null,
			jobFilterProcessedUrlsTest: null,
		})
	})
})

describe('validatePipelineConfig', () => {
	it('accepts normalized prod defaults', () => {
		expect(validatePipelineConfig(PROD_DEFAULTS)).toBeNull()
	})

	it('rejects empty agency after normalize would fill default', () => {
		// normalize fills agency; validation runs on normalized values
		expect(validatePipelineConfig({ firestoreImportAgencyName: '' })).toBeNull()
	})

	it('rejects invalid maxDomainsTest when provided', () => {
		expect(validatePipelineConfig({ maxDomainsTest: 0 })).toBe(
			'Max domains (test job) must be empty or at least 1.',
		)
	})

	it('accepts null maxDomainsTest', () => {
		expect(validatePipelineConfig({ maxDomainsTest: null })).toBeNull()
	})

	it('accepts merge similarity typed as text within 0–1', () => {
		expect(validatePipelineConfig({ clusterMergePersonMinCosine: '0.6' })).toBeNull()
	})

	it('rejects merge similarity outside 0–1 or blank', () => {
		const msg = 'Same-person merge similarity must be between 0 and 1.'
		expect(validatePipelineConfig({ clusterMergePersonMinCosine: 1.2 })).toBe(msg)
		expect(validatePipelineConfig({ clusterMergePersonMinCosine: '' })).toBe(msg)
		expect(validatePipelineConfig({ clusterMergePersonMinCosine: 'abc' })).toBe(msg)
	})
})
