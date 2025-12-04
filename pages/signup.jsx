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
 * - Privacy policy modal
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
	signOut,
	createUserWithEmailAndPassword,
	verifyEmail,
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
import Select from 'react-select'
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
import PrivacyPolicyModal from "../components/modals/PrivacyPolicyModal"

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
	const { user, signup, verifyEmail, addAgencyRole, setPassword } = useAuth()
	
	// Check if current user has agency invitation privilege
	const isAgency = isSignInWithEmailLink(auth, window.location.href)
	
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
	
	// Privacy policy modal state
	const [showModal, setShowModal] = useState(false)
	const openModal = () => setShowModal(true)
	const closeModal = () => setShowModal(false)
	
	// console.log(isAgency);
	
	/**
	 * Creates a new mobile user document in Firestore
	 * 
	 * @param {string} privilege - User role ('User', 'Agency', or 'Admin')
	 * @returns {Promise<void>}
	 */
	const addMobileUser = (privilege) => {
		// Get user object
		// console.log('addMobileUser start', privilege)
		const user = auth.currentUser
		// console.log(user)
		if (user) {
			// Set user uid
			// console.log('adding mobile user')
			// console.log(data)
			const uid = user.uid
			// create a new mobileUsers doc with signed in user's uid
			setDoc(doc(db, 'mobileUsers', uid), {
				name: data.name,
				email: data.email,
				// phone: data.phone ? data.phone : '',
				joiningDate: moment().utc().unix(),
				state: data.state,
				city: data.city,
				isBanned: false,
				userRole: privilege,
				contact: data.contact,
			})
			// console.log("user was added with uid" + uid)
		} else {
			console.log('no user')
		}
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
		// console.log("should be given agency privilege " + isAgency)
		try {
			if (isAgency) {
				console.log('DEV LOG - handleSignUp - Agency user')
				// Sees if agency already exists -if it does, adds user to the agency's user list
				signInWithEmailLink(auth, data.email, window.location.href)
					.then((result) => {
						const promise2 = addAgencyRole({ email: data.email }) // Asynchronously adds agency role to the user.
						const promise1 = auth.updateCurrentUser(result.user) // Updates the current user in Firebase.
						auth.currentUser.reload().then(() => {
							// Reloads the current user information.
							const promise3 = setPassword(data.password) // Asynchronously sets the new password.
							Promise.all([promise1, promise2, promise3]).then((values) => {
								// Waits for all promises to complete.
								/**
                  Add new Agency issue is here. When the agency user goes through the
                  signup process they are not added as a `mobileUser` and therefore
                  they have no real profile
                  -- or at least that is what my testing has shown.
                  1) Admin user adds a new agency
                  2) user's email is sent email subject:"Sign in to MisInfo App requested"
                  3) user clicks link in email
                  4) signup.jsx page with "** Must be the email you were sent the invite." text under Email input.
                  5) user submits
                  6) user's email is sent "Verify your email for MisInfo App"
                  7) user clicks link
                  8) verifyEmail.jsx page
                  9) user clicks link
                  10) https://misinfo-5d004.firebaseapp.com/__/auth/action?0000 page
                  11) user clicks "Continue" button
                  12) login.jsx page to log in
                  notes: where is the user assigned the 'Agency' custom claim?
                  notes: firestore `mobileUsers` db is not added the new user's doc
                */
								if (verifyEmail(auth.currentUser)) {
									// console.log('verifyEmail==> ', verifyEmail(auth.currentUser));
									// console.log('auth.currentUser==> ', auth.currentUser);
									// Verifies the email of the logged-in user.
									setSignUpError('') // Clears any previous sign-up errors.
									addMobileUser('Agency') // Adds the user to the 'mobileUsers' collection with 'Agency' role.
									window.location.replace('/verifyEmail') // Redirects to the verify email page.
								} else {
									// console.log("if in else where addMobileUser('Agency') runs")
									addMobileUser('Agency')
									// console.log('else SEND TO VERIFY EMAIL PAGE');
									window.location.replace('/verifyEmail')
								}
							})
						})
					})
					.catch((err) => {
						if (err.message == 'Firebase: Error (auth/invalid-action-code).') {
							setSignUpError(
								'Sign in link had expired. Please ask admin to send a new link to sign up.',
							)
						} else if (
							err.message ==
							'Firebase: The email provided does not match the sign-in email address. (auth/invalid-email).'
						) {
							// An error happened.
							setSignUpError(
								'Your email does not match up with the email address that the sign-in link was sent to.',
							)
						} else {
							console.log(err)
						}
					})
				// const userCredential = await auth.currentUser.linkWithCredential(
				// 	result.credential,
				// )
				// verifyEmail(auth.currentUser).then((verified) => {
				// 	// Handle email verification logic
				// 	// ...
				// })
			} else {
				console.log('DEV LOG - handleSignUp - not agency user')

				// check if `mobileUsers` doc already exist with the user's email
				/*
                try {
                  console.log('NEW CODE--> ', data.email);
                  const mobileRef = getDoc(doc(db, 'mobileUsers', data.email))
                  // setUserData(mobileRef.data())
                  console.log(mobileRef);
                } catch (err) {
                  if (err.message == "Firebase: Error (firestore 'mobileUsers' doc already created).") {
                      setSignUpError("An account has already been set up with this email. Please log in.")
                  } else {
                      setSignUpError(err.message)
                  }
                }
                */

				signup(data.name, data.email, data.password, data.state, data.city)
					.then((userCredential) => {
						setSignUpError('')
						addMobileUser('User')
						router.push('/verifyEmail')
						// console.log(
						// 	'sign up successful user credentials--> ',
						// 	userCredential,
						// )
					})
					.catch((error) => {
						if (error.code === 'auth/email-already-in-use') {
							setSignUpError('The entered email is already in use.')
						} else {
							setSignUpError(error.message)
						}
						console.error('Error in (non Agency) signup--> ', error)
					})
			}
			// analytics.logEvent('sign_up', { method: 'email' }); // Log 'login' event
		} catch (err) {
			if (err.message == 'Firebase: Error (auth/email-already-in-use).') {
				setSignUpError('Email already in use. Please log in.')
			} else {
				setSignUpError(err.message)
			}
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
			<div className="w-screen h-screen overflow-auto flex justify-center items-start pt-12 pb-8">
				<div className="w-full max-w-sm font-light">
					{/* Logo and branding section */}
					<div className="flex flex-col items-center justify-center mb-2">
						<div className="bg-blue-600 p-7 rounded-full mb-2">
							<GiMagnifyingGlass size={30} className="fill-white" />
						</div>
						<Typography variant="small" className='text-xs font-semibold text-blue-600'>Truth Sleuth Local</Typography>
					</div>
					
					{/* Signup form */}
					<form className="px-8 pt-6 pb-4 mb-4" onSubmit={handleSignUp}>
						{/* Name input (hidden for agency users) */}
						<div className="mb-4">
							{!isAgency && (
								<input
									className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									id="name"
									type="text"
									placeholder={t('name')}
									required
									value={data.name}
									onChange={handleChange}
									autoComplete=""
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
							<Select
								className="border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="state"
								type="text"
								required
								placeholder={t('NewReport:state_text')}
								value={data.state}
								options={State.getStatesOfCountry('US')}
								getOptionLabel={(options) => {
									return options['name']
								}}
								getOptionValue={(options) => {
									return options['name']
								}}
								label="state"
								onChange={handleStateChange}
							/>
							{errors.state && data.state === null && (
								<span className="text-red-500">{errors.state}</span>
							)}
						</div>

						{/* City selection dropdown */}
						<div className="mb-4">
							<Select
								className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="city"
								type="text"
								placeholder={t('NewReport:city_text')}
								value={data.city}
								options={City.getCitiesOfState(
									data.state?.countryCode,
									data.state?.isoCode,
								)}
								getOptionLabel={(options) => {
									return options['name']
								}}
								getOptionValue={(options) => {
									return options['name']
								}}
								onChange={handleCityChange}
							/>
						</div>
						
						{/* Email input */}
						<div className="mb-4">
							<input
								className={`${isAgency && 'mb-1 '}shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
								id="email"
								type="text"
								placeholder={t('email')}
								required
								value={data.email}
								onChange={handleChange}
								autoComplete="email"
							/>
							{isAgency && (
								<div className="mb-1 text-sm italic">
									** Must be the email you were sent the invite.
								</div>
							)}
						</div>
						
						{/* Password input with visibility toggle */}
						<>
							{isAgency && (
								<div className="mb-1 text-sm italic">
									Create a secure password for your account.
								</div>
							)}
							<div className="mb-1 flex">
								<input
									className={`${isAgency && 'mb-1 '}shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
									id="password"
									type={type}
									placeholder={t('password')}
									required
									value={data.password}
									onChange={handleChange}
									autoComplete="new-password"
								/>
								<span
									className="flex justify-around items-center"
									onClick={handleTogglePass}>
									<MdOutlineRemoveRedEye className="absolute mr-10" />
								</span>
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
							<input
								className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="confirmPW"
								type={type}
								placeholder={t('confirmPassword')}
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
							className="inline-block px-2 align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
							{t('login_action')}
						</Link>
					</p>
					
					{/* Language switcher */}
					<div className="flex justify-center items-center p-6 gap-1">
						{/* <span className="text-blue-500 text-md uppercase font-bold py-2 px-2">{t("select")}</span> */}
						<LanguageSwitcher />
					</div>
					
					{/* Privacy policy link */}
					<div className="privacy_policy flex justify-center items-center">
						<a className='cursor-pointer text-blue-600' onClick={openModal}>Privacy Policy</a>
					</div>
				</div>
				<PrivacyPolicyModal showModal={showModal} closeModal={closeModal} />
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
