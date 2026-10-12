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
const brand = BRANDS[BRAND_ID]

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

module.exports = { BRANDS, BRAND_ID, brand, tagDisplayName, isFeatureEnabled, pageTitle }
