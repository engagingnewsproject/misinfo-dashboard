import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { analytics } from '../config/firebase'
import { db, auth } from '../config/firebase'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { MdOutlineRemoveRedEye } from "react-icons/md"; // <MdOutlineRemoveRedEye />

const Login = () => {
  const router = useRouter()

  const { t } = useTranslation('Welcome');

  const { user, login, verifyEmail } = useAuth()
  const [data, setData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState(null)
  const [errorMessage, setErrorMessage] = useState()
  const [loading, setLoading] = useState(false)

  // password show/hide
  const [password, setPassword] = useState("")
  const [type, setType] = useState('password')
  const [icon, setIcon] = useState(false)
  // handle the toggle between the hide password (eyeOff icon) and the show password (eye icon)
  const handleTogglePass = () => {
    if (type==='password'){
       setIcon(true);
       setType('text')
    } else {
       setIcon(false)
       setType('password')
    }
 }
 
  //   Get user custom token
  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch('/dashboard')
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true) // Set loading state to true during login process
    try {
      await login(data.email, data.password)
      // Login successful, check if email is verified
      if (auth.currentUser?.emailVerified) {
        const idTokenResult = await auth.currentUser.getIdTokenResult()
        console.log("Claims:", idTokenResult.claims)

        // Redirect user based on their role
        if (idTokenResult.claims.admin || idTokenResult.claims.agency) {
          console.log("Redirecting to dashboard...")
          await router.push("/dashboard")
        } else {
          console.log("Redirecting to report page...")
          await router.push("/report")
        }
      } else {
        // Email not verified, send verification email and redirect
        console.log("Email not verified. Sending verification email...")
        await verifyEmail(auth.currentUser)
        await router.push("/verifyEmail")
      }
      analytics.logEvent('login', { method: 'email' }); // Log 'login' event
    } catch (error) {
      // Login error occurred, handle and display it
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found") {
        setError(t("not_found"))
      } else if (error.code === "auth/wrong-password") {
        setError(t("incorrect"))
      } else {
        setError(t("error"))
      }
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setPassword(e.target.value)
    setData({ ...data, [e.target.id]: e.target.value})
  }


  return (
    <div className="w-screen h-screen flex justify-center items-center">
        <div className="w-full max-w-sm font-light">
            <div className="flex justify-center mb-4">
                <div className="w-24 h-24 font-extralight rounded-full tracking-widest flex justify-center items-center text-white bg-blue-500">MOODY</div>
            </div>
            <form className="px-8 pt-6 pb-4 mb-4" onSubmit={handleLogin}>
                <div className="mb-4">
                    <input
                        className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        type="text"
                        placeholder={t("email")}
                        required
                        value={data.email}
                        onChange={handleChange}
                        autoComplete='username'
                        />
                </div>
                <div className="mb-1 flex">
                    <input
                        className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline"
                        id="password"
                        type={type}
                        name='password'
                        placeholder={t("password")}
                        required 
                        value={data.password}
                        onChange={handleChange}
                        autoComplete='current-password'
                        />
                        <span class="flex justify-around items-center" onClick={handleTogglePass}>
                          <MdOutlineRemoveRedEye className='absolute mr-10' />
                        </span>
                </div>
                {error && <span className="text-red-500 text-sm font-light">{error}</span>}
                <div className="mt-5 flex-col items-center content-center">
                    <button 
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-4 px-6 rounded focus:outline-none focus:shadow-outline"
                    type="submit">
                        {loading ?        
                          <svg aria-hidden="true" className="m-auto h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">	
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />	
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />	
                          </svg>
                              
                          : t("login") }
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="content-center">
                            <input type="checkbox" name='remember-me' className="form-checkbox rounded-sm border-transparent focus:border-transparent focus:ring-0" onChange={handleChange} />
                            <span className="text-sm p-2">{t("remember")}</span>
                        </div>
                        <Link href="/resetPassword" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                          {t('forgot')}

                        </Link>
                    </div>
         
                </div>
            </form>
            <p className="text-center text-gray-500 text-sm">
                {t("noAccount")}
                <Link href="/signup" className="inline-block px-2 align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                    {t('signup')}
                </Link>
            </p>
                {/* <View> */}
          <div className="flex justify-between items-center p-6 gap-1">
            <span className="text-blue-500 text-md uppercase font-bold py-2 px-2">{t("select")}</span>
            <LanguageSwitcher/>
          </div>

      </div>

  </div>
  )
}

export default Login;

export async function getStaticProps(context) {
  // extract the locale identifier from the URL
  const { locale } = context

  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale, ['Welcome'])),
    },
  }
}