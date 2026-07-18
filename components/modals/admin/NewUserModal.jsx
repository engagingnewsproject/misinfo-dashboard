import FormInput from '../../ui/FormInput'
import ModalCloseButton from '../../ui/ModalCloseButton'
import React from 'react'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

/**
 * Mount when visible; Dialog is always open while mounted.
 */
const NewUserModal = ({
	setNewUserModal,
	onFormSubmit,
	newUserEmail,
	onNewUserEmail,
	errors,
}) => {
	const handleClose = () => setNewUserModal(false)

	return (
		<Dialog
			open
			handler={handleClose}
			size="md"
			className="new-user-modal rounded-md">
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					Add new agency user
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody>
				<form onSubmit={onFormSubmit} id="newUserModal" className="flex flex-col gap-4">
					<FormInput
						id="userEmail"
						type="email"
						label="Agency user email"
						value={newUserEmail}
						onChange={onNewUserEmail}
						autoComplete="email"
						error={!!errors.email}
					/>
					{errors.email && (
						<p className="error text-red-500 text-sm font-light">{errors.email}</p>
					)}
					<Button type="submit" id="userNew">
						Add User
					</Button>
				</form>
			</DialogBody>
		</Dialog>
	)
}

export default NewUserModal
