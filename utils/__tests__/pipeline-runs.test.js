import {
	DATA_STUDIO_EMBED_SRC,
	formatCount,
	formatDuration,
	formatHealth,
	formatIssueMessage,
	formatRunTimestamp,
	healthBadgeClass,
	parseJsonArray,
	pipelineRunKey,
} from '../pipeline-runs'

describe('formatCount', () => {
	it('formats numbers and uses an em dash for empty values', () => {
		expect(formatCount(1200)).toBe('1,200')
		expect(formatCount(0)).toBe('0')
		expect(formatCount(null)).toBe('—')
		expect(formatCount('')).toBe('—')
	})
})

describe('formatDuration', () => {
	it('formats seconds into a short duration', () => {
		expect(formatDuration(45)).toBe('45s')
		expect(formatDuration(125)).toBe('2m 5s')
		expect(formatDuration(3720)).toBe('1h 2m')
		expect(formatDuration(null)).toBe('—')
	})
})

describe('formatRunTimestamp', () => {
	it('turns a night key into a readable timestamp', () => {
		expect(formatRunTimestamp('20260811_070316')).toBe('2026-08-11 07:03')
		expect(formatRunTimestamp('not-a-stamp')).toBe('not-a-stamp')
		expect(formatRunTimestamp('')).toBe('—')
	})
})

describe('formatHealth', () => {
	it('falls back to unknown', () => {
		expect(formatHealth('ok')).toBe('ok')
		expect(formatHealth('')).toBe('unknown')
	})
})

describe('healthBadgeClass', () => {
	it('maps health to badge colors', () => {
		expect(healthBadgeClass('ok')).toContain('green')
		expect(healthBadgeClass('warning')).toContain('amber')
		expect(healthBadgeClass('critical')).toContain('red')
		expect(healthBadgeClass('')).toContain('gray')
	})
})

describe('parseJsonArray', () => {
	it('parses JSON arrays and ignores junk', () => {
		expect(parseJsonArray('["a","b"]')).toEqual(['a', 'b'])
		expect(parseJsonArray([{ code: 'x' }])).toEqual([{ code: 'x' }])
		expect(parseJsonArray('')).toEqual([])
		expect(parseJsonArray('{not json')).toEqual([])
		expect(parseJsonArray('{"a":1}')).toEqual([])
	})
})

describe('formatIssueMessage', () => {
	it('prefers message then code', () => {
		expect(formatIssueMessage({ message: 'Too few curated' })).toBe(
			'Too few curated',
		)
		expect(formatIssueMessage({ code: 'curated_below_minimum' })).toBe(
			'curated_below_minimum',
		)
		expect(formatIssueMessage('plain')).toBe('plain')
		expect(formatIssueMessage({})).toBe('')
	})
})

describe('pipelineRunKey', () => {
	it('joins identifying fields', () => {
		expect(
			pipelineRunKey(
				{
					run_timestamp: '20260811_070316',
					measurement_run_id: 'production_daily',
					execution_name: 'truth-sleuth-test-abc',
				},
				0,
			),
		).toBe('20260811_070316|production_daily|truth-sleuth-test-abc|0')
	})
})

describe('DATA_STUDIO_EMBED_SRC', () => {
	it('points at the Truth Sleuth articles report', () => {
		expect(DATA_STUDIO_EMBED_SRC).toContain(
			'c39e73c0-db85-44c2-9ea0-a12de00953b3',
		)
	})
})
