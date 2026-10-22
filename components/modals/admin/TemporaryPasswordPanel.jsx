/**
 * Admin action on study sites. Generates a one-time password and shows it
 * once so it can be copied into a Prolific reply.
 */
import React, { useState } from 'react'
import { Button, Typography } from '@material-tailwind/react'
import { useAuth } from '../../../context/AuthContext'

const TemporaryPasswordPanel = ({ userId }) => {
	const { setTemporaryPassword } = useAuth()
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [busy, setBusy] = useState(false)
	const [copied, setCopied] = useState(false)

	const handleGenerate = async () => {
		setBusy(true)
		setError('')
		setCopied(false)
		try {
			const result = await setTemporaryPassword(userId)
			setPassword(result?.password || '')
		} catch (err) {
			console.error(err)
			setPassword('')
			setError('Could not set a temporary password. Please try again.')
		} finally {
			setBusy(false)
		}
	}

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(password)
			setCopied(true)
		} catch (err) {
			console.error(err)
			setError('Could not copy the password. Select it and copy it yourself.')
		}
	}

	return (
		<div
			data-component="TemporaryPasswordPanel"
			className="rounded-md border border-blue-gray-100 p-3">
			<Typography variant="small" className="font-semibold mb-1">
				Temporary password
			</Typography>
			<Typography variant="small" className="mb-3 font-normal text-slate-600">
				Generate a password and send it in the Prolific reply. It stops
				working after they choose their own.
			</Typography>
			<Button
				type="button"
				variant="outlined"
				size="sm"
				disabled={busy || !userId}
				onClick={handleGenerate}>
				{busy ? 'Generating…' : 'Generate temporary password'}
			</Button>
			{password ? (
				<div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
					<input
						readOnly
						value={password}
						aria-label="Temporary password"
						className="w-full rounded-md border border-blue-gray-200 px-3 py-2 font-mono text-sm"
					/>
					<Button type="button" size="sm" onClick={handleCopy}>
						{copied ? 'Copied' : 'Copy'}
					</Button>
				</div>
			) : null}
			{error ? (
				<Typography variant="small" className="mt-2 text-red-600">
					{error}
				</Typography>
			) : null}
		</div>
	)
}

export default TemporaryPasswordPanel
