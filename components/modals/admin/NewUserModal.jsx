import FormInput from '../../ui/FormInput'
import ModalCloseButton from '../../ui/ModalCloseButton'
import React, { useEffect, useState } from 'react'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

/**
 * Mount when visible; Dialog opens one tick later to avoid Floating UI
 * aria-hidden warnings when mounting with open={true} immediately.
 */
const NewUserModal = ({
	setNewUserModal,
	onFormSubmit,
	newUserEmail,
	onNewUserEmail,
	errors,
}) => {
	const handleClose = () => setNewUserModal(false)
	// Delay Dialog open one tick: MT Dialog + Floating UI 0.19 logs aria-hidden
	// "not contained inside body" when mounting with open={true} immediately.
	const [dialogOpen, setDialogOpen] = useState(false)

	useEffect(() => {
		const id = window.setTimeout(() => setDialogOpen(true), 0)
		return () => window.clearTimeout(id)
	}, [])

	return (
		<Dialog data-component="NewUserModal"
			open={dialogOpen}
			handler={handleClose}
			size="md"
			className="new-user-modal rounded-md">
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h2" color="blue" className="mt-0 mb-0">
					Invite user
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody>
				<form onSubmit={onFormSubmit} id="newUserModal" className="flex flex-col gap-4">
					<FormInput
						id="userEmail"
						type="email"
						label="Email to invite"
						value={newUserEmail}
						onChange={onNewUserEmail}
						autoComplete="email"
						error={!!errors.email}
					/>
					{errors.email && (
						<p className="error text-red-500 text-sm font-light">{errors.email}</p>
					)}
					<Button type="submit" id="userNew">
						Send invite
					</Button>
				</form>
			</DialogBody>
		</Dialog>
	)
}

export default NewUserModal
