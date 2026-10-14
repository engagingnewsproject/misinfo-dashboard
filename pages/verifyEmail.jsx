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
 * @author Engaging News Project
 * @version 1.0.0
 */

import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {signOut} from 'firebase/auth'
import { auth } from '../config/firebase'
import Head from 'next/head'
import { brand, pageTitle } from '../config/brand'
import { BrandIcon } from '../components/layout/BrandLockup'
import { Typography } from '@material-tailwind/react'
import LanguageSwitcher from '../components/layout/LanguageSwitcher'
import { useTranslation } from 'next-i18next'
import { brandServerSideTranslations } from '../lib/brandServerSideTranslations'

const RESEND_COOLDOWN_SECONDS = 60
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
    
    // Resend status: null | 'sending' | 'sent' | 'tooMany' | 'error'
    const [resendStatus, setResendStatus] = useState(null)

    // Seconds left before the resend button unlocks after a successful send
    const [cooldown, setCooldown] = useState(0)

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

    useEffect(() => {
      if (cooldown <= 0) return
      const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
      return () => clearTimeout(timer)
    }, [cooldown])

    /**
     * Handles resending verification email
     * 
     * Sends a new verification email to the current user and shows whether
     * it was sent, rate-limited by Firebase, or failed for another reason.
     * 
     * @returns {Promise<void>}
     */
    const handleVerifyEmail = async () => {
      setResendStatus('sending')
      try {
        await verifyEmail(auth.currentUser)
        setResendStatus('sent')
        setCooldown(RESEND_COOLDOWN_SECONDS)
      } catch (err) {
        console.error(err)
        setResendStatus(err?.code === 'auth/too-many-requests' ? 'tooMany' : 'error')
      }
  }

    const resendDisabled = resendStatus === 'sending' || cooldown > 0

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
				<title>{pageTitle(t('verifyEmailPageTitle'))}</title>
			</Head>
			<div data-component="verifyEmail" className="w-screen h-screen flex justify-center items-center">
				<div className="w-full max-w-md font-light bg-white rounded-md p-6">
					{/* Logo/branding section */}
					<div className="flex flex-col items-center justify-center mb-4">
						<div className="bg-blue-600 p-7 rounded-full mb-2">
							<BrandIcon size={30} className="fill-white" />
						</div>
						<Typography variant="small" className="text-xs font-semibold text-[#2E3B4E]">
							{brand.appName}
						</Typography>
					</div>
					
					{/* Main content section */}
					<div className="mb-4">
						<div role="status" aria-live="polite">
							{resendStatus === 'sent' && <div>{t('verifyEmailSent')}</div>}
							{resendStatus === 'tooMany' && (
								<div className="text-red-600">{t('verifyEmailTooMany')}</div>
							)}
							{resendStatus === 'error' && (
								<div className="text-red-600">{t('verifyEmailSendError')}</div>
							)}
						</div>
						
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
								<p className="mt-3 text-sm text-gray-600">
									{t('verifyEmailSpamTip')}
								</p>
							</div>
						) : (
							/* General user verification instructions */
							<div>
								<h3>{t('verifyEmailUserPrompt')}</h3>
								<p className="mt-2 text-sm text-gray-600">
									{t('verifyEmailSpamTip')}
								</p>
							</div>
						)}
					</div>

					{/* Action buttons */}
					<p className="text-center text-gray-500 text-sm">
						<button
							className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
							onClick={handleVerifyEmail}
							disabled={resendDisabled}>
							{resendStatus === 'sending'
								? t('verifyEmailSending')
								: cooldown > 0
									? t('verifyEmailResendIn', { seconds: cooldown })
									: t('verifyEmailResend')}
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
      ...(await brandServerSideTranslations(locale, ['Welcome'])),
    },
  }
}
