/**
 * @fileoverview Login Page - User authentication and role-based redirect
 *
 * This page provides the login form for users, including:
 * - Email/password authentication
 * - Role-based redirect to dashboard or report page
 * - Email verification and resend logic
 * - Error handling and loading state
 * - Integration with next-i18next for translations
 * - Privacy policy link (public page) and language switcher
 *
 * Integrates with:
 * - AuthContext for authentication and role management
 * - Firebase Auth and Firestore for user/role verification
 * - next-i18next for translations
 * - Material Tailwind for UI components
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { db, auth } from '../config/firebase'
import LanguageSwitcher from '../components/layout/LanguageSwitcher'
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { MdOutlineRemoveRedEye } from "react-icons/md"; // <MdOutlineRemoveRedEye />
import {
	collection,
	getDocs,
	query,
	where,
} from "firebase/firestore"
import { GiMagnifyingGlass } from "react-icons/gi";
import Head from 'next/head';
import { Button, Typography } from '@material-tailwind/react'
import FormInput from '../components/ui/FormInput'

// Dev-only UI: conditional require so production client bundles can tree-shake it away.
const DevLoginShortcuts =
	process.env.NODE_ENV === 'development'
		? // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
			require('../components/dev/DevLoginShortcuts').default
		: null

/**
 * Login Page
 *
 * Renders the login form, handles authentication, and redirects users based on role.
 *
 * @returns {JSX.Element} The rendered login page
 */
const Login = () => {
  const router = useRouter()

  const { t } = useTranslation('Welcome');

  const { user, login, verifyEmail, addAgencyRole, refreshCustomClaims } = useAuth()
  const [data, setData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
	// password show/hide
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

	/**
	 * Sign in and role-based redirect. Shared by the form and local-dev shortcuts.
	 * @param {string} email
	 * @param {string} password
	 */
	const signInAndRedirect = async (email, password) => {
		await login(email, password)
		if (auth.currentUser?.emailVerified) {
			const idTokenResult = await auth.currentUser.getIdTokenResult(true)

			// Agency/admin users must not run a collection-wide agencyUsers query:
			// new rules only allow reading their own agency doc (or all for admin).
			// Prefer token claims; only probe membership when the user has no agency claim yet.
			if (!idTokenResult.claims.admin && !idTokenResult.claims.agency) {
				const dbInstance = collection(db, 'agency')
				const q = query(
					dbInstance,
					where('agencyUsers', 'array-contains', email),
				)
				const querySnapshot = await getDocs(q)

				if (!querySnapshot.empty) {
					const agencyId = querySnapshot.docs[0].id
					await addAgencyRole({ email, agencyId })
					await refreshCustomClaims()
					console.log(`${email} has been made an agency user`)
					await router.push('/dashboard')
					return
				}

				await router.push('/report')
				return
			}

			await router.push('/dashboard')
		} else {
			await verifyEmail(auth.currentUser)
			await router.push('/verifyEmail')
		}
	}

	const mapLoginError = (err) => {
		if (err.code === 'auth/user-not-found') {
			setError(t('not_found'))
		} else if (err.code === 'auth/wrong-password') {
			setError(t('incorrect'))
		} else if (err.code === 'auth/network-request-failed') {
			setError(
				process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'
					? t('login_network_emulator')
					: t('login_network_live'),
			)
		} else {
			console.log(err)
			setError(err?.message || t('error'))
		}
	}

	const completeLogin = async (email, password) => {
		setLoading(true)
		setError(null)
		try {
			await signInAndRedirect(email, password)
		} catch (err) {
			mapLoginError(err)
		} finally {
			setLoading(false)
		}
	}

	const handleLogin = async (e) => {
		e.preventDefault()
		await completeLogin(data.email, data.password)
	}

  const handleChange = (e) => {
    const { id, value } = e.target
    setData((prevData) => ({
      ...prevData,
      [id]: value,
    }))
  }


  return (
		<>
			<Head>
				<title>Login | Truth Sleuth Local</title>
			</Head>
			<div data-component="login" className="w-screen h-screen overflow-auto flex justify-center items-start py-12 pb-8">
				<div className="w-full max-w-md font-light bg-white rounded-md p-6">
					<div className="flex flex-col items-center justify-center h-auto mb-2">
						<div className="bg-blue-600 p-7 rounded-full mb-2">
							<GiMagnifyingGlass size={30} className="fill-white" />
						</div>
						<Typography variant="small" className='text-xs font-semibold text-[#2E3B4E]'>Truth Sleuth Local</Typography>
					</div>
					{process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' && (
						<div
							className="mx-8 mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs text-amber-950"
							role="status">
							{t('emulator_mode_banner')}
						</div>
					)}
					<form className="px-8 pt-6 pb-4 mb-4" onSubmit={handleLogin}>
						<div className="mb-4">
							<FormInput
								id="email"
								type="text"
								label={t('email')}
								required
								value={data.email}
								onChange={handleChange}
								autoComplete="username"
							/>
						</div>
						<div className="mb-1">
							<FormInput
								id="password"
								type={type}
								name="password"
								label={t('password')}
								required
								value={data.password}
								onChange={handleChange}
								autoComplete="current-password"
								icon={
									<button
										type="button"
										className="cursor-pointer"
										onClick={handleTogglePass}
										aria-label="Toggle password visibility">
										<MdOutlineRemoveRedEye />
									</button>
								}
							/>
						</div>
						{error && (
							<span className="text-red-500 text-sm font-light">{error}</span>
						)}
						<div className="mt-5 flex-col items-center content-center">
							<Button type="submit" fullWidth loading={loading}>
								{t('loginButton')}
							</Button>
							<div className="flex items-center justify-between mt-4">
								<div className="content-center">
									<input
										type="checkbox"
										name="remember-me"
										id="remember-me"
										className="form-checkbox rounded-sm border-gray-400 text-[#2E3B4E] focus:ring-[#2E3B4E]"
									/>
									<label htmlFor="remember-me" className="text-sm p-2">
										{t('remember')}
									</label>
								</div>
								<Link
									href="/resetPassword"
									className="inline-block align-baseline font-bold text-sm text-[#2E3B4E] hover:text-blue-800">
									{t('forgot')}
								</Link>
							</div>
						</div>
					</form>
					{DevLoginShortcuts && (
						<DevLoginShortcuts
							loading={loading}
							setLoading={setLoading}
							setEmailHint={(email) =>
								setData((prev) => ({ ...prev, email, password: '' }))
							}
							signInAndRedirect={async (email, password) => {
								setError(null)
								await signInAndRedirect(email, password)
							}}
							onError={mapLoginError}
						/>
					)}
					<p className="text-center text-gray-500 text-sm">
						{t('noAccount')}
						<Link
							href="/signup"
							className="inline-block px-2 align-baseline font-bold text-sm text-[#2E3B4E] hover:text-blue-800">
							{t('signupButton')}
						</Link>
					</p>
					{/* <View> */}
					<div className="flex justify-center items-center p-6 gap-1">
						<LanguageSwitcher />
					</div>
					<div className="privacy_policy flex justify-center items-center">
						<Link
							href="/privacy-policy"
							className="text-[#2E3B4E] text-xs font-semibold hover:underline">
							Privacy Policy
						</Link>
					</div>
				</div>
			</div>
		</>
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