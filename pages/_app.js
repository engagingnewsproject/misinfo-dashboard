import { useRouter } from 'next/router'
import ProtectedRoute from '../components/ProtectedRoute'
import { AuthContextProvider } from '../context/AuthContext'
import '../styles/globals.css'
import 'react-tooltip/dist/react-tooltip.css'

const noAuthRequired = ['/login', '/signup', '/resetPassword']
// for testing page add '/testPage' above
function MyApp({ Component, pageProps }) {

  const router = useRouter()

  return (
    <AuthContextProvider>
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
