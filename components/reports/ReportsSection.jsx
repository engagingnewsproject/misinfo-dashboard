/**
 * @fileoverview ReportsSection Component
 * 
 * A comprehensive reports management component that provides CRUD operations,
 * filtering, pagination, CSV import/export, and real-time data synchronization
 * for misinformation reports. This component handles both agency-specific and
 * admin views with role-based access control.
 * 
 * Key Features:
 * - Real-time data fetching from Firestore
 * - Advanced filtering (date range, read status, search)
 * - Pagination with configurable page sizes
 * - CSV import/export functionality
 * - Report modal management
 * - Role-based access control (admin vs agency)
 * - Bulk read status updates
 * 
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Papa from 'papaparse'
import firebaseHelper from '../../firebase/FirebaseHelper'
import {
	collection,
	getDoc,
	getDocs,
	doc,
	query,
	where,
	updateDoc,
	deleteDoc,
	addDoc,
	Timestamp,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
// Icons
import {
	IoMdRefresh,
	IoIosInformationCircle,
	IoMdCheckmark,
} from 'react-icons/io'
import { IoAdd, IoTrash } from 'react-icons/io5'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { HiDocumentAdd } from 'react-icons/hi'
import { FaFileExport } from 'react-icons/fa'
import { FaFileImport } from 'react-icons/fa'
import ReportModal from '../modals/reports/ReportModal'
import ConfirmModal from '../modals/common/ConfirmModal'
import globalStyles from '../../styles/globalStyles'
import TableHead from '../table/TableHead'
import TableBody from '../table/TableBody'
import { TableDropdownMenu } from '../table/TableDropdownMenu'
import TableFilterControls from '../table/TableFilterControls'
import {
	Button,
	Card,
	CardHeader,
	CardFooter,
	IconButton,
	Tooltip,
	Typography,
	Input,
	CardBody,
} from '@material-tailwind/react'

/**
 * Table column configuration for the reports table
 * @type {Array<{label: string, accessor: string, sortable: boolean}>}
 */
const columns = [
	{ label: 'Title', accessor: 'title', sortable: true },
	{ label: 'Date/Time', accessor: 'createdDate', sortable: true },
	// { label: 'Candidates', accessor: 'candidates', sortable: false },
	{ label: 'Topic Tags', accessor: 'topic', sortable: true },
	{ label: 'Sources', accessor: 'hearFrom', sortable: false },
	{ label: 'Labels', accessor: 'label', sortable: false },
	{ label: 'Read/Unread', accessor: 'read', sortable: true },
]

/**
 * Read filter options for filtering reports by read status
 * @type {Array<{label: string, value: string}>}
 */
const readValues = [
	{ label: 'All', value: 'all' },
	{ label: 'Read', value: 'true' },
	{ label: 'Unread', value: 'false' },
]

/**
 * ReportsSection Component
 * 
 * Main component for managing and displaying misinformation reports with
 * comprehensive filtering, pagination, and CRUD operations. Supports both
 * admin and agency user roles with different data access patterns.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.newReportSubmitted - Flag indicating if a new report was submitted
 * @param {Function} props.handleNewReportClick - Callback for new report button click
 * @returns {JSX.Element} The rendered reports section component
 * 
 * @example
 * <ReportsSection 
 *   newReportSubmitted={false}
 *   handleNewReportClick={() => setShowNewReportModal(true)}
 * />
 */
const ReportsSection = ({
	// search,
	newReportSubmitted,
	handleNewReportClick,
}) => {
	// Get user ID from localStorage for data fetching
	const userId = localStorage.getItem('userId')
	
	// Core data state
	const [reports, setReports] = useState([]) // All reports from database
	const ITEMS_PER_PAGE = 10 // Number of items per page for pagination
	const [endIndex, setEndIndex] = useState(10)
	const [isDataFetched, setIsDataFetched] = useState(false)
	
	// Filtering state
	const [reportWeek, setReportWeek] = useState('4') // Week filter (4 weeks by default)
	const [readFilter, setReadFilter] = useState('all') // Read status filter
	const [reportTitle, setReportTitle] = useState('') // Report title filter
	const [agencyName, setAgencyName] = useState('') // Agency name for display
	const [isAgency, setIsAgency] = useState(null) // User role flag
	const { user, customClaims } = useAuth() // Authentication context
	const [search, setSearch] = useState('') // Search term
	
	// Pagination state
	const [rowsPerPage, setRowsPerPage] = useState(10) // Rows per page setting
	const [currentPage, setCurrentPage] = useState(1) // Current page number
	const [filteredReports, setFilteredReports] = useState([]) // Reports after filtering
	const [loadedReports, setLoadedReports] = useState([]) // Reports for current page

	// Calculate pagination values
	const totalPages = Math.ceil(filteredReports.length / rowsPerPage)
	const VISIBLE_PAGES = 5 // Number of page buttons to display

	// Report modal state management
	const [report, setReport] = useState('') // Selected report data
	const [reportId, setReportId] = useState('') // Selected report ID
	const [reportModalShow, setReportModalShow] = useState(false) // Modal visibility
	const [reportModalId, setReportModalId] = useState('') // Modal report ID
	const [note, setNote] = useState('') // Report note
	const [title, setTitle] = useState('') // Report title
	const [detail, setDetail] = useState() // Report detail
	const [reportSubmitBy, setReportSubmitBy] = useState('') // Report submitter
	const [reportRead, setReportRead] = useState(false) // Report read status
	const [reportsRead, setReportsRead] = useState({}) // Bulk read state tracking
	const [reportsReadState, setReportsReadState] = useState({}) // Individual read states
	const [info, setInfo] = useState({}) // Additional report info
	const [selectedLabel, setSelectedLabel] = useState('') // Selected label
	const [activeLabels, setActiveLabels] = useState([]) // Available labels
	const [changeStatus, setChangeStatus] = useState('') // Status change tracking
	const [postedDate, setPostedDate] = useState('') // Formatted posted date
	const [reportLocation, setReportLocation] = useState('') // Report location
	const [update, setUpdate] = useState(false) // Update trigger
	const [deleteModal, setDeleteModal] = useState(false) // Delete modal visibility

	// UI state management
	const [reportsUpdated, setReportsUpdated] = useState(false) // Update indicator
	const [refresh, setRefresh] = useState(false) // Refresh loading state
	const [showCheckmark, setShowCheckmark] = useState(false) // Success indicator
	const [open, setOpen] = useState(true) // Section open/close state

	/**
	 * Fetches reports data from Firestore based on user role and permissions
	 * Handles both agency-specific and admin data fetching patterns
	 * 
	 * @async
	 * @function getData
	 * @returns {Promise<void>}
	 */
	const getData = async () => {
		let reportArr = []
		let agencyName = ''
		let agencyId = ''
		let agencyTags = []
		
		if (isAgency) {
			// Agency user: fetch reports for their specific agency
			const agencyQuery = query(
				collection(db, 'agency'),
				where('agencyUsers', 'array-contains', user.email),
			)
			const agencySnapshot = await getDocs(agencyQuery)
			agencySnapshot.forEach((doc) => {
				agencyName = doc.data().name
				agencyId = doc.id
			})
			
			// Fetch reports for the agency
			const reportsQuery = query(
				collection(db, 'reports'),
				where('agency', '==', agencyName),
			)
			const reportSnapshot = await getDocs(reportsQuery)
			reportSnapshot.forEach((doc) => {
				const data = doc.data()
				data.reportID = doc.id
				reportArr.push(data)
			})
			
			// Fetch agency-specific tags
			const tagsDocRef = doc(db, 'tags', agencyId)
			const tagsDoc = await getDoc(tagsDocRef)
			if (tagsDoc.exists()) {
				agencyTags = tagsDoc.data()
			}
			setActiveLabels(agencyTags.Labels.active)
		} else {
			// Admin user: fetch all reports
			const reportSnapshot = await getDocs(collection(db, 'reports'))
			reportSnapshot.forEach((doc) => {
				const data = doc.data()
				data.reportID = doc.id
				reportArr.push(data)
			})
		}
		
		// Update state with fetched data
		setReports(reportArr)
		setIsDataFetched(true)
		setLoadedReports(reportArr.slice(0, endIndex))
		setEndIndex(endIndex)
		
		// Initialize read states for all reports
		setReportsReadState(
			reportArr.reduce((acc, report) => {
				acc[report.reportID] = report.read
				return acc
			}, {}),
		)
	}

	/**
	 * Handles manual refresh of reports data with visual feedback
	 * Shows checkmark icon for 2 seconds after successful refresh
	 * 
	 * @async
	 * @function handleRefresh
	 * @returns {Promise<void>}
	 */
	const handleRefresh = async () => {
		setRefresh(true)
		await getData()
		setReportsUpdated(true)
		setShowCheckmark(true)
		
		// Hide checkmark after 2 seconds
		setTimeout(() => {
			setRefresh(false)
			setShowCheckmark(false)
			setReportsUpdated(false)
		}, 2000)
	}

	/**
	 * Filters reports by date range based on selected week
	 * Week '100' shows all reports, other values filter by weeks ago
	 * 
	 * @function handleDateChanged
	 * @param {string} selectedWeek - Week filter value ('100' for all, or number of weeks ago)
	 */
	const handleDateChanged = (selectedWeek) => {
		setReportWeek(selectedWeek)
		let filteredArr

		if (selectedWeek === '100') {
			filteredArr = [...reports] // No filter, show all
		} else {
			const filterDate = new Date()
			filterDate.setDate(filterDate.getDate() - selectedWeek * 7)

			filteredArr = reports.filter((report) => {
				const reportDate = report.createdDate.toDate()
				return reportDate >= filterDate
			})
		}

		setFilteredReports(filteredArr)
		setCurrentPage(1) // Reset to the first page after filtering
	}

	/**
	 * Filters reports by read status (read/unread/all)
	 * 
	 * @function handleReadFilterChanged
	 * @param {string} value - Filter value ('all', 'true', 'false')
	 */
	const handleReadFilterChanged = (value) => {
		setReadFilter(value) // Update the readFilter state first
		if (value !== 'all') {
			const filterValue = value === 'true'
			setLoadedReports(
				reports.filter((report) => {
					return report.read === filterValue
				}),
			)
		} else {
			setLoadedReports(reports)
		}
	}

	/**
	 * Opens default email client with pre-filled report information
	 * 
	 * @function handleUserSendEmail
	 * @param {string} reportURI - URI/link to the report
	 */
	const handleUserSendEmail = (reportURI) => {
		const subject = 'Misinfo Report'
		const body = `Link to report:\n${reportURI}`
		const uri = `mailto:?subject=${encodeURIComponent(
			subject,
		)}&body=${encodeURIComponent(body)}`
		window.open(uri)
	}

	/**
	 * Opens the report modal and fetches detailed report data
	 * Sets report as read for agency users, fetches submitter information
	 * 
	 * @async
	 * @function handleReportModalShow
	 * @param {string} reportId - ID of the report to display
	 */
	const handleReportModalShow = async (reportId) => {
		// Fetch report document from Firestore
		const docRef = await getDoc(doc(db, 'reports', reportId))
		const reportData = docRef.data()
		setReport({ id: reportId, ...reportData })
		setNote(docRef.data().note)
		setReportTitle(docRef.data().title)
		setDetail(docRef.data().detail)
		setSelectedLabel(docRef.data().selectedLabel)
		setInfo(docRef.data())
		setReportModalId(reportId)
		
		// Only set report as read if an agency user clicks
		// Admin users should not be changing the read status
		if (customClaims.agency || customClaims.admin) {
			await handleChangeReadModal(reportId, true)
		}

		// Fetch submitter information from mobileUsers collection
		const mUserRef = doc(db, 'mobileUsers', docRef.data().userID)
		const docSnap = await getDoc(mUserRef)

		if (docSnap.exists()) {
			setReportSubmitBy(docSnap.data())
		}
		setReportModalShow(true)
	}

	/**
	 * Updates report read status with optimistic UI updates and error handling
	 * Provides immediate visual feedback while updating Firestore in background
	 * 
	 * @async
	 * @function handleRowChangeRead
	 * @param {string} reportId - ID of the report to update
	 * @param {boolean} checked - New read status (true = read, false = unread)
	 */
	const handleRowChangeRead = async (reportId, checked) => {
		// Optimistic UI update for immediate feedback
		setReports((prevReports) =>
			prevReports.map((report) =>
				report.reportID === reportId ? { ...report, read: checked } : report,
			),
		)

		setFilteredReports((prevFilteredReports) =>
			prevFilteredReports.map((report) =>
				report.reportID === reportId ? { ...report, read: checked } : report,
			),
		)

		setReportsReadState((prevState) => ({
			...prevState,
			[reportId]: checked,
		}))

		// Firestore update with error handling
		try {
			const docRef = doc(db, 'reports', reportId)
			await updateDoc(docRef, { read: checked })
		} catch (error) {
			console.error('Error updating read status:', error)
			// Revert the optimistic update in case of error
			setReports((prevReports) =>
				prevReports.map((report) =>
					report.reportID === reportId ? { ...report, read: !checked } : report,
				),
			)

			setFilteredReports((prevFilteredReports) =>
				prevFilteredReports.map((report) =>
					report.reportID === reportId ? { ...report, read: !checked } : report,
				),
			)

			setReportsReadState((prevState) => ({
				...prevState,
				[reportId]: !checked,
			}))
		}
	}

	/**
	 * Updates report read status from within the modal
	 * Triggers data refresh after update
	 * 
	 * @async
	 * @function handleChangeReadModal
	 * @param {string} reportId - ID of the report to update
	 * @param {boolean} checked - New read status
	 */
	const handleChangeReadModal = async (reportId, checked) => {
		const docRef = doc(db, 'reports', reportId)
		await updateDoc(docRef, { read: checked })
		setUpdate(!update) // Trigger data refresh
	}

	/**
	 * Handles form submission in the report modal
	 * 
	 * @async
	 * @function handleFormSubmit
	 * @param {Event} e - Form submission event
	 */
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		setReportModalShow(false)
	}
	
	/**
	 * Updates report note in Firestore when changed in modal
	 * Only updates if the note value has actually changed
	 * 
	 * @async
	 * @function handleNoteChange
	 * @param {Event} e - Input change event
	 */
	const handleNoteChange = async (e) => {
		e.preventDefault()
		let reportId = reportModalId
		if (e.target.value !== report['note']) {
			const docRef = doc(db, 'reports', reportId)
			await updateDoc(docRef, { note: e.target.value })
			setUpdate(e.target.value)
		} else {
			setUpdate('')
		}
	}
	/**
	 * Updates report label in Firestore when changed in modal
	 * Only updates if the label value has actually changed
	 * 
	 * @async
	 * @function handleLabelChange
	 * @param {Event} e - Input change event
	 */
	const handleLabelChange = async (e) => {
		e.preventDefault()
		const newLabel = e.target.value
		const reportId = reportModalId

		// Check if the label has actually changed
		if (newLabel !== report['label']) {
			try {
				const docRef = doc(db, 'reports', reportId)
				// Update the label in the Firestore document
				await updateDoc(docRef, { label: newLabel })
				setSelectedLabel(newLabel) // Update the selectedLabel state
				setUpdate(newLabel) // Trigger any necessary updates
			} catch (error) {
				console.error('Error updating label:', error)
			}
		} else {
			setUpdate('') // Reset the update state if the label didn't change
		}
	}
	/**
	 * Initiates report deletion process
	 * Shows confirmation modal before actual deletion
	 * 
	 * @async
	 * @function handleReportDelete
	 * @param {Event|string} e - Event object or report ID
	 */
	const handleReportDelete = async (e) => {
		reportModalShow ? e.preventDefault() : setReportModalId(e)
		setDeleteModal(true)
	}
	
	/**
	 * Performs actual report deletion from Firestore
	 * Refreshes data and closes modals after successful deletion
	 * 
	 * @async
	 * @function handleDelete
	 * @param {Event} e - Event object
	 */
	const handleDelete = async (e) => {
		const docRef = doc(db, 'reports', reportModalId)
		deleteDoc(docRef)
			.then(() => {
				getData() // Refresh data after deletion
				setReportModalShow(false)
				setDeleteModal(false)
			})
			.catch((error) => {
				console.log('The write failed' + error)
			})
	}

	/**
	 * Sorts reports by specified field and order
	 * Handles null/undefined values and numeric sorting
	 * 
	 * @function handleSorting
	 * @param {string} sortField - Field name to sort by
	 * @param {string} sortOrder - Sort order ('asc' or 'desc')
	 */
	const handleSorting = (sortField, sortOrder) => {
		const sortedReports = [...filteredReports].sort((a, b) => {
			const aValue = a[sortField]
			const bValue = b[sortField]

			// Handle null/undefined values
			if (aValue === null || aValue === undefined) return 1
			if (bValue === null || bValue === undefined) return -1
			if (aValue === null && bValue === null) return 0

			return (
				aValue.toString().localeCompare(bValue.toString(), 'en', {
					numeric: true,
				}) * (sortOrder === 'asc' ? 1 : -1)
			)
		})

		setLoadedReports(sortedReports)
	}

	/**
	 * Dynamically extracts all unique keys from JSON objects for CSV headers
	 * Handles nested objects and special cases like createdDate
	 * 
	 * @function extractHeaders
	 * @param {Array<Object>} jsonArray - Array of report objects
	 * @returns {Array<string>} Array of header names
	 */
	const extractHeaders = (jsonArray) => {
		const headersSet = new Set()

		jsonArray.forEach((report) => {
			Object.keys(report).forEach((key) => {
				// Handle nested objects like 'createdDate'
				if (typeof report[key] === 'object' && !Array.isArray(report[key])) {
					if (key !== 'createdDate') {
						Object.keys(report[key]).forEach((nestedKey) => {
							headersSet.add(`${key}.${nestedKey}`)
						})
					}
				} else {
					headersSet.add(key)
				}
			})
		})

		// Replace createdDate.seconds with a combined createdDate field
		headersSet.add('createdDate')
		headersSet.delete('createdDate.seconds')
		headersSet.delete('createdDate.nanoseconds')

		return Array.from(headersSet) // Convert Set to Array
	}

	/**
	 * Converts user ID to email address by querying mobileUsers collection
	 * 
	 * @async
	 * @function userIDToEmail
	 * @param {string} userID - User ID to convert
	 * @returns {Promise<string>} Email address or empty string if not found
	 */
	const userIDToEmail = async (userID) => {
		const docRef = doc(db, 'mobileUsers', userID)
		const docSnap = await getDoc(docRef)
		if (docSnap.exists()) {
			return docSnap.data().email
		} else {
			console.log('No such document!')
			return ''
		}
	}

	/**
	 * Converts JSON array of reports to CSV format
	 * Handles date formatting, user email lookup, and CSV escaping
	 * 
	 * @async
	 * @function convertToCSV
	 * @param {Array<Object>} jsonArray - Array of report objects
	 * @returns {Promise<string>} CSV string
	 */
	const convertToCSV = async (jsonArray) => {
		const headers = extractHeaders(jsonArray)

		// Ensure 'images' is the last header. Multiple images mess up the CSV format
		const filteredHeaders = headers.filter((header) => header !== 'images')
		// Add 'userEmail' column after 'userID'
		const extendedHeaders = filteredHeaders.flatMap((header) =>
			header === 'userID' ? ['userID', 'userEmail'] : [header],
		)
		const finalHeaders = [...extendedHeaders, 'images']

		const csvRows = []

		// Add headers row
		csvRows.push(finalHeaders.join(','))

		// Function to convert `createdDate` to ISO 8601 format
		const formatDateToISO = (createdDate) => {
			if (createdDate && createdDate.seconds) {
				const date = new Date(
					createdDate.seconds * 1000 +
						Math.floor(createdDate.nanoseconds / 1e6),
				)
				return date.toISOString()
			}
			return ''
		}

		// Loop through each report and convert to CSV row
		for (const report of jsonArray) {
			const row = await Promise.all(
				finalHeaders.map(async (header) => {
					let value

					// Special case for the `createdDate`
					if (header === 'createdDate') {
						value = formatDateToISO(report.createdDate)
					} else if (header === 'userEmail' && report.userID) {
						// Fetch the email for the corresponding userID
						value = await userIDToEmail(report.userID)
					} else {
						const keys = header.split('.')
						value = report
						keys.forEach((key) => {
							value = value[key] !== undefined ? value[key] : '' // Safely access nested values
						})

						// Handle commas and newlines in CSV fields
						if (typeof value === 'string') {
							value = value.replace(/"/g, '""') // Escape double quotes
							if (value.includes(',') || value.includes('\n')) {
								value = `"${value}"` // Wrap in double quotes if necessary
							}
						}
					}

					return value
				}),
			)
			csvRows.push(row.join(','))
		}

		return csvRows.join('\n')
	}

	/**
	 * Triggers download of CSV file containing all reports
	 * Creates blob and downloads file as 'reports.csv'
	 * 
	 * @async
	 * @function downloadCSV
	 */
	const downloadCSV = async () => {
		const csvData = await convertToCSV(reports)
		const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)

		// Create a link and trigger the download
		const link = document.createElement('a')
		link.href = url
		link.setAttribute('download', 'reports.csv')
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	/**
	 * Handles CSV file import and bulk report creation
	 * Parses CSV using Papa Parse and creates reports in Firestore
	 * 
	 * @function handleCSVImport
	 * @param {File} file - CSV file to import
	 */
	const handleCSVImport = (file) => {
		if (!user) {
			alert('User not logged in')
			return
		}

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: async (results) => {
				const data = results.data

				for (const row of data) {
					let agencyName = ''
					if (row.state && row.agency) {
						const agencyQuery = query(
							collection(db, 'agency'),
							where('state', '==', row.state),
						)
						const agencySnapshot = await getDocs(agencyQuery)

						// Find agency with a name containing the CSV agency name (case-insensitive)
						agencySnapshot.forEach((doc) => {
							const fullAgencyName = doc.data().name.toLowerCase()
							const csvAgencyName = row.agency.toLowerCase()

							if (fullAgencyName.includes(csvAgencyName)) {
								agencyName = doc.data().name // Use the full agency name from Firestore
							}
						})

						if (!agencyName) {
							console.warn(
								`No matching agency found for state: ${row.state} and partial name: ${row.agency}`,
							)
						}
					}

					// Format row with correct types, and assign matched agency name
					const formattedRow = {
						agency: agencyName, // Full agency name if found, otherwise empty string
						city: String(row.city || ''),
						createdDate: row.createdDate
							? Timestamp.fromDate(new Date(row.createdDate))
							: Timestamp.now(),
						detail: String(row.detail || ''),
						hearFrom: String(row.hearFrom || ''),
						images: Array.isArray(row.images)
							? row.images
							: row.images
								? row.images.split(',')
								: [],
						isApproved: row.isApproved === 'true' || row.isApproved === true,
						label: String(row.label || ''),
						link: String(row.link || ''),
						read: row.read === 'true' || row.read === true,
						secondLink: String(row.secondLink || ''),
						state: String(row.state || ''),
						title: String(row.title || ''),
						topic: String(row.topic || ''),
						userID: user.uid, // Set userID to current user’s UID
					}

					try {
						await addDoc(collection(db, 'reports'), formattedRow)
						// console.log(`Report added: ${formattedRow.title}`)
					} catch (error) {
						console.error('Error adding report:', error)
					}
				}
				alert('CSV file successfully imported into Firestore')
			},
			error: (error) => console.error('Error parsing CSV:', error),
		})
	}

	// Data fetching effect - triggers when update state changes
	useEffect(() => {
		getData()
	}, [update])

	// Agency data fetching effect - fetches agency name for agency users
	useEffect(() => {
		if (isAgency && user.email) {
			firebaseHelper.fetchAgencyByUserEmail(user.email, (response) => {
				if (response.isSuccess) {
					const agencyData = response.response.data()
					setAgencyName(agencyData.name)
				} else {
					console.error(response.message) // Handle the error or no agency found
				}
			})
		}
	}, [isAgency, user.email])

	// User role determination effect - sets isAgency based on custom claims
	useEffect(() => {
		if (customClaims.admin) {
			setIsAgency(false)
		} else if (customClaims.agency) {
			setIsAgency(true)
		}
	}, [customClaims])

	// Report modal state management effect - handles modal data setup and read status
	useEffect(() => {
		// Only proceed if reportModalShow is true
		if (reportModalShow && reportModalId && customClaims.agency) {
			// When a report's modal opens set the report as read
			handleRowChangeRead(reportModalId, true)
		}
		// Set the date, label, and location for the report when the modal is shown
		if (reportModalShow && report) {
			if (report.createdDate) {
				const options = {
					day: '2-digit',
					year: 'numeric',
					month: 'short',
					hour: 'numeric',
					minute: 'numeric',
				}
				setPostedDate(
					report['createdDate']
						.toDate()
						.toLocaleString('en-US', options)
						.replace(/,/g, '')
						.replace('at', ''),
				)
			}
			setSelectedLabel(report['label'] || '')

			const location = [report['city'], report['state']]
				.filter(Boolean)
				.join(', ')
			setReportLocation(location)
		}
	}, [reportModalShow, reportModalId, customClaims.agency, report]) // this effect runs when the report modal is opened/closed

	// Fetch data when new report is submitted or isAgency is set
	useEffect(() => {
		// Ensure isAgency is set before fetching data:
		if (isAgency !== null) {
			getData()
		}
	}, [newReportSubmitted, isAgency])

	// New Filtering Hooks
	// Search
	useEffect(() => {
		if (search === '') {
			setLoadedReports(filteredReports.slice(0, ITEMS_PER_PAGE)) // No search term, use filteredReports
		} else {
			const searchFilteredReports = filteredReports.filter((report) => {
				// Define searchable fields within each report
				const searchableText = [
					report.title,
					report.detail,
					report.city,
					report.state,
					report.label,
					report.topic,
				]
					.filter(Boolean) // Remove undefined or null values
					.join(' ') // Concatenate to create one searchable string
					.toLowerCase()
				return searchableText.includes(search.toLowerCase())
			})

			setLoadedReports(searchFilteredReports.slice(0, ITEMS_PER_PAGE))
		}
		setCurrentPage(1) // Reset pagination on new search
	}, [search, filteredReports])

	// Date Filtering
	useEffect(() => {
		if (isDataFetched && reportWeek) {
			let filteredArr

			if (reportWeek === '100') {
				filteredArr = [...reports] // Show all
			} else {
				const filterDate = new Date()
				filterDate.setDate(filterDate.getDate() - reportWeek * 7)

				filteredArr = reports.filter((report) => {
					const reportDate = report.createdDate.toDate()
					return reportDate >= filterDate
				})
			}

			setFilteredReports(filteredArr) // Only update `filteredReports`
			// setLoadedReports(filteredArr.slice(0, ITEMS_PER_PAGE)) // Paginate based on filtered reports
			setCurrentPage(1) // Reset to first page on filter change
		}
	}, [reportWeek, reports, isDataFetched])

	// Read Filter - applies to already date-filtered reports
	useEffect(() => {
		const readFiltered = filteredReports.filter((report) => {
			if (readFilter === 'all') return true // Show all if no read filter
			return report.read === (readFilter === 'true') // Filter by read status
		})

		setLoadedReports(readFiltered.slice(0, ITEMS_PER_PAGE)) // Paginate the filtered data
		setCurrentPage(1) // Reset to the first page
	}, [readFilter, filteredReports])

	// Pagination on filteredReports
	useEffect(() => {
		const paginated = filteredReports.slice(
			(currentPage - 1) * ITEMS_PER_PAGE,
			currentPage * ITEMS_PER_PAGE,
		)
		setLoadedReports(paginated)
	}, [filteredReports, currentPage])

	// Search Filter - applies on top of both date and read filters
	useEffect(() => {
		if (search === '') {
			setLoadedReports(filteredReports.slice(0, ITEMS_PER_PAGE)) // Reset to paginated filtered reports
		} else {
			const searchFiltered = filteredReports.filter((report) => {
				// Implement your existing search logic here
				// Example for filtering based on a search term
				return report.title.toLowerCase().includes(search.toLowerCase())
			})

			setLoadedReports(searchFiltered.slice(0, ITEMS_PER_PAGE)) // Paginate the search results
		}
		setCurrentPage(1) // Reset to the first page on new search
	}, [search, filteredReports])

	// Read Filter
	useEffect(() => {
		if (readFilter === 'all') {
			setFilteredReports(reports)
		} else {
			const readFiltered = reports.filter(
				(report) => report.read === (readFilter === 'true'),
			)
			setFilteredReports(readFiltered)
		}
		setCurrentPage(1) // Reset to first page on filter change
	}, [readFilter, reports])

	// Reset loadedReports on refresh
	useEffect(() => {
		if (refresh) {
			setFilteredReports(reports)
			setSearch('')
			setCurrentPage(1) // Reset pagination on refresh
		}
	}, [refresh, reports])

	// Pagination logic, triggered only when currentPage, rowsPerPage, or filteredReports change
	useEffect(() => {
		const paginatedReports = filteredReports.slice(
			(currentPage - 1) * rowsPerPage,
			currentPage * rowsPerPage,
		)
		setLoadedReports(paginatedReports)
	}, [filteredReports, currentPage, rowsPerPage])

	/**
	 * Navigates to the previous page in pagination
	 * Ensures page number doesn't go below 1
	 * 
	 * @function goToPreviousPage
	 */
	const goToPreviousPage = () => {
		setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))
	}

	/**
	 * Navigates to the next page in pagination
	 * Ensures page number doesn't exceed total pages
	 * 
	 * @function goToNextPage
	 */
	const goToNextPage = () => {
		setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages))
	}

	/**
	 * Navigates to a specific page number
	 * 
	 * @function goToPage
	 * @param {number} pageNumber - Target page number
	 */
	const goToPage = (pageNumber) => {
		setCurrentPage(pageNumber)
	}

	/**
	 * Calculates which page numbers should be visible in pagination controls
	 * Centers the current page with VISIBLE_PAGES number of buttons
	 * 
	 * @function getVisiblePageNumbers
	 * @returns {Array<number>} Array of page numbers to display
	 */
	const getVisiblePageNumbers = () => {
		const pages = []
		const startPage = Math.max(1, currentPage - Math.floor(VISIBLE_PAGES / 2))
		const endPage = Math.min(totalPages, startPage + VISIBLE_PAGES - 1)

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i)
		}

		return pages
	}

	return (
		<>
			<Card className="w-full mt-4">
				<CardHeader floated={false} shadow={false} className="rounded-none">
					<div className="mb-8 flex items-center justify-between gap-8">
						<Typography variant="h5" color="blue" className="basis-1/3">
							List of Reports
						</Typography>
						<Typography
							className="flex-initial basis-1/3 text-center"
							variant="small">
							{loadedReports.length}{' '}
							{loadedReports.length == 1 ? 'report' : 'reports'}
						</Typography>
						<div className="flex flex-row gap-1 justify-end basis-1/3">
							{!isAgency && (
								<>
									{/* Export Button */}
									<Tooltip content="Export Reports" placement="bottom-start">
										<Button
											size="sm"
											variant="outlined"
											onClick={downloadCSV}
											className="flex items-center gap-2"
											ripple={true}>
											<FaFileExport />
											Export
										</Button>
									</Tooltip>

									{/* Import Button */}
									<Tooltip
										content="Import Reports CSV"
										placement="bottom-start">
										<Button
											size="sm"
											variant="outlined"
											ripple={true}
											onClick={() =>
												document.getElementById('csvImportInput').click()
											}
											className="flex items-center gap-2">
											<FaFileImport />
											Import
										</Button>
									</Tooltip>

									{/* Hidden file input for CSV upload */}
									<input
										id="csvImportInput"
										type="file"
										accept=".csv"
										style={{ display: 'none' }}
										onChange={(e) => {
											const file = e.target.files[0]
											if (file) handleCSVImport(file)
										}}
									/>
								</>
							)}
							<Tooltip content="New Report" placement="bottom-start">
								<Button
									ripple={true}
									size="sm"
									onClick={(e) => handleNewReportClick(e)}
									className="flex items-center gap-2">
									<IoAdd />
									New Report
								</Button>
							</Tooltip>
						</div>
					</div>
					<div className="flex items-center justify-between gap-8">
						<TableFilterControls
							readFilter={readFilter}
							onReadFilterChange={setReadFilter}
							onRefresh={handleRefresh}
							refresh={refresh}
							showCheckmark={showCheckmark}
						/>
						<div className="w-full md:w-72 basis-1/3">
							<Input
								label="Search"
								icon={<HiMagnifyingGlass className="h-5 w-5" />}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<TableDropdownMenu
							reportWeek={reportWeek}
							onChange={(value) => setReportWeek(value)} // Update `reportWeek` based on selection
							rowsPerPage={rowsPerPage}
							setRowsPerPage={(value) => setRowsPerPage(value)} // Update rows per page
							setCurrentPage={(page) => setCurrentPage(page)} // Reset page to 1 when rows per page changes
						/>
					</div>
				</CardHeader>
				<CardBody className="overflow-scroll px-0 pt-0">
					<table className="mt-4 w-full min-w-full table-fixed text-left">
						<TableHead columns={columns} handleSorting={handleSorting} />

						<TableBody
							loadedReports={loadedReports}
							columns={columns}
							onReportModalShow={handleReportModalShow}
							onRowChangeRead={handleRowChangeRead}
							onReportDelete={handleReportDelete}
							reportsReadState={reportsReadState}
						/>
					</table>

					{reportModalShow && (
						<ReportModal
							customClaims={customClaims}
							reportModalShow={reportModalShow}
							report={report}
							reportTitle={reportTitle}
							key={reportModalId}
							note={note}
							detail={detail}
							checked={reportsReadState[reportModalId]} // Pass the checked state for the clicked report
							onReadChange={handleChangeReadModal}
							reportSubmitBy={reportSubmitBy}
							setReportModalShow={setReportModalShow}
							reportModalId={reportModalId}
							onNoteChange={handleNoteChange}
							onLabelChange={handleLabelChange}
							selectedLabel={selectedLabel}
							activeLabels={activeLabels}
							changeStatus={changeStatus}
							onFormSubmit={handleFormSubmit}
							onReportDelete={handleReportDelete}
							postedDate={postedDate}
							onUserSendEmail={handleUserSendEmail}
							reportLocation={reportLocation}
						/>
					)}
				</CardBody>
				{/* Pagination Footer */}
				<CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
					<Button
						variant="outlined"
						size="sm"
						onClick={goToPreviousPage}
						disabled={currentPage === 1}>
						Previous
					</Button>
					<div className="flex items-center gap-2">
						{currentPage > VISIBLE_PAGES / 2 + 1 && (
							<>
								<IconButton
									variant="text"
									size="sm"
									onClick={() => goToPage(1)}>
									1
								</IconButton>
								{currentPage > VISIBLE_PAGES / 2 + 2 && (
									<IconButton variant="text" size="sm" disabled>
										...
									</IconButton>
								)}
							</>
						)}
						{getVisiblePageNumbers().map((page) => (
							<IconButton
								key={page}
								variant={currentPage === page ? 'outlined' : 'text'}
								size="sm"
								onClick={() => goToPage(page)}>
								{page}
							</IconButton>
						))}
						{currentPage < totalPages - VISIBLE_PAGES / 2 && (
							<>
								{currentPage < totalPages - VISIBLE_PAGES / 2 - 1 && (
									<IconButton variant="text" size="sm" disabled>
										...
									</IconButton>
								)}
								<IconButton
									variant="text"
									size="sm"
									onClick={() => goToPage(totalPages)}>
									{totalPages}
								</IconButton>
							</>
						)}
					</div>
					<Button
						variant="outlined"
						size="sm"
						color="blue"
						onClick={goToNextPage}
						disabled={currentPage === totalPages}>
						Next
					</Button>
				</CardFooter>
			</Card>
			{deleteModal && (
				<ConfirmModal
					func={handleDelete}
					title="Are you sure you want to delete this report?"
					subtitle=""
					CTA="Delete"
					closeModal={setDeleteModal}
				/>
			)}
		</>
	)
}

export default ReportsSection
