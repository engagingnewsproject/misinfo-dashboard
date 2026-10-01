jest.mock('../../config/firebase', () => ({ db: {} }))

import {
	ROUTING_REASON_PROMOTED,
	buildPromotedReport,
	groupLeftOutArticles,
} from '../left-out-articles'

const scraped = new Date('2026-09-28T07:00:00Z')
const promotedAt = new Date('2026-09-29T15:00:00Z')

const candidate = {
	id: 'abc123',
	runTimestamp: '20260928_070000',
	state: 'Nevada',
	clusterId: 4,
	clusterName: 'Voting Processes',
	meatinessScore: 0.4,
	winners: [{ url: 'https://ex.com/w', title: 'Winner', meatinessScore: 0.9 }],
	report: {
		title: 'Buried article',
		detail: 'Body',
		link: 'https://ex.com/buried',
		hearFrom: 'ex.com',
		createdDate: scraped,
		origin: 'scrape',
		truthSleuthRunId: '20260928_070000',
		topic: '',
	},
	status: 'pending',
}

describe('buildPromotedReport', () => {
	const built = buildPromotedReport(candidate, {
		agencyId: 'test1',
		agencyName: 'Test Agency',
		experimentId: '2026-main',
		uid: 'admin-1',
		promotedAt,
	})

	it('keeps the report content', () => {
		expect(built.title).toBe('Buried article')
		expect(built.link).toBe('https://ex.com/buried')
		expect(built.origin).toBe('scrape')
		expect(built.truthSleuthRunId).toBe('20260928_070000')
	})

	it('routes to the fallback agency with state kept', () => {
		expect(built.agency).toBe('Test Agency')
		expect(built.agencyId).toBe('test1')
		expect(built.state).toBe('Nevada')
		expect(built.experimentId).toBe('2026-main')
		expect(built.archived).toBe(false)
	})

	it('marks it promoted and dates it now, keeping the scrape date', () => {
		expect(built.routingReason).toBe(ROUTING_REASON_PROMOTED)
		expect(built.promotedBy).toBe('admin-1')
		expect(built.leftOutArticleId).toBe('abc123')
		expect(built.createdDate).toBe(promotedAt)
		expect(built.scrapedAt).toBe(scraped)
	})

	it('requires an agency id', () => {
		expect(() =>
			buildPromotedReport(candidate, { agencyName: 'Test Agency', experimentId: 'x', uid: 'u' }),
		).toThrow()
	})
})

describe('groupLeftOutArticles', () => {
	it('groups by night then cluster, newest night first, meatiest first', () => {
		const groups = groupLeftOutArticles([
			{ ...candidate, id: 'a', meatinessScore: 0.2 },
			{ ...candidate, id: 'b', meatinessScore: 0.6 },
			{ ...candidate, id: 'c', clusterId: 7, clusterName: 'Other' },
			{ ...candidate, id: 'd', runTimestamp: '20260929_070000' },
		])
		expect(groups.map((g) => g.runTimestamp)).toEqual(['20260929_070000', '20260928_070000'])
		const older = groups[1]
		expect(older.clusters).toHaveLength(2)
		expect(older.clusters[0].articles.map((a) => a.id)).toEqual(['b', 'a'])
		expect(older.clusters[0].winners[0].title).toBe('Winner')
	})
})
