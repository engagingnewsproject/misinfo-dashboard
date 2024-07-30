import { useRouter } from "next/router"
import ProtectedRoute from "../components/ProtectedRoute"
import { AuthContextProvider } from "../context/AuthContext"
import "../styles/globals.css"
import "react-tooltip/dist/react-tooltip.css"
import { appWithTranslation } from "next-i18next"
import { ThemeProvider } from "@material-tailwind/react"
import style from '../styles/style.js'

// Import Sentry configuration
import "../sentry.client.config.js"
import "../sentry.server.config";

const noAuthRequired = ["/login", "/signup", "/resetPassword", "/testPage"]
// for testing page add '/testPage' above
function MyApp({ Component, pageProps }) {
	const router = useRouter()


	return (
		<ThemeProvider value={style}>
			<AuthContextProvider>
				<div className='bg-sky-100 w-full min-h-screen'>
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
	)
}

export default appWithTranslation(MyApp)
