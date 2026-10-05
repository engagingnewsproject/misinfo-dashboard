/**
 * @fileoverview PWA manifest gets the active brand's name.
 */
import { brandManifest } from '../brand-manifest'

const caffeine = require('../../config/brands/caffeine')

describe('brandManifest', () => {
	const base = JSON.stringify({ name: 'Old', short_name: 'Old', start_url: '/login', icons: [{ src: '/icon-192x192.png' }] })

	it('swaps name, short name and description, keeping everything else', () => {
		const out = JSON.parse(brandManifest(Buffer.from(base), caffeine))
		expect(out.name).toBe('Caffeine App')
		expect(out.short_name).toBe('Caffeine App')
		expect(out.description).toBe(caffeine.description)
		expect(out.start_url).toBe('/login')
		expect(out.icons).toEqual([{ src: '/icon-192x192.png' }])
	})

	it('defaults to the active (misinfo) brand', () => {
		expect(JSON.parse(brandManifest(base)).name).toBe('Truth Sleuth Local')
	})
})
