import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { db, auth } from '../config/firebase'


const Login = () => {
  const router = useRouter()
  const { user, login, verifyEmail } = useAuth()
  const [data, setData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState(null)
  const [errorMessage, setErrorMessage] = useState()
  const [loading, setLoading] = useState(false)
//   Get user custom token
 

  const handleLogin = () => {
      //console.log(user)
      login(data.email, data.password).then(()=> {
        setError(null)
        console.log(auth.currentUser.uid)
        if (auth.currentUser?.emailVerified) {
          auth.currentUser.getIdTokenResult()
          .then((idTokenResult) => {
              // if admin load the dashboard
              if (!!idTokenResult.claims.admin || !!idTokenResult.claims.agency) {
                window.location.replace('/dashboard')
              // otherwise load the report page
              } else {
                window.location.replace('/report')
              }
          })
        } else if (!auth.currentUser?.emailVerified) {
          verifyEmail(auth.currentUser)
          router.push('/verifyEmail')
        }
      }).catch((err)=> {
        if (err == "FirebaseError: Firebase: Error (auth/user-not-found).") {
          setError("An account was not found with the provided email. ")
        } else if (err == "FirebaseError: Firebase: Error (auth/wrong-password).") {
          setError("The password is incorrect. ")
        } else {
          setError("An error occurred when logging in.")
          console.log(err)
        }
        
      })
  
   
  }

  const handleChange = (e) => {
      setData({ ...data, [e.target.id]: e.target.value})
  }


  return (
    <div className="w-screen h-screen flex justify-center items-center">
        <div className="w-full max-w-sm font-light">
            <div className="flex justify-center mb-4">
                <div className="w-24 h-24 font-extralight rounded-full tracking-widest flex justify-center items-center text-white bg-blue-500">MOODY</div>
            </div>
            <form className="px-8 pt-6 pb-4 mb-4" onChange={handleChange}>
                <div className="mb-4">
                    <input
                        className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        type="text"
                        placeholder="Email"
                        required
                        value={data.email}
                        onChange={handleChange}
                        autoComplete='username'
                        />
                </div>
                <div className="mb-1">
                    <input
                        className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 mb-1 leading-tight focus:outline-none focus:shadow-outline"
                        id="password"
                        type="password"
                        placeholder="Password"
                        required 
                        value={data.password}
                        onChange={handleChange}
                        autoComplete='current-password'
                        />
                </div>
                {error && <span className="text-red-500 text-sm font-light">{error}</span>}
                <div className="mt-5 flex-col items-center content-center">
                    <button 
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-4 px-6 rounded focus:outline-none focus:shadow-outline"
                    type="button" onClick={()=>handleLogin()}>
                        Log In
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="content-center">
                            <input type="checkbox" className="form-checkbox rounded-sm border-transparent focus:border-transparent focus:ring-0" onChange={handleChange} />
                            <span className="text-sm p-2">Remember me</span>
                        </div>
                        <Link href="/resetPassword" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                            Forgot Password?
                        </Link>
                    </div>
                </div>
            </form>
            <p className="text-center text-gray-500 text-sm">
                Don't have an account?
                <Link href="/signup" className="inline-block px-2 align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                    Sign Up
                </Link>
            </p>
        </div>
    </div>
  )
}

export default Login