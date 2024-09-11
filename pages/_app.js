import { useRouter } from "next/router"
import ProtectedRoute from "../components/ProtectedRoute"
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
