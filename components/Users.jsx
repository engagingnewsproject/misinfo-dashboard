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

/**
 * Retrieves the user's join date based on available data.
 *
 * This function determines the user's join date by checking the `joiningDate` field in the Firestore
 * user document (`firestoreUser`). If the `joiningDate` is present, it is converted to a human-readable
 * format. If the `joiningDate` is not available, the function falls back to using the `creationTime`
 * from the user's Firebase Auth metadata (`authUser`). If neither source provides a date, it returns 
 * a default message indicating that no date is available.
 *
 * @param {Object} firestoreUser - The Firestore document data for the user, containing a possible `joiningDate` field.
 * @param {Object} authUser - The Firebase Auth user object, containing metadata like `creationTime`.
 * @returns {string} The user's join date formatted as a human-readable string, or 'No Date' if unavailable.
 */
const getJoinedDate = (firestoreUser, authUser) => {
    if (firestoreUser && firestoreUser.joiningDate) {
        // If Firestore user data exists and has a 'joiningDate', use it
        return new Date(firestoreUser.joiningDate * 1000).toLocaleString('en-US', dateOptions);
    } else if (authUser) {
        // Otherwise, use 'metadata.creationTime' from the Auth user
        return new Date(authUser.metadata.creationTime).toLocaleString('en-US', dateOptions);
    } else {
        // Fallback if neither is available
        return 'No Date';
    }
};

/**
 * Sorts an array of users by their join date in descending order.
 *
 * This function takes an array of user objects and sorts them based on their `joined` date.
 * The sorting is done in descending order, so users with the most recent join date will appear first.
 * The `joined` date is expected to be a string that can be converted into a Date object.
 *
 * @param {Array<Object>} users - An array of user objects, each containing a `joined` date field.
 * @returns {Array<Object>} The sorted array of users, with the most recently joined users first.
 */
const sortByJoinedDate = (users) => {
    return users.sort((a, b) => new Date(b.joined) - new Date(a.joined));
};

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
		authGetUserList,
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
	const [agencyName, setAgencyName] = useState('')
	const [agenciesArray, setAgenciesArray] = useState([])
	const [selectedAgency, setSelectedAgency] = useState('')
	const [banned, setBanned] = useState(false)
	const [userEditModal, setUserEditModal] = useState(null)
	const [userId, setUserId] = useState(null)
	const [update, setUpdate] = useState('')
	// Add new user
	const [newUserModal, setNewUserModal] = useState(false)
	const [data, setData] = useState({
		email: '',
	})
	const [newUserEmail, setNewUserEmail] = useState('')
	const [errors, setErrors] = useState({})

	/**
	 * Fetches all agency documents from the Firestore 'agency' collection
	 * and stores them in an array with their ID and name.
	 *
	 * This function retrieves all the documents from the 'agency' collection in Firestore.
	 * It then maps each document to an object containing its ID and name. The resulting
	 * array of agencies is stored in the component's state using the `setAgenciesArray` function.
	 *
	 * @returns {Promise<void>} A promise that resolves when the agencies have been fetched
	 * and stored in the `agenciesArray` state.
	 */
	const fetchAgencies = async () => {
		const snapshot = await getDocs(collection(db, 'agency'))
		const agencies = snapshot.docs.map((doc) => ({
			id: doc.id,
			name: doc.data().name,
		}))
		// console.log(agencies);
		setAgenciesArray(agencies)
	}

	/**
	 * Fetches the user IDs associated with a specific agency from the Firestore 'reports' collection.
	 *
	 * This function queries the 'reports' collection in Firestore for documents where the 'agency'
	 * field matches the provided agency name. It then maps each document to the user ID found in
	 * the 'userID' field of the report and returns an array of these user IDs.
	 *
	 * @param {string} agencyName - The name of the agency for which to fetch user IDs.
	 * @returns {Promise<string[]>} A promise that resolves to an array of user IDs associated with the specified agency.
	 */
	const getAgencyUserIds = async (agencyName) => {
		const reportQuery = query(
			collection(db, 'reports'),
			where('agency', '==', agencyName),
		)
		const reportSnapshot = await getDocs(reportQuery)
		const userIds = reportSnapshot.docs.map((doc) => doc.data().userID)
		// console.log("User IDs from reports:", userIds); // Verify the IDs being captured
		return userIds
	}

	/**
	 * Filters the given list of users by the agency associated with the provided user email.
	 *
	 * This function queries the 'agency' collection in Firestore to find an agency that
	 * includes the provided user's email. It then retrieves the user IDs associated with
	 * that agency and filters the input user list to include only those users whose
	 * IDs match the retrieved agency user IDs.
	 *
	 * @param {Array} users - An array of user objects to be filtered. Each user object should contain a `mobileUserId` property.
	 * @param {string} userEmail - The email of the user whose agency is being queried.
	 * @returns {Promise<Array>} A promise that resolves to an array of filtered user objects associated with the user's agency.
	 */
	const filterUsersByAgency = async (users, userEmail) => {
		const q = query(
			collection(db, 'agency'),
			where('agencyUsers', 'array-contains', userEmail),
		)
		const querySnapshot = await getDocs(q)
		if (querySnapshot.docs.length > 0) {
			const agencyName = querySnapshot.docs[0].data().name // Assuming the first result is the correct one

			const userIds = await getAgencyUserIds(agencyName) // Retrieve user IDs for this agency
			const filteredUsers = users.filter((user) =>
				userIds.includes(user.mobileUserId),
			)
			// console.log("Filtered users:", filteredUsers); // Log the filtered users for debugging
			return filteredUsers
		} else {
			console.log('No agency found for this user.')
			return [] // Return an empty array if no agency is found
		}
	}

	/**
	 * Fetches the details of a user by their user ID and determines if the user is disabled.
	 *
	 * This function attempts to fetch the user record associated with the provided user ID.
	 * If the record is successfully retrieved, it checks if the user is disabled. If an error
	 * occurs during the fetch, the function assumes the user is disabled and logs the error.
	 *
	 * @param {string} userId - The unique identifier of the user whose details are being fetched.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if the user is disabled or
	 * if an error occurs during the fetch, and `false` if the user is not disabled.
	 */
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

	/**
	 * Asynchronous function to fetch and process user data from Firestore and Firebase Auth.
	 *
	 * This function is responsible for retrieving a list of users, either from Firestore's `mobileUsers`
	 * collection or from Firebase Auth, depending on the user's role (Agency or Admin). It processes
	 * and combines the user data, including additional fields like `joined` and `disabled`, and sets
	 * the processed data into the component's state.
	 *
	 * For Agency users:
	 * - Fetches users from Firestore's `mobileUsers` collection.
	 * - Filters users by the agency associated with the logged-in user's email.
	 * - Sets the filtered and sorted list of users into the component's state.
	 *
	 * For Admin users:
	 * - Fetches users from both Firebase Auth and Firestore's `mobileUsers` collection.
	 * - Combines and processes data from both sources.
	 * - Sets the combined and sorted list of users into the component's state.
	 *
	 * @async
	 * @function
	 * @returns {Promise<void>} This function does not return a value, but updates the component's state.
	 *
	 * @throws Will log an error to the console if the data fetching or processing fails.
	 */
	const getData = async () => {
		setIsLoading(true)
		try {
			// Pull firestore `mobileUsers` list of users
			const mobileUsersQuerySnapshot = await getDocs(
				collection(db, 'mobileUsers'),
			)

			if (customClaims.agency) {
				// Agency user is viewing Users table

				const mobileUsersArr = await Promise.all(
					mobileUsersQuerySnapshot.docs.map(async (doc) => {
						const userData = doc.data()
						userData.mobileUserId = doc.id
						userData.disabled = await fetchUserDetails(doc.id)

						// Only set 'joined' if 'joiningDate' exists
						userData.joined = getJoinedDate(userData, null)
						return userData
					}),
				)

				// Here you need to await the filterUsersByAgency because it's async
				const filteredUsers = await filterUsersByAgency(
					mobileUsersArr,
					user.email,
				)

				// Ensure filteredUsers is always an array
				setLoadedMobileUsers(sortByJoinedDate(filteredUsers) || [])
				// Admin only
			} else {
				const result = await authGetUserList() // Call the function from context
				// Pull auth list of users
				const usersFromAuth = result.data.users
				const mobileUsersMap = new Map()
				mobileUsersQuerySnapshot.forEach((doc) => {
					const userData = doc.data() // mobileUsers data
					userData.mobileUserId = doc.id // mobileUsers doc id
					mobileUsersMap.set(doc.id, userData) // mobileUsers map list
				})

				// Combine data from Auth and Firestore
				const combinedUsers = usersFromAuth.map((authUser) => {
					const firestoreUser = mobileUsersMap.get(authUser.uid) // auth user data
					return {
						...authUser,
						...firestoreUser,
						hasFirestoreDoc: !!firestoreUser,
						// Use metadata.creationTime for the joined date
						joined: getJoinedDate(firestoreUser, authUser),
					}
				})
				// TODO: get each users agency name
				//
				// Sort users by the 'joined' date
				setLoadedMobileUsers(sortByJoinedDate(combinedUsers)) // array combination of mobileUsers doc and auth user info
			}
		} catch (error) {
			console.error('Failed to fetch or process user data:', error)
		} finally {
			setIsLoading(false)
		}
	}

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

	/**
	 * Handles the event when the "Add New User" button is clicked, opening the modal to add a new user.
	 *
	 * This function prevents the default form submission behavior when the "Add New User" button is clicked.
	 * It then triggers the state change to open the modal for adding a new user by setting `setNewUserModal` to `true`.
	 *
	 * @param {Event} e - The event object from the form submission.
	 */
	const handleAddNewUserModal = (e) => {
		e.preventDefault()
		setNewUserModal(true)
	}

	/**
	 * Handles the submission of the form to add a new user.
	 *
	 * This function prevents the default form submission behavior, sends a sign-in email to the new user's email address,
	 * triggers an update by toggling the `update` state, and then closes the new user modal.
	 *
	 * @param {Event} e - The event object from the form submission.
	 * @returns {Promise<void>} A promise that resolves after the sign-in email is sent and the modal is closed.
	 */
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

	/**
	 * Handles the change event for the "New User Name" input field.
	 *
	 * This function prevents the default form submission behavior and updates the `newUserName` state
	 * with the value entered in the input field.
	 *
	 * @param {Event} e - The event object from the input field.
	 */
	const handleNewUserName = (e) => {
		e.preventDefault()
		setNewUserName(e.target.value)
	}

	/**
	 * Handles the change event for the "New User Email" input field.
	 *
	 * This function prevents the default form submission behavior and updates the `newUserEmail` state
	 * with the value entered in the input field.
	 *
	 * @param {Event} e - The event object from the input field.
	 */
	const handleNewUserEmail = (e) => {
		e.preventDefault()
		setNewUserEmail(e.target.value)
	}

	/**
	 * useEffect hook that runs once on component mount to fetch agencies and data.
	 *
	 * This hook triggers two functions, `fetchAgencies` and `getData`, when the component
	 * first mounts. The `fetchAgencies` function retrieves the list of agencies from the database,
	 * and the `getData` function fetches the initial set of data for the component.
	 *
	 * @effect This hook has no dependencies, so it only runs once on the initial render.
	 */
	useEffect(() => {
		fetchAgencies()
		getData()
	}, [])

	/**
	 * Triggers the delete user modal and sets the user ID for deletion.
	 *
	 * @param {string} userId - The ID of the user to be deleted.
	 */
	const handleMobileUserDelete = async (userId) => {
		setDeleteModal(true)
		setUserId(userId)
	}

	/**
	 * Handles the deletion of a user from the 'mobileUsers' collection in Firestore.
	 *
	 * This function deletes the user document with the given userId and then closes the delete modal.
	 *
	 * @param {Event} e - The event object from the delete action.
	 */
	const handleDelete = async (e) => {
		e.preventDefault()
		const docRef = doc(db, 'mobileUsers', userId)
		await deleteDoc(docRef)
		setDeleteModal(false)
	}

	/**
	 * Opens the EditUserModal and populates it with the user's current data.
	 *
	 * This function sets the user ID, fetches the user data from Firestore, and updates the state
	 * with the user's name, email, role, and agency information. It also determines if the user
	 * is assigned to an agency by performing a case-insensitive email match against the agency's
	 * `agencyUsers` array. The function ensures that the correct agency is selected in the modal
	 * even if there are differences in email capitalization.
	 *
	 * @param {Object} userObj - The object containing user data.
	 * @param {string} userId - The ID of the user to be edited.
	 */
	const handleEditUser = async (userObj, userId) => {
		setUserId(userId)
		const userRef = await getDoc(doc(db, 'mobileUsers', userId))
		setUserEditing(userObj)
		setUserEditModal(true)

		// Retrieve the email from the `mobileUsers` document and convert it to lowercase
		const email = userRef.data().email.toLowerCase()

		// Query all agencies and find the one where the email matches case-insensitively
		const agenciesSnapshot = await getDocs(collection(db, 'agency'))
		let userAgencyDoc = null

		agenciesSnapshot.forEach((doc) => {
			const agencyUsers = doc.data().agencyUsers || []
			// Convert each email in agencyUsers to lowercase and check for a match
			if (agencyUsers.some((userEmail) => userEmail.toLowerCase() === email)) {
				userAgencyDoc = doc
			}
		})

		if (userAgencyDoc) {
			const userAgency = userAgencyDoc.id // Get the document ID
			const agencyName = userAgencyDoc.data().name // Get the agency name from the document data

			console.log('userAgency ID --> ', userAgency)
			console.log('agencyName --> ', agencyName)

			setSelectedAgency(userAgency)
			setAgencyName(agencyName)
		} else {
			setSelectedAgency('')
			setAgencyName('')
		}

		// setSelectedAgency(userAgency || '')
		setName(userRef.data()['name'] ?? '')
		setEmail(userRef.data()['email'])
		setBanned(userRef.data()['isBanned'] ?? false)
		setUserRole(userRef.data()['userRole'] ?? 'User')
	}

	/**
	 * Handles the change event for selecting a new agency in the EditUserModal.
	 *
	 * This function updates the selected agency in the state, removes the user's email from any other agencies,
	 * and adds the user's email to the newly selected agency's `agencyUsers` array in Firestore.
	 *
	 * @param {Event} e - The event object from the agency selection dropdown.
	 */
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

	/**
	 * Handles the change event for the name input field in the EditUserModal.
	 *
	 * This function prevents the default form submission behavior and updates the `name` state
	 * with the value entered in the input field.
	 *
	 * @param {Event} e - The event object from the input field.
	 */
	const handleNameChange = (e) => {
		e.preventDefault()
		setName(e.target.value)
	}

	/**
	 * Handles the change event for the email input field in the EditUserModal.
	 *
	 * This function prevents the default form submission behavior and updates the `email` state
	 * with the value entered in the input field.
	 *
	 * @param {Event} e - The event object from the input field.
	 */
	const handleEmailChange = (e) => {
		e.preventDefault()
		setEmail(e.target.value)
	}

	/**
	 * Handles the change event for the user role selection in the EditUserModal.
	 *
	 * This function triggers the fetching of agencies and updates the `userRole` state
	 * with the selected role.
	 *
	 * @param {string} role - The selected user role.
	 */
	const handleRoleChange = (role) => {
		fetchAgencies()
		setUserRole(role)
	}

	/**
	 * Handles the change event for the banned status toggle in the EditUserModal.
	 *
	 * This function toggles the `banned` state between true and false based on its previous state.
	 *
	 * @param {Event} e - The event object from the banned status toggle.
	 */
	const handleBannedChange = (e) => {
		setBanned((prevBanned) => !prevBanned) // Use a function to toggle based on previous state
	}

	/**
	 * Adds a user's email to the `agencyUsers` array of the specified agency in Firestore.
	 *
	 * This function checks if the user's email is already in the agency's `agencyUsers` array
	 * to prevent duplicates. If not, it appends the email to the array.
	 *
	 * @param {string} email - The email of the user to add to the agency.
	 * @param {string} agencyId - The ID of the agency to which the user should be added.
	 */
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

	/**
	 * Removes a user's email from all agency documents in Firestore where the email is listed in the `agencyUsers` array.
	 *
	 * This function retrieves all agencies where the user's email is listed and removes the email
	 * from the `agencyUsers` array in each of those agency documents.
	 *
	 * @param {string} email - The email of the user to remove from all agencies.
	 */
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

	/**
	 * Handles the form submission to update user data in Firestore.
	 *
	 * This function updates the user's document in the `mobileUsers` collection with the new name, email,
	 * banned status, and user role. It also handles role changes, such as adding or removing admin and agency roles,
	 * and updates the local state to reflect the changes.
	 *
	 * @param {Event} e - The event object from the form submission.
	 */
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

	/**
	 * useEffect hook that triggers the `getData` function whenever the `update` state changes.
	 *
	 * This hook ensures that the `getData` function is called whenever the `update` state is toggled,
	 * allowing the component to re-fetch data and re-render with the latest information.
	 *
	 * @dependency {boolean} update - The state that triggers the data fetching when it changes.
	 */
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
				{!customClaims.agency && (
					<div className="flex items-center gap-2 p-2 bg-white rounded-lg text-xs mb-2">
						<div className="font-bold">Key: </div>
						<div className="flex gap-1 items-center">
							<div className="bg-red-50 p-1">Red:</div>
							<div>Firestore 'mobileUsers' doc missing</div>
						</div>
						<div className="flex gap-1 items-center">
							<div className="bg-yellow-100 p-1">Yellow:</div>
							<div>User disabled in Firebase Auth</div>
						</div>
					</div>
				)}
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

											return (
												<tr
													className={`border-b transition duration-300 ease-in-out dark:border-indigo-100 ${!customClaims.agency && !userObj.hasFirestoreDoc && 'bg-red-50'} ${userObj.disabled && 'bg-yellow-100'}`}
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
													<td className={column.data_center}>
														{userObj.joined}
													</td>
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
