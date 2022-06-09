import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import illu_pw from '../public/Login/illu-Password.svg'
import illu_email from '../public/Login/illu-email.svg'
import { useAuth } from '../context/AuthContext'

const ResetPassword = () => {
    const router = useRouter()
    const { resetPassword } = useAuth()
    const [email, setEmail] = useState()
    const [emailSent, setEmailSent] = useState(false)
    const [btn, disableBtn] = useState(false)

    const [template, setTemplate] = useState({
        heading: "Forget Your Password?",
        subtitle: "Don't worry! Enter your registered email below to receive password reset email",
        btnText: "Send",
        icon: illu_pw
    })

    const handleReset = async (e) => {
        e.preventDefault()

        if (emailSent) {
            disableBtn(true)
        }

        try {
            await resetPassword(email)
            setEmailSent(true)
            setTemplate({
                heading: "Password Reset Email Has Been Sent!",
                subtitle: "Please check your inbox and reset password via email for your privacy safety",
                btnText: "Send it again",
                icon: illu_email
            })
        } catch (err) {
            console.log(err)
        }
    }

    const handleChange = (e) => {
        setEmail(e.target.value)
    }


    return (
        <div class="w-screen h-screen flex justify-center items-center">
            <div class="w-full max-w-sm font-light">
                <div class="grid justify-items-center mb-4">
                    <Image src={template.icon} width={156} height={120}/>
                    <div class="flex-col mt-2 text-center tracking-wide">
                        <div class="text-lg font-bold my-2">{template.heading}</div>
                        <div class="text-sm font-light">{template.subtitle}</div>
                    </div>
                </div>
                <form class="px-8 pt-4 pb-4" onChange={handleChange} onSubmit={handleReset}>
                    {!emailSent &&
                    <div class="mb-4">
                        <input
                            class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="email"
                            type="text"
                            placeholder="Email"
                            required
                            value={email}
                            />
                    </div>}
                    <div class="flex-col items-center content-center">
                        <button
                            class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                            type="submit"
                            disabled={btn}>
                            {template.btnText}
                        </button>
                    </div>
                </form>
                {btn && <div class="text-green-500 text-sm font-light mx-24">The reset email has been sent</div>}
                <p class="text-center text-gray-500 text-sm mt-2">
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