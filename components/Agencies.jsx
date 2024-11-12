import React, { useState, useEffect, useRef } from 'react'
import { 
	doc, 
	setDoc,
	collection, 
	getDocs, 
	getDoc, 
	updateDoc,
	deleteDoc,
	addDoc,
	arrayUnion,
	query,
	where
} from 'firebase/firestore'
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, auth } from "../config/firebase"
import { useAuth } from '../context/AuthContext'
import Image from 'next/image'
import AgencyModal from './modals/AgencyModal'
import NewAgencyModal from './modals/NewAgencyModal'
import ConfirmModal from "./modals/ConfirmModal"
import { Tooltip } from 'react-tooltip'
import { IoTrash } from "react-icons/io5"
import { FaPlus } from 'react-icons/fa'
import { Button, Typography } from '@material-tailwind/react'

const Agencies = ({handleAgencyUpdateSubmit}) => {
	// //
	// States
	// //
	const [agencies, setAgencies] = useState([])
	const [agencyInfo, setAgencyInfo] = useState('')
	const [agencyId, setAgencyId] = useState('')
	const [agencyUsersArr, setAgencyUsersArr] = useState([])
	const [agencyAdminUsers, setAgencyAdminUsers] = useState('')
	// EXISTING Agency Modal
	const [agencyModal, setAgencyModal] = useState(false)
	const [update, setUpdate] = useState('')
	const [logo, setLogo] = useState('')
	const [search, setSearch] = useState('')
	const [endIndex, setEndIndex] = useState(10)
	const [deleteModal, setDeleteModal] = useState(false)
	// NEW Agency Modal
	const { user, sendSignIn } = useAuth()
	const [newAgencyModal, setNewAgencyModal] = useState(false)
	const [newAgencySubmitted, setNewAgencySubmitted] = useState(0)
	const [newAgencyName, setNewAgencyName] = useState('')
	const [newAgencyEmails, setNewAgencyEmails] = useState([])
	const [data, setData] = useState({ country: 'US', state: null, city: null })
	const [emailSent, setEmailSent] = useState(false) // check if email was sent
	// validation states
	const [errors, setErrors] = useState({})
	// States related to AgencyModal
	const [addAgencyUsers, setAddAgencyUsers] = useState([])
	const [images, setImages] = useState([])
	const [uploadedImageURLs, setUploadedImageURLs] = useState([])
	const [resendEmail, setResendEmail] = useState('')
	const [sendEmail, setSendEmail] = useState('')
	const [adminDelete, setAdminDelete] = useState('')
	// Add this state to keep track of image preview URLs
	const imgPicker = useRef(null)
	const storage = getStorage()

	// Data
	// The getData function retrieves agency data from a Firebase Firestore collection and populates the agencies state variable.
	const getData = async () => {
		const agencyCollection = collection(db, 'agency')
		const reportsCollection = collection(db, 'reports')
		const snapshot = await getDocs(agencyCollection, reportsCollection)
		try {
			var arr = []
			snapshot.forEach((doc) => {
				arr.push({
					[doc.id]: doc.data(),
				})
			})
			setAgencies(arr)
		} catch (error) {
			console.log(error)
		}
	}

	// Handler: new agency MODAL
	// Modal for new agencies. Modal is displayed when users click the button to add a new agency.
	const handleAddNewAgencyModal = (e) => {
		e.preventDefault()
		setNewAgencyModal(true)
	}
	// Handler: new agency NAME
	const handleNewAgencyName = (e) => {
		e.preventDefault()
		setNewAgencyName(e.target.value)
	}
	// Handler: new agency EMAIL
	const handleNewAgencyEmails = (e) => {
		e.preventDefault()
		let usersArr = e.target.value
		usersArr = usersArr.split(',')
		setNewAgencyEmails(usersArr)
	}
	// Handler: new agency state
	const handleNewAgencyState = (e) => {
		setData((data) => ({ ...data, state: e, city: null }))
	}
	// Handler: new agency city
	const handleNewAgencyCity = (e) => {
		setData((data) => ({ ...data, city: e !== null ? e : null }))
	}
	// Handler: Image Change
	const handleImageChange = (e) => {
		// Clear the 'images' state to start with an empty array
		setImages([])

		// Loop through each selected image and update state
		const files = Array.from(e.target.files)
		for (let i = 0; i < files.length; i++) {
			const newImage = files[i]
			setImages((prevState) => [...prevState, newImage])
		}

		// Trigger the upload by toggling the 'update' state
		setUpdate(!update)
	}

	// Handler: Upload Images to Firebase Storage
	const handleUpload = async () => {
		try {
			if (images.length === 0) {
				console.error('No images to upload.')
				return
			}

			// Create upload tasks
			const uploadPromises = images.map(async (image) => {
				const storageRef = ref(
					storage,
					`${new Date().getTime().toString()}.png`,
				)
				const uploadTask = uploadBytesResumable(storageRef, image)
				await uploadTask
				const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
				return downloadURL
			})

			// Wait for all uploads to complete
			const imageURLs = await Promise.all(uploadPromises)
			setUploadedImageURLs([...imageURLs])
			setLogo(imageURLs) // Update logo if needed

			// Automatically save after successful upload
			saveAgency(imageURLs)
		} catch (error) {
			console.error('Error uploading images:', error)
		}
	}

	// Handler: Add Agency Users
	const handleAddAgencyUsers = async (e) => {
		e.preventDefault()

		// Split the input string into an array of emails, trim spaces, and filter out empty strings
		const userEmails = addAgencyUsers
			.split(',')
			.map((email) => email.trim())
			.filter((email) => email)

		let tempUsersArr = [...agencyUsersArr]
		let invalidEmails = []

		for (const userEmail of userEmails) {
			// Validate the email format using a regex pattern
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailPattern.test(userEmail)) {
				invalidEmails.push(userEmail)
				continue // Skip sending sign-in link for invalid email
			}

			// Check if the email already exists in the agencyUsersArr
			if (!tempUsersArr.includes(userEmail)) {
				tempUsersArr.push(userEmail)

				try {
					// Attempt to send the sign-in link to the valid email
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

		// Update Firestore with the new list of agency users
		if (tempUsersArr.length > agencyUsersArr.length) {
			const agencyRef = doc(db, 'agency', agencyId)
			await updateDoc(agencyRef, {
				agencyUsers: arrayUnion(...tempUsersArr),
			}).then(() => {
				setAgencyUsersArr(tempUsersArr) // Update state to reflect changes
				handleAgencyUpdateSubmit() // Trigger any necessary updates
			})
		}

		// Handle display of invalid emails if any were found
		if (invalidEmails.length > 0) {
			setSendEmail(`Invalid emails: ${invalidEmails.join(', ')}`)
		}

		// Clear the input field after processing
		setAddAgencyUsers('')
	}

	// Handler: Resend Sign-in Links
	const sendAgencyLinks = async (email) => {
		await sendSignIn(email)
		setResendEmail('Email was sent.')
	}

	// Handler: Delete Admin User
	const deleteAdmin = async (adminEmail) => {
		try {
			// Step 1: Filter out the admin user to be deleted from the agency's admin list
			const updatedUsers = agencyUsersArr.filter((user) => user !== adminEmail)
			const agencyRef = doc(db, 'agency', agencyId)

			// Step 2: Update Firestore to reflect the removed admin in the agency's document
			await updateDoc(agencyRef, { agencyUsers: updatedUsers })

			// Step 3: Query the mobileUsers collection to find the user with the given email
			const userQuery = query(
				collection(db, 'mobileUsers'),
				where('email', '==', adminEmail),
			)
			const userSnapshot = await getDocs(userQuery)

			// Step 4: Check if the user exists and update the userRole to "User"
			if (!userSnapshot.empty) {
				const userDoc = userSnapshot.docs[0] // Assuming there's only one user document with this email
				await updateDoc(userDoc.ref, { userRole: 'User' })
				console.log(`User role updated to 'User' for ${adminEmail}`)
			} else {
				console.warn(`No user found with email: ${adminEmail}`)
			}

			// Step 5: Update state to reflect changes in UI
			setAgencyUsersArr(updatedUsers)
			setUpdate(!update)
			console.log('Admin user deleted successfully.')
		} catch (error) {
			console.error('Error deleting admin user:', error)
		}
	}

	// Handler: Form Submit
	const handleSubmitClick = async (e) => {
		e.preventDefault()
		if (images.length > 0) {
        // Use 'update' to trigger the upload
        setUpdate((prev) => !prev)
		} else {
			// Proceed to save if no images are selected
			saveAgency(uploadedImageURLs)
			setAgencyModal(false)
		}
	}

	// Handler: Save Agency
	const saveAgency = (uploadedImageURLs) => {
		console.log(uploadedImageURLs)
		const agencyRef = doc(db, 'agency', agencyId)
		updateDoc(agencyRef, {
			logo: uploadedImageURLs,
		}).then(() => {
			handleAgencyUpdateSubmit()
		})
	}

	// Handler: Form submit NEW & EXISTING AGENCY
	const handleFormSubmit = async (e) => {
		e.preventDefault()

		// make sure an email is entered (last email in arr)
		if (newAgencyEmails.length < 1) {
			console.log('Please enter an email')
			return
		}
		

		setUpdate(!update)
		// check form id
		if (e.target.id == 'newAgencyModal') {
			// NEW AGENCY
			saveAgency()
			setNewAgencyModal(false)
		} else if (e.target.id == 'agencyModal') {
			// EXISTING AGENCY
			handleAgencyUpdate(e)
		}
	}

	// Handler: Delete agency modal
	const handleAgencyDelete = async (agencyId) => {
		setDeleteModal(true)
		setAgencyId(agencyId)
	}
	// Handler: delete agency from database and remove related user's agency field
	const handleDelete = async (e) => {
		e.preventDefault()

		try {
			// Get agency data
			const agencyRef = doc(db, 'agency', agencyId)
			const agencySnapshot = await getDoc(agencyRef)
			const agencyData = agencySnapshot.data()

			// Get agency users
			const agencyUsers = agencyData['agencyUsers']

			// Update agency field for each user
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

					// TODO: Change privilege for user since we're deleting agency
					// TODO: Check if user account exists - if it does, get rid of agency privilege.
					// Update the agency field for the user
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

	// Handler: Agency modal
	// Modal for existing agencies. Modals displayed when user click's the list item to view agency details, or delete an agency.
	const handleAgencyModalShow = async (agencyId) => {
		setAgencyModal(true)
		const docRef = await getDoc(doc(db, 'agency', agencyId))
		setAgencyInfo(docRef.data())
		setAgencyUsersArr(docRef.data()['agencyUsers'])
		setAgencyId(agencyId)
		setLogo(docRef.data()['logo'])
	}
	// Handler: Agency update
	const handleAgencyUpdate = async (e) => {
		e.preventDefault()
		// TODO: Check for any errors
		const allErrors = {}
		setErrors(allErrors)
		// console.log(e.target.value);
		if (allErrors > 0) {
			console.log(Object.keys(allErrors).length + ' Error array length')
		}
	}

	// Effects
	// The useEffect hook is used to trigger the getData function when the component mounts,
	// ensuring that agency data is fetched from Firestore.
	useEffect(() => {
		getData()
	})
	useEffect(() => {
		if (update) {
			handleUpload()
		}
	},[update])
	
	useEffect(() => {
		console.log(agencyInfo)
	}, [agencyModal])

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
	// The return statement defines the JSX structure of the component.
	// It renders a table with agency information,including logos,names,
	// locations,and admin users.Users can interact with this table to view,
	// edit,or delete agency data.
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