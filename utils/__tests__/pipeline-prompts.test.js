import {
	PROMPT_DEFAULTS,
	effectivePromptText,
	normalizePipelinePrompts,
	validateFormatPlaceholders,
	validatePipelinePrompts,
	validatePromptText,
} from '../pipeline-prompts'

describe('normalizePipelinePrompts', () => {
	it('returns empty strings when raw is empty', () => {
		expect(normalizePipelinePrompts(null)).toEqual({
			electionSystemPrompt: '',
			swingMultiPrompt: '',
			swingSinglePrompt: '',
		})
	})

	it('normalizes CRLF and keeps text', () => {
		expect(
			normalizePipelinePrompts({
				electionSystemPrompt: 'a\r\nb',
				swingMultiPrompt: '  keep  ',
			}),
		).toEqual({
			electionSystemPrompt: 'a\nb',
			swingMultiPrompt: '  keep  ',
			swingSinglePrompt: '',
		})
	})
})

describe('effectivePromptText', () => {
	it('uses bundled default when no override', () => {
		const stored = normalizePipelinePrompts(null)
		const result = effectivePromptText(stored, 'electionSystemPrompt')
		expect(result.isOverride).toBe(false)
		expect(result.text).toBe(PROMPT_DEFAULTS.electionSystemPrompt)
	})

	it('uses override when non-empty', () => {
		const stored = normalizePipelinePrompts({
			electionSystemPrompt: 'custom election prompt',
		})
		const result = effectivePromptText(stored, 'electionSystemPrompt')
		expect(result.isOverride).toBe(true)
		expect(result.text).toBe('custom election prompt')
	})

	it('treats whitespace-only as no override', () => {
		const stored = normalizePipelinePrompts({
			swingMultiPrompt: '   \n  ',
		})
		const result = effectivePromptText(stored, 'swingMultiPrompt')
		expect(result.isOverride).toBe(false)
		expect(result.text).toBe(PROMPT_DEFAULTS.swingMultiPrompt)
	})
})

describe('validatePromptText', () => {
	it('rejects empty override text', () => {
		expect(validatePromptText('electionSystemPrompt', '  ')).toMatch(/empty/i)
	})

	it('requires states_label for swing multi', () => {
		expect(validatePromptText('swingMultiPrompt', 'no placeholder here')).toMatch(
			/states_label/,
		)
	})

	it('accepts bundled swing multi default', () => {
		expect(
			validatePromptText('swingMultiPrompt', PROMPT_DEFAULTS.swingMultiPrompt),
		).toBeNull()
	})

	it('accepts bundled swing single default', () => {
		expect(
			validatePromptText('swingSinglePrompt', PROMPT_DEFAULTS.swingSinglePrompt),
		).toBeNull()
	})

	it('accepts bundled election default', () => {
		expect(
			validatePromptText(
				'electionSystemPrompt',
				PROMPT_DEFAULTS.electionSystemPrompt,
			),
		).toBeNull()
	})
})

describe('validateFormatPlaceholders', () => {
	it('allows known placeholders and doubled braces', () => {
		expect(
			validateFormatPlaceholders('Hello {{literal}} {state} end', ['state']),
		).toBeNull()
	})

	it('rejects unknown placeholders', () => {
		expect(validateFormatPlaceholders('Hi {foo}', ['state'])).toMatch(/Unknown/)
	})

	it('rejects unbalanced braces', () => {
		expect(validateFormatPlaceholders('Hi {state', ['state'])).toMatch(
			/Unbalanced/,
		)
	})
})

describe('validatePipelinePrompts', () => {
	it('ignores keys not present on the object', () => {
		expect(
			validatePipelinePrompts({
				swingMultiPrompt: PROMPT_DEFAULTS.swingMultiPrompt,
			}),
		).toBeNull()
	})

	it('flags invalid present keys', () => {
		expect(
			validatePipelinePrompts({
				swingSinglePrompt: 'missing placeholder',
			}),
		).toMatch(/Swing single/)
	})
})
