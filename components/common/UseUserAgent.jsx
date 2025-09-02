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
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React, { useEffect, useState } from 'react';

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
    /**
     * we set our initial state as null because we don't know what the user agent is yet
     * that way we can check if the user agent has been set or not
     */
	const [isMobile,setIsMobile] = useState(null);
    const [userAgent, setUserAgent] = useState(null);
    const [isIOS, setIsIOS] = useState(null);
    const [isStandalone, setIsStandalone] = useState(null);
    const [userAgentString, setUserAgentString] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userAgentString = window.navigator.userAgent;
            setUserAgentString(userAgentString);
					let userAgent;
					
            /**
             * Parse user agent string to determine browser
             * The order of the if statements is important because some browsers
             * have multiple matches in their user agent string
             */
            if (userAgentString.indexOf('SamsungBrowser') > -1) {
                userAgent = 'SamsungBrowser';
            } else if (userAgentString.indexOf('Firefox') > -1) {
                userAgent = 'Firefox';
            } else if (userAgentString.indexOf('FxiOS') > -1) {
                userAgent = 'FirefoxiOS';
            } else if (userAgentString.indexOf('CriOS') > -1) {
                userAgent = 'ChromeiOS';
            } else if (userAgentString.indexOf('Chrome') > -1) {
                userAgent = 'Chrome';
            } else if (userAgentString.indexOf('Safari') > -1) {
                userAgent = 'Safari';
            } else {
                userAgent = 'unknown';
            }
            setUserAgent(userAgent);

            // Check if user agent is mobile
            const isIOS = userAgentString.match(/iPhone|iPad|iPod/i);
            const isAndroid = userAgentString.match(/Android/i);
            setIsIOS(!!isIOS);
            const isMobile = isIOS || isAndroid;
            setIsMobile(!!isMobile);

            // Check if app is installed (if it's installed we wont show the prompt)
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsStandalone(true);
            }
        }
    }, []);

    return { isMobile, userAgent, isIOS, isStandalone, userAgentString };
}
