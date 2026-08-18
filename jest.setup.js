import '@testing-library/jest-dom'

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
