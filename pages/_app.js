/**
 * @fileoverview Custom Next.js App - Global providers and route protection
 *
 * This file customizes the Next.js App component to:
 * - Provide global authentication context
 * - Enforce route protection for authenticated pages
 * - Set up theme and global styles
 * - Integrate next-i18next for translations
 * - Set up global meta tags, favicons, and PWA install UX
 *
 * Integrates with:
 * - AuthContextProvider for authentication state
 * - ProtectedRoute for route guarding
 * - ThemeProvider for Material Tailwind theme
 * - next-i18next for i18n
 * - Next.js Head for meta tags and icons
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import { useRouter } from "next/router"
import { Inter } from "next/font/google"
import ProtectedRoute from "../components/layout/ProtectedRoute"
import { AuthContextProvider } from "../context/AuthContext"
import "../styles/globals.css"
import "react-tooltip/dist/react-tooltip.css"
import { appWithTranslation } from "next-i18next"
import { ThemeProvider } from "@material-tailwind/react"
import style from '../styles/style.js'
import Head from 'next/head'
import LoadingSpinner from "../components/ui/LoadingSpinner"
import PwaInstallBanner from "../components/common/PwaInstallBanner"

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
})

const noAuthRequired = ["/login", "/signup", "/resetPassword", "/testPage", "/privacy-policy", "/offline"]
// for testing page add '/testPage' above
/**
 * MyApp (Custom Next.js App)
 *
 * Wraps all pages with global providers, theme, authentication, and route protection.
 * Handles public vs. protected routes and sets up global meta tags.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.Component - The active page component
 * @param {Object} props.pageProps - Props for the active page
 * @returns {JSX.Element} The wrapped app component
 */
/** Fallback when Next.js passes undefined Component (e.g. during error or route resolve). */
function FallbackPage() {
	return (
		<div className="w-screen h-screen flex flex-col justify-center items-center bg-[#D3D3D3] gap-3">
			<LoadingSpinner className="h-12 w-12 text-[#2E3B4E]" />
			<p className="text-sm text-gray-600">Loading…</p>
		</div>
	)
}

function MyApp({ Component, pageProps }) {
	const router = useRouter()
	const SafeComponent = Component ?? FallbackPage

	return (
		<>
			<Head>
				<link rel="icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#2E3B4E" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
				<meta name="apple-mobile-web-app-title" content="Truth Sleuth" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
				/>
				{/* iPhone SE / 8 */}
				<link
					rel="apple-touch-startup-image"
					href="/apple_splash_640.png"
					media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
				/>
				{/* iPhone 8 Plus / similar */}
				<link
					rel="apple-touch-startup-image"
					href="/apple_splash_750.png"
					media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
				/>
				{/* iPhone X / 11 Pro / 12 mini / 13 mini */}
				<link
					rel="apple-touch-startup-image"
					href="/apple_splash_1125.png"
					media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
				/>
				{/* iPhone 6+/7+/8+ landscape-ish 1242x2208 portrait asset */}
				<link
					rel="apple-touch-startup-image"
					href="/apple_splash_1242.png"
					media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
				/>
				{/* iPad Mini / Air portrait */}
				<link
					rel="apple-touch-startup-image"
					href="/apple_splash_1536.png"
					media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
				/>
				{/* iPad Pro 10.5 / similar */}
				<link
					rel="apple-touch-startup-image"
					href="/apple_splash_1668.png"
					media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
				/>
				{/* iPad Pro 12.9 */}
				<link
					rel="apple-touch-startup-image"
					href="/apple_splash_2048.png"
					media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
				/>
			</Head>
			<ThemeProvider value={style}>
				<AuthContextProvider>
					<div className={`${inter.variable} font-sans bg-[#D3D3D3] w-full max-w-full overflow-x-hidden min-h-screen-safe safe-area-pad`}>
						<div className='w-screen content-center'>
							{noAuthRequired.includes(router.pathname) ? (
								<SafeComponent {...pageProps} />
							) : (
								<ProtectedRoute>
									<SafeComponent {...pageProps} />
								</ProtectedRoute>
							)}
						</div>
						<PwaInstallBanner />
					</div>
				</AuthContextProvider>
			</ThemeProvider>
		</>
	)
}

MyApp.getInitialProps = async (appContext) => {
	const { Component, ctx } = appContext
	let pageProps = {}
	if (Component && typeof Component.getInitialProps === 'function') {
		pageProps = await Component.getInitialProps(ctx)
	}
	return { pageProps }
}

export default appWithTranslation(MyApp)
