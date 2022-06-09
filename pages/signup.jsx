import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'

const SignUp = () => {
    const router = useRouter()
    const { user, signup } = useAuth()

    const [data, setData] = useState({
       teamName: '',
       email: '',
       password: '',
       confirmPW: ''
    })

    const handleSignUp = async (e) => {
        e.preventDefault()
        
        if (data.password.length < 8) {
            return
        }

        try {
            await signup(data.teamName, data.email, data.password)
            router.push('/dashboard')
        } catch (err) {
            console.log(err)
        }
    }

    const handleChange = (e) => {
        setData({ ...data, [e.target.id]: e.target.value})
    }


    return (
        <div class="w-screen h-screen flex justify-center items-center">
            <div class="w-full max-w-sm font-light">
                <div class="flex justify-center mb-4">
                    <div class="w-24 h-24 font-extralight rounded-full tracking-widest flex justify-center items-center text-white bg-blue-500">MOODY</div>
                </div>
                <form class="px-8 pt-6 pb-4 mb-4" onChange={handleChange} onSubmit={handleSignUp}>
                    <div class="mb-4">
                        <input
                            class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="teamName"
                            type="text"
                            placeholder="Name of your team"
                            required
                            value={data.teamName}
                            />
                    </div>
                    <div class="mb-4">
                        <input
                            class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="email"
                            type="text"
                            placeholder="Email"
                            required
                            value={data.email}
                            />
                    </div>
                    <div class="mb-1">
                        <input
                            class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="password"
                            type="password"
                            placeholder="Password"
                            required 
                            value={data.password}
                            />
                    </div>
                    {data.password.length > 0 && data.password.length < 8 && <span class="text-red-500 text-sm font-light">Password must be atleast 8 characters</span>}
                    <div class="mt-4 mb-1">
                        <input
                            class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="confirmPW"
                            type="password"
                            placeholder="Confirm Password"
                            required 
                            value={data.confirmPW}
                            />
                    </div>
                    {data.password !== data.confirmPW && <span class="text-red-500 text-sm font-light">Passwords don't match</span>}
                    <div class="flex-col items-center content-center mt-7">
                        <button disabled={data.password !== data.confirmPW} class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline" type="submit">
                            Sign Up
                        </button>
                    </div>
                </form>
                <p class="text-center text-gray-500 text-sm">
                    Already have an account?
                    <Link href="/login">
                        <a class="inline-block px-2 align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
                            Log In
                        </a>
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default SignUp