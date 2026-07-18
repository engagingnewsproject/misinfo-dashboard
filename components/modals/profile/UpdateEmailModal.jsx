import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'next-i18next'
import { auth } from '../../../config/firebase'
import FormInput from '../../ui/FormInput'
import ModalCloseButton from '../../ui/ModalCloseButton'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

/**
 * Mount when visible (`{emailModal && <UpdateEmailModal ... />}`); Dialog is always open
 * while mounted, matching existing call sites.
 */
const UpdateEmailModal = ({ setEmailModal }) => {
	const { t } = useTranslation('Profile')

	const { updateUserEmail } = useAuth()
	const [updateSuccess, setUpdateSuccess] = useState(false)
	const [incorrectPassword, setIncorrectPassword] = useState(false)
	const [data, setData] = useState({
		currentEmail: '',
		newEmail: '',
		currentPassword: '',
	})

	const handleClose = () => setEmailModal(false)

	const handleChange = (e) => {
		setData({ ...data, [e.target.id]: e.target.value })
	}

	const handleUpdateEmail = async (e) => {
		e.preventDefault()
		try {
			await updateUserEmail(auth, data.currentPassword, data.newEmail)
			setUpdateSuccess(true)
			setIncorrectPassword(false)
		} catch (error) {
			setUpdateSuccess(false)
			setIncorrectPassword(true)
		}
	}

	return (
		<Dialog
			open
			handler={handleClose}
			size="xs"
			className="update-email-modal rounded-md">
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					{updateSuccess ? t('emailUpdated') : t('resetEmail')}
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody>
				<form onChange={handleChange} onSubmit={handleUpdateEmail}>
					<div className="mb-4">
						<FormInput
							id="currentEmail"
							type="email"
							label={t('currentEmail')}
							required
							value={data.currentEmail}
							onChange={handleChange}
							autoComplete="email"
						/>
					</div>
					<div className={incorrectPassword ? 'mb-0' : 'mb-4'}>
						<FormInput
							id="currentPassword"
							type="password"
							label="Verify password"
							required
							value={data.currentPassword}
							onChange={handleChange}
							autoComplete="current-password"
						/>
					</div>
					{incorrectPassword && (
						<span className="text-red-500 text-sm font-light">
							Incorrect password
						</span>
					)}
					<div className="mb-0.5">
						<FormInput
							id="newEmail"
							type="email"
							label={t('newEmail')}
							required
							value={data.newEmail}
							onChange={handleChange}
							autoComplete="email"
						/>
					</div>
					{data.newEmail.length > 0 && data.newEmail.length < 8 && (
						<span className="text-red-500 text-sm font-light">
							{t('incorrectEmail')}.
						</span>
					)}

					<div className="mt-6">
						<Button
							disabled={
								!data.newEmail ||
								(data.newEmail.length > 0 && data.newEmail.length < 8)
							}
							type="submit"
							variant="filled"
							fullWidth>
							{t('resetEmail')}
						</Button>
					</div>
				</form>
			</DialogBody>
		</Dialog>
	)
}

export default UpdateEmailModal
