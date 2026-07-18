import React from 'react'
import {
	Dialog,
	DialogHeader,
	DialogBody,
	Typography,
} from '@material-tailwind/react'
import ModalCloseButton from '../../ui/ModalCloseButton'

const HelpModal = ({ open, setHelpModal }) => {
	const handleClose = () => setHelpModal(false)

	return (
		<Dialog open={open} handler={handleClose} size="lg" className="rounded-md">
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h2" color="blue" className="mt-0 mb-0">
					Help and Documentation
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody className="overflow-y-auto max-h-[70vh]">
				<Typography variant="h3" color="blue" className="mt-0">
					General
				</Typography>
				<Typography variant="paragraph">
					The following includes a general overview and additional explanations
					per each main feature of the dashboard.
				</Typography>

				<Typography variant="h3" color="blue">
					Overview
				</Typography>
				<Typography variant="paragraph">
					By default, the overview feature is displayed when viewing the home
					page for the dashboard. There are three main components of the
					overview screen, which are three pie charts that show the top three
					trending topics within the given time spans:
				</Typography>

				<ul className="list-disc pl-6 my-2 space-y-1">
					<li>
						<Typography variant="paragraph" className="mb-0">
							One pie chart displays the number of reports for the top three
							trending topics within the past day
						</Typography>
					</li>
					<li>
						<Typography variant="paragraph" className="mb-0">
							One pie chart displays the number of reports for the top three
							trending topics within the past three days, showing the top three
							trending topics.
						</Typography>
					</li>
					<li>
						<Typography variant="paragraph" className="mb-0">
							One pie chart displays the number of reports for the top three
							trending topics within the past seven days.
						</Typography>
					</li>
				</ul>

				<Typography variant="h3" color="blue">
					Comparison View
				</Typography>
				<Typography variant="paragraph">
					The comparison view allows you to select topics and a date range to
					compare the number of reports for each topic.
				</Typography>

				<Typography variant="h3" color="blue">
					Tag System
				</Typography>
				<Typography variant="paragraph">
					Tags are used to associate additional information with each report. We
					have three general tag systems, which may be edited and viewed via the
					&quot;Tag System&quot; feature of our site and is accessible via the
					navigation bar.
				</Typography>

				<Typography variant="h3" color="blue">
					Reports Section
				</Typography>
				<Typography variant="paragraph">
					The reports section can be accessed via the home screen of the
					dashboard, which is displayed beneath the comparison/overview graphs.
				</Typography>

				<Typography variant="h3" color="blue">
					Adding a New Report
				</Typography>
				<Typography variant="paragraph">
					To add a new report, you may either select the &quot;Add&quot; icon in
					the navigation bar, or the &quot;Add new report&quot; icon featured
					above the reports section.
				</Typography>
			</DialogBody>
		</Dialog>
	)
}

export default HelpModal
