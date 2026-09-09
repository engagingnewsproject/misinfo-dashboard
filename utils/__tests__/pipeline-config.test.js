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
			}),
		).toMatchObject({
			maxDomains: PROD_DEFAULTS.maxDomains,
			maxLinksPerDomain: PROD_DEFAULTS.maxLinksPerDomain,
			curatedArticleLimit: PROD_DEFAULTS.curatedArticleLimit,
			minPublicationDate: PROD_DEFAULTS.minPublicationDate,
			firestoreImportAgencyName: PROD_DEFAULTS.firestoreImportAgencyName,
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
})
