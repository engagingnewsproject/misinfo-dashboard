/**
 * @fileoverview useUserAgent Hook - Detects user agent and device characteristics
 *
 * This custom React hook detects the user's browser, device type (mobile/iOS), and PWA standalone mode.
 * Features include:
 * - Parses the user agent string to determine browser type
 * - Detects if the device is mobile or iOS
 * - Checks if the app is running in standalone (PWA) mode
 * - Returns all relevant user agent information for use in components
 *
 * Integrates with:
 * - window.navigator.userAgent for browser detection
 * - window.matchMedia for PWA display mode
 * - navigator.standalone for iOS home-screen apps
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import { useEffect, useState } from 'react';

/**
 * useUserAgent Hook
 *
 * Detects the user's browser, device type, and PWA standalone mode.
 * Returns an object with user agent details for use in components.
 *
 * @returns {Object} User agent information:
 *   - isMobile: {boolean|null} Whether the device is mobile
 *   - userAgent: {string|null} The detected browser type
 *   - isIOS: {boolean|null} Whether the device is iOS
 *   - isStandalone: {boolean|null} Whether the app is running in standalone mode
 *   - userAgentString: {string|null} The raw user agent string
 */
export default function useUserAgent() {
	const [isMobile, setIsMobile] = useState(null);
	const [userAgent, setUserAgent] = useState(null);
	const [isIOS, setIsIOS] = useState(null);
	const [isStandalone, setIsStandalone] = useState(null);
	const [userAgentString, setUserAgentString] = useState(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const uaString = window.navigator.userAgent;
		setUserAgentString(uaString);

		/**
		 * Parse user agent string to determine browser.
		 * Order matters because some browsers match multiple tokens.
		 */
		let detected;
		if (uaString.indexOf('SamsungBrowser') > -1) {
			detected = 'SamsungBrowser';
		} else if (uaString.indexOf('Firefox') > -1) {
			detected = 'Firefox';
		} else if (uaString.indexOf('FxiOS') > -1) {
			detected = 'FirefoxiOS';
		} else if (uaString.indexOf('CriOS') > -1) {
			detected = 'ChromeiOS';
		} else if (uaString.indexOf('Chrome') > -1) {
			detected = 'Chrome';
		} else if (uaString.indexOf('Safari') > -1) {
			detected = 'Safari';
		} else {
			detected = 'unknown';
		}
		setUserAgent(detected);

		const iosMatch = uaString.match(/iPhone|iPad|iPod/i);
		const androidMatch = uaString.match(/Android/i);
		const ios = !!iosMatch;
		setIsIOS(ios);
		setIsMobile(!!(iosMatch || androidMatch));

		const standaloneDisplay =
			window.matchMedia('(display-mode: standalone)').matches ||
			window.matchMedia('(display-mode: fullscreen)').matches ||
			window.navigator.standalone === true;
		setIsStandalone(standaloneDisplay);
	}, []);

	return { isMobile, userAgent, isIOS, isStandalone, userAgentString };
}
