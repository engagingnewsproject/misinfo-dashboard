import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Papa from 'papaparse'
import firebaseHelper from '../firebase/FirebaseHelper'
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
import { db } from '../config/firebase'
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
import ReportModal from './modals/ReportModal'
import ConfirmModal from './modals/ConfirmModal'
import globalStyles from '../styles/globalStyles'
import TableHead from './partials/table/TableHead'
import TableBody from './partials/table/TableBody'
import { TableDropdownMenu } from './partials/table/TableDropdownMenu'
import TableFilterControls from './partials/table/TableFilterControls'
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

// Table columns
const columns = [
	{ label: 'Title', accessor: 'title', sortable: true },
	{ label: 'Date/Time', accessor: 'createdDate', sortable: true },
	// { label: 'Candidates', accessor: 'candidates', sortable: false },
	{ label: 'Topic Tags', accessor: 'topic', sortable: true },
	{ label: 'Sources', accessor: 'hearFrom', sortable: false },
	{ label: 'Labels', accessor: 'label', sortable: false },
	{ label: 'Read/Unread', accessor: 'read', sortable: true },
]

// Report read values
const readValues = [
	{ label: 'All', value: 'all' },
	{ label: 'Read', value: 'true' },
	{ label: 'Unread', value: 'false' },
]

const ReportsSection = ({
	// search,
	newReportSubmitted,
	handleNewReportClick,
}) => {
	const userId = localStorage.getItem('userId')
	const [reports, setReports] = useState([])
	// const [loadedReports, setLoadedReports] = useState([])
	const ITEMS_PER_PAGE = 10 // Set how many items per page
	const [endIndex, setEndIndex] = useState(10)
	const [isDataFetched, setIsDataFetched] = useState(false)
	const [reportWeek, setReportWeek] = useState('4')
	const [readFilter, setReadFilter] = useState('all')
	const [reportTitle, setReportTitle] = useState('')
	const [agencyName, setAgencyName] = useState('')
	const [isAgency, setIsAgency] = useState(null)
	const { user, customClaims } = useAuth()
	const [search, setSearch] = useState('')
	const [rowsPerPage, setRowsPerPage] = useState(10) // Initialize rows per page
	const [currentPage, setCurrentPage] = useState(1)
	const [filteredReports, setFilteredReports] = useState([])
	const [loadedReports, setLoadedReports] = useState([])

	// Calculate total pages based on current filteredReports and rowsPerPage
	const totalPages = Math.ceil(filteredReports.length / rowsPerPage)
	const VISIBLE_PAGES = 5 // Number of page buttons to display

	// Report modal states
	const [report, setReport] = useState('')
	const [reportId, setReportId] = useState('')
	const [reportModalShow, setReportModalShow] = useState(false)
	const [reportModalId, setReportModalId] = useState('')
	const [note, setNote] = useState('')
	const [title, setTitle] = useState('')
	const [detail, setDetail] = useState()
	const [reportSubmitBy, setReportSubmitBy] = useState('')
	const [reportRead, setReportRead] = useState(false)
	const [reportsRead, setReportsRead] = useState({}) // Store checked state for each report
	const [reportsReadState, setReportsReadState] = useState({})
	const [info, setInfo] = useState({})
	const [selectedLabel, setSelectedLabel] = useState('')
	const [activeLabels, setActiveLabels] = useState([])
	const [changeStatus, setChangeStatus] = useState('')
	const [postedDate, setPostedDate] = useState('')
	const [reportLocation, setReportLocation] = useState('')
	// const [update,setUpdate] = useState("")
	const [update, setUpdate] = useState(false)
	const [deleteModal, setDeleteModal] = useState(false)

	// Indicates when reports have been updated once user presses the refresh button.
	const [reportsUpdated, setReportsUpdated] = useState(false)
	const [refresh, setRefresh] = useState(false)
	const [showCheckmark, setShowCheckmark] = useState(false)
	const [open, setOpen] = useState(true)

	const getData = async () => {
		let reportArr = []
		let agencyName = ''
		let agencyId = ''
		let agencyTags = []
		if (isAgency) {
			const agencyQuery = query(
				collection(db, 'agency'),
				where('agencyUsers', 'array-contains', user.email),
			)
			const agencySnapshot = await getDocs(agencyQuery)
			agencySnapshot.forEach((doc) => {
				agencyName = doc.data().name
				agencyId = doc.id
			})
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
			// TAGS
			// Query to get tags related to the agency
			const tagsDocRef = doc(db, 'tags', agencyId)
			const tagsDoc = await getDoc(tagsDocRef)
			if (tagsDoc.exists()) {
				agencyTags = tagsDoc.data()
			}
			setActiveLabels(agencyTags.Labels.active)
		} else {
			const reportSnapshot = await getDocs(collection(db, 'reports'))
			reportSnapshot.forEach((doc) => {
				const data = doc.data()
				data.reportID = doc.id
				reportArr.push(data)
			})
		}
		setReports(reportArr)
		setIsDataFetched(true) // Set flag to true after fetching
		setLoadedReports(reportArr.slice(0, endIndex))
		setEndIndex(endIndex)
		setReportsReadState(
			reportArr.reduce((acc, report) => {
				acc[report.reportID] = report.read
				return acc
			}, {}),
		)
	}

	// Handler that is run once user wants to refresh the reports section
	const handleRefresh = async () => {
		setRefresh(true)
		await getData()
		setReportsUpdated(true)
		setShowCheckmark(true)
		// setReadFilter('all')
		// Set a timer to hide the checkmark icon after 2 seconds
		setTimeout(() => {
			setRefresh(false)
			setShowCheckmark(false)
			setReportsUpdated(false)
		}, 2000)
	}

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

	const handleUserSendEmail = (reportURI) => {
		const subject = 'Misinfo Report'
		const body = `Link to report:\n${reportURI}`
		const uri = `mailto:?subject=${encodeURIComponent(
			subject,
		)}&body=${encodeURIComponent(body)}`
		window.open(uri)
	}

	const handleReportModalShow = async (reportId) => {
		// get doc
		const docRef = await getDoc(doc(db, 'reports', reportId))
		const reportData = docRef.data()
		setReport({ id: reportId, ...reportData })
		setNote(docRef.data().note)
		setReportTitle(docRef.data().title)
		setDetail(docRef.data().detail)
		setSelectedLabel(docRef.data().selectedLabel)
		setInfo(docRef.data())
		setReportModalId(reportId)
		// only set report as read if an agency user clicks
		// admin users should not be changing the read status
		if (customClaims.agency || customClaims.admin) {
			await handleChangeReadModal(reportId, true)
		}

		const mUserRef = doc(db, 'mobileUsers', docRef.data().userID)
		const docSnap = await getDoc(mUserRef)

		if (docSnap.exists()) {
			setReportSubmitBy(docSnap.data())
		}
		setReportModalShow(true)
	} // end handleReportModalShow

	// list item handle read change
	const handleRowChangeRead = async (reportId, checked) => {
		// Optimistic UI update
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

		// Firestore update
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

	// modal item read change
	// function runs when report modal is displayed
	// and user clicks the read/unread toggle
	const handleChangeReadModal = async (reportId, checked) => {
		const docRef = doc(db, 'reports', reportId)
		await updateDoc(docRef, { read: checked })
		setUpdate(!update)
	}

	const handleFormSubmit = async (e) => {
		e.preventDefault()
		setReportModalShow(false)
	}
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
	// Delete report
	const handleReportDelete = async (e) => {
		reportModalShow ? e.preventDefault() : setReportModalId(e)
		setDeleteModal(true)
	}
	const handleDelete = async (e) => {
		const docRef = doc(db, 'reports', reportModalId)
		deleteDoc(docRef)
			.then(() => {
				getData()
				setReportModalShow(false)
				setDeleteModal(false)
			})
			.catch((error) => {
				console.log('The write failed' + error)
			})
	}

	const handleSorting = (sortField, sortOrder) => {
		const sortedReports = [...filteredReports].sort((a, b) => {
			const aValue = a[sortField]
			const bValue = b[sortField]

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

	// Dynamically extract all unique keys from the JSON objects
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

	// Convert JSON array to CSV
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

	// Trigger download of CSV file
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

	// Function to handle CSV import
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

	// Non filtering hooks
	useEffect(() => {
		getData()
	}, [update])

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

	useEffect(() => {
		if (customClaims.admin) {
			setIsAgency(false)
		} else if (customClaims.agency) {
			setIsAgency(true)
		}
	}, [customClaims])

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

	// Pagination functions to change pages
	const goToPreviousPage = () => {
		setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))
	}

	const goToNextPage = () => {
		setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages))
	}

	const goToPage = (pageNumber) => {
		setCurrentPage(pageNumber)
	}

	// Helper function to calculate visible page numbers
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
