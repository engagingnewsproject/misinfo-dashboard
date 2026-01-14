/**
 * @fileoverview Reset Password Page - Password reset email flow
 *
 * This page provides a form for users to request a password reset email.
 * Features include:
 * - Email input and validation
 * - Success/failure messaging
 * - Integration with AuthContext for password reset
 * - Responsive and accessible UI
 *
 * Integrates with:
 * - AuthContext for password reset
 * - next/head for meta tags
 * - next/link for navigation
 * - next/image for icons
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from "next/image"
import { useAuth } from '../context/AuthContext'
import Head from 'next/head'

/**
 * ResetPassword Page
 *
 * Renders the password reset form and handles email sending.
 *
 * @returns {JSX.Element} The rendered reset password page
 */
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
				icon: "svgs/illu-Password.svg"
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
								icon: "svgs/illu-Password.svg"
            })
        } catch (err) {
            console.log(err)
        }
    }

    const handleChange = (e) => {
        setEmail(e.target.value)
    }


	return (
		<>
			<Head>
				<title>Reset Password | Truth Sleuth Local</title>
			</Head>

			<div className="w-screen h-screen flex justify-center items-center">
				<div className="w-full max-w-sm font-light">
					<div className="grid justify-items-center mb-4">
						<Image
							src={template.icon}
							width="100"
							height="100"
							alt="template-icon"
						/>
						<div className="flex-col mt-2 text-center tracking-wide">
							<div className="text-lg font-bold my-2">{template.heading}</div>
							<div className="text-sm font-light">{template.subtitle}</div>
						</div>
					</div>
					<form
						className="px-8 pt-4 pb-4"
						onChange={handleChange}
						onSubmit={handleReset}>
						{!emailSent && (
							<div className="mb-4">
								<input
									className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									id="email"
									type="text"
									placeholder="Email"
									required
									value={email}
									onChange={handleChange}
								/>
							</div>
						)}
						<div className="flex-col items-center content-center">
							<button
								className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
								type="submit"
								disabled={btn}>
								{template.btnText}
							</button>
						</div>
					</form>
					{btn && (
						<div className="text-green-500 text-sm font-light mx-24">
							The reset email has been sent
						</div>
					)}
					<p className="text-center text-gray-500 text-sm mt-2">
						Already have an account?
						<Link
							href="/login"
							className="inline-block px-2 align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
							Log In
						</Link>
					</p>
				</div>
			</div>
		</>
	)
}

export default ResetPassword