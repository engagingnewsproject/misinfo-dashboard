import React, { useState, useEffect, useContext } from 'react'
import { useAuth } from '../context/AuthContext'
import {
	collection,
	getDocs,
	getDoc,
	doc,
	deleteDoc,
	updateDoc,
	onSnapshot,
	query,
	where,
	addDoc,
} from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import { Tooltip } from 'react-tooltip'
import { IoTrash } from 'react-icons/io5'
import InfiniteScroll from 'react-infinite-scroll-component'
import ConfirmModal from './modals/ConfirmModal'
import EditUserModal from './modals/EditUserModal'
import NewUserModal from './modals/NewUserModal'
import { FaPlus } from 'react-icons/fa'
import globalStyles from '../styles/globalStyles'

const Users = () => {
	// Initialize authentication context
	const {
		user,
		addAdminRole,
		addAgencyRole,
		addUserRole,
		sendSignIn,
		customClaims,
		fetchUserRecord,
	} = useAuth()

	// State variables for managing user data
	const [userRole, setUserRole] = useState('')
	const [loadedMobileUsers, setLoadedMobileUsers] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [endIndex, setEndIndex] = useState(0)
	const [deleteModal, setDeleteModal] = useState(false)
	const [userEditing, setUserEditing] = useState([])
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	// agency
	// table agency
	const [agenciesArray, setAgenciesArray] = useState([])
	const [selectedAgency, setSelectedAgency] = useState('')
	const [agencyName, setAgencyName] = useState('')
	const [agencyNameNew, setAgencyNameNew] = useState('')
	const [banned, setBanned] = useState(false)
	const [userEditModal, setUserEditModal] = useState(null)
	const [userId, setUserId] = useState(null)
	const [update, setUpdate] = useState('')

	// Add new user
	// Add new user
	// Add new user
	const [newUserModal, setNewUserModal] = useState(false)
	const [data, setData] = useState({
		email: '',
	})
	const [newUserEmail, setNewUserEmail] = useState('')
	const [errors, setErrors] = useState({})

	const saveUser = () => {
		// Save new user
		const dbInstance = collection(db, 'mobileUsers')
		addDoc(dbInstance, {
			email: newUserEmail,
		}).then(async () => {
			try {
			} catch (err) {
			} finally {
			}
		})
	}

	const handleAddNewUserModal = (e) => {
		e.preventDefault()
		setNewUserModal(true)
	}

	const handleAddNewUserFormSubmit = async (e) => {
		e.preventDefault()
		await sendSignIn(newUserEmail)
		setUpdate(!update)
		// check form id
		// if (e.target.id == 'newUserModal') { // NEW AGENCY
		// 	saveUser()
		setNewUserModal(false)
		// } else if (e.target.id == 'userModal') { // EXISTING AGENCY
		// 	handleUserUpdate(e)
		// }
	}
	// Handler: new user NAME
	const handleNewUserName = (e) => {
		e.preventDefault()
		setNewUserName(e.target.value)
	}
	// Handler: new agency EMAIL
	const handleNewUserEmail = (e) => {
		e.preventDefault()
		setNewUserEmail(e.target.value)
	}
	// END Add new user
	// END Add new user
	// END Add new user
	const dateOptions = {
		day: '2-digit',
		year: 'numeric',
		month: 'short',
	}
	const tableHeading = {
		default: 'px-3 py-1 text-sm font-semibold text-left tracking-wide',
		default_center: 'text-center p-2 text-sm font-semibold tracking-wide',
		small: '',
	}
	const column = {
		data: 'whitespace-normal text-sm px-3 py-1',
		data_center:
			'whitespace-normal md:whitespace-nowrap text-sm px-3 py-1 text-center',
	}
	const style = {
		icon: 'hover:fill-cyan-700',
		section_container:
			'w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto',
		section_wrapper: 'flex flex-col h-full',
		section_header: 'flex justify-between ml-10 md:mx-0 py-5',
		section_title: 'text-xl font-extrabold text-blue-600 tracking-wider',
		section_filtersWrap: 'p-0 px-4 md:p-4 md:py-0 md:px-4 flex items-center',
		table_main: 'min-w-full bg-white rounded-xl p-1',
		button:
			'flex items-center shadow ml-auto bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline',
	}

	const fetchUserDetails = async (userId) => {
		try {
			const userRecord = await fetchUserRecord(userId)
			// console.log("User Data:", userRecord);
			return userRecord.disabled || false // Assuming fetchUserRecord correctly returns the user data
		} catch (error) {
			console.error('Error fetching user data:', userId, error)
			return true // Assume disabled if error
		}
	}

	// fetching and setting agencies with id and name
	const fetchAgencies = async () => {
		const snapshot = await getDocs(collection(db, 'agency'))
		const agencies = snapshot.docs.map((doc) => ({
			id: doc.id,
			name: doc.data().name,
		}))
		// console.log(agencies);
		setAgenciesArray(agencies)
	}

	// Function to fetch user data from Firebase
	const getData = async () => {
		setIsLoading(true)
		try {
			const mobileUsersQuerySnapshot = await getDocs(
				collection(db, 'mobileUsers'),
			)
			const mobileUsersArr = await Promise.all(
				mobileUsersQuerySnapshot.docs.map(async (doc) => {
					const userData = doc.data()
					userData.mobileUserId = doc.id
					userData.disabled = await fetchUserDetails(doc.id)
					return userData
				}),
			)

			if (customClaims.agency) {
				const filteredUsers = filterUsersByAgency(mobileUsersArr, user.email)
				setLoadedMobileUsers(filteredUsers)
			} else {
				mobileUsersArr.sort((a, b) => b.joiningDate - a.joiningDate)
				setLoadedMobileUsers(mobileUsersArr)
			}
		} catch (error) {
			console.error('Failed to fetch or process user data:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const filterUsersByAgency = async (users, userEmail) => {
		const q = query(
			collection(db, 'agency'),
			where('agencyUsers', 'array-contains', userEmail),
		)
		const querySnapshot = await getDocs(q)
		const agencyNames = querySnapshot.docs.map((doc) => doc.data().name)

		return users.filter((user) => agencyNames.includes(user.agencyName))
	}

	useEffect(() => {
		fetchAgencies()
		getData()
	}, [])

	// Function to trigger delete user modal
	const handleMobileUserDelete = async (userId) => {
		setDeleteModal(true)
		setUserId(userId)
	}

	// Function to handle user deletion
	const handleDelete = async (e) => {
		e.preventDefault()
		const docRef = doc(db, 'mobileUsers', userId)
		await deleteDoc(docRef)
		setDeleteModal(false)
	}

	// MODAL: Function to handle opening and setting values in the EditUserModal
	const handleEditUser = async (userObj, userId) => {
		setUserId(userId)
		const userRef = await getDoc(doc(db, 'mobileUsers', userId))
		setUserEditing(userObj)
		setUserEditModal(true)

		// Fetch all agencies to populate the dropdown list
		// let agencyArr = []
		// const agencySnapshot = await getDocs(collection(db, "agency"));
		// agencySnapshot.forEach((doc) => {
		//     agencyArr.push({
		//         id: doc.id, // Store the agency's document ID
		//         name: doc.data().name // Store the agency's name
		//     });
		// });
		// setAgenciesArray(agencyArr)

		// Determine if the user is assigned to an agency
		const q = query(
			collection(db, 'agency'),
			where('agencyUsers', 'array-contains', userRef.data().email),
		)
		const querySnapshot = await getDocs(q)
		const userAgency = querySnapshot.docs.length ? querySnapshot.docs[0].id : ''
		console.log(userAgency)
		setSelectedAgency(userAgency || '')
		setName(userRef.data()['name'] ?? '')
		setEmail(userRef.data()['email'])
		setBanned(userRef.data()['isBanned'] ?? false)
		setUserRole(userRef.data()['userRole'] ?? 'User')
	}

	const handleAgencyChange = async (e) => {
		e.preventDefault()
		const selectedValue = e.target.value
		setSelectedAgency(selectedValue)
		// console.log(selectedAgency.name)
		const selectedAgency = agenciesArray.find(
			(agency) => agency.id === selectedValue,
		)
		// console.log(selectedAgency) // Additional debugging to verify the correct agency is selected

		if (selectedAgency) {
			try {
				// Fetch the current data of the agency document to which the user is being added
				const newDocRef = doc(db, 'agency', selectedAgency.id) // Correctly use agency ID here
				const newDocSnap = await getDoc(newDocRef)
				if (newDocSnap.exists()) {
					const newAgencyData = newDocSnap.data()
					console.log(newAgencyData)
					// Check if the user's email is already in the agencyUsers array of the new agency
					const newAgencyUsers = newAgencyData.agencyUsers || []
					if (!newAgencyUsers.includes(email)) {
						// Remove the user's email from any other agencies they are part of first
						const agenciesQuery = query(
							collection(db, 'agency'),
							where('agencyUsers', 'array-contains', email),
						)
						const agenciesQuerySnapshot = await getDocs(agenciesQuery)
						for (const doc of agenciesQuerySnapshot.docs) {
							const docData = doc.data()
							const updatedAgencyUsers = (docData.agencyUsers || []).filter(
								(userEmail) => userEmail !== email,
							)
							await updateDoc(doc.ref, { agencyUsers: updatedAgencyUsers })
						}

						// Append the user's email to the new agency's agencyUsers array
						const updatedNewAgencyUsers = [...newAgencyUsers, email]
						await updateDoc(newDocRef, { agencyUsers: updatedNewAgencyUsers })
						console.log('User successfully added to the new agency.')
					} else {
						console.log('User already exists in this agency.')
					}
				} else {
					console.log('Agency document does not exist.')
				}
			} catch (error) {
				console.error('Error updating agency documents:', error)
			}
		} else {
			console.log('Selected agency not found in agenciesArray.')
		}
	}

	// Function to handle name change
	const handleNameChange = (e) => {
		e.preventDefault()
		setName(e.target.value)
	}

	// Function to handle email change
	const handleEmailChange = (e) => {
		e.preventDefault()
		setEmail(e.target.value)
	}

	// Function to handle user role change
	const handleRoleChange = (role) => {
		fetchAgencies()
		setUserRole(role)
	}

	// Function to handle banned status change
	const handleBannedChange = (e) => {
		setBanned((prevBanned) => !prevBanned) // Use a function to toggle based on previous state
	}

	const addUserToAgency = async (email, agencyId) => {
		try {
			const agencyRef = doc(db, 'agency', agencyId)
			const agencySnap = await getDoc(agencyRef)

			if (agencySnap.exists()) {
				const agencyData = agencySnap.data()
				const agencyUsers = agencyData.agencyUsers || []

				// Check if the user's email is already included to prevent duplicates
				if (!agencyUsers.includes(email)) {
					// Update the agency document to include the new user's email
					await updateDoc(agencyRef, {
						agencyUsers: [...agencyUsers, email],
					})
					console.log('User added to agency successfully.')
				} else {
					console.log('User already exists in the agency.')
				}
			} else {
				console.error('Agency document does not exist.')
			}
		} catch (error) {
			console.error('Error adding user to agency:', error)
		}
	}

	// Function to remove a user's email from all agency documents
	const removeUserFromAgencies = async (email) => {
		try {
			// Retrieve all agencies where this user's email is listed in the agencyUsers array
			const queryRef = query(
				collection(db, 'agency'),
				where('agencyUsers', 'array-contains', email),
			)
			const querySnapshot = await getDocs(queryRef)

			// Loop through all agencies and remove the email from the agencyUsers array
			querySnapshot.forEach(async (doc) => {
				const currentUsers = doc.data().agencyUsers || []
				const filteredUsers = currentUsers.filter(
					(userEmail) => userEmail !== email,
				)
				await updateDoc(doc.ref, { agencyUsers: filteredUsers })
			})
		} catch (error) {
			console.error('Error removing user from agencies:', error)
		}
	}

	// Function to handle form submission (updating user data)
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		const docRef = doc(db, 'mobileUsers', userId)
		// add user email to agency agencyUsers doc
		await updateDoc(docRef, {
			name: name,
			email: email,
			isBanned: banned,
			userRole: userRole,
		})
		console.log('Selected Agency ID:', selectedAgency) // Debug: Check the selected agency ID
		// Check if the user's role has been modified
		if (userRole !== userEditing.userRole) {
			// If the userRole is set to "Admin", call the addAdminRole function
			if (userRole === 'Admin') {
				try {
					// Call the addAdminRole function
					await addAdminRole({ email: email })
				} catch (error) {
					console.error('Error adding admin role:', error)
				}
			} else if (userRole === 'Agency') {
				// Call the addAgencyRole function
				try {
					// Switch user's mobileUsers/doc/userRole to "Agency"
					await addAgencyRole({ email: email })
					// Add user's email to the selected agency's document
					await addUserToAgency(email, selectedAgency) // Ensure `selectedAgency` is the actual document ID of the agency
				} catch (error) {
					console.error('Error adding agency role:', error)
					// Handle error if needed
				}
			} else if (userRole === 'User') {
				try {
					// Switch user's mobileUsers/doc/userRole to "User"
					await addUserRole({ email: email })
					// Call the function to remove user's email from agencyUsers array
					await removeUserFromAgencies(email)
				} catch (error) {
					console.error('Error adding general user role:', error)
					// Handle error if needed
				}
			}
		}

		// Update the loadedMobileUsers state after successful update
		setLoadedMobileUsers((prevUsers) =>
			prevUsers.map((userObj) =>
				userObj.id === userId
					? {
							id: userId,
							data: {
								...userObj.data,
								name: name,
								email: email,
								isBanned: banned,
								userRole: userRole,
							},
						}
					: userObj,
			),
		)
		setUserEditModal(false)
		setUpdate(!update)
	}

	// Data fetch on update
	useEffect(() => {
		getData()
	}, [update])

	return (
		<div className={style.section_container}>
			<div className={style.section_wrapper}>
				<div className={style.section_header}>
					<div className={style.section_title}>
						<div className={`${globalStyles.heading.h1.blue} leading-none`}>
							Users
						</div>
						{customClaims.admin ? (
							<span className="text-xs">Admin: All Users</span>
						) : (
							<span className="text-xs">All Agency</span>
						)}
					</div>
					<div className={style.section_filtersWrap}>
						<button className={style.button} onClick={handleAddNewUserModal}>
							<FaPlus className="text-blue-600 mr-2" size={12} />
							Add User
						</button>
					</div>
				</div>
				<div className={style.table_main}>
					<div className="flex flex-col h-full">
						<InfiniteScroll
							className="overflow-x-auto"
							dataLength={endIndex}
							inverse={false}
							scrollableTarget="scrollableDiv">
							<table className="min-w-full bg-white rounded-xl p-1">
								<thead className="border-b dark:border-indigo-100 bg-slate-100">
									<tr>
										<th scope="col" className={tableHeading.default}>
											Name
										</th>
										<th scope="col" className={tableHeading.default_center}>
											Email
										</th>
										<th scope="col" className={tableHeading.default_center}>
											Join Date
										</th>
										{customClaims.admin && (
											<th scope="col" className={tableHeading.default_center}>
												Agency
											</th>
										)}
										{customClaims.admin && (
											<th scope="col" className={tableHeading.default_center}>
												Role
											</th>
										)}
										<th scope="col" className={tableHeading.default_center}>
											Banned
										</th>
										<th scope="col" className={tableHeading.default_center}>
											Disabled
										</th>
										{customClaims.admin && (
											<th
												scope="col"
												colSpan={2}
												className={tableHeading.default_center}>
												Delete
											</th>
										)}
									</tr>
								</thead>
								<tbody>
									{isLoading ? (
										<tr>
											<td colSpan="100%" className="text-center">
												{' '}
												{/* Ensure it spans all columns */}
												<div className="flex justify-center items-center h-32">
													{' '}
													{/* Adjust height as needed */}
													Loading...{' '}
													{/* You can replace this with a spinner or any loading animation */}
												</div>
											</td>
										</tr>
									) : (
										loadedMobileUsers.map((userObj, key) => {
											// Directly access user details and user ID
											let userId = userObj.mobileUserId
											let joined = userObj.joiningDate
											joined = joined * 1000
											joined = new Date(joined)
											joined = joined.toLocaleString('en-US', dateOptions)
											return (
												<tr
													className="border-b transition duration-300 ease-in-out dark:border-indigo-100"
													key={key}
													onClick={
														customClaims.admin
															? () => handleEditUser(userObj, userId)
															: undefined
													}>
													{/* Name */}
													<td scope="row" className={column.data}>
														{userObj.name}
													</td>
													{/* TODO: add geopoint fields as a column in table. */}
													{/* Email */}
													<td className={column.data_center}>
														{userObj.email}
													</td>
													{/* Joined date */}
													<td className={column.data_center}>{joined}</td>
													{/* Agency */}
													{customClaims.admin && (
														<td className={column.data_center}>
															{userObj.agencyName}
														</td>
													)}
													{/* Role */}
													{customClaims.admin && (
														<td className={column.data_center}>
															{userObj.userRole}
														</td>
													)}
													{/* Banned */}
													<td className={column.data_center}>
														{(userObj.isBanned && 'yes') || 'no'}
													</td>
													<td className={column.data_center}>
														{userObj.disabled ? 'Yes' : 'No'}
													</td>
													{/* Delete */}
													{customClaims.admin && (
														<td
															className={column.data_center}
															onClick={(e) => e.stopPropagation()}>
															<button
																onClick={() => handleMobileUserDelete(userId)}
																className={`${style.icon} tooltip-delete-user`}>
																<IoTrash
																	size={20}
																	className="ml-4 fill-gray-400 hover:fill-red-600"
																/>
																<Tooltip
																	anchorSelect=".tooltip-delete-user"
																	place="top"
																	delayShow={500}>
																	Delete User
																</Tooltip>
															</button>
														</td>
													)}
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</InfiniteScroll>
						<div className="mt-2 self-end text-xs">
							Total users: {loadedMobileUsers.length}
						</div>
					</div>
				</div>
			</div>
			{deleteModal && (
				<ConfirmModal
					func={handleDelete}
					title="Are you sure you want to delete this user?"
					subtitle=""
					CTA="Delete"
					closeModal={setDeleteModal}
				/>
			)}
			{userEditModal && (
				<EditUserModal
					// User
					userId={userId}
					userEditing={userEditing}
					// Claims
					customClaims={customClaims}
					// Modal
					setUserEditModal={setUserEditModal}
					// Name
					name={name}
					onNameChange={handleNameChange}
					// agency
					agenciesArray={agenciesArray}
					selectedAgency={selectedAgency}
					agencyName={agencyName}
					onAgencyChange={handleAgencyChange}
					// Role
					onRoleChange={handleRoleChange}
					userRole={userRole}
					setUserRole={setUserRole}
					// Email
					email={email}
					onEmailChange={handleEmailChange}
					// Banned
					banned={banned}
					setBanned={setBanned}
					onBannedChange={handleBannedChange}
					// Form submit
					onFormSubmit={handleFormSubmit}
				/>
			)}
			{newUserModal && (
				<NewUserModal
					setNewUserModal={setNewUserModal}
					// newUserName={newUserName}
					// onNewUserName={handleNewUserName}
					newUserEmail={newUserEmail}
					onNewUserEmail={handleNewUserEmail}
					// onNewAgencyState={handleNewAgencyState}
					// onNewAgencyCity={handleNewAgencyCity}
					onFormSubmit={handleAddNewUserFormSubmit}
					errors={errors}
				/>
			)}
		</div>
	)
}

export default Users
