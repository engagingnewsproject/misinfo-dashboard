/**
 * @fileoverview Users Management Component - Comprehensive user administration interface
 * 
 * This component provides a complete user management interface for administrators
 * to view, edit, and manage users across the misinformation dashboard. Key features include:
 * - User listing with infinite scroll and real-time data
 * - Role-based access control (Admin, Agency, User)
 * - User editing with role and agency management
 * - User creation with email invitation system
 * - User deletion with confirmation
 * - Agency association management
 * - User status tracking (banned, disabled)
 * - Real-time data fetching from Firebase Auth and Firestore
 * - Role-based UI rendering (admin vs agency views)
 * - Data validation and error handling
 * 
 * The component integrates with multiple modals for different operations:
 * - EditUserModal: Edit existing users
 * - NewUserModal: Create new users
 * - ConfirmModal: Delete confirmation
 * 
 * Role-based functionality:
 * - Admins: Full access to all users, can edit roles, assign agencies, delete users
 * - Agency users: Limited view of users within their agency
 * - Real-time updates when user data changes
 * 
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useContext } from 'react'
import { useAuth } from '../../context/AuthContext'
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
	arrayUnion,
	limit, 
	startAfter,
} from 'firebase/firestore'
import { db, auth } from '../../config/firebase'
import { Tooltip } from 'react-tooltip'
import { IoTrash } from 'react-icons/io5'
import InfiniteScroll from 'react-infinite-scroll-component'
import ConfirmModal from '../modals/common/ConfirmModal'
import EditUserModal from '../modals/admin/EditUserModal'
import NewUserModal from '../modals/admin/NewUserModal'
import { FaPlus } from 'react-icons/fa'
import globalStyles from '../../styles/globalStyles'

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

/**
 * Users Component - Comprehensive user management interface
 * 
 * This component provides a complete user administration interface with role-based
 * access control. It handles user listing, editing, creation, and deletion with
 * real-time data synchronization between Firebase Auth and Firestore.
 * 
 * Key functionality:
 * - Display users in a table with infinite scroll
 * - Role-based UI rendering (admin vs agency views)
 * - User editing with role and agency management
 * - User creation with email invitation system
 * - User deletion with confirmation
 * - Agency association management
 * - Real-time data updates
 * - User status tracking (banned, disabled)
 * 
 * Role-based access:
 * - Admins: Full access to all users and operations
 * - Agency users: Limited view of users within their agency
 * 
 * @returns {JSX.Element} The Users management component
 */
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

	// User data management state
	const [userRole, setUserRole] = useState('') // Current user's role being edited
	const [loadedMobileUsers, setLoadedMobileUsers] = useState([]) // List of all users
	const [isLoading, setIsLoading] = useState(false) // Loading state for data fetching
	const [endIndex, setEndIndex] = useState(0) // Pagination index for infinite scroll
	const [deleteModal, setDeleteModal] = useState(false) // Delete confirmation modal
	const [userEditing, setUserEditing] = useState([]) // User data being edited
	const [name, setName] = useState('') // User name being edited
	const [email, setEmail] = useState('') // User email being edited
	
	// Agency management state
	const [agencyName, setAgencyName] = useState('') // Agency name for user
	const [agencyId, setAgencyId] = useState('') // Agency ID for user
	const [agenciesArray, setAgenciesArray] = useState([]) // List of all agencies
	const [selectedAgency, setSelectedAgency] = useState('') // Currently selected agency
	const [banned, setBanned] = useState(false) // User banned status
	const [userEditModal, setUserEditModal] = useState(null) // User edit modal state
	const [userId, setUserId] = useState(null) // Current user ID being edited
	const [update, setUpdate] = useState('') // Trigger for data refresh
	
	// New user creation state
	const [newUserModal, setNewUserModal] = useState(false) // New user modal state
	const [data, setData] = useState({ email: '' }) // New user data
	const [newUserEmail, setNewUserEmail] = useState('') // New user email
	const [errors, setErrors] = useState({}) // Form validation errors

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
	 * Fetches the Firestore Auth details of a user by their user ID and determines if the user is disabled.
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
			// Get Firestore Auth user details
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

	const USERS_PER_PAGE = 10; // Number of users to fetch per page

const getInitialUsers = async () => {
	setIsLoading(true);
	const userQuery = query(
		collection(db, 'mobileUsers'),
		limit(USERS_PER_PAGE)
	);

	try {
		const querySnapshot = await getDocs(userQuery);
		const users = querySnapshot.docs.map(doc => ({
			mobileUserId: doc.id,
			...doc.data(),
		}));

		setLoadedMobileUsers(users);

		// Set the last visible document for pagination
		const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
		setLastVisible(lastVisibleDoc);

		// If less than USERS_PER_PAGE were fetched, no more users are available
		if (querySnapshot.docs.length < USERS_PER_PAGE) {
			setHasMore(false);
		}

		setIsLoading(false);
	} catch (error) {
		console.error("Error fetching users:", error);
		setIsLoading(false);
	}
};

useEffect(() => {
	getInitialUsers(); // Fetch users when the component mounts
}, []);

const fetchMoreUsers = async () => {
	if (!lastVisible || !hasMore || isLoading) return; // Prevent fetching if already loading or no more users

	setIsLoading(true);

	const nextUserQuery = query(
		collection(db, 'mobileUsers'),
		startAfter(lastVisible), // Start after the last loaded document
		limit(USERS_PER_PAGE)
	);

	try {
		const querySnapshot = await getDocs(nextUserQuery);
		const users = querySnapshot.docs.map(doc => ({
			mobileUserId: doc.id,
			...doc.data(),
		}));

		// Append newly loaded users to the existing list
		setLoadedMobileUsers((prevUsers) => [...prevUsers, ...users]);

		// Update the last visible document for the next batch
		const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
		setLastVisible(lastVisibleDoc);

		// If less than USERS_PER_PAGE were fetched, no more users are available
		if (querySnapshot.docs.length < USERS_PER_PAGE) {
			setHasMore(false);
		}

		setIsLoading(false);
	} catch (error) {
		console.error("Error fetching more users:", error);
		setIsLoading(false);
	}
};

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
	 * Handles the change event for the "New User Email" input field.
	 *
	 * This function updates the `newUserEmail` state with the value entered in the input field.
	 * It also clears any existing email-related error in the `errors` state as soon as the user starts typing,
	 * ensuring that the error message is removed when the user re-enters the input field.
	 *
	 * @param {Event} e - The event object from the input field.
	 */
	const handleNewUserEmail = (e) => {
		setNewUserEmail(e.target.value)
		// Clear the email-related error when the user starts typing
		setErrors((prevErrors) => ({
			...prevErrors,
			email: '', // Clear the email error
		}))
	}

	/**
	 * Handles the submission of the form to add a new user.
	 *
	 * This function is responsible for managing the entire process of adding a new user.
	 * It first prevents the default form submission behavior and clears any existing errors.
	 * The function then validates the new user's email address to ensure it meets the minimum
	 * length requirement (at least 15 characters). If the email is valid, the function attempts
	 * to send a sign-in link to the provided email address.
	 *
	 * After successfully sending the sign-in link, the function adds the new user's email to the
	 * `agencyUsers` array in the corresponding Firestore agency document, provided that the
	 * `agencyId` is valid. If any part of this process fails, the error is caught and handled by
	 * updating the `errors` state with the appropriate message.
	 *
	 * Finally, if all operations succeed, the function triggers a state update to refresh the user list
	 * and closes the modal.
	 *
	 * @param {Event} e - The event object from the form submission.
	 * @returns {Promise<void>} A promise that resolves after the sign-in email is sent, the user's email
	 * is added to the Firestore agency document, and the modal is closed. If an error is encountered,
	 * it is handled and displayed in the form.
	 */
	const handleAddNewUserFormSubmit = async (e) => {
		e.preventDefault()
		try {
			// Clear previous errors
			setErrors({})

			// Validate the email length before sending the sign-in link
			if (newUserEmail.length < 15) {
				setErrors((prevErrors) => ({
					...prevErrors,
					// Error message shown to user
					email: 'Email should be at least 15 characters long',
				}))
				return // Stop the form submission if there's a validation error
			}

			await sendSignIn(newUserEmail)

			// Add the new user's email to the agency's `agencyUsers` array in Firestore
			// Validate agencyId before proceeding
			if (!agencyId || agencyId.trim() === '') {
				throw new Error('Invalid or missing agency ID')
			}
			const agencyRef = doc(db, 'agency', agencyId)
			console.log(agencyRef)
			await updateDoc(agencyRef, {
				agencyUsers: arrayUnion(newUserEmail),
			})

			setUpdate(!update)
			setNewUserModal(false)
		} catch (error) {
			console.error('Error in handleAddNewUserFormSubmit:', error.message)

			// Set the error message in the errors state
			setErrors((prevErrors) => ({
				...prevErrors,
				email: error.message,
			}))
		}
	}

	/**
	 * useEffect hook that runs once on component mount to fetch relevant data based on the user's role.
	 *
	 * This hook triggers different functions depending on whether the logged-in user is an admin or an agency user.
	 *
	 * - Admin Users: Fetches all agencies and user data.
	 * - Agency Users: Fetches the details of the logged-in user's agency and then retrieves the associated user data.
	 *
	 * The hook runs once on the initial render and checks the user's role (admin or agency) to determine which data to fetch.
	 *
	 * @effect This hook runs once on the initial render and performs the following:
	 * - If the user is an admin, it fetches all agencies and user data.
	 * - If the user is an agency user, it fetches the specific agency details associated with the user's email, stores the agency ID and name, and then fetches the user data related to that agency.
	 */
	useEffect(() => {
		const fetchInitialData = async () => {
			if (customClaims.admin) {
				// Admin: Fetch all agencies and user data
				await fetchAgencies()
				await getData()
			} else if (customClaims.agency) {
				// Agency user: Fetch only the agency details and user data
				const agencySnapshot = await getDocs(
					query(
						collection(db, 'agency'),
						where('agencyUsers', 'array-contains', user.email.toLowerCase()),
					),
				)

				if (!agencySnapshot.empty) {
					const agencyDoc = agencySnapshot.docs[0]
					const agencyId = agencyDoc.id
					const agencyName = agencyDoc.data().name
					console.log(agencyDoc)
					console.log(agencyId)
					console.log(agencyName)
					// Store the agency ID and name in state or context
					setAgencyId(agencyId)
					setAgencyName(agencyName)

					await getData()
					// Fetch data relevant to this agency
					// await getData(agencyId) // Pass the agencyId to fetch data for this agency
				} else {
					console.error('No agency found for the current user.')
				}
			}
		}

		fetchInitialData()
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
	 * to prevent duplicates. If not, it appends the email to the array. This ensures that
	 * users are properly associated with their assigned agencies for role-based access control.
	 *
	 * @param {string} email - The email of the user to add to the agency
	 * @param {string} agencyId - The ID of the agency to which the user should be added
	 * @returns {Promise<void>} Promise that resolves when the user is added to the agency
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
				{/* Data status legend for admins - shows data consistency issues */}
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
									<tr className="border-b transition duration-300 ease-in-out dark:border-indigo-100">
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
									{/* Loading state - shows spinner while fetching user data */}
									{isLoading ? (
										<tr>
											<td colSpan="100%" className="text-center">
												<div className="flex justify-center items-center h-32">
													Loading...
												</div>
											</td>
										</tr>
									) : (
										// Render user rows with role-based conditional rendering
										loadedMobileUsers.map((userObj, key) => {
											// Extract user ID for operations
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
													{/* User name column */}
													<td scope="row" className={column.data}>
														{userObj.name}
													</td>
													{/* User email column */}
													<td className={column.data_center}>
														{userObj.email}
													</td>
													{/* User join date column */}
													<td className={column.data_center}>
														{userObj.joined}
													</td>
													{/* Agency column - only visible to admins */}
													{customClaims.admin && (
														<td className={column.data_center}>
															{userObj.agencyName}
														</td>
													)}
													{/* User role column - only visible to admins */}
													{customClaims.admin && (
														<td className={column.data_center}>
															{userObj.userRole}
														</td>
													)}
													{/* User banned status column */}
													<td className={column.data_center}>
														{(userObj.isBanned && 'yes') || 'no'}
													</td>
													{/* User disabled status column */}
													<td className={column.data_center}>
														{userObj.disabled ? 'Yes' : 'No'}
													</td>
													{/* Delete action column - only visible to admins */}
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
			{/* Delete confirmation modal */}
			{deleteModal && (
				<ConfirmModal
					func={handleDelete}
					title="Are you sure you want to delete this user?"
					subtitle=""
					CTA="Delete"
					closeModal={setDeleteModal}
				/>
			)}
			{/* User editing modal */}
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
			{/* New user creation modal */}
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