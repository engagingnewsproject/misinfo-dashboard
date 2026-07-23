import React from 'react'
import ModalCloseButton from '../ui/ModalCloseButton'
import { useDelayedDialogOpen } from '../../hooks/useDelayedDialogOpen'
import {
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

/**
 * Mount when visible; Dialog opens one tick later to avoid Floating UI
 * aria-hidden warnings. Closes contact-help flow via setContactHelpModal /
 * setContactSent when provided.
 */
const ThankYouModal = ({ setContactHelpModal, setContactSent }) => {
	const dialogOpen = useDelayedDialogOpen()

	const handleClose = () => {
		setContactHelpModal?.(false)
		setContactSent?.(false)
	}

	return (
		<Dialog data-component="ThankYouModal"
			open={dialogOpen}
			handler={handleClose}
			size="xs"
			className="thank-you-modal rounded-md">
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					Contact Help Form
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody>
				<Typography variant="paragraph" className="mb-0">
					Thank you.
				</Typography>
			</DialogBody>
		</Dialog>
	)
}

export default ThankYouModal
