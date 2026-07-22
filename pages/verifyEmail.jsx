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
import { useAuth } from '../context/AuthContext'
import {signOut} from 'firebase/auth'
import { auth } from '../config/firebase'
import Head from 'next/head'
import { GiMagnifyingGlass } from 'react-icons/gi'
import { Typography } from '@material-tailwind/react'
import LanguageSwitcher from '../components/layout/LanguageSwitcher'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

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
    const { t } = useTranslation('Welcome')
    
    // Authentication context and verification functions
    const { verifyEmail, verifyRole } = useAuth()
    
    // Shown after user requests a new verification email
    const [emailResent, setEmailResent] = useState(false)

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
      setEmailResent(true)

        try {
          await verifyEmail(auth.currentUser)
            
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
				<title>{t('verifyEmailPageTitle')}</title>
			</Head>
			<div className="w-screen h-screen flex justify-center items-center">
				<div className="w-full max-w-md font-light bg-white rounded-md p-6">
					{/* Logo/branding section */}
					<div className="flex flex-col items-center justify-center mb-4">
						<div className="bg-blue-600 p-7 rounded-full mb-2">
							<GiMagnifyingGlass size={30} className="fill-white" />
						</div>
						<Typography variant="small" className="text-xs font-semibold text-[#2E3B4E]">
							Truth Sleuth Local
						</Typography>
					</div>
					
					{/* Main content section */}
					<div className="mb-4">
						{emailResent && <div>{t('verifyEmailSent')}</div>}
						
						{/* Agency-specific verification instructions */}
						{userRole?.agency ? (
							<div>
								<p className="text-lg font-bold text-[#2E3B4E] tracking-wider pt-2">
									{t('verifyEmailHeading')}
								</p>

								<div>
									{t('verifyEmailAgencyIntro')}
								</div>
								<ol className="list-disc pl-4">
									<li>{t('verifyEmailAgencyStep1')}</li>
									<li>{t('verifyEmailAgencyStep2')}</li>
									<li>{t('verifyEmailAgencyStep3')}</li>
								</ol>
							</div>
						) : (
							/* General user verification instructions */
							<h3>{t('verifyEmailUserPrompt')}</h3>
						)}
					</div>

					{/* Action buttons */}
					<p className="text-center text-gray-500 text-sm">
						<button
							className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline"
							onClick={handleVerifyEmail}>
							{t('verifyEmailResend')}
						</button>
						<button
							className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline"
							onClick={handleLogin}>
							{t('loginButton')}
						</button>
					</p>
					<div className="flex justify-center items-center p-6 gap-1">
						<LanguageSwitcher />
					</div>
				</div>
			</div>
		</>
	)
}

export default VerifyEmail

export async function getStaticProps(context) {
  const { locale } = context
  return {
    props: {
      ...(await serverSideTranslations(locale, ['Welcome'])),
    },
  }
}
