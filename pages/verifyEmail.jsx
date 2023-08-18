import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import {signOut} from 'firebase/auth'
import { auth } from '../config/firebase'

const VerifyEmail = () => {
    const router = useRouter()
    // const [signUpError, setSignUpError] = useState("")
    const { user, signup, verifyEmail } = useAuth()
    const [signUpError, setSignUpError] = useState(!auth.currentUser.emailVerified)
 
    const handleVerifyEmail = async (e) => {
      setSignUpError("New verification email sent.")

        try {
          const userVerified = await verifyEmail(auth.currentUser)
            
        } catch (err) {
          console.log(err)
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
                <div className="mb-4">
                  {signUpError?.length !== 0 && <div>{signUpError}</div>}
                  <h3>Check your inbox to verify your email in order to log in.</h3>

                </div>
             
                <p className="text-center text-gray-500 text-sm">
                <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline" onClick={handleVerifyEmail}>
                        Resend email
                    </button>
                    <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline" onClick={handleLogin}>
                        Log In
                    </button>
                </p>
            </div>
        </div>
    )
}

export default VerifyEmail