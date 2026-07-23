/**
 * Local-dev-only login shortcuts (buttons + ?devLogin=).
 * Loaded from login.jsx only when NODE_ENV === 'development' so production
 * client bundles should tree-shake this module away.
 */

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@material-tailwind/react'

const DEV_LOGIN_ALIASES = /** @type {const} */ (['admin', 'agency', 'public'])

function isBrowserLocalhost() {
	if (typeof window === 'undefined') return false
	const host = window.location.hostname
	return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

/**
 * @param {{
 *   loading: boolean
 *   setLoading: (value: boolean) => void
 *   setEmailHint: (email: string) => void
 *   signInAndRedirect: (email: string, password: string) => Promise<void>
 *   onError: (err: unknown) => void
 * }} props
 */
export default function DevLoginShortcuts({
	loading,
	setLoading,
	setEmailHint,
	signInAndRedirect,
	onError,
}) {
	const router = useRouter()
	const [visible, setVisible] = useState(false)
	const started = useRef(false)

	useEffect(() => {
		setVisible(isBrowserLocalhost())
	}, [])

	const runDevLogin = async (alias) => {
		if (!isBrowserLocalhost()) {
			onError(new Error('Dev login is only available on localhost'))
			return
		}
		setLoading(true)
		try {
			const res = await fetch(
				`/api/dev/login-creds?alias=${encodeURIComponent(alias)}`,
			)
			if (!res.ok) {
				const body = await res.json().catch(() => ({}))
				throw new Error(body.error || `Dev login failed (${res.status})`)
			}
			const { email, password } = await res.json()
			setEmailHint(email)
			await signInAndRedirect(email, password)
		} catch (err) {
			console.error(err)
			onError(err)
		} finally {
			setLoading(false)
		}
	}

	// Agent / bookmark: /login?devLogin=admin|agency|public
	useEffect(() => {
		if (!visible || !router.isReady || started.current) return
		const alias =
			typeof router.query.devLogin === 'string'
				? router.query.devLogin.trim().toLowerCase()
				: ''
		if (!DEV_LOGIN_ALIASES.includes(/** @type {*} */ (alias))) return
		started.current = true
		void runDevLogin(/** @type {'admin' | 'agency' | 'public'} */ (alias))
		void router.replace('/login', undefined, { shallow: true })
		// eslint-disable-next-line react-hooks/exhaustive-deps -- once per URL alias
	}, [visible, router.isReady, router.query.devLogin])

	if (!visible) return null

	return (
		<div
			className="mx-8 mb-4 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3"
			data-component="dev-login-shortcuts">
			<p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
				Localhost dev only
			</p>
			<div className="flex flex-col gap-2">
				{DEV_LOGIN_ALIASES.map((alias) => (
					<Button
						key={alias}
						type="button"
						variant="outlined"
						fullWidth
						disabled={loading}
						onClick={() => runDevLogin(alias)}
						className="border-gray-400 text-[#2E3B4E] normal-case">
						dev {alias}
					</Button>
				))}
			</div>
		</div>
	)
}
