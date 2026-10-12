/**
 * Fills the shared PWA manifest with the active brand's name and description,
 * so one public/manifest.json serves every brand.
 */
import { brand } from '../config/brand'

/**
 * @param {string|Buffer} raw - Contents of public/manifest.json
 * @param {{ appName: string, shortName: string, description: string }} [activeBrand]
 * @returns {string}
 */
export function brandManifest(raw, activeBrand = brand) {
	const manifest = JSON.parse(raw.toString('utf8'))
	return JSON.stringify({
		...manifest,
		name: activeBrand.appName,
		short_name: activeBrand.shortName,
		description: activeBrand.description,
	})
}
