import React from 'react'
import Link from 'next/link'
import { Card, Button, Typography } from '@material-tailwind/react'
import { useTranslation } from 'next-i18next'
import globalStyles from '../../../styles/globalStyles'
import Image from 'next/image'

const ViewReport = ({
	title,
	link,
	secondLink,
	imageURLs,
	detail,
	reportSystem,
	setReportSystem,
}) => {
	const { t } = useTranslation('NewReport') // Use the useTranslation hook

	return (
		<>
			<Card data-component="ViewReport"
				className={`${globalStyles.form.view} ${reportSystem === 7 ? '' : 'hidden'}`}>
				{/* Title */}
				<div className="mb-6 p-0">
					<Typography variant="h6" color="blue">
						{t('title_text')}
					</Typography>
					<Typography>{title}</Typography>
				</div>
				{/* Links */}
				<div className="mb-6 p-0">
					<Typography variant="h6" color="blue">
						{t('links')}
					</Typography>
					<Typography>
						{link || secondLink != '' ? (
							<>
								{link}
								<br></br>
								{secondLink}
							</>
						) : (
							t('noLinks')
						)}
					</Typography>
				</div>
				{/* Image upload */}
				<div className="mb-6 p-0">
					<Typography variant="h6" color="blue">
						{t('image')}
					</Typography>
					<div className="flex w-full overflow-y-auto">
						{imageURLs.map((image, index) => (
							<div className="flex mr-2" key={index}>
								<Link
									href={image}
									target="_blank"
									rel="noopener noreferrer">
									<Image
										src={image}
										width={100}
										height={100}
										alt="image"
										className="object-cover w-auto"
									/>
								</Link>
							</div>
						))}
					</div>
				</div>
				{/* Details */}
				<div className="mb-6 p-0">
					<Typography variant="h6" color="blue">
						{t('detailed')}
					</Typography>
					<Typography>
						{detail ? detail : `No description provided.`}
					</Typography>
				</div>
				<Button color="blue" onClick={() => setReportSystem(0)}>
					{t('backReports')}
				</Button>
			</Card>
		</>
	)
}

export default ViewReport
