import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { doc, setDoc } from '@firebase/firestore'
import { db, auth } from '../config/firebase'
import moment from 'moment'

const SignUp = () => {
    const router = useRouter()
    const [signUpError, setSignUpError] = useState("")
    const { user, signup } = useAuth()
    const [data, setData] = useState({
       name: '',
       email: '',
       password: '',
       confirmPW: ''
    })
    
    const addMobileUser = () => {
        // Get user object
        const user = auth.currentUser;
        if (user) {
            // Set user uid
            const uid = user.uid;
            // create a new mobileUsers doc with signed in user's uid
            setDoc(doc(db, "mobileUsers", uid), {
                name: data.name,
                email: data.email,
                joiningDate: moment().utc().unix(),
                isBanned: false
            });
        } else {
            console.log('no user');
        }
    }

    const handleSignUp = async (e) => {
        e.preventDefault()

        if (data.password.length < 8) {
            return
        }

        try {
            await signup(data.teamName, data.email, data.password)
            setSignUpError("")
            router.push('/report')
        } catch (err) {
            if (err.message == "Firebase: Error (auth/email-already-in-use).") {
                setSignUpError("Email already in use. Please log in.")
            } else {
                setSignUpError(err.message)
            }
        } finally {
            addMobileUser()
        }
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
                <form className="px-8 pt-6 pb-4 mb-4" onChange={handleChange} onSubmit={handleSignUp}>
                    <div className="mb-4">
                        <input
                            className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="name"
                            type="text"
                            placeholder="Name of your team"
                            required
                            value={data.name}
                            onChange={handleChange}
                            />
                    </div>
                    <div className="mb-4">
                        <input
                            className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="email"
                            type="text"
                            placeholder="Email"
                            required
                            value={data.email}
                            onChange={handleChange}
                            />
                    </div>
                    <div className="mb-1">
                        <input
                            className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="password"
                            type="password"
                            placeholder="Password"
                            required 
                            value={data.password}
                            onChange={handleChange}
                            />
                    </div>
                    {data.password.length > 0 && data.password.length < 8 && <span className="text-red-500 text-sm font-light">Password must be atleast 8 characters</span>}
                    <div className="mt-4 mb-1">
                        <input
                            className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="confirmPW"
                            type="password"
                            placeholder="Confirm Password"
                            required 
                            value={data.confirmPW}
                            onChange={handleChange}
                            />
                    </div>
                    {data.password !== data.confirmPW && <span className="text-red-500 text-sm font-light">Passwords don't match</span>}
                    {signUpError && <div className="text-red-500 text-sm font-normal pt-3">{signUpError}</div>}
                    <div className="flex-col items-center content-center mt-7">
                        <button 
                        disabled={data.password !== data.confirmPW} 
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline" 
                        type="submit">
                            Sign Up
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-500 text-sm">
                    Already have an account?
                    <Link href="/login" className="inline-block px-2 align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default SignUp