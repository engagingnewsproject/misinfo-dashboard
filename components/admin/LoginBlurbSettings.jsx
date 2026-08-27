/**
 * Admin controls for the bilingual login page purpose blurb.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Typography } from '@material-tailwind/react'
import { db } from '../../config/firebase'
import FormTextarea from '../ui/FormTextarea'
import {
	DEFAULT_LOGIN_BLURB,
	getLoginBlurbConfig,
	resetLoginBlurbConfig,
	saveLoginBlurbConfig,
} from '../../utils/login-blurb-config'

const LoginBlurbSettings = () => {
	const [en, setEn] = useState(DEFAULT_LOGIN_BLURB.en)
	const [es, setEs] = useState(DEFAULT_LOGIN_BLURB.es)
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [status, setStatus] = useState('')

	const loadConfig = useCallback(async () => {
		setLoading(true)
		setStatus('')
		try {
			const config = await getLoginBlurbConfig(db)
			setEn(config.en)
			setEs(config.es)
		} catch (err) {
			console.error(err)
			setStatus('Failed to load login page text.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadConfig()
	}, [loadConfig])

	const handleSave = async () => {
		setBusy(true)
		setStatus('')
		try {
			const saved = await saveLoginBlurbConfig(db, { en, es })
			setEn(saved.en)
			setEs(saved.es)
			setStatus('Login page text saved.')
		} catch (err) {
			console.error(err)
			setStatus('Failed to save login page text.')
		} finally {
			setBusy(false)
		}
	}

	const handleReset = async () => {
		setBusy(true)
		setStatus('')
		try {
			await resetLoginBlurbConfig(db)
			setEn(DEFAULT_LOGIN_BLURB.en)
			setEs(DEFAULT_LOGIN_BLURB.es)
			setStatus('Reset to defaults.')
		} catch (err) {
			console.error(err)
			setStatus('Failed to reset login page text.')
		} finally {
			setBusy(false)
		}
	}

	return (
		<div
			data-component="LoginBlurbSettings"
			className="mb-8 p-6 bg-white rounded-md border border-blue-gray-100">
			<Typography variant="h5" color="blue" className="mb-2">
				Login page
			</Typography>
			<p className="text-sm text-gray-600 mb-4">
				Short description shown on the public login page. English and Spanish
				versions switch when visitors use the language toggle.
			</p>

			{loading ? (
				<p className="text-sm text-gray-500">Loading…</p>
			) : (
				<div className="flex flex-col gap-4 max-w-2xl">
					<FormTextarea
						id="login-blurb-en"
						label="English blurb"
						value={en}
						onChange={(e) => setEn(e.target.value)}
						resizable
					/>
					<FormTextarea
						id="login-blurb-es"
						label="Spanish blurb"
						value={es}
						onChange={(e) => setEs(e.target.value)}
						resizable
					/>

					<div className="flex flex-wrap gap-2 pt-2">
						<Button size="sm" color="blue" disabled={busy} onClick={handleSave}>
							Save
						</Button>
						<Button
							size="sm"
							variant="outlined"
							disabled={busy}
							onClick={handleReset}>
							Reset to defaults
						</Button>
					</div>

					{status && (
						<p className="text-sm text-gray-600" role="status">
							{status}
						</p>
					)}
				</div>
			)}
		</div>
	)
}

export default LoginBlurbSettings
