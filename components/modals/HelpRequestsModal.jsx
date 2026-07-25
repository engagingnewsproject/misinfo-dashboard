import {
	Button,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'
import Link from 'next/link'
import React, { Fragment, useState } from 'react'
import ModalCloseButton from '../ui/ModalCloseButton'
import ImageLightboxGallery from '../ui/ImageLightboxGallery'
import { useDelayedDialogOpen } from '../../hooks/useDelayedDialogOpen'

const formatLabel = (label) => label.replace(/([a-z])([A-Z])/g, '$1 $2')

/**
 * Mount when visible; Dialog opens one tick later to avoid Floating UI
 * aria-hidden warnings when mounting with open={true} immediately.
 */
const HelpRequestsModal = ({ helpRequestInfo, handleClose, mailtoLink }) => {
	const dialogOpen = useDelayedDialogOpen()
	const [lightboxOpen, setLightboxOpen] = useState(false)

	return (
		<Dialog data-component="HelpRequestsModal"
			open={dialogOpen}
			handler={handleClose}
			size="lg"
			className="help-requests-modal rounded-md"
			dismiss={{
				escapeKey: !lightboxOpen,
				outsidePress: () => !lightboxOpen,
			}}>
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					Help Request Info
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody className="overflow-y-auto max-h-[70vh]">
				<div className="grid justify-center md:gap-5 lg:gap-5 grid-cols-2 auto-cols-auto">
					{Object.entries(helpRequestInfo).map(([key, value]) => (
						<Fragment key={key}>
							<Typography
								variant="h5"
								color="blue"
								className="mt-0 mb-4 capitalize">
								{formatLabel(key)}
							</Typography>
							<div className="mb-4">
								{key === 'images' ? (
									<ImageLightboxGallery
										images={Array.isArray(value) ? value : [value]}
										altPrefix="Help request screenshot"
										listClassName="grid grid-cols-2 gap-4 w-full sm:grid-cols-3"
										onLightboxChange={setLightboxOpen}
									/>
								) : key === 'email' ? (
									<Link href={mailtoLink} target="_blank" className="underline">
										{value}
									</Link>
								) : (
									<span>{value}</span>
								)}
							</div>
						</Fragment>
					))}
				</div>
			</DialogBody>
			<DialogFooter>
				<Link href={mailtoLink} target="_blank">
					<Button>Reply</Button>
				</Link>
			</DialogFooter>
		</Dialog>
	)
}

export default HelpRequestsModal
