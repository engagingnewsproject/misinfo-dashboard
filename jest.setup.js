import '@testing-library/jest-dom'

// Tests assume the default brand even when a local .env sets NEXT_PUBLIC_BRAND (e.g. caffeine-app-v2).
// Brand-specific tests opt in with jest.isolateModules.
process.env.NEXT_PUBLIC_BRAND = 'misinfo'

// Material Tailwind Button ripple uses the Web Animations API, which jsdom lacks.
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
	Element.prototype.animate = function animate() {
		return {
			finished: Promise.resolve(),
			cancel() {},
			play() {},
			pause() {},
			reverse() {},
			finish() {},
		}
	}
}
