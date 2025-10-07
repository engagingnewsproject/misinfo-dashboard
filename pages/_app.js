/**
 * @fileoverview Custom Next.js App - Global providers and route protection
 *
 * This file customizes the Next.js App component to:
 * - Provide global authentication context
 * - Enforce route protection for authenticated pages
 * - Set up theme and global styles
 * - Integrate next-i18next for translations
 * - Configure Sentry for error monitoring
 * - Set up global meta tags and favicons
 *
 * Integrates with:
 * - AuthContextProvider for authentication state
 * - ProtectedRoute for route guarding
 * - ThemeProvider for Material Tailwind theme
 * - next-i18next for i18n
 * - Sentry for error monitoring
 * - Next.js Head for meta tags and icons
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import { useRouter } from "next/router"
import ProtectedRoute from "../components/layout/ProtectedRoute"
import { AuthContextProvider } from "../context/AuthContext"
import "../styles/globals.css"
import "react-tooltip/dist/react-tooltip.css"
import { appWithTranslation } from "next-i18next"
import { ThemeProvider } from "@material-tailwind/react"
import style from '../styles/style.js'
import Head from 'next/head'

// Import Sentry configuration
import "../sentry.client.config.js"
import "../sentry.server.config";

const noAuthRequired = ["/login", "/signup", "/resetPassword", "/testPage"]
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
function MyApp({ Component, pageProps }) {
	const router = useRouter()


	return (
		<>
			<Head>
				<link rel="icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<ThemeProvider value={style}>
				<AuthContextProvider>
					<div className='bg-sky-100 w-full max-w-full overflow-x-hidden min-h-screen'>
						<div className='w-screen content-center'>
							{noAuthRequired.includes(router.pathname) ? (
								<Component {...pageProps} />
							) : (
								<ProtectedRoute>
									<Component {...pageProps} />
								</ProtectedRoute>
							)}
						</div>
					</div>
				</AuthContextProvider>
			</ThemeProvider>
		</>
	)
}

export default appWithTranslation(MyApp)
