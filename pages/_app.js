import { useEffect } from 'react';
import { useRouter } from 'next/router'
import ProtectedRoute from '../components/ProtectedRoute'
import { AuthContextProvider } from '../context/AuthContext'
import '../styles/globals.css'
import 'react-tooltip/dist/react-tooltip.css'
import Head from 'next/head';

const noAuthRequired = ['/login', '/signup', '/resetPassword', '/testPage']
// for testing page add '/testPage' above
function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered:', registration);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);
  const router = useRouter()

  return (
    <AuthContextProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2066D3" />
        {/* Add any other metadata here */}
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
