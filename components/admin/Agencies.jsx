/**
 * @fileoverview Agencies Management Component - Comprehensive agency CRUD operations
 * 
 * This component provides a complete agency management interface for administrators
 * to create, read, update, and delete agencies. Key features include:
 * - Agency listing with logo display and location information
 * - Agency creation with user invitation system
 * - Agency editing with image upload capabilities
 * - User management within agencies (add/remove admin users)
 * - Email invitation system for new agency users
 * - Agency deletion with confirmation
 * - Real-time data fetching from Firestore
 * - Image upload to Firebase Storage
 * - Location-based agency filtering
 * 
 * The component integrates with multiple modals for different operations:
 * - AgencyModal: Edit existing agencies
 * - NewAgencyModal: Create new agencies
 * - ConfirmModal: Delete confirmation
 * 
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
	doc, 
	collection, 
	getDocs, 
	getDoc, 
	updateDoc,
	deleteDoc,
	arrayUnion,
	query,
	where
} from 'firebase/firestore'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db } from "../../config/firebase"
import { useAuth } from '../../context/AuthContext'
import Image from 'next/image'
import AgencyModal from '../modals/admin/AgencyModal'
import NewAgencyModal from '../modals/admin/NewAgencyModal'
import ConfirmModal from "../modals/common/ConfirmModal"
import { Tooltip } from 'react-tooltip'
import { IoTrash } from "react-icons/io5"
import { FaPlus } from 'react-icons/fa'
import { Button } from '@material-tailwind/react'

/**
 * Agencies Component - Comprehensive agency management interface
 * 
 * This component provides a complete CRUD interface for managing agencies in the
 * misinformation dashboard. It handles agency listing, creation, editing, and deletion
 * with integrated user management and image upload capabilities.
 * 
 * Key functionality:
 * - Display agencies in a table format with logos, names, locations, and admin users
 * - Create new agencies with location and user invitation system
 * - Edit existing agencies with image upload and user management
 * - Delete agencies with confirmation
 * - Manage agency admin users with email invitation system
 * - Handle image uploads for agency logos
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleAgencyUpdateSubmit - Callback function for agency updates
 * @returns {JSX.Element} The Agencies management component
 */
const Agencies = ({handleAgencyUpdateSubmit}) => {
	// Authentication and Firebase
	const { sendSignIn } = useAuth() // User authentication and email sending
	const storage = getStorage() // Firebase Storage instance
	const imgPicker = useRef(null) // File input reference for image upload
	
	// Agency data management
	const [agencies, setAgencies] = useState([]) // List of all agencies
	const [agencyInfo, setAgencyInfo] = useState('') // Current agency data for editing
	const [agencyId, setAgencyId] = useState('') // Current agency ID being edited
	const [agencyUsersArr, setAgencyUsersArr] = useState([]) // Agency admin users array
	const [agencyAdminUsers, setAgencyAdminUsers] = useState('') // Agency admin users string
	
	// Modal and UI state management
	const [agencyModal, setAgencyModal] = useState(false) // Existing agency edit modal
	const [newAgencyModal, setNewAgencyModal] = useState(false) // New agency creation modal
	const [deleteModal, setDeleteModal] = useState(false) // Delete confirmation modal
	
	// Image upload and management
	const [update, setUpdate] = useState('') // Trigger for image upload
	const [logo, setLogo] = useState('') // Agency logo URL
	const [images, setImages] = useState([]) // Selected image files
	const [uploadedImageURLs, setUploadedImageURLs] = useState([]) // Uploaded image URLs
	
	// New agency creation state
	const [newAgencySubmitted, setNewAgencySubmitted] = useState(0) // Submission counter
	const [newAgencyName, setNewAgencyName] = useState('') // New agency name
	const [newAgencyEmails, setNewAgencyEmails] = useState([]) // New agency admin emails
	const [data, setData] = useState({ country: 'US', state: null, city: null }) // Location data
	const [emailSent, setEmailSent] = useState(false) // Email invitation status
	
	// User management state
	const [addAgencyUsers, setAddAgencyUsers] = useState([]) // Users to add to agency
	const [resendEmail, setResendEmail] = useState('') // Resend email status
	const [sendEmail, setSendEmail] = useState('') // Send email status
	const [adminDelete, setAdminDelete] = useState('') // Admin deletion status
	
	// UI and validation state
	const [search, setSearch] = useState('') // Search functionality (unused)
	const [endIndex, setEndIndex] = useState(10) // Pagination limit
	const [errors, setErrors] = useState({}) // Form validation errors

	/**
	 * Fetches all agencies from Firestore and populates the agencies state
	 * 
	 * Retrieves agency documents from the 'agency' collection and formats them
	 * into an array of objects with document IDs as keys and data as values.
	 * This data is used to populate the agencies table.
	 * 
	 * @returns {Promise<void>} Promise that resolves when agencies are fetched
	 */
	const getData = async () => {
		const agencyCollection = collection(db, 'agency')
		const reportsCollection = collection(db, 'reports')
		const snapshot = await getDocs(agencyCollection, reportsCollection)
		try {
			var arr = []
			snapshot.forEach((doc) => {
				arr.push({
					[doc.id]: doc.data(), // Format: { docId: docData }
				})
			})
			setAgencies(arr)
		} catch (error) {
			console.log(error)
		}
	}

	/**
	 * Opens the new agency creation modal
	 * 
	 * Resets location data to default values and opens the modal
	 * for creating a new agency.
	 * 
	 * @param {Event} e - Form event
	 */
	const handleAddNewAgencyModal = (e) => {
		e.preventDefault()
		setData({ country: 'US', state: null, city: null }) // Reset location data
		setNewAgencyModal(true)
	}
	
	/**
	 * Handles new agency name input changes
	 * 
	 * Updates the newAgencyName state when user types in the name field.
	 * 
	 * @param {Event} e - Input change event
	 */
	const handleNewAgencyName = (e) => {
		e.preventDefault()
		setNewAgencyName(e.target.value)
	}
	
	/**
	 * Handles new agency admin emails input changes
	 * 
	 * Parses comma-separated email addresses and updates the newAgencyEmails state.
	 * 
	 * @param {Event} e - Input change event
	 */
	const handleNewAgencyEmails = (e) => {
		e.preventDefault()
		let usersArr = e.target.value
		usersArr = usersArr.split(',') // Split comma-separated emails
		setNewAgencyEmails(usersArr)
	}
	
	/**
	 * Handles new agency state selection
	 * 
	 * Updates the location data with selected state and resets city to null
	 * since city depends on state selection.
	 * 
	 * @param {Object} e - Selected state object
	 */
	const handleNewAgencyState = (e) => {
		setData((data) => ({ ...data, state: e, city: null }))
	}
	
	/**
	 * Handles new agency city selection
	 * 
	 * Updates the location data with selected city, handling null values.
	 * 
	 * @param {Object} e - Selected city object or null
	 */
	const handleNewAgencyCity = (e) => {
		setData((data) => ({ ...data, city: e !== null ? e : null }))
	}
	/**
	 * Handles image file selection for agency logo upload
	 * 
	 * Processes multiple image files selected by the user and adds them to the
	 * images state array. Triggers the upload process by setting the update flag.
	 * 
	 * @param {Event} e - File input change event
	 */
	const handleImageChange = (e) => {
		// Clear previous images and start with empty array
		setImages([])

		// Process each selected file
		const files = Array.from(e.target.files)
		for (let i = 0; i < files.length; i++) {
			const newImage = files[i]
			setImages((prevState) => [...prevState, newImage])
		}

		// Trigger upload process
		setUpdate(!update)
	}

	/**
	 * Uploads selected images to Firebase Storage
	 * 
	 * Creates unique filenames for each image and uploads them to Firebase Storage.
	 * Uses Promise.all to handle multiple concurrent uploads. Automatically saves
	 * the agency data after successful upload.
	 * 
	 * @returns {Promise<void>} Promise that resolves when uploads complete
	 */
	const handleUpload = async () => {
		try {
			if (images.length === 0) {
				console.error('No images to upload.')
				return
			}

			// Create upload tasks for all selected images
			const uploadPromises = images.map(async (image) => {
				const storageRef = ref(
					storage,
					`${new Date().getTime().toString()}.png`, // Unique filename
				)
				const uploadTask = uploadBytesResumable(storageRef, image)
				await uploadTask
				const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
				return downloadURL
			})

			// Wait for all uploads to complete
			const imageURLs = await Promise.all(uploadPromises)
			setUploadedImageURLs([...imageURLs])
			setLogo(imageURLs) // Update logo state

			// Automatically save agency data after successful upload
			saveAgency(imageURLs)
		} catch (error) {
			console.error('Error uploading images:', error)
		}
	}

	/**
	 * Adds new admin users to an agency with email validation and invitation
	 * 
	 * Processes comma-separated email addresses, validates email format,
	 * sends sign-in invitations to new users, and updates the agency's
	 * admin user list in Firestore. Handles duplicate emails and invalid formats.
	 * 
	 * @param {Event} e - Form submission event
	 * @returns {Promise<void>} Promise that resolves when users are added
	 */
	const handleAddAgencyUsers = async (e) => {
		e.preventDefault()

		// Parse and clean email addresses
		const userEmails = addAgencyUsers
			.split(',')
			.map((email) => email.trim())
			.filter((email) => email)

		let tempUsersArr = [...agencyUsersArr]
		let invalidEmails = []

		// Process each email address
		for (const userEmail of userEmails) {
			// Validate email format using regex
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailPattern.test(userEmail)) {
				invalidEmails.push(userEmail)
				continue // Skip invalid emails
			}

			// Check for duplicates and add new users
			if (!tempUsersArr.includes(userEmail)) {
				tempUsersArr.push(userEmail)

				try {
					// Send sign-in invitation to new user
					await sendSignIn(userEmail)
					setSendEmail(`Sign-in link sent to ${userEmail}`)
				} catch (error) {
					console.error(`Error sending sign-in link to ${userEmail}:`, error)
					setSendEmail(`Error sending sign-in link to ${userEmail}`)
				}
			} else {
				setSendEmail(`${userEmail} is already an admin for this agency.`)
			}
		}

		// Update Firestore if new users were added
		if (tempUsersArr.length > agencyUsersArr.length) {
			const agencyRef = doc(db, 'agency', agencyId)
			await updateDoc(agencyRef, {
				agencyUsers: arrayUnion(...tempUsersArr),
			}).then(() => {
				setAgencyUsersArr(tempUsersArr) // Update local state
				handleAgencyUpdateSubmit() // Trigger parent updates
			})
		}

		// Display invalid emails if any were found
		if (invalidEmails.length > 0) {
			setSendEmail(`Invalid emails: ${invalidEmails.join(', ')}`)
		}

		// Clear input field after processing
		setAddAgencyUsers('')
	}

	/**
	 * Resends sign-in invitation email to a specific user
	 * 
	 * Sends a new sign-in link to the specified email address and updates
	 * the resend email status for user feedback.
	 * 
	 * @param {string} email - Email address to send invitation to
	 * @returns {Promise<void>} Promise that resolves when email is sent
	 */
	const sendAgencyLinks = async (email) => {
		await sendSignIn(email)
		setResendEmail('Email was sent.')
	}

	/**
	 * Removes an admin user from an agency and updates their role
	 * 
	 * Removes the specified email from the agency's admin list and updates
	 * the user's role in the mobileUsers collection from "Admin" to "User".
	 * Updates both Firestore and local state to reflect the changes.
	 * 
	 * @param {string} adminEmail - Email address of admin to remove
	 * @returns {Promise<void>} Promise that resolves when admin is deleted
	 */
	const deleteAdmin = async (adminEmail) => {
		try {
			// Remove admin from agency's admin list
			const updatedUsers = agencyUsersArr.filter((user) => user !== adminEmail)
			const agencyRef = doc(db, 'agency', agencyId)

			// Update agency document in Firestore
			await updateDoc(agencyRef, { agencyUsers: updatedUsers })

			// Find and update user's role in mobileUsers collection
			const userQuery = query(
				collection(db, 'mobileUsers'),
				where('email', '==', adminEmail),
			)
			const userSnapshot = await getDocs(userQuery)

			// Update user role to "User" if found
			if (!userSnapshot.empty) {
				const userDoc = userSnapshot.docs[0] // Get first matching user
				await updateDoc(userDoc.ref, { userRole: 'User' })
				console.log(`User role updated to 'User' for ${adminEmail}`)
			} else {
				console.warn(`No user found with email: ${adminEmail}`)
			}

			// Update local state and trigger UI refresh
			setAgencyUsersArr(updatedUsers)
			setUpdate(!update)
			console.log('Admin user deleted successfully.')
		} catch (error) {
			console.error('Error deleting admin user:', error)
		}
	}

	/**
	 * Handles form submission for agency updates
	 * 
	 * Triggers image upload if images are selected, otherwise saves agency data
	 * directly. Closes the agency modal after successful submission.
	 * 
	 * @param {Event} e - Form submission event
	 * @returns {Promise<void>} Promise that resolves when form is submitted
	 */
	const handleSubmitClick = async (e) => {
		e.preventDefault()
		if (images.length > 0) {
			// Trigger image upload process
			setUpdate((prev) => !prev)
		} else {
			// Save agency data directly if no images
			saveAgency(uploadedImageURLs)
			setAgencyModal(false)
		}
	}

	/**
	 * Saves agency logo updates to Firestore
	 * 
	 * Updates the agency document with new logo URLs and triggers
	 * parent component updates through the callback function.
	 * 
	 * @param {string[]} uploadedImageURLs - Array of uploaded image URLs
	 * @returns {Promise<void>} Promise that resolves when agency is saved
	 */
	const saveAgency = (uploadedImageURLs) => {
		console.log(uploadedImageURLs)
		const agencyRef = doc(db, 'agency', agencyId)
		updateDoc(agencyRef, {
			logo: uploadedImageURLs,
		}).then(() => {
			handleAgencyUpdateSubmit() // Trigger parent updates
		})
	}

	/**
	 * Handles form submission for both new and existing agencies
	 * 
	 * Routes form submission based on form ID to either create a new agency
	 * or update an existing one. Triggers appropriate handlers for each case.
	 * 
	 * @param {Event} e - Form submission event
	 * @returns {Promise<void>} Promise that resolves when form is submitted
	 */
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		setUpdate(!update)
		
		// Route based on form type
		if (e.target.id == 'newAgencyModal') {
			// Create new agency
			saveAgency()
			setNewAgencyModal(false)
		} else if (e.target.id == 'agencyModal') {
			// Update existing agency
			handleAgencyUpdate(e)
		}
	}

	/**
	 * Opens the agency deletion confirmation modal
	 * 
	 * Sets the agency ID for deletion and opens the confirmation modal
	 * to allow users to confirm the deletion action.
	 * 
	 * @param {string} agencyId - ID of the agency to delete
	 */
	const handleAgencyDelete = async (agencyId) => {
		setDeleteModal(true)
		setAgencyId(agencyId)
	}
	
	/**
	 * Deletes an agency and updates all associated users
	 * 
	 * Removes the agency document from Firestore and updates all users
	 * who were associated with the agency by clearing their agency field.
	 * This ensures data consistency when an agency is deleted.
	 * 
	 * @param {Event} e - Form submission event
	 * @returns {Promise<void>} Promise that resolves when agency is deleted
	 */
	const handleDelete = async (e) => {
		e.preventDefault()

		try {
			// Get agency data to find associated users
			const agencyRef = doc(db, 'agency', agencyId)
			const agencySnapshot = await getDoc(agencyRef)
			const agencyData = agencySnapshot.data()

			// Get list of agency users
			const agencyUsers = agencyData['agencyUsers']

			// Update agency field for each associated user
			const updatePromises = []

			for (const userEmail of agencyUsers) {
				const userRef = query(
					collection(db, 'mobileUsers'),
					where('email', '==', userEmail),
				)
				const querySnapshot = await getDocs(userRef)

				querySnapshot.forEach((doc) => {
					const userData = doc.data()
					console.log(userData)

					// Clear agency association for user
					// TODO: Update user privileges when agency is deleted
					const userUpdatePromise = updateDoc(doc.ref, { agency: '' })
					updatePromises.push(userUpdatePromise)
				})
			}

			// Wait for all user updates to complete
			await Promise.all(updatePromises)

			// Delete the agency document
			await deleteDoc(agencyRef)

			console.log('Agency and user updates completed successfully.')
			setDeleteModal(false)
		} catch (error) {
			console.error('Error deleting agency:', error)
		}
	}

	/**
	 * Opens the agency edit modal and loads agency data
	 * 
	 * Fetches agency data from Firestore and populates the modal with
	 * agency information, users, and logo for editing.
	 * 
	 * @param {string} agencyId - ID of the agency to edit
	 * @returns {Promise<void>} Promise that resolves when agency data is loaded
	 */
	const handleAgencyModalShow = async (agencyId) => {
		setAgencyModal(true)
		const docRef = await getDoc(doc(db, 'agency', agencyId))
		setAgencyInfo(docRef.data()) // Set agency data for editing
		setAgencyUsersArr(docRef.data()['agencyUsers']) // Set agency users
		setAgencyId(agencyId) // Set current agency ID
		setLogo(docRef.data()['logo']) // Set agency logo
	}
	
	/**
	 * Handles agency update form submission
	 * 
	 * Currently a placeholder for agency update validation and processing.
	 * TODO: Implement proper error checking and agency update logic.
	 * 
	 * @param {Event} e - Form submission event
	 * @returns {Promise<void>} Promise that resolves when update is processed
	 */
	const handleAgencyUpdate = async (e) => {
		e.preventDefault()
		// TODO: Implement proper error validation
		const allErrors = {}
		setErrors(allErrors)
		
		if (allErrors > 0) {
			console.log(Object.keys(allErrors).length + ' Error array length')
		}
	}

	// Initialize agency data on component mount
	useEffect(() => {
		getData()
	}, [])
	
	// Trigger image upload when update flag is set
	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update])
	
	// Debug logging when agency modal opens
	useEffect(() => {
		console.log(agencyInfo)
	}, [agencyModal])

	// Component styling object
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
	/**
	 * Renders the agencies management interface
	 * 
	 * Displays a table with agency information including logos, names, locations,
	 * and admin users. Users can interact with table rows to view/edit agencies
	 * or delete them. Includes modals for agency creation, editing, and deletion.
	 * 
	 * @returns {JSX.Element} The agencies management component
	 */
	return (
		<div className={style.section_container}>
			<div className={style.section_wrapper}>
				<div className={style.section_header}>
					<div className={style.section_title}>Agencies</div>
					<div className={style.section_filtersWrap}>
						{/* <button className={style.button} onClick={handleAddNewAgencyModal}><FaPlus className="text-blue-600 mr-2" size={12}/>Add Agency</button> */}
						<Button
							className="flex items-center gap-3"
							onClick={handleAddNewAgencyModal}>
							<FaPlus size={12} />
							Add Agency
						</Button>
						{/* TODO: add filters to agency list */}
					</div>
				</div>
				<table className={style.table_main}>
					<thead className={style.table_thead}>
						<tr>
							<th className={style.table_th}>Agency Logo</th>
							<th className={style.table_th}>Agency Name</th>
							<th className={style.table_th}>Agency Location</th>
							<th className={style.table_th}>Agency Admin User</th>
							<th className={style.table_th}>Delete Agency</th>
						</tr>
					</thead>
					<tbody>
						{agencies.slice(0, endIndex).map((agencyObj, i) => {
							const agency = Object.values(agencyObj)[0]
							i = Object.keys(agencyObj)[0]
							return (
								<tr
									onClick={() =>
										handleAgencyModalShow(Object.keys(agencyObj)[0])
									}
									className={style.table_tr}
									key={i}>
									<td className={style.table_td}>
										{agency['logo'] && agency['logo'][0] ? (
											agency['logo'].map((image, i) => {
												return (
													<Image
														src={`${image}`}
														width={50}
														height={50}
														className="w-auto"
														alt="image"
														key={i}
													/>
												)
											})
										) : (
											<>No logo for this agency</>
										)}
									</td>
									<td className={style.table_td}>{agency.name}</td>
									<td className={style.table_td}>
										{agency.city}, {agency.state}
									</td>
									<td
										className={`${style.table_td} max-w-56 overflow-y-hidden`}>
										<p className="max-h-20 overflow-auto">
											{agency['agencyUsers'].join(', ')}
										</p>
									</td>
									<td
										className={style.table_td}
										onClick={(e) => e.stopPropagation()}>
										<button
											onClick={() =>
												handleAgencyDelete(Object.keys(agencyObj)[0])
											}
											className={`${style.table_button} tooltip-delete`}>
											<IoTrash size={20} className={style.table_icon} />
											<Tooltip
												anchorSelect=".tooltip-delete"
												place="bottom"
												delayShow={500}>
												Delete Agency
											</Tooltip>
										</button>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
			{agencyModal && (
				<AgencyModal
					handleImageChange={handleImageChange}
					handleUpload={handleUpload}
					handleAddAgencyUsers={handleAddAgencyUsers}
					addAgencyUsers={addAgencyUsers}
					setAddAgencyUsers={setAddAgencyUsers}
					sendAgencyLinks={sendAgencyLinks}
					deleteAdmin={deleteAdmin}
					handleSubmitClick={handleSubmitClick}
					saveAgency={saveAgency}
					setAgencyModal={setAgencyModal}
					agencyInfo={agencyInfo}
					agencyUsersArr={agencyUsersArr}
					agencyId={agencyId}
					images={images}
					uploadedImageURLs={uploadedImageURLs}
					resendEmail={resendEmail}
					sendEmail={sendEmail}
					adminDelete={adminDelete}
					setErrors={setErrors}
					setSendEmail={setSendEmail}
					setResendEmail={setResendEmail}
					imgPicker={imgPicker}
					errors={errors}
				/>
			)}
			{deleteModal && (
				<ConfirmModal
					func={handleDelete}
					title="Are you sure you want to delete this agency?"
					subtitle=""
					CTA="Delete"
					closeModal={setDeleteModal}
				/>
			)}
			{newAgencyModal && (
				<NewAgencyModal
					setNewAgencyModal={setNewAgencyModal}
					newAgencyName={newAgencyName}
					onNewAgencyName={handleNewAgencyName}
					newAgencyEmails={newAgencyEmails}
					onNewAgencyEmails={handleNewAgencyEmails}
					data={data}
					onNewAgencyState={handleNewAgencyState}
					onNewAgencyCity={handleNewAgencyCity}
					onFormSubmit={handleFormSubmit}
					errors={errors}
				/>
			)}
		</div>
	)
}

export default Agencies