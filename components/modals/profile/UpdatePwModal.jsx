import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'next-i18next'
import { auth } from '../../../config/firebase'
import { MdOutlineRemoveRedEye } from 'react-icons/md'
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
 * Mount when visible (`{openModal && <UpdatePwModal ... />}`); Dialog is always open
 * while mounted, matching existing call sites.
 */
const UpdatePwModal = ({ setOpenModal }) => {
	const { t } = useTranslation('Profile')

	const { user, updateUserPassword } = useAuth()
	const [updateSuccess, setUpdateSuccess] = useState(false)
	const [incorrectPassword, setIncorrectPassword] = useState(false)
	const [type, setType] = useState('password')
	const [data, setData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmNewPW: '',
	})

	const handleClose = () => setOpenModal(false)

	const handleTogglePass = () => {
		setType((prev) => (prev === 'password' ? 'text' : 'password'))
	}

	const handleChange = (e) => {
		setData({ ...data, [e.target.id]: e.target.value })
	}

	const handleUpdatePW = async (e) => {
		e.preventDefault()
		try {
			await updateUserPassword(auth, data.currentPassword, data.newPassword)
			setUpdateSuccess(true)
			setIncorrectPassword(false)
		} catch (error) {
			setUpdateSuccess(false)
			setIncorrectPassword(true)
		}
	}

	return (
		<Dialog data-component="UpdatePwModal"
			open
			handler={handleClose}
			size="xs"
			className="update-pw-modal rounded-md">
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					{updateSuccess ? t('passwordUpdated') : t('resetPassword')}
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody>
				<form onChange={handleChange} onSubmit={handleUpdatePW}>
					<div className="flex flex-col mb-4">
						<FormInput
							label={t('email')}
							value={user.email}
							disabled
							id="username"
							autoComplete="username"
						/>
					</div>
					<div className={incorrectPassword ? 'mb-0' : 'mb-4'}>
						<FormInput
							id="currentPassword"
							type={type}
							name="current password"
							label={t('currentPassword')}
							required
							value={data.currentPassword}
							onChange={handleChange}
							autoComplete="current-password"
							icon={
								<button
									type="button"
									className="cursor-pointer"
									onClick={handleTogglePass}
									aria-label="Toggle password visibility">
									<MdOutlineRemoveRedEye />
								</button>
							}
						/>
					</div>
					{incorrectPassword && (
						<span className="text-red-500 text-sm font-light">
							Incorrect password
						</span>
					)}
					<div className="mb-0.5">
						<FormInput
							id="newPassword"
							type={type}
							name="new password"
							label={t('newPassword')}
							required
							value={data.newPassword}
							onChange={handleChange}
							autoComplete="new-password"
						/>
					</div>
					{data.newPassword.length > 0 && data.newPassword.length < 8 && (
						<span className="text-red-500 text-sm font-light">
							New password must be atleast 8 characters
						</span>
					)}
					<div className="mt-4 mb-0.5">
						<FormInput
							id="confirmNewPW"
							type={type}
							name="confirm password"
							label={t('confirmPassword')}
							required
							value={data.confirmNewPW}
							onChange={handleChange}
							autoComplete="new-password"
						/>
					</div>
					{data.newPassword !== data.confirmNewPW && (
						<span className="text-red-500 text-sm font-light">
							Passwords don't match
						</span>
					)}
					<div className="mt-6">
						<Button
							disabled={
								!data.newPassword ||
								data.newPassword.length < 8 ||
								data.newPassword !== data.confirmNewPW
							}
							type="submit"
							variant="filled"
							fullWidth>
							{t('resetPassword')}
						</Button>
					</div>
				</form>
			</DialogBody>
		</Dialog>
	)
}

export default UpdatePwModal
