/**
 * @fileoverview Signup page component for user registration and agency onboarding
 * 
 * This page handles two types of user registration:
 * 1. Regular user signup with email/password
 * 2. Agency user signup via email invitation link
 * 
 * Features:
 * - Email verification flow
 * - Role-based registration (User vs Agency)
 * - Location selection (State/City)
 * - Password validation and visibility toggle
 * - Privacy policy link (public page)
 * - Internationalization support
 * 
 * @author Truth Sleuth Local Team
 * @version 1.0.0
 */

import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import {
	isSignInWithEmailLink,
	signInWithEmailLink,
} from 'firebase/auth'
import {
	doc,
	setDoc,
	getDoc,
	collection,
	addDoc,
	arrayUnion,
} from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import FormInput from '../components/ui/FormInput'
import FormSelect from '../components/ui/FormSelect'
// import PhoneInput from 'react-phone-input-2'
import LanguageSwitcher from '../components/layout/LanguageSwitcher'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
// import 'react-phone-input-2/lib/style.css'
import { MdOutlineRemoveRedEye } from 'react-icons/md'
import { Country, State, City } from 'country-state-city'
import moment from 'moment'
import { RiContactsBookLine } from 'react-icons/ri'
import { Button, Typography } from '@material-tailwind/react'
import { GiMagnifyingGlass } from "react-icons/gi";
import Head from 'next/head'

/**
 * SignUp component for user registration
 * 
 * Handles both regular user signup and agency user onboarding via email invitation.
 * Supports email verification, role assignment, and location-based registration.
 * 
 * @component
 * @returns {JSX.Element} The signup form component
 */
const SignUp = () => {
	const router = useRouter()
	const { t } = useTranslation(['Welcome', 'NewReport'])
	
	// Error state management
	const [signUpError, setSignUpError] = useState('')
	const [errors, setErrors] = useState({})
	
	// Authentication context
	const { signup, addAgencyRole, setPassword } = useAuth()
	
	// Email-link invites: agency when continue URL has agency context; otherwise public User
	const isEmailLinkInvite = isSignInWithEmailLink(auth, window.location.href)

	const inviteAgencyName = (() => {
		const raw = router.query?.agencyName
		const value = Array.isArray(raw) ? raw[0] : raw
		return typeof value === 'string' ? value.trim() : ''
	})()
	const inviteAgencyId = (() => {
		const raw = router.query?.agencyId
		const value = Array.isArray(raw) ? raw[0] : raw
		return typeof value === 'string' ? value.trim() : ''
	})()
	const isAgencyInvite =
		isEmailLinkInvite && (!!inviteAgencyName || !!inviteAgencyId)
	
	// Form data state
	const [data, setData] = useState({
		name: '',
		email: '',
		// phone: '',
		password: '',
		confirmPW: '',
		city: '',
		state: '',
		contact: false,
	})
	
	// Password visibility state
	const [pass, setPass] = useState('')
	const [type, setType] = useState('password')
	const [icon, setIcon] = useState(false)
	
	
	// console.log(isAgency);
	
	/**
	 * Creates a new mobile user document in Firestore
	 * 
	 * @param {string} privilege - User role ('User', 'Agency', or 'Admin')
	 * @returns {Promise<void>}
	 */
	const addMobileUser = async (privilege) => {
		const currentUser = auth.currentUser
		if (!currentUser) {
			throw new Error('No signed-in user to create profile for')
		}
		const uid = currentUser.uid
		await setDoc(doc(db, 'mobileUsers', uid), {
			name: data.name,
			email: data.email,
			joiningDate: moment().utc().unix(),
			state: data.state,
			city: data.city,
			isBanned: false,
			userRole: privilege,
			contact: data.contact,
		})
	}

	/**
	 * Completes email-link signup: sign in, set password, write mobileUsers.
	 * Agency role is optional and must not block profile creation.
	 *
	 * @param {'User' | 'Agency'} privilege
	 * @param {{ assignAgencyRole?: boolean }} [options]
	 */
	const completeEmailLinkSignup = async (
		privilege,
		{ assignAgencyRole = false } = {},
	) => {
		const result = await signInWithEmailLink(
			auth,
			data.email,
			window.location.href,
		)
		await auth.updateCurrentUser(result.user)
		await auth.currentUser.reload()
		await setPassword(data.password)

		if (assignAgencyRole) {
			try {
				await addAgencyRole({
					email: data.email,
					...(inviteAgencyId ? { agencyId: inviteAgencyId } : {}),
				})
			} catch (roleErr) {
				// Do not block mobileUsers creation — Auth account already exists.
				console.error('addAgencyRole failed after signup:', roleErr)
			}
		}

		await addMobileUser(privilege)
		setSignUpError('')
		window.location.replace('/verifyEmail')
	}

	/**
	 * Handles the signup form submission
	 * 
	 * Processes both regular user signup and agency user onboarding.
	 * Validates form data, handles email verification, and creates user profiles.
	 * 
	 * @param {Event} e - Form submission event
	 * @returns {Promise<void>}
	 */
	const handleSignUp = async (e) => {
		e.preventDefault()

		if (data.password.length < 8) {
			return // Ensures the password length is at least 8 characters before proceeding.
		}
		const allErrors = {} // Object to hold any validation errors.
		// Manage form validation errors
		if (data.state == null) {
			console.log('state error')
			allErrors.state = t('NewReport:state')
		}
		if (data.city == null) {
			console.log('city error')
			allErrors.city = t('NewReport:city')
			if (
				data.state != null &&
				City.getCitiesOfState(data.state?.countryCode, data.state?.isoCode)
					.length == 0
			) {
				console.log('No cities here')
				delete allErrors.city
			}
		}
		setErrors(allErrors)
		if (Object.keys(allErrors).length > 0) return

		const handleEmailLinkError = (err) => {
			if (err.message == 'Firebase: Error (auth/invalid-action-code).') {
				setSignUpError(
					'Sign in link had expired. Please ask admin to send a new link to sign up.',
				)
			} else if (
				err.message ==
				'Firebase: The email provided does not match the sign-in email address. (auth/invalid-email).'
			) {
				setSignUpError(
					'Your email does not match up with the email address that the sign-in link was sent to.',
				)
			} else {
				console.log(err)
				setSignUpError(err.message)
			}
		}

		try {
			if (isAgencyInvite) {
				console.log('DEV LOG - handleSignUp - Agency invite')
				await completeEmailLinkSignup('Agency', { assignAgencyRole: true })
			} else if (isEmailLinkInvite) {
				console.log('DEV LOG - handleSignUp - Public user invite')
				await completeEmailLinkSignup('User')
			} else {
				console.log('DEV LOG - handleSignUp - self signup')

				await signup(data.name, data.email, data.password, data.state, data.city)
				setSignUpError('')
				await addMobileUser('User')
				router.push('/verifyEmail')
			}
		} catch (err) {
			if (isEmailLinkInvite || isAgencyInvite) {
				handleEmailLinkError(err)
				return
			}
			if (err.code === 'auth/email-already-in-use') {
				setSignUpError('The entered email is already in use.')
			} else if (err.message == 'Firebase: Error (auth/email-already-in-use).') {
				setSignUpError('Email already in use. Please log in.')
			} else {
				setSignUpError(err.message)
			}
			console.error('Error in signup--> ', err)
		}
	}
	
	/**
	 * Handles form input changes
	 * 
	 * @param {Event} e - Input change event
	 */
	const handleChange = (e) => {
		setData({ ...data, [e.target.id]: e.target.value })
	}

	/**
	 * Handles state selection change and resets city
	 * 
	 * @param {Object} e - Selected state object
	 */
	const handleStateChange = (e) => {
		setData((data) => ({ ...data, state: e, city: null }))
	}
	
	/**
	 * Handles city selection change
	 * 
	 * @param {Object} e - Selected city object or null
	 */
	const handleCityChange = (e) => {
		setData((data) => ({ ...data, city: e !== null ? e : null }))
	}
	
	/**
	 * Handles contact checkbox change
	 * 
	 * @param {Event} e - Checkbox change event
	 */
	const handleChecked = (e) => {
		setData({ ...data, contact: e.target.checked })
	}

	// const handlePhoneNumber = (number) => {
	// 	// console.log(number)
	// 	setData({ ...data, phone: number })
	// }
	
	/**
	 * Toggles password visibility between text and password type
	 * 
	 * @param {Event} e - Click event
	 */
	const handleTogglePass = (e) => {
		if (type === 'password') {
			setIcon(true)
			setType('text')
		} else {
			setIcon(false)
			setType('password')
		}
	}

	return (
		<>
			<Head>
				<title>Signup | Truth Sleuth Local</title>
			</Head>
			<div data-component="signup" className="w-screen h-screen overflow-auto flex justify-center items-start pt-12 pb-8">
				<div className="w-full max-w-sm font-light bg-white rounded-md p-6">
					{/* Logo and branding section */}
					<div className="flex flex-col items-center justify-center mb-2">
						<div className="bg-blue-600 p-7 rounded-full mb-2">
							<GiMagnifyingGlass size={30} className="fill-white" />
						</div>
						<Typography variant="small" className='text-xs font-semibold text-[#2E3B4E]'>Truth Sleuth Local</Typography>
					</div>
					
					{/* Signup form */}
					<form className="px-8 pt-6 pb-4 mb-4" onSubmit={handleSignUp}>
						{isAgencyInvite && inviteAgencyName ? (
							<div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
								<Typography variant="small" className="text-[#2E3B4E]">
									You&apos;re joining{' '}
									<span className="font-semibold">{inviteAgencyName}</span>
								</Typography>
							</div>
						) : null}
						{/* Name input (hidden for agency invites) */}
						<div className="mb-4">
							{!isAgencyInvite && (
								<FormInput
									id="name"
									type="text"
									label={t('name')}
									required
									value={data.name}
									onChange={handleChange}
									autoComplete="name"
								/>
							)}
						</div>
						{/* <div className="mb-4">
						<PhoneInput
							placeholder={t('phone')}
							value={data.phone}
							country={'us'}
							inputStyle={{ width: '100%' }}
							onChange={handlePhoneNumber}
						/>
					</div> */}
						
						{/* State selection dropdown */}
						<div className="mb-4">
							<FormSelect
								id="state"
								required
								label={t('NewReport:state_text')}
								value={data.state}
								options={State.getStatesOfCountry('US')}
								getOptionLabel={(options) => options['name']}
								getOptionValue={(options) => options['name']}
								onChange={handleStateChange}
							/>
							{errors.state && data.state === null && (
								<span className="text-red-500">{errors.state}</span>
							)}
						</div>

						{/* City selection dropdown */}
						<div className="mb-4">
							<FormSelect
								id="city"
								label={t('NewReport:city_text')}
								value={data.city}
								options={City.getCitiesOfState(
									data.state?.countryCode,
									data.state?.isoCode,
								)}
								getOptionLabel={(options) => options['name']}
								getOptionValue={(options) => options['name']}
								onChange={handleCityChange}
							/>
						</div>
						
						{/* Email input */}
						<div className="mb-4">
							<FormInput
								className={isEmailLinkInvite ? 'mb-1' : ''}
								id="email"
								type="email"
								label={t('email')}
								required
								value={data.email}
								onChange={handleChange}
								autoComplete="email"
							/>
							{isEmailLinkInvite && (
								<div className="mb-1 text-sm italic">
									** Must be the email you were sent the invite.
								</div>
							)}
						</div>
						
						{/* Password input with visibility toggle */}
						<>
							{isEmailLinkInvite && (
								<div className="mb-1 text-sm italic">
									Create a secure password for your account.
								</div>
							)}
							<div className="mb-1">
								<FormInput
									className={isEmailLinkInvite ? 'mb-1' : ''}
									id="password"
									type={type}
									label={t('password')}
									required
									value={data.password}
									onChange={handleChange}
									autoComplete="new-password"
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
						</>
						
						{/* Password length validation */}
						{data.password.length > 0 && data.password.length < 8 && (
							<span className="text-red-500 text-sm font-light">
								Password must be atleast 8 characters
							</span>
						)}
						
						{/* Confirm password input */}
						<div className="mt-4 mb-1">
							<FormInput
								id="confirmPW"
								type={type}
								label={t('confirmPassword')}
								required
								value={data.confirmPW}
								onChange={handleChange}
								autoComplete="new-password"
							/>
						</div>

						{/* Contact permission checkbox */}
						<div className="mb-1">
							<input
								className="shadow border-white rounded-md mx-1"
								id="contact"
								type="checkbox"
								value={data.contact}
								checked={data.contact}
								onChange={handleChecked}
								autoComplete="contact"
							/>
							<label htmlFor="contact">{t('contact')}</label>
						</div>
						
						{/* Password confirmation validation */}
						{data.password !== data.confirmPW && (
							<span className="text-red-500 text-sm font-light">
								{t('password_error')}
							</span>
						)}
						
						{/* Error display */}
						{signUpError && (
							<div className="text-red-500 text-sm font-normal pt-3">
								{signUpError}
							</div>
						)}

						{/* Submit button */}
						<div className="flex-col items-center content-center mt-7">
							<Button
								loading={data.password !== data.confirmPW}
								fullWidth
								type="submit">
								{t('signupButton')}
							</Button>
						</div>
					</form>
					
					{/* Login link */}
					<p className="text-center text-gray-500 text-sm">
						{t('haveAccount')}
						<Link
							href="/login"
							className="inline-block px-2 align-baseline font-bold text-sm text-[#2E3B4E] hover:text-blue-800">
							{t('login_action')}
						</Link>
					</p>
					
					{/* Language switcher */}
					<div className="flex justify-center items-center p-6 gap-1">
						{/* <span className="text-[#2E3B4E] text-md uppercase font-bold py-2 px-2">{t("select")}</span> */}
						<LanguageSwitcher />
					</div>
					
					{/* Privacy policy link */}
					<div className="privacy_policy flex justify-center items-center">
						<Link
							href="/privacy-policy"
							className="text-[#2E3B4E] font-semibold hover:underline">
							Privacy Policy
						</Link>
					</div>
				</div>
			</div>
		</>
	)
}
export default SignUp

/**
 * Server-side translation props for internationalization
 * 
 * @param {Object} context - Next.js context with locale information
 * @returns {Promise<Object>} Props with translation data
 */
export async function getStaticProps(context) {
	// extract the locale identifier from the URL
	const { locale } = context
	return {
		props: {
			// pass the translation props to the page component
			...(await serverSideTranslations(locale, [
				'Welcome',
				'Report',
				'NewReport',
			])),
		},
	}
}
