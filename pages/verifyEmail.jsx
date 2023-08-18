import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import {signOut} from 'firebase/auth'
import { auth } from '../config/firebase'

const VerifyEmail = () => {
    const router = useRouter()
    // const [signUpError, setSignUpError] = useState("")
    const { user, signup } = useAuth()
    const {signUpError, setSignUpError} = useState(!auth.currentUser.emailVerified)
 
    const handleVerifyEmail = async (e) => {
        try {
            const userVerified = await verifyEmail(auth.currentUser)
            if (userVerified) {
              setSignUpError(false)
              console.log("sign up error set to false")
              router.push('/dashboard')
            } else {
              setSignUpError("New verification email sent.")
            }
            
        } catch (err) {
            setSignUpError(err.message)
    }
  }


  const handleLogin = async () => {
      await signOut(auth)
      router.push('/login')
  }


    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <div className="w-full max-w-sm font-light">
                <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 font-extralight rounded-full tracking-widest flex justify-center items-center text-white bg-blue-500">MOODY</div>
                </div>
                <form className="px-8 pt-6 pb-4 mb-4" onSubmit={handleVerifyEmail}>
                    <div className="mb-4">
                      {signUpError && <div>{signUpError}</div>}
                      <h3>Check your inbox to verify your email in order to log in.</h3>

                    </div>
                </form>
                <p className="text-center text-gray-500 text-sm">
                    <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline" onClick={handleLogin}>
                        Log In
                    </button>
                </p>
            </div>
        </div>
    )
}

export default VerifyEmail