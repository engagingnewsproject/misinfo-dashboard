/**
 * Picks which product this build is (Truth Sleuth vs Caffeine) from NEXT_PUBLIC_BRAND.
 * Everything brand-specific (name, icon, URLs, wording, feature switches) lives in config/brands/*.
 *
 * CommonJS so next.config.js and Node scripts can require it too.
 */
const misinfo = require('./brands/misinfo')
const caffeine = require('./brands/caffeine')

const BRANDS = { misinfo, caffeine }

const BRAND_ID = BRANDS[process.env.NEXT_PUBLIC_BRAND] ? process.env.NEXT_PUBLIC_BRAND : 'misinfo'

/**
 * Which agency gets every public report, if any. A deploy can override the brand default
 * (e.g. the "online study" copies send everything to "Prolific sample").
 *
 * Both env values are needed: the id is what rules and queries use, and the name must match
 * the agency doc's `name` because the report form loads that agency's tags by name.
 *
 * @param {{ id: string, name: string } | null} brandDefault
 * @param {{ id?: string, name?: string }} override - Raw env values
 * @returns {{ id: string, name: string } | null}
 */
function resolveFixedReportAgency(brandDefault, override) {
	const id = (override.id || '').trim()
	const name = (override.name || '').trim()
	if (id && name) return { id, name }
	if (id || name) {
		console.warn(
			'NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID and NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME must both be set; ignoring the override.',
		)
	}
	return brandDefault ?? null
}

/**
 * Which site a new user signed up on, saved as `signupSource` on their mobileUsers doc.
 * Study copies share the live app's Firebase project, so this is how researchers tell
 * their users apart: "truthsleuth", "truthsleuth-study", "caffeine", "caffeine-study".
 *
 * A deploy counts as a study copy when it overrides the fixed agency (both env values set).
 *
 * @param {string} brandSource - The brand's `signupSource`
 * @param {{ id?: string, name?: string }} override - Raw fixed-agency env values
 * @returns {string}
 */
function resolveSignupSource(brandSource, override) {
	return isStudyCopy(override) ? `${brandSource}-study` : brandSource
}

/**
 * Brand settings to swap in for this deploy: the brand's `studyOverrides` on study copies
 * (e.g. "Caffeine Study" instead of "Caffeine Dashboard"), else nothing.
 *
 * @param {{ studyOverrides?: object }} brandConfig
 * @param {{ id?: string, name?: string }} override - Raw fixed-agency env values
 * @returns {object}
 */
function resolveStudyOverrides(brandConfig, override) {
	return isStudyCopy(override) ? brandConfig.studyOverrides ?? {} : {}
}

/**
 * @param {{ id?: string, name?: string }} override - Raw fixed-agency env values
 * @returns {boolean}
 */
function isStudyCopy(override) {
	return Boolean((override.id || '').trim() && (override.name || '').trim())
}

// Env values are read literally so Next.js inlines them into the client bundle.
const fixedAgencyOverride = {
	id: process.env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_ID,
	name: process.env.NEXT_PUBLIC_FIXED_REPORT_AGENCY_NAME,
}
const brand = {
	...BRANDS[BRAND_ID],
	...resolveStudyOverrides(BRANDS[BRAND_ID], fixedAgencyOverride),
	fixedReportAgency: resolveFixedReportAgency(
		BRANDS[BRAND_ID].fixedReportAgency,
		fixedAgencyOverride,
	),
	signupSource: resolveSignupSource(BRANDS[BRAND_ID].signupSource, fixedAgencyOverride),
	// True only when both agency env values are set. Live Caffeine has a fixed
	// agency in the brand file, so that alone must not count as a study copy.
	isStudyCopy: isStudyCopy(fixedAgencyOverride),
}

/**
 * On-screen name for a tag system. Firestore keys (e.g. `Topic`) never change.
 *
 * @param {string} system - Tag system key such as 'Topic', 'Source', 'Labels'
 * @returns {string}
 */
function tagDisplayName(system) {
	return brand.tagDisplayNames?.[system] ?? system
}

/**
 * Whether a brand-level feature is on.
 *
 * @param {keyof typeof brand.features} name
 * @returns {boolean}
 */
function isFeatureEnabled(name) {
	return Boolean(brand.features?.[name])
}

/**
 * Page `<title>` text: "Login | Truth Sleuth Local".
 *
 * @param {string} page
 * @returns {string}
 */
function pageTitle(page) {
	return page ? `${page} | ${brand.appName}` : brand.appName
}

module.exports = {
	BRANDS,
	BRAND_ID,
	brand,
	resolveFixedReportAgency,
	resolveSignupSource,
	resolveStudyOverrides,
	tagDisplayName,
	isFeatureEnabled,
	pageTitle,
}
