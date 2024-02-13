import { useRouter } from 'next/router'
import { useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { AuthContextProvider } from '../context/AuthContext'
import Head from 'next/head'
import '../styles/globals.css'
import 'react-tooltip/dist/react-tooltip.css'
// NEW
// Define PWA metadata
export const metadata = {
  title: "Misinformation",
  description: "Report misinformation in your location for submission to news agencies near that location.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["misinfo", "misinformation", "reporting", "false news", "fake news"],
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
  authors: [
    { name: "CME" },
    {
      name: "CME",
      url: "https://mediaengagement.org/",
    },
  ],
  viewport: "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "/icons/icon-192x192.png" },
    { rel: "icon", url: "/icons/icon-192x192.png" },
  ],
};
// NEW end
const noAuthRequired = ['/login', '/signup', '/resetPassword', '/testPage']
// for testing page add '/testPage' above
function MyApp({ Component, pageProps }) {

  const router = useRouter()

  // PWA
  useEffect(() => {
    // Register the service worker when the component mounts
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('../public/sw.js').then(registration => {
          console.log('Service worker registered:', registration);
        }).catch(error => {
          console.error('Service worker registration failed:', error);
        });
      });
    }
  }, []);
  
  return (
    <AuthContextProvider>
      <Head>
        <meta name="application-name" content="PWA App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PWA App" />
        <meta name="description" content="Best PWA App in the world" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
        
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#2066d3" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#5bbad5" />
        <link rel="shortcut icon" href="/icons/favicon.ico" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link href="/icons/apple_splash_2048.png" sizes="2048x2732" rel="apple-touch-startup-image" />
        <link href="/icons/apple_splash_1668.png" sizes="1668x2224" rel="apple-touch-startup-image" />
        <link href="/icons/apple_splash_1536.png" sizes="1536x2048" rel="apple-touch-startup-image" />
        <link href="/icons/apple_splash_1125.png" sizes="1125x2436" rel="apple-touch-startup-image" />
        <link href="/icons/apple_splash_1242.png" sizes="1242x2208" rel="apple-touch-startup-image" />
        <link href="/icons/apple_splash_750.png" sizes="750x1334" rel="apple-touch-startup-image" />
        <link href="/icons/apple_splash_640.png" sizes="640x1136" rel="apple-touch-startup-image" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://yourdomain.com" />
        <meta name="twitter:title" content="PWA App" />
        <meta name="twitter:description" content="Best PWA App in the world" />
        {/* <meta name="twitter:image" content="/icons/android-chrome-192x192.png" /> */}
        <meta name="twitter:creator" content="@DavidWShadow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="PWA App" />
        <meta property="og:description" content="Best PWA App in the world" />
        <meta property="og:site_name" content="PWA App" />
        <meta property="og:url" content="https://yourdomain.com" />
        {/* <meta property="og:image" content="https://yourdomain.com/icons/apple-touch-icon.png" /> */}
      </Head>
      <div className="bg-sky-100 w-full h-full overflow-y-auto">
        <div className='w-screen h-screen content-center'>
          { noAuthRequired.includes(router.pathname) ? (
            <Component {...pageProps} />
          ) : (
            <ProtectedRoute>
              <Component {...pageProps} />
            </ProtectedRoute>
          ) }
        </div>
      </div>
    </AuthContextProvider>
    
  )
}

export default MyApp
