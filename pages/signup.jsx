import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import {isSignInWithEmailLink, signInWithEmailLink, signOut, createUserWithEmailAndPassword, verifyEmail } from 'firebase/auth'
import { doc, setDoc, collection, addDoc, arrayUnion} from '@firebase/firestore'
import { db, auth } from '../config/firebase'
import Select from "react-select";
import PhoneInput from 'react-phone-input-2'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import 'react-phone-input-2/lib/style.css'

import { Country, State, City }  from 'country-state-city';

import moment from 'moment'
import { RiContactsBookLine } from 'react-icons/ri'

const SignUp = () => {
    const router = useRouter()
    const { t } = useTranslation('Welcome');

    const [signUpError, setSignUpError] = useState("")

    const { user, signup, verifyEmail, addAgencyRole, setPassword } = useAuth()

    // Determines if current user has the privilege to sign up as an agency
    const isAgency = isSignInWithEmailLink(auth, window.location.href)
    const [data, setData] = useState({
       name: '',
       email: '',
       phone: '',
       password: '',
       confirmPW: '',
       contact: false
    })
    
    const addMobileUser = (privilege) => {
        // Get user object
        const user = auth.currentUser;
        
        if (user) {
            // Set user uid
            // console.log("adding mobile user")
            const uid = user.uid;
            // create a new mobileUsers doc with signed in user's uid
            setDoc(doc(db, "mobileUsers", uid), {
                name: data.name,
                email: data.email,
                phone: (data.phone ? data.phone : ""),
                joiningDate: moment().utc().unix(),
                isBanned: false,
                userRole: privilege,
                contact: data.contact
            });
            // console.log("user was added with uid" + uid)
        } else {
            // console.log('no user');
        }
    }


    const handleSignUp = async (e) => {
        e.preventDefault()
        // console.log("signing up")

        if (data.password.length < 8) {
          return
      }


        // console.log("should be given agency privilege " + isAgency)

          try {
              if (isAgency) {

                // Sees if agency already exists -if it does, adds user to the agency's user list
                  signInWithEmailLink(auth, data.email, window.location.href).then((result) =>{
                    const promise2 = addAgencyRole({email: data.email});

                    // console.log(result.user.email)
                    // console.log("current user " + auth.currentUser)
                    const promise1 = auth.updateCurrentUser(result.user)
                    auth.currentUser.reload().then(() => {

                    const promise3 = setPassword(data.password)

                    Promise.all([promise1, promise2, promise3]).then((values) => {
                      
                      // console.log(auth.currentUser.email)

                      if (verifyEmail(auth.currentUser)) {
                        setSignUpError("")
                        // console.log("in try")
                        window.location.replace('/dashboard')
                      } else {
                        // console.log("here = for agency")
                        addMobileUser("Agency")
                        window.location.replace('/verifyEmail')
                      }
                    })

                  })}).catch((err)=> {
                    if (err.message == "Firebase: Error (auth/invalid-action-code).") {
                      setSignUpError("Sign in link had expired. Please ask admin to send a new link to sign up.")
                    } else if (err.message == "Firebase: The email provided does not match the sign-in email address. (auth/invalid-email).") {
                      // An error happened.
                      setSignUpError("Your email does not match up with the email address that the sign-in link was sent to.")
                    } else {
                      console.log(err)
                    }
                  })

                  const userCredential = await auth.currentUser.linkWithCredential(result.credential);

                  verifyEmail(auth.currentUser).then((verified) => {
                    // Handle email verification logic
                    // ...
                  });
                
              } else {
                signup(data.name, data.email, data.password)
									.then((userCredential) => {
										setSignUpError("")
                    addMobileUser("User")
										router.push('/verifyEmail');
									})
									.catch((error) => {
										if (error.code === "auth/email-already-in-use") {
											setSignUpError("The entered email is already in use.")
										} else {
											setSignUpError(error.message)
										}
										console.error(error)
									})


              }
              analytics.logEvent('sign_up', { method: 'email' }); // Log 'login' event
          } catch (err) {
              
              if (err.message == "Firebase: Error (auth/email-already-in-use).") {
                  setSignUpError("Email already in use. Please log in.")
              } else {
                  setSignUpError(err.message)
              }
          }
    }

    const handleChange = (e) => {
        setData({ ...data, [e.target.id]: e.target.value})
    }

    const handleChecked = (e) => {
      console.log(e.target.checked)

      setData({...data, contact: e.target.checked})
    }


    const handlePhoneNumber = (number) => {
      console.log(number)
      setData({...data, phone: number})

    }
    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <div className="w-full max-w-sm font-light">
                <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 font-extralight rounded-full tracking-widest flex justify-center items-center text-white bg-blue-500">MOODY</div>
                </div>
                <form className="px-8 pt-6 pb-4 mb-4"  onSubmit={handleSignUp}>
                    <div className="mb-4">
                        {/* Only allows user to select team name. Agencies had already had their name selected. */}  
                        {!isAgency &&       
                          <input
                            className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="name"
                            type="text"
                            placeholder={t("name")}
                            required
                            value={data.name}
                            onChange={handleChange}
                            autoComplete=''
                            />
                        }
                    </div>
                    <div className="mb-4">
              
                          {/* TODO: {agency && Instructions for an agency to sign up */}
                    {isAgency && 
                    <div>
                      <p className="text-lg font-bold text-blue-600 tracking-wider pt-2">Account Creation</p>
                      <div className="mb-1">Enter your email address.</div>
                    </div>}
                    <PhoneInput
                        placeholder={t("phone")}
                        value={data.phone}
                        country={'us'}
                        inputStyle={{width: "100%"}}

                        onChange={handlePhoneNumber}/>
                    </div>
                    <div className="mb-4">
                      <input
                        className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        type="text"
                        placeholder={t("email")}
                        required
                        value={data.email}
                        onChange={handleChange}
                        autoComplete='email'
                        />
                    </div>
                    <div className="mb-1">
                      {isAgency && 
                        <div className="mb-1">Create a secure password for your account.</div>}
                        <input
                            className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="password"
                            type="password"
                            placeholder={t("password")}
                            required 
                            value={data.password}
                            onChange={handleChange}
                            autoComplete='new-password'
                            />
                    </div>
                    {data.password.length > 0 && data.password.length < 8 && <span className="text-red-500 text-sm font-light">Password must be atleast 8 characters</span>}
                    <div className="mt-4 mb-1">
                        <input
                            className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="confirmPW"
                            type="password"
                            placeholder={t("confirmPassword")}
                            required 
                            value={data.confirmPW}
                            onChange={handleChange}
                            autoComplete='new-password'
                            />
                    </div>
                    <div className="mb-1">
                      <input
                            className="shadow border-white rounded-md mx-1"
                            id="contact"
                            type="checkbox"
                            value={data.contact}
                            checked={data.contact}
                            onChange={handleChecked}
                            autoComplete='contact'
                            />
                      <label htmlFor="contact">{t("contact")}</label>

                    </div>

                    {data.password !== data.confirmPW && <span className="text-red-500 text-sm font-light">{t("password_error")}</span>}
                    {signUpError && <div className="text-red-500 text-sm font-normal pt-3">{signUpError}</div>}
             
                    <div className="flex-col items-center content-center mt-7">
                        <button 
                        disabled={data.password !== data.confirmPW} 
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline" 
                        type="submit">
                           {t("signup")}
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-500 text-sm">
                    {t("haveAccount")}
                    <Link href="/login" className="inline-block px-2 align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                        {t("login_action")}
                    </Link>
                </p>
                <div className="flex justify-between items-center p-6 gap-1">
              <span className="text-blue-500 text-md uppercase font-bold py-2 px-2">{t("select")}</span>
              <LanguageSwitcher/>
               </div>
            </div>
          
        </div>
    )
}

export default SignUp


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