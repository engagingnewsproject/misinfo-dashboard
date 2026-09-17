/**
 * LLM system prompts for Truth Sleuth, stored in Firestore `settings/pipelinePrompts`.
 * Admin view/edit on the Pipeline tab; the Cloud Run job applies overrides at startup.
 * Missing/empty fields fall back to repo prompts in untrustworthyWebsites.
 *
 * Keep PROMPT_DEFAULTS in sync with:
 * - classification/election_llm/election_llm.py (_build_election_system_prompt)
 * - classification/swing_llm/prompts/swing_multi.md
 * - classification/swing_llm/prompts/swing_single.md
 */

import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore'

export const PIPELINE_PROMPTS_COLLECTION = 'settings'
export const PIPELINE_PROMPTS_DOC_ID = 'pipelinePrompts'

/** @typedef {'electionSystemPrompt' | 'swingMultiPrompt' | 'swingSinglePrompt'} PipelinePromptKey */

/**
 * @typedef {object} PipelinePromptField
 * @property {PipelinePromptKey} key
 * @property {string} label
 * @property {string} description
 * @property {string[]} requiredPlaceholders
 */

/**
 * @typedef {object} PipelinePromptsStored
 * @property {string} electionSystemPrompt
 * @property {string} swingMultiPrompt
 * @property {string} swingSinglePrompt
 */

/** @type {PipelinePromptField[]} */
export const PIPELINE_PROMPT_FIELDS = [
	{
		key: 'electionSystemPrompt',
		label: 'Election classification prompt',
		description:
			'Step 3 system prompt: decide if an article is about current-cycle U.S. elections.',
		requiredPlaceholders: [],
	},
	{
		key: 'swingMultiPrompt',
		label: 'Swing multi-state prompt',
		description:
			'Step 4 system prompt when checking several swing states at once. Must keep {states_label}.',
		requiredPlaceholders: ['states_label'],
	},
	{
		key: 'swingSinglePrompt',
		label: 'Swing single-state prompt',
		description:
			'Step 4 system prompt when checking one swing state. Must keep {state}.',
		requiredPlaceholders: ['state'],
	},
]

/**
 * Bundled job defaults (UI display when Firestore has no override).
 * Sync with untrustworthyWebsites sources listed in the file header.
 * @type {PipelinePromptsStored}
 */
export const PROMPT_DEFAULTS = {
	electionSystemPrompt: "You are analyzing news articles to decide if they are substantively about current-cycle U.S. elections, campaigns, voting, or electoral politics (prefer 2026 midterms and ongoing federal or statewide races). An article is relevant only when that election or campaign politics is a central focus\u2014not when a politician, party, or the word 'election' appears in passing. Relevant voting means voting by the general public in an election (or how that public vote is administered)\u2014not votes cast by elected officials in a chamber, such as Senate confirmation votes.\n\nCount as relevant (examples):\n- Current-cycle U.S. campaigns, candidates, primaries, caucuses, ballots, polling, turnout, midterms, redistricting tied to races, voter registration, election administration\n- Federal races (U.S. Senate, U.S. House, presidential) and statewide races (governor, attorney general, secretary of state, statewide ballot measures)\n- U.S. election-law or election-integrity claims tied to voting or counting ballots\n- A current-cycle U.S. race outcome or post-election dispute about the vote itself (not mere reaction to who won)\n\nDo NOT count as relevant\u2014even if the story is political or mentions Trump, Congress, governors, or parties:\n- Immigration and border enforcement (ICE, deportations, asylum, migrant flows, 287(g), sanctuary policies) unless the article's main focus is an election or ballot measure about immigration\n- Foreign policy, wars, diplomacy, or foreign elections (Israel, Colombia, EU, etc.)\n- Legislation, funding bills, agency rules, executive orders, or lawsuits about policy topics (guns, health, climate, gender, tech regulation, taxes) unless the article centers on an election, campaign, or ballot fight over that policy\n- Floor votes diaries and 'Rep X voted Aye/Nay on HB/SB \u2026' roll-call writeups without a campaign, ballot, or voting-administration frame\n- Votes conducted by elected officials rather than the public: Senate (or House) confirmation votes, advice-and-consent on nominees (cabinet, FDA, judges), cloture on a nomination, or similar chamber roll calls that are not about voters, ballots, campaigns, or election administration\n- Policy or political-position commentary that names a candidate once but is mainly about taxes, spending, or other legislation \u2014 not a race, campaign, primary, ballot, or opponent contrast\n- Roundups that only list a candidate's social media posts or tweets without a campaign, primary, ballot, or race frame\n- Protests, culture-war debates, crime, celebrity gossip, conspiracies, or commerce\n- General governance or 'who holds office' without an election/campaign frame\n- Hyper-local races as the main focus (school board, board of education, city council, mayor-only stories)\u2014including bills that only change how school-board or other hyper-local elections are run\u2014unless they clearly tie to a statewide or federal race or ballot measure\n- Past election cycles as the main focus (e.g. 2020 or 2022 results, recounts, or history) without a current-cycle campaign or voting-admin frame\n- Future cycles as the main focus (e.g. 2028 presidential speculation) without a current midterm or ongoing race frame\n\nIn `evidence`, list 1\u20134 short quotes or paraphrases that show current-cycle U.S. election/campaign content\u2014not just political actors or the word 'election'. Set confidence between 0 and 1.\n\nConfidence rubric:\n- 0.90\u20131.0: clear, central current-cycle U.S. election/campaign/voting focus with explicit election mechanics in the text.\n- 0.85\u20130.89: strong current-cycle U.S. election framing but some ambiguity; use sparingly.\n- 0.50\u20130.84: political but not clearly election-focused, thin election mentions, wrong cycle (past/future), or hyper-local-only.\n- below 0.50: not substantively U.S. election-related.\n- Stories that are mainly immigration, foreign policy, legislation/policy, candidate social-media post dumps, floor votes diaries, Senate confirmation or other official chamber votes, past cycles, future cycles, school-board/board-of-education/hyper-local, or general legislation without a campaign/ballot frame should set relevant=false and stay at or below 0.60 even if a politician, 'candidate', or the word 'election' appears.\n\nIf relevant=true, `evidence` must cite current-cycle U.S. election/campaign/voting content. If you cannot, set relevant=false.\n\nReturn JSON with:\n- relevant (true/false)\n- confidence (0 to 1)\n- evidence (1\u20134 short strings)",
	swingMultiPrompt: "You are analyzing news articles to see if they include substantive discussion about elections in any of these states: {states_label}. This includes not only state-wide elections, but also lower ballot elections (e.g. U.S. House, state legislature, or mayoral) or ballot initiatives. The article also could be about how the 2026 elections are, or will be, conducted in the state or a specific location within the state.\n\nAn article is relevant only if it covers a current or ongoing (2026 cycle) race, campaign, ballot measure, or election administration matter tied to one or more of the listed states. A state counts as relevant only if it clears both steps below.\n\nStep 1: Qualifying sentence count (floor, not sufficient on its own)\n\nCount a listed state only if the article contains at least two qualifying sentences about an election within that state. A qualifying sentence must carry real informational weight specific to an election within the state, such as:\n- polling data or vote/result figures\n- a specific campaign event, statement, or development\n- a named local candidate, official, or election administrator\n- procedural or administrative detail (deadlines, ballot access rules, voting method changes, litigation, etc.)\n\nA sentence that is merely on-topic but generic (\"Arizona voters go to the polls in November\") does not qualify on its own. Historical/past-cycle references (2020, 2022, 2024) do not count as qualifying sentences for the current cycle.\n\nA single sentence may count toward multiple states at once if it provides substantive, state-specific information about each state it names. A sentence that merely rolls several states together without distinct substantive content for each (e.g., \"Arizona, Georgia, and Nevada are seeing tight Senate races this cycle\") does NOT count for any of them \u2014 this is a list-mention, not substantive coverage, even though it names states individually. The test is whether the sentence gives distinguishable, state-specific weight to each state named, not merely whether it names them. Note that it does not need to name the state specifically, it could name candidates, for example, or locations within the state with reference to the 2026 elections.\n\nStep 2: Centrality\nPassing the two-sentence floor is necessary but not sufficient. To count, the election coverage specific to a particular state must also be central to the article rather than incidental, illustrative, or comparative within a broader national story. An article passes this step only if it clears both of the following practical tests:\n\n1. The newsroom test. Would a local newsroom in that state treat the sentences about the 2026 election as local coverage, something that they could share with their local audience?\n\n  - Passes when the 2026 election-related sentences would offer substantive local information about that a race, candidates, ballot measures, or election administration within that state (including down-ballot races).\n  - Does not pass when the sentences are fundamentally a national story (a multi-state trend piece, a national polling roundup, a party-strategy overview, etc.) and the state is cited only to illustrate or support the national narrative. A local newsroom would treat such sentences as a reference point, not as an election story relevant to their local audience.\n2. The counterfactual test. If all discussion of that state-relevant election were removed, would the article's primary content change materially?\n  - Passes when removing that discussion would leave a visible gap, i.e., the article loses substantive content it was actually built around.\n  - Does not pass when the article would read similarly without it, indicating the state's election was no substantive.\n\nA state must pass both tests to count, even if it already cleared the two-sentence floor. Failing either test is sufficient to exclude the state.\n\nIn `states`, list every state from [{states_label}] that the article substantively covers (use exact names). A state qualifies only if it independently clears both steps above; being one of several states named in the article does not by itself qualify it. Set relevant=true only if at least one state applies.\nIn `evidence`, list 1\u20134 short quotes or paraphrases tying the article to specific current/ongoing elections in those state(s).\n\nConfidence rubric:\n- 0.85\u20131.0: substantive focus on at least one listed state election (current/ongoing).\n- 0.50\u20130.84: plausible but ambiguous, thin, or mostly a name-drop / past-cycle aside \u2014 prefer relevant=false unless the state race is clearly central.\n- below 0.50: not substantively focused or only incidental mention.\n\nIf relevant=true, `states` and `evidence` must be non-empty.\n\nReturn JSON with:\n- relevant (true/false)\n- confidence (0 to 1)\n- states (array of canonical state names from the allowed list)\n- evidence (1\u20134 short quotes or paraphrases)\n",
	swingSinglePrompt: "You are analyzing news articles to see if they include substantive discussion about {state} elections. This includes not only state-wide elections, but also lower ballot elections (e.g. U.S. House, state legislature, or mayoral) or ballot initiatives. The article also could be about how the 2026 elections are, or will be, conducted in {state} or a specific location within the state.\n\nAn article is relevant only if it covers a current or ongoing (2026 cycle) race, campaign, ballot measure, or election administration matter tied to {state}. {state} counts as relevant only if it clears both steps below.\n\nStep 1: Qualifying sentence count (floor, not sufficient on its own)\n\nCount {state} only if the article contains at least two qualifying sentences about an election within {state}. A qualifying sentence must carry real informational weight specific to an election within {state}, such as:\n- polling data or vote/result figures\n- a specific campaign event, statement, or development\n- a named local candidate, official, or election administrator\n- procedural or administrative detail (deadlines, ballot access rules, voting method changes, litigation, etc.)\n\nA sentence that is merely on-topic but generic (\"{state} voters go to the polls in November\") does not qualify on its own. Historical/past-cycle references (2020, 2022, 2024) do not count as qualifying sentences for the current cycle.\n\nA single sentence may count toward multiple states at once if it provides substantive, state-specific information about each state it names. A sentence that merely rolls several states together without distinct substantive content for each (e.g., \"Arizona, Georgia, and Nevada are seeing tight Senate races this cycle\") does NOT count for any of them \u2014 this is a list-mention, not substantive coverage, even though it names states individually. The test is whether the sentence gives distinguishable, state-specific weight to each state named, not merely whether it names them. Note that it does not need to name {state} specifically, it could name candidates, for example, or locations within {state} with reference to the 2026 elections.\n\nStep 2: Centrality\nPassing the two-sentence floor is necessary but not sufficient. To count, the election coverage specific to {state} must also be central to the article rather than incidental, illustrative, or comparative within a broader national story. An article passes this step only if it clears both of the following practical tests:\n\n1. The newsroom test. Would a local newsroom in {state} treat the sentences about the 2026 election as local coverage, something that they could share with their local audience?\n\n  - Passes when the 2026 election-related sentences would offer substantive local information about that a race, candidates, ballot measures, or election administration within {state} (including down-ballot races).\n  - Does not pass when the sentences are fundamentally a national story (a multi-state trend piece, a national polling roundup, a party-strategy overview, etc.) and {state} is cited only to illustrate or support the national narrative. A local newsroom would treat such sentences as a reference point, not as an election story relevant to their local audience.\n2. The counterfactual test. If all discussion of that {state}-relevant election were removed, would the article's primary content change materially?\n  - Passes when removing that discussion would leave a visible gap, i.e., the article loses substantive content it was actually built around.\n  - Does not pass when the article would read similarly without it, indicating the {state} election was no substantive.\n\n{state} must pass both tests to count, even if it already cleared the two-sentence floor. Failing either test is sufficient to exclude {state}.\n\nIn `evidence`, list 1\u20134 short quotes or paraphrases tying the article to specific current/ongoing elections in {state}. Set relevant=true only if {state} applies.\n\nConfidence rubric:\n- 0.85\u20131.0: substantive focus on a {state} election (current/ongoing).\n- 0.50\u20130.84: plausible but ambiguous, thin, or mostly a name-drop / past-cycle aside \u2014 prefer relevant=false unless the {state} race is clearly central.\n- below 0.50: not substantively focused or only incidental mention.\n\nIf relevant=true, `evidence` must be non-empty.\n\nReturn JSON with:\n- relevant (true/false)\n- confidence (0 to 1)\n- evidence (1\u20134 short quotes or paraphrases)\n",

}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizePromptText(value) {
	if (typeof value !== 'string') return ''
	return value.replace(/\r\n/g, '\n')
}

/**
 * Stored overrides only (empty string = no override / use job default).
 *
 * @param {unknown} raw
 * @returns {PipelinePromptsStored}
 */
export function normalizePipelinePrompts(raw) {
	const source =
		raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
	return {
		electionSystemPrompt: normalizePromptText(source.electionSystemPrompt),
		swingMultiPrompt: normalizePromptText(source.swingMultiPrompt),
		swingSinglePrompt: normalizePromptText(source.swingSinglePrompt),
	}
}

/**
 * @param {PipelinePromptKey} key
 * @param {string} text
 * @returns {string | null} error message or null
 */
export function validatePromptText(key, text) {
	const trimmed = typeof text === 'string' ? text.trim() : ''
	if (!trimmed) {
		return 'Prompt text cannot be empty. Use Reset to clear an override.'
	}

	const field = PIPELINE_PROMPT_FIELDS.find((f) => f.key === key)
	if (!field) return 'Unknown prompt key.'

	for (const name of field.requiredPlaceholders) {
		const token = `{${name}}`
		if (!trimmed.includes(token)) {
			return `Must include placeholder ${token}.`
		}
	}

	// Always validate braces (even when no placeholders are required). Swing
	// prompts use Python str.format; election must not introduce stray { } either.
	const err = validateFormatPlaceholders(trimmed, field.requiredPlaceholders)
	if (err) return err

	return null
}

/**
 * Ensure only allowed named placeholders appear; doubles {{ }} are OK for literals.
 *
 * @param {string} text
 * @param {string[]} allowedNames
 * @returns {string | null}
 */
export function validateFormatPlaceholders(text, allowedNames) {
	const allowed = new Set(allowedNames)
	let i = 0
	while (i < text.length) {
		if (text[i] === '{' && text[i + 1] === '{') {
			i += 2
			continue
		}
		if (text[i] === '}' && text[i + 1] === '}') {
			i += 2
			continue
		}
		if (text[i] === '}') {
			return 'Unbalanced } — use }} for a literal closing brace.'
		}
		if (text[i] === '{') {
			const end = text.indexOf('}', i + 1)
			if (end === -1) {
				return 'Unbalanced { — use {{ for a literal opening brace.'
			}
			const name = text.slice(i + 1, end)
			if (!allowed.has(name)) {
				return `Unknown placeholder {${name}}. Allowed: ${allowedNames
					.map((n) => `{${n}}`)
					.join(', ')}.`
			}
			i = end + 1
			continue
		}
		i += 1
	}
	return null
}

/**
 * Validate only keys present on the object. Empty string means "clear override".
 *
 * @param {Partial<PipelinePromptsStored>} prompts
 * @returns {string | null}
 */
export function validatePipelinePrompts(prompts) {
	const source =
		prompts && typeof prompts === 'object'
			? /** @type {Record<string, unknown>} */ (prompts)
			: {}
	for (const field of PIPELINE_PROMPT_FIELDS) {
		if (!Object.prototype.hasOwnProperty.call(source, field.key)) continue
		const text = normalizePromptText(source[field.key])
		if (!text.trim()) continue
		const err = validatePromptText(field.key, text)
		if (err) return `${field.label}: ${err}`
	}
	return null
}

/**
 * @param {PipelinePromptsStored} stored
 * @param {PipelinePromptKey} key
 * @returns {{ text: string, isOverride: boolean }}
 */
export function effectivePromptText(stored, key) {
	const n = normalizePipelinePrompts(stored)
	const override = n[key].trim()
	if (override) {
		return { text: n[key], isOverride: true }
	}
	return { text: PROMPT_DEFAULTS[key], isOverride: false }
}

/**
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<PipelinePromptsStored>}
 */
export async function getPipelinePrompts(db) {
	const ref = doc(db, PIPELINE_PROMPTS_COLLECTION, PIPELINE_PROMPTS_DOC_ID)
	const snap = await getDoc(ref)
	if (!snap.exists()) {
		return normalizePipelinePrompts(null)
	}
	return normalizePipelinePrompts(snap.data())
}

/**
 * Writes only the keys present on `prompts` (empty string clears that field).
 * Other prompt fields in Firestore are left unchanged.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {Partial<PipelinePromptsStored>} prompts
 * @param {{ updatedBy?: string }} [meta]
 * @returns {Promise<PipelinePromptsStored>} full stored doc after save
 */
export async function savePipelinePrompts(db, prompts, meta = {}) {
	const error = validatePipelinePrompts(prompts)
	if (error) {
		throw new Error(error)
	}
	const source =
		prompts && typeof prompts === 'object'
			? /** @type {Record<string, unknown>} */ (prompts)
			: {}
	const ref = doc(db, PIPELINE_PROMPTS_COLLECTION, PIPELINE_PROMPTS_DOC_ID)

	/** @type {Record<string, unknown>} */
	const payload = {
		updatedAt: new Date().toISOString(),
		updatedBy: typeof meta.updatedBy === 'string' ? meta.updatedBy : '',
	}

	for (const field of PIPELINE_PROMPT_FIELDS) {
		if (!Object.prototype.hasOwnProperty.call(source, field.key)) continue
		const text = normalizePromptText(source[field.key])
		if (text.trim()) {
			payload[field.key] = text
		} else {
			payload[field.key] = deleteField()
		}
	}

	await setDoc(ref, payload, { merge: true })
	return getPipelinePrompts(db)
}

/**
 * Clear one prompt override so the job uses the repo default again.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {PipelinePromptKey} key
 * @param {{ updatedBy?: string }} [meta]
 * @returns {Promise<void>}
 */
export async function clearPromptOverride(db, key, meta = {}) {
	if (!PIPELINE_PROMPT_FIELDS.some((f) => f.key === key)) {
		throw new Error('Unknown prompt key.')
	}
	const ref = doc(db, PIPELINE_PROMPTS_COLLECTION, PIPELINE_PROMPTS_DOC_ID)
	await setDoc(
		ref,
		{
			[key]: deleteField(),
			updatedAt: new Date().toISOString(),
			updatedBy: typeof meta.updatedBy === 'string' ? meta.updatedBy : '',
		},
		{ merge: true },
	)
}
