import {
	Button,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'
import Image from 'next/image'
import Link from 'next/link'
import React, { Fragment } from 'react'
import ModalCloseButton from '../ui/ModalCloseButton'

const formatLabel = (label) => label.replace(/([a-z])([A-Z])/g, '$1 $2')

/**
 * Mount when visible; Dialog is always open while mounted.
 */
const HelpRequestsModal = ({ helpRequestInfo, handleClose, mailtoLink }) => {
	return (
		<Dialog
			open
			handler={handleClose}
			size="lg"
			className="help-requests-modal rounded-md">
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
									<div className="grid grid-cols-1 gap-y-4">
										{(Array.isArray(value) ? value : [value]).map(
											(image, imgIndex) => (
												<Link
													key={imgIndex}
													href={image}
													passHref={true}
													target="_blank">
													<Image
														src={`${image}`}
														width={100}
														height={100}
														className="w-auto"
														alt={`image-${imgIndex}`}
													/>
												</Link>
											),
										)}
									</div>
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
