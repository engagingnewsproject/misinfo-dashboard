import { useRouter } from 'next/router'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import illu_pw from '../public/Login/illu-Password.svg'

//import { useAuth } from '../context/AuthContext'

const ResetPassword = () => {
    const router = useRouter()
    //const { user, login } = useAuth()
    const [email, setEmail] = useState()

    const handleReset = async (e) => {
        e.preventDefault()

        //console.log(user)
        /* try {
        await login(data.email, data.password)
        router.push('/dashboard')
        } catch (err) {
        console.log(err)
        } */
    }

    const handleChange = (e) => {
        setEmail(e.target.value)
    }


    return (
        <div class="w-screen h-screen flex justify-center items-center">
            <div class="w-full max-w-sm font-light">
                <div class="grid justify-items-center mb-4">
                    <Image src={illu_pw} width={156} height={120}/>
                    <div class="flex-col mt-2 text-center tracking-wide">
                        <div class="text-lg font-bold my-2">Forget Your Password?</div>
                        <div class="text-sm font-light">Don't worry! Enter your registered email below to receive password reset email</div>
                    </div>
                </div>
                <form class="px-8 pt-4 pb-4 mb-4" onChange={handleChange} onSubmit={handleReset}>
                    <div class="mb-4">
                        <input
                            class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="email"
                            type="text"
                            placeholder="Email"
                            required
                            value={email}
                            />
                    </div>
                    <div class="flex-col items-center content-center">
                        <button class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-4 px-6 rounded focus:outline-none focus:shadow-outline" type="submit">
                            Send
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

export default ResetPassword