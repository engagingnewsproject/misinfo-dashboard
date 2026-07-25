/**
 * @fileoverview HelpRequests Component - Admin interface for managing user help requests
 *
 * This component provides an interface for viewing, responding to, and deleting user help requests.
 * Features include:
 * - Fetching and displaying help requests from Firestore
 * - Searching and filtering help requests by email, subject, message, or user ID
 * - Viewing detailed help request information in a modal
 * - Deleting help requests with confirmation
 * - Generating mailto links for direct email responses
 * - Loading state and error handling
 * - Responsive and accessible table UI
 *
 * Integrates with:
 * - HelpRequestsModal (for viewing request details)
 * - ConfirmModal (for delete confirmation)
 * - Firebase Firestore for help request data
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useEffect, useState } from 'react'
import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	Timestamp,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { IoTrash } from 'react-icons/io5'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import HelpRequestsModal from '../modals/HelpRequestsModal'
import ConfirmModal from '../modals/common/ConfirmModal'
import Link from 'next/link'
import {
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	IconButton,
	Input,
	Tooltip,
	Typography,
} from '@material-tailwind/react'
import adminSectionStyles from '../../styles/adminSectionStyles'
import PageTitle from '../layout/PageTitle'

const style = adminSectionStyles

const tableTh =
	'sticky top-0 z-10 border-y border-blue-gray-100 bg-blue-gray-50/80 p-4'
const tableThCenter = `${tableTh} text-center`
const tableTd = 'whitespace-normal p-4'
const tableTdCenter =
	'whitespace-normal md:whitespace-nowrap p-4 text-center'

const HELP_REQUEST_COLUMNS = [
	{ label: 'Subject', center: false, width: 'w-[18%]' },
	{ label: 'Message', center: false, width: 'w-[38%]' },
	{ label: 'Email', center: false, width: 'w-[20%]' },
	{ label: 'Created Date', center: false, width: 'w-[16%]' },
	{ label: 'Delete', center: true, width: 'w-[8%]' },
]

/**
 * HelpRequests Component
 *
 * Renders a table of user help requests for admin review and management.
 * Allows viewing request details, deleting requests, and generating email responses.
 *
 * @returns {JSX.Element} The rendered help requests management interface
 */
const HelpRequests = () => {
	const [helpRequests, setHelpRequests] = useState([])
	const [showHelpRequestModal, setShowHelpRequestModal] = useState(false)
	const [selectedHelpRequest, setSelectedHelpRequest] = useState(null)
	const [loading, setLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState('')
	const [deleteModal, setDeleteModal] = useState(false)
	const [pendingDeleteId, setPendingDeleteId] = useState(null)

	/**
	 * Filters help requests based on search term.
	 * Searches across email, subject, message, and userID fields.
	 * Case-insensitive substring matching.
	 *
	 * @returns {Array} Filtered array of help requests
	 */
	const getFilteredHelpRequests = () => {
		if (!searchTerm || searchTerm.trim() === '') {
			return helpRequests
		}

		const lowerSearch = searchTerm.toLowerCase().trim()

		return helpRequests.filter((request) => {
			const email = request.email?.toLowerCase() || ''
			const subject = request.subject?.toLowerCase() || ''
			const message = request.message?.toLowerCase() || ''
			const userID = request.userID?.toLowerCase() || ''

			return (
				email.includes(lowerSearch) ||
				subject.includes(lowerSearch) ||
				message.includes(lowerSearch) ||
				userID.includes(lowerSearch)
			)
		})
	}

	const filteredHelpRequests = getFilteredHelpRequests()
	const sortedHelpRequests = [...filteredHelpRequests].sort(
		(a, b) => new Date(b.createdDate) - new Date(a.createdDate),
	)

	/**
	 * Fetches help requests from Firestore and updates the state.
	 */
	const getData = async () => {
		const helpRequestsCollection = collection(db, 'helpRequests')
		const helpRequestsSnapshot = await getDocs(helpRequestsCollection)

		const helpRequestsList = helpRequestsSnapshot.docs.map((docSnap) => {
			const { createdDate, ...data } = docSnap.data()
			return {
				id: docSnap.id,
				...data,
				createdDate: formatDate(createdDate),
			}
		})

		setHelpRequests(helpRequestsList)
		setLoading(false)
	}

	/**
	 * Formats a Firebase Timestamp object into a readable date and time string.
	 *
	 * @param {Timestamp} timestamp - The Firebase Timestamp object.
	 * @returns {string} A formatted date and time string.
	 */
	const formatDate = (timestamp) => {
		if (timestamp instanceof Timestamp) {
			const date = timestamp.toDate()
			return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
		}
		return ''
	}

	/**
	 * Opens the HelpRequestsModal to display details of a specific help request.
	 *
	 * @param {Object} data - The help request data to display.
	 */
	const handleRequestModalShow = (data) => {
		setSelectedHelpRequest(data)
		setShowHelpRequestModal(true)
	}

	/**
	 * Closes the HelpRequestsModal.
	 */
	const handleRequestModalClose = () => {
		setShowHelpRequestModal(false)
		setSelectedHelpRequest(null)
	}

	/**
	 * Opens the delete confirmation modal for a help request.
	 *
	 * @param {string} id - The ID of the help request to delete.
	 */
	const handleDeleteClick = (id) => {
		setPendingDeleteId(id)
		setDeleteModal(true)
	}

	/**
	 * Deletes the pending help request from Firestore after confirmation.
	 */
	const handleDeleteConfirm = async () => {
		if (!pendingDeleteId) return

		try {
			const helpRequestDoc = doc(db, 'helpRequests', pendingDeleteId)
			await deleteDoc(helpRequestDoc)
			setHelpRequests((prev) =>
				prev.filter((request) => request.id !== pendingDeleteId),
			)
			setDeleteModal(false)
			setPendingDeleteId(null)
		} catch (error) {
			console.error('Error deleting help request:', error)
		}
	}

	// Fetch data from Firestore
	useEffect(() => {
		getData()
	}, [])

	/**
	 * Generates a mailto link for a specific help request.
	 *
	 * @param {Object} helpRequestInfo - The help request information.
	 * @returns {string} A mailto link string.
	 */
	const getMailtoLink = (helpRequestInfo) => {
		const formattedBody =
			`Hi [NAME],%0A%0A%0A%0A%0A%0A` +
			`Best Regards,%0A` +
			`[YOUR NAME]%0A` +
			`Truth Sleuth Support Team%0A%0A` +
			`---%0A%0AForwarded Help Request:%0A%0A` +
			`User ID: ${helpRequestInfo.userID}%0A` +
			`Email: ${helpRequestInfo.email}%0A` +
			`Subject: ${helpRequestInfo.subject}%0A` +
			`Message: ${helpRequestInfo.message}%0A` +
			`Created Date: ${helpRequestInfo.createdDate}%0A` +
			`Images: ${helpRequestInfo.images ? helpRequestInfo.images.join(', ') : 'No images'}%0A`

		const mailtoLink = `mailto:${helpRequestInfo.email}?subject=${encodeURIComponent(helpRequestInfo.subject)}%20-%20Truth%20Sleuth%20Help%20Request&body=${formattedBody}`
		return mailtoLink
	}

	return (
		<>
			<div data-component="HelpRequests" className={style.section_container}>
				<Card className="h-full w-full">
					<CardHeader floated={false} shadow={false} className="mb-4">
						<div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
							<div>
								<PageTitle gutter={false}>Help Requests</PageTitle>
							</div>
							<div className="w-full md:w-72">
								<Input
									label="Search"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									icon={<HiMagnifyingGlass className="h-5 w-5" />}
								/>
							</div>
						</div>
					</CardHeader>
					<CardBody className="overflow-x-hidden px-0">
						<table className="w-full table-fixed text-left">
							<thead>
								<tr>
									{HELP_REQUEST_COLUMNS.map(({ label, center, width }) => (
										<th
											key={label}
											scope="col"
											className={`${center ? tableThCenter : tableTh} ${width}`}>
											<Typography
												variant="small"
												color="blue-gray"
												className="font-normal leading-none opacity-70">
												{label}
											</Typography>
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{loading && (
									<tr>
										<td colSpan="100%" className="text-center">
											<div className="flex h-32 items-center justify-center">
												<Typography
													variant="small"
													color="blue-gray"
													className="font-normal">
													Loading...
												</Typography>
											</div>
										</td>
									</tr>
								)}

								{!loading && sortedHelpRequests.length === 0 && (
									<tr>
										<td colSpan="100%" className="text-center">
											<div className="flex h-32 items-center justify-center">
												<Typography
													variant="small"
													color="blue-gray"
													className="font-normal">
													{searchTerm
														? `No help requests found matching "${searchTerm}"`
														: 'No help requests found'}
												</Typography>
											</div>
										</td>
									</tr>
								)}

								{!loading &&
									sortedHelpRequests.map((request, index) => {
										const isLast = index === sortedHelpRequests.length - 1
										const cellClass = isLast
											? tableTd
											: `${tableTd} border-b border-blue-gray-50`
										const cellClassCenter = isLast
											? tableTdCenter
											: `${tableTdCenter} border-b border-blue-gray-50`

										return (
											<tr
												key={request.id}
												onClick={() => {
													const { id, ...data } = request
													handleRequestModalShow(data)
												}}
												className="cursor-pointer transition duration-300 ease-in-out hover:bg-blue-gray-50/50">
												<td className={`${cellClass} min-w-0`}>
													<Typography
														variant="small"
														color="blue-gray"
														className="truncate font-normal">
														{request.subject}
													</Typography>
												</td>
												<td className={`${cellClass} min-w-0`}>
													<Typography
														variant="small"
														color="blue-gray"
														className="line-clamp-2 break-words font-normal [overflow-wrap:anywhere]">
														{request.message}
													</Typography>
												</td>
												<td className={`${cellClass} min-w-0`}>
													<Link
														onClick={(e) => {
															e.stopPropagation()
														}}
														className="block truncate underline"
														href={getMailtoLink(request)}
														target="_blank">
														<Typography
															variant="small"
															color="blue-gray"
															className="truncate font-normal">
															{request.email}
														</Typography>
													</Link>
												</td>
												<td className={`${cellClass} min-w-0`}>
													<Typography
														variant="small"
														color="blue-gray"
														className="truncate font-normal">
														{request.createdDate}
													</Typography>
												</td>
												<td
													className={cellClassCenter}
													onClick={(e) => e.stopPropagation()}>
													<Tooltip content="Delete Request">
														<IconButton
															variant="text"
															onClick={() =>
																handleDeleteClick(request.id)
															}>
															<IoTrash
																size={20}
																className="fill-gray-400 hover:fill-red-600"
															/>
														</IconButton>
													</Tooltip>
												</td>
											</tr>
										)
									})}
							</tbody>
						</table>
					</CardBody>
					<CardFooter className="flex shrink-0 flex-wrap items-center gap-2 rounded-b-md border-t border-blue-gray-50 bg-blue-gray-50/80 p-4">
						<Typography
							variant="small"
							color="blue-gray"
							className="ml-auto font-normal">
							{searchTerm
								? `Showing ${filteredHelpRequests.length} of ${helpRequests.length} help requests`
								: `Total help requests: ${helpRequests.length}`}
						</Typography>
					</CardFooter>
				</Card>
			</div>

			{showHelpRequestModal && selectedHelpRequest && (
				<HelpRequestsModal
					helpRequestInfo={selectedHelpRequest}
					handleClose={handleRequestModalClose}
					mailtoLink={getMailtoLink(selectedHelpRequest)}
				/>
			)}

			{deleteModal && (
				<ConfirmModal
					func={handleDeleteConfirm}
					title="Are you sure you want to delete this help request?"
					subtitle=""
					CTA="Delete"
					closeModal={(open) => {
						setDeleteModal(open)
						if (!open) setPendingDeleteId(null)
					}}
				/>
			)}
		</>
	)
}

export default HelpRequests
