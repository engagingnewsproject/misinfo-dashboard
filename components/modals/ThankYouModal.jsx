import React from 'react'
import ModalCloseButton from '../ui/ModalCloseButton'
import {
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

/**
 * Mount when visible; Dialog is always open while mounted.
 * Closes contact-help flow via setContactHelpModal / setContactSent when provided.
 */
const ThankYouModal = ({ setContactHelpModal, setContactSent }) => {
	const handleClose = () => {
		setContactHelpModal?.(false)
		setContactSent?.(false)
	}

	return (
		<Dialog data-component="ThankYouModal"
			open
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
