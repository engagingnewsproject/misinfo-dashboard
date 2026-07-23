/**
 * Admin modal: recreate a missing `mobileUsers/{uid}` doc from Firebase Auth.
 * Lookup by Auth UID or email; document ID is always the Auth UID.
 */
import React, { useState } from 'react'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'
import FormInput from '../../ui/FormInput'
import ModalCloseButton from '../../ui/ModalCloseButton'

const ROLES = ['User', 'Agency', 'Admin']

/**
 * @param {Object} props
 * @param {(open: boolean) => void} props.setOpen
 * @param {string} props.lookup
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onLookupChange
 * @param {'uid' | 'email'} props.lookupMode
 * @param {(mode: 'uid' | 'email') => void} props.onLookupModeChange
 * @param {() => void | Promise<void>} props.onLookup
 * @param {boolean} props.lookingUp
 * @param {null | {
 *   uid: string
 *   email: string
 *   displayName: string
 *   suggestedRole: string
 *   docExists: boolean
 * }} props.resolved
 * @param {string} props.name
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onNameChange
 * @param {string} props.userRole
 * @param {(e: React.ChangeEvent<HTMLSelectElement>) => void} props.onRoleChange
 * @param {string} props.agency
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onAgencyChange
 * @param {boolean} props.forceOverwrite
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onForceOverwriteChange
 * @param {() => void | Promise<void>} props.onSubmit
 * @param {boolean} props.submitting
 * @param {Record<string, string>} props.errors
 * @param {string} [props.successMessage]
 */
const RecreateProfileModal = ({
	setOpen,
	lookup,
	onLookupChange,
	lookupMode,
	onLookupModeChange,
	onLookup,
	lookingUp,
	resolved,
	name,
	onNameChange,
	userRole,
	onRoleChange,
	agency,
	onAgencyChange,
	forceOverwrite,
	onForceOverwriteChange,
	onSubmit,
	submitting,
	errors,
	successMessage,
}) => {
	const handleClose = () => setOpen(false)
	const [localMode, setLocalMode] = useState(lookupMode)

	const selectMode = (mode) => {
		setLocalMode(mode)
		onLookupModeChange(mode)
	}

	return (
		<Dialog
			data-component="RecreateProfileModal"
			open
			handler={handleClose}
			size="md"
			className="recreate-profile-modal rounded-md">
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					Recreate mobileUsers profile
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody>
				<p className="text-sm text-gray-600 mb-4">
					Use when Auth still exists but the Firestore{' '}
					<code className="text-xs">mobileUsers</code> doc was deleted. Doc id
					is always the Auth UID.
				</p>

				<form
					onSubmit={(e) => {
						e.preventDefault()
						onLookup()
					}}
					className="flex flex-col gap-3 mb-4">
					<div className="flex gap-4 text-sm">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="lookupMode"
								checked={localMode === 'email'}
								onChange={() => selectMode('email')}
							/>
							Email
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="lookupMode"
								checked={localMode === 'uid'}
								onChange={() => selectMode('uid')}
							/>
							UID
						</label>
					</div>
					<FormInput
						id="recreateLookup"
						type={localMode === 'email' ? 'email' : 'text'}
						label={localMode === 'email' ? 'Auth email' : 'Auth UID'}
						value={lookup}
						onChange={onLookupChange}
						autoComplete="off"
						error={!!errors.lookup}
					/>
					{errors.lookup && (
						<p className="error text-red-500 text-sm font-light">
							{errors.lookup}
						</p>
					)}
					<Button type="submit" variant="outlined" disabled={lookingUp}>
						{lookingUp ? 'Looking up…' : 'Look up Auth user'}
					</Button>
				</form>

				{resolved && (
					<form
						onSubmit={(e) => {
							e.preventDefault()
							onSubmit()
						}}
						className="flex flex-col gap-3 border-t border-gray-200 pt-4">
						<div className="text-sm bg-slate-50 rounded p-3 space-y-1">
							<div>
								<span className="font-semibold">UID:</span> {resolved.uid}
							</div>
							<div>
								<span className="font-semibold">Email:</span>{' '}
								{resolved.email || '(none)'}
							</div>
							<div>
								<span className="font-semibold">Claims role:</span>{' '}
								{resolved.suggestedRole}
							</div>
							<div>
								<span className="font-semibold">mobileUsers doc:</span>{' '}
								{resolved.docExists ? (
									<span className="text-amber-700">already exists</span>
								) : (
									<span className="text-green-700">missing (can recreate)</span>
								)}
							</div>
						</div>

						<FormInput
							id="recreateName"
							type="text"
							label="Name"
							value={name}
							onChange={onNameChange}
							error={!!errors.name}
						/>
						{errors.name && (
							<p className="error text-red-500 text-sm font-light">
								{errors.name}
							</p>
						)}

						<label className="text-sm font-medium text-gray-700" htmlFor="recreateRole">
							Role
						</label>
						<select
							id="recreateRole"
							value={userRole}
							onChange={onRoleChange}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm">
							{ROLES.map((role) => (
								<option key={role} value={role}>
									{role}
								</option>
							))}
						</select>

						{userRole === 'Agency' && (
							<FormInput
								id="recreateAgency"
								type="text"
								label="Agency name (optional)"
								value={agency}
								onChange={onAgencyChange}
							/>
						)}

						{resolved.docExists && (
							<label className="flex items-center gap-2 text-sm text-amber-800">
								<input
									type="checkbox"
									checked={forceOverwrite}
									onChange={onForceOverwriteChange}
								/>
								Overwrite existing mobileUsers doc
							</label>
						)}

						{errors.submit && (
							<p className="error text-red-500 text-sm font-light">
								{errors.submit}
							</p>
						)}
						{successMessage && (
							<p className="text-green-700 text-sm">{successMessage}</p>
						)}

						<Button type="submit" id="recreateProfileSubmit" disabled={submitting}>
							{submitting ? 'Saving…' : 'Recreate profile'}
						</Button>
					</form>
				)}
			</DialogBody>
		</Dialog>
	)
}

export default RecreateProfileModal
