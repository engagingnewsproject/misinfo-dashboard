/**
 * Study sites stop here when an admin has set a temporary password.
 * Saving a new password clears that requirement. Live sites bounce away.
 */
import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { doc, getDoc } from 'firebase/firestore'
import { useTranslation } from 'next-i18next'
import { Button } from '@material-tailwind/react'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { brand, pageTitle } from '../config/brand'
import { brandServerSideTranslations } from '../lib/brandServerSideTranslations'
import FormInput from '../components/ui/FormInput'

const ChoosePassword = () => {
	const router = useRouter()
	const { t } = useTranslation('Welcome')
	const { user, loading, replaceTemporaryPassword } = useAuth()
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [error, setError] = useState('')
	const [busy, setBusy] = useState(false)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		if (loading) return
		if (!brand.isStudyCopy) {
			router.replace('/report')
			return
		}
		if (!user?.accountId) return
		let cancelled = false
		getDoc(doc(db, 'mobileUsers', user.accountId))
			.then((snap) => {
				if (cancelled) return
				if (snap.data()?.mustChangePassword !== true) {
					router.replace('/report')
					return
				}
				setReady(true)
			})
			.catch((err) => {
				console.error(err)
				if (!cancelled) {
					setError(t('choosePasswordError'))
					setReady(true)
				}
			})
		return () => {
			cancelled = true
		}
	}, [loading, router, t, user])

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError('')
		if (password.length < 8) {
			setError(t('choosePasswordTooShort'))
			return
		}
		if (password !== confirm) {
			setError(t('password_error'))
			return
		}
		setBusy(true)
		try {
			await replaceTemporaryPassword(password)
			await router.replace('/report')
		} catch (err) {
			console.error(err)
			setError(t('choosePasswordError'))
			setBusy(false)
		}
	}

	return (
		<>
			<Head>
				<title>{pageTitle('Choose a new password')}</title>
			</Head>
			<div
				data-component="choose-password"
				className="w-screen min-h-screen flex justify-center items-start py-12">
				<div className="w-full max-w-sm px-8 font-light">
					<h1 className="text-lg font-bold text-[#2E3B4E] mb-2">
						{t('choosePasswordTitle')}
					</h1>
					<p className="text-sm text-[#2E3B4E] mb-4">
						{t('choosePasswordBody')}
					</p>
					{!ready ? (
						<p className="text-sm text-gray-600">Loading…</p>
					) : (
						<form onSubmit={handleSubmit}>
							<div className="mb-4">
								<FormInput
									id="password"
									type="password"
									label={t('password')}
									required
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									autoComplete="new-password"
								/>
							</div>
							<div className="mb-4">
								<FormInput
									id="confirmPassword"
									type="password"
									label={t('confirmPassword')}
									required
									value={confirm}
									onChange={(event) => setConfirm(event.target.value)}
									autoComplete="new-password"
								/>
							</div>
							{error ? (
								<p className="text-red-500 text-sm mb-3">{error}</p>
							) : null}
							<Button type="submit" fullWidth loading={busy} disabled={!ready}>
								{t('choosePasswordButton')}
							</Button>
						</form>
					)}
				</div>
			</div>
		</>
	)
}

export default ChoosePassword

export async function getStaticProps(context) {
	const { locale } = context
	return {
		props: {
			...(await brandServerSideTranslations(locale, ['Welcome'])),
		},
	}
}
