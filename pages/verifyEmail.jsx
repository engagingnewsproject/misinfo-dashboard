/**
 * @fileoverview Email verification page component for user account activation
 * 
 * This page handles the email verification flow after user registration.
 * Provides role-specific instructions for agency users vs regular users,
 * allows resending verification emails, and offers login navigation.
 * 
 * Features:
 * - Role-based verification instructions
 * - Email resend functionality
 * - Login navigation
 * - User role verification
 * 
 * @author Truth Sleuth Local Team
 * @version 1.0.0
 */

import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import {signOut} from 'firebase/auth'
import { auth } from '../config/firebase'
import Head from 'next/head'

/**
 * VerifyEmail component for email verification flow
 * 
 * Handles the post-registration email verification process with role-specific
 * instructions and verification email resend functionality.
 * 
 * @component
 * @returns {JSX.Element} The email verification page component
 */
const VerifyEmail = () => {
    const router = useRouter()
    // const [signUpError, setSignUpError] = useState("")
    
    // Authentication context and verification functions
    const { user, signup, verifyEmail, verifyRole, customClaims, setCustomClaims} = useAuth()
    
    // Error state - shows error if email is not verified
    const [signUpError, setSignUpError] = useState(!auth.currentUser.emailVerified)

    // User role state for conditional rendering
    const [userRole, setUserRole] = useState(null)
    
    // Check if the user is an agency, admin, or user.
    useEffect(()=> {
      verifyRole().then((result) => {
        if (result.admin) {
          setUserRole({admin: true})
        } else if (result.agency) {
          setUserRole({agency:true})
        } else {
          setUserRole({user: true})
        }
      })

    }, [])

    /**
     * Handles resending verification email
     * 
     * Sends a new verification email to the current user and updates
     * the UI to show confirmation message.
     * 
     * @param {Event} e - Click event
     * @returns {Promise<void>}
     */
    const handleVerifyEmail = async (e) => {
      setSignUpError("New verification email sent.")

        try {
          const userVerified = await verifyEmail(auth.currentUser)
            
        } catch (err) {
          console.log(err)
        }
  }

    /**
     * Handles logout and navigation to login page
     * 
     * Signs out the current user and redirects to the login page.
     * 
     * @returns {Promise<void>}
     */
  const handleLogin = async () => {
      await signOut(auth)
      router.push('/login')
  }

  return (
		<>
			<Head>
				<title>Verify Email | Truth Sleuth Local</title>
			</Head>
			<div className="w-screen h-screen flex justify-center items-center">
				<div className="w-full max-w-sm font-light">
					{/* Logo/branding section */}
					<div className="flex justify-center mb-4">
						<div className="w-24 h-24 font-extralight rounded-full tracking-widest flex justify-center items-center text-white bg-blue-500">
							MOODY
						</div>
					</div>
					
					{/* Main content section */}
					<div className="mb-4">
						{/* Error message display */}
						{signUpError?.length !== 0 && <div>{signUpError}</div>}
						
						{/* Agency-specific verification instructions */}
						{userRole?.agency ? (
							<div>
								<p className="text-lg font-bold text-blue-600 tracking-wider pt-2">
									Email Verification
								</p>

								<div>
									Upon creating an account, you will be asked to verify your
									email.
								</div>
								<ol className="list-disc pl-4">
									<li>Click the link in the verification email.</li>
									<li>
										Log in to the dashboard using your new account information.
									</li>
									<li>
										If needed, you can change your agency name and location
										under your profile.
									</li>
								</ol>
							</div>
						) : (
							/* General user verification instructions */
							<h3>Check your inbox to verify your email in order to log in.</h3>
						)}
					</div>

					{/* Action buttons */}
					<p className="text-center text-gray-500 text-sm">
						<button
							className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline"
							onClick={handleVerifyEmail}>
							Resend email
						</button>
						<button
							className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline"
							onClick={handleLogin}>
							Log In
						</button>
					</p>
				</div>
			</div>
		</>
	)
}

export default VerifyEmail