import { useRouter } from 'next/router'
import ProtectedRoute from '../components/ProtectedRoute'
import { AuthContextProvider } from '../context/AuthContext'
import '../styles/globals.css'

const noAuthRequired = ['/', '/login', '/signup', '/resetPassword']

function MyApp({ Component, pageProps }) {

  const router = useRouter()

  return (
    <AuthContextProvider>
      <div className='bg-sky-100 w-screen h-screen content-center'>
        { noAuthRequired.includes(router.pathname) ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        ) }
      </div>
    </AuthContextProvider>
    
  )
}

export default MyApp
