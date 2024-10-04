import React from 'react'
import { Typography } from '@material-tailwind/react'
import Link from 'next/link'

const Modal = ({ showModal, closeModal, children }) => {
	if (!showModal) {
		return null // Return nothing if modal is not open
	}

	return (
		<div
			onClick={closeModal}
			className="fixed top-0 z-[9999] insert-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full">
			<div className="relative top-20 mx-auto p-5 pb-10 border w-10/12 lg:w-6/12 shadow-lg rounded-md bg-white">
				<div
					className="flex flex-col overflow-y-auto bg-white h-auto rounded-2xl mt-4 lg:mt-autopy-10 px-10"
					onClick={(e) => {
						e.stopPropagation()
					}}>
					<button
						className="absolute top-3 right-4 size-2 cursor-auto"
						onClick={closeModal}>
						X
					</button>
					<Typography variant="h2" color="blue" className='mb-2 border-b-4'>
						Privacy Policy
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						Below, we describe our privacy policy relating to products (e.g.,
						tools, apps, and dashboards) created and maintained by the Center
						for Media Engagement at The University of Texas at Austin. If you do
						not agree with this Privacy Policy, please do not access or use our
						work.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						Those using our products, whether via our website or via a
						third-party (e.g., a news website) using the tools, provide
						information such as names, usernames, email addresses, and
						passwords. They also can create or answer quiz questions and provide
						reports or assessments of potential misinformation.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						Your name, username, and email address are used to log your
						individual reports and to allow for follow-up if requested. All
						text, images, and files submitted are viewable by the agencies where
						the reports were submitted.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						The information collected is shared with the Center for Media
						Engagement and the organization implementing the product. We do not
						share information across organizations using a product. We do
						summarize information about uses across products for the purposes of
						improving the product, reporting to funders, and tracking trends. In
						some products, we also give people the option of indicating whether
						they would, or would not, like to have a newsroom contact them about
						the information they provide.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						We use the following tools to support our products, and they may
						independently collect data, such as your IP address. These tools
						include Amazon Web Services, Firebase, and Google Analytics.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						The data that we collect from you is encrypted and stored to protect
						your private information to the best of our ability in the event of
						a data breach.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						We do not sell any data provided.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						When we publish academic research articles, we do share our data
						with other academics after removing, to the best of our ability,
						personally identifying information so that other scholars can use it
						to replicate and extend our research.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						The Center for Media Engagement may disclose your personal data if
						required to do so by law.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						We will retain all data for a period of up to three years and then
						will retain data with personally identifying information for an
						indefinite time period afterward.
					</Typography>
					<Typography variant='paragraph'>
						If we become aware of a data breach, we will notify the university
						and act in accordance with the law to notify the necessary
						authorities. We will follow their guidance and work to take
						recommended actions.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						This privacy policy may be updated to comply with new legal
						requirements.
					</Typography>
					<Typography variant="paragraph" className='mb-3'>
						If you have any questions, please contact us at{' '}
						<Link className='text-blue-600' href="mailto:mediaengagement@austin.utexas.edu">
							mediaengagement@austin.utexas.edu
						</Link>
						.
					</Typography>{' '}
				</div>
			</div>
		</div>
	)
}

export default Modal
