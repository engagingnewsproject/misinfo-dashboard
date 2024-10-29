import React, { useEffect, useState } from 'react'
import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	Timestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { IoTrash } from 'react-icons/io5'
import { Tooltip } from 'react-tooltip'
import HelpRequestsModal from './modals/HelpRequestsModal'
import Link from 'next/link'

// Styles
const style = {
	section_container:
		'w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto',
	section_wrapper: 'flex flex-col h-full',
	section_header: 'flex justify-between ml-10 md:mx-0 py-5',
	section_title: 'text-xl font-extrabold text-blue-600 tracking-wider',
	section_filters: '',
	section_filtersWrap: 'p-0 px-4 md:p-4 md:py-0 md:px-4 flex items-center',
	table_main: 'min-w-full bg-white rounded-xl p-1',
	table_thead: 'border-b dark:border-indigo-100 bg-slate-100',
	table_th: 'px-3 p-3 text-sm font-semibold text-left tracking-wide',
	table_tr:
		'border-b transition duration-300 ease-in-out hover:bg-indigo-50 dark:border-indigo-100 dark:hover:bg-indigo-100',
	table_td: 'whitespace-normal text-sm px-3 p-2 cursor-pointer',
	table_button: 'hover:fill-cyan-700',
	table_icon: 'ml-4 fill-gray-400 hover:fill-red-600',
	button:
		'flex items-center shadow ml-auto bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline',
}

const HelpRequests = () => {
	const [helpRequests, setHelpRequests] = useState([])
	const [showHelpRequestModal, setShowHelpRequestModal] = useState(false)
	const [selectedHelpRequest, setSelectedHelpRequest] = useState(null)
	const [loading, setLoading] = useState(true)

	const getData = async () => {
		const helpRequestsCollection = collection(db, 'helpRequests')
		const helpRequestsSnapshot = await getDocs(helpRequestsCollection)

		const helpRequestsList = helpRequestsSnapshot.docs.map((doc) => {
			const { createdDate, ...data } = doc.data()
			return {
				id: doc.id,
				...data,
				createdDate: formatDate(createdDate),
			}
		})

		setHelpRequests(helpRequestsList)
		setLoading(false)
	}

	const formatDate = (timestamp) => {
		if (timestamp instanceof Timestamp) {
			const date = timestamp.toDate()
			return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
		}
		return ''
	}

	const handleRequestModalShow = (data) => {
		// Open the modal when the button is clicked
		setSelectedHelpRequest(data)
		setShowHelpRequestModal(true)
	}

	const handleRequestModalClose = () => {
		// Close the modal when the close button is clicked
		setShowHelpRequestModal(false)
		setSelectedHelpRequest(null)
	}

	const handleDeleteRequest = async (id) => {
		try {
			console.log('Deleting help request:', id)
			const helpRequestDoc = doc(db, 'helpRequests', id)
			await deleteDoc(helpRequestDoc)
			setHelpRequests(helpRequests.filter((request) => request.id !== id))
			getData()
		} catch (error) {
			console.error('Error deleting help request:', error)
		}
	}

	// Fetch data from Firestore
	useEffect(() => {
		getData()
	}, [])

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
			`Images: ${helpRequestInfo.images.join(', ')}%0A`

		const mailtoLink = `mailto:${helpRequestInfo.email}?subject=${encodeURIComponent(helpRequestInfo.subject)}%20-%20Truth%20Sleuth%20Help%20Request&body=${formattedBody}`
		return mailtoLink
	}

	return (
		<>
			<div className={style.section_container}>
				<div className={style.section_wrapper}>
					<div className={style.section_header}>
						<div className={style.section_title}>Help Requests</div>
					</div>
					<table className={style.table_main}>
						<thead className={style.table_thead}>
							<tr>
								<th className={style.table_th}>Subject</th>
								<th className={style.table_th}>Message</th>
								<th className={style.table_th}>Email</th>
								<th className={style.table_th}>Created Date</th>
								<th className={`${style.table_th} text-center`}>
									Delete Request
								</th>
							</tr>
						</thead>
						<tbody>
							{loading && (
								<tr>
									<td colSpan="5" className={`${style.table_td} text-center`}>
										Loading...
									</td>
								</tr>
							)}

							{!loading && helpRequests.length == 0 && (
								<tr>
									<td colSpan="5" className={`${style.table_td} text-center`}>
										No help requests found
									</td>
								</tr>
							)}

							{helpRequests.length > 0 &&
								helpRequests
									.sort(
										(a, b) => new Date(b.createdDate) - new Date(a.createdDate),
									)
									.map((request) => (
										<tr
											onClick={() => {
												const { id, ...data } = request
												handleRequestModalShow(data)
											}}
											key={request.id}
											className={style.table_tr}>
											<td className={style.table_td}>{request.subject}</td>
											<td className={style.table_td}>{request.message}</td>
											<td className={style.table_td}>
												<Link
													onClick={(e) => {
														e.stopPropagation()
													}}
													className="underline"
													href={getMailtoLink(request)}
													target="_blank">
													{request.email}
												</Link>
											</td>
											<td className={style.table_td}>{request.createdDate}</td>
											<td
												className={`${style.table_td} text-center`}
												onClick={(e) => e.stopPropagation()}>
												<button
													onClick={async () => {
														await handleDeleteRequest(request.id)
													}}
													className={`${style.icon} tooltip-delete-user`}>
													<IoTrash
														size={20}
														className="fill-gray-400 hover:fill-red-600"
													/>
													<Tooltip
														anchorSelect=".tooltip-delete-user"
														place="top"
														delayShow={500}>
														Delete Request
													</Tooltip>
												</button>
											</td>
										</tr>
									))}
						</tbody>
					</table>
				</div>
			</div>

			{showHelpRequestModal && selectedHelpRequest && (
				<HelpRequestsModal
					helpRequestInfo={selectedHelpRequest}
					handleClose={handleRequestModalClose}
					mailtoLink={getMailtoLink(selectedHelpRequest)}
				/>
			)}
		</>
	)
}

export default HelpRequests
