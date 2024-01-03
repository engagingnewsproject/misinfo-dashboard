import React, { useState, useEffect, useContext } from "react"
import { useAuth } from "../context/AuthContext"
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
} from "firebase/firestore"
import { db, auth } from "../config/firebase"
import ReactTooltip from "react-tooltip"
import { IoTrash } from "react-icons/io5"
import InfiniteScroll from "react-infinite-scroll-component"
import ConfirmModal from "./modals/ConfirmModal"
import EditUserModal from "./modals/EditUserModal"
import Headbar from "./Headbar"

// Profile page that allows the user to edit password or logout of their account
const Users = () => {
	// Initialize authentication context
	const {
		user,
		addAdminRole,
		addAgencyRole,
		addUserRole,
		customClaims,
		setCustomClaims,
	} = useAuth()

	// State variables for managing user data
	const [userRole, setUserRole] = useState("")
	const [loadedMobileUsers, setLoadedMobileUsers] = useState([])
	const [endIndex, setEndIndex] = useState(0)
	const [deleteModal, setDeleteModal] = useState(false)
	const [userEditing, setUserEditing] = useState([])
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [agencyUserAgency, setAgencyUserAgency] = useState("")
	const [currentUserAgency,setCurrentUserAgency] = useState('');
	const [loading,setLoading] = useState(true);
	const [agencyName, setAgencyName] = useState("")
	const [banned, setBanned] = useState("")
	const [userEditClick, setUserEditClick] = useState(null)
	const [userId, setUserId] = useState(null)
	const [update,setUpdate] = useState(false)
	const [listOfUsers, setListOfUsers] =useState([])
	const [search,setSearch] = useState("")


	const dateOptions = {
		day: "2-digit",
		year: "numeric",
		month: "short",
	}
	const tableHeading = {
		default: "px-3 py-1 text-sm font-semibold text-left tracking-wide",
		default_center: "text-center p-2 text-sm font-semibold tracking-wide",
		small: "",
	}
	const column = {
		data: "whitespace-normal text-sm px-3 py-1",
		data_center:
			"whitespace-normal md:whitespace-nowrap text-sm px-3 py-1 text-center",
	}
	const style = {
		icon: "hover:fill-cyan-700",
	}

	const getCurrentUserAgency = async () => {
		// need to itterate over the 'agency' collection 
		// to see if the mobileUser's email is in the
		// 'agency'(s) 'agencyUsers' array
		const agencyCollection = collection(db,'agency')
		const q = query(agencyCollection,where('agencyUsers',"array-contains",user['email']))
		try {
			const querySnapshot = await getDocs(q)

			// Set the current user's agency in the state
			if (!querySnapshot.empty) {
				const agencyName = querySnapshot.docs[0].data()['name']
				setCurrentUserAgency(agencyName)
				return agencyName // Optionally, you can also return the agency name
			} else {
				setCurrentUserAgency('') // Clear the current user's agency if not found
				return '' // Optionally, you can also return an empty string
			}
		} catch (error) {
			console.error('Error fetching data:',error)
			setCurrentUserAgency('') // Clear the current user's agency in case of an error
			return '' // Optionally, you can also return an empty string
		}
	}

	// Function to fetch user data from Firebase
	const getData = async () => {
		
		// ALL users regardless if agency user or admin user
		try {
			// Set loading to true while fetching data
			setLoading(true);
			// Check the current user's agency name
			if (customClaims.agency) {
				// Await the result of getCurrentUserAgency
				const userAgency = await getCurrentUserAgency()
				// console.log('Current user agency: ' + userAgency)

				// Set the list of user's agency names
				setAgencyUserAgency(userAgency)

				// Continue with fetching data only if userAgency is available
				if (!userAgency) {
					return
				}
			} else {
				// Clear the current user's agency if not an agency user
				setCurrentUserAgency('')
				// Clear the list of user's agency names
				setAgencyUserAgency('')
			}
			const mobileUsersQuery = query(collection(db,'mobileUsers'))
			const mobileUsersQuerySnapshot = await getDocs(mobileUsersQuery)

			const mobileUsersArray = []

			// Build list of mobileUsers
			// Iterate over each mobile user 
			for (const doc of mobileUsersQuerySnapshot.docs) {
				const userData = {
					id: doc.id,
					data: doc.data()
				};

				// Check if the user is associated with any agency
				const agencyRef = collection(db,'agency')
				const agencyQuery = query(agencyRef,where('agencyUsers','array-contains',userData.data.email))
				const agencySnapshot = await getDocs(agencyQuery);
				if (!agencySnapshot.empty) {
					const agencyData = agencySnapshot.docs[0].data()
					userData.data.agencyName = agencyData.name;

					// Log the user and agency for debugging
					// console.log(
					// 	'Logged in user agency: ' +
					// 	currentUserAgency +
					// 	', User: ' +
					// 	userData.data.email +
					// 	', Agency: ' +
					// 	userData.data.agencyName
					// )

					// If currentUserAgency is defined and doesn't match, skip this user
					if (currentUserAgency && userData.data.agencyName !== currentUserAgency) {
						// console.log('Skipping user:: ' + userData.data.email)
						continue
					}
					// Set loading to false after data is loaded
					setLoading(false)
				}

				mobileUsersArray.push(userData)
			}

			// FINAL SET loadedMobileUsers
			setLoadedMobileUsers(mobileUsersArray)
			// Set loading to false after data is loaded
			setLoading(false);
		} catch (error) {
			console.error('Error in getData:',error)
			// Set loading to false in case of an error
			setLoading(false);
		}
	};

	useEffect(() => {
		const fetchData = async () => {
			// Ensure that currentUserAgency is updated before calling getData
			await getData()
		}

		fetchData()
	},[currentUserAgency]) // Watch for changes in currentUserAgency and re-run the effect


	// Function to trigger delete user modal
	const handleMobileUserDelete = async (userId) => {
		setDeleteModal(true)
		setUserId(userId)
	}

	// Function to handle user deletion
	const handleDelete = async (e) => {
		e.preventDefault()
		const docRef = doc(db, "mobileUsers", userId)
		deleteDoc(docRef)
			.then(() => {
				getData()
				setDeleteModal(false)
				// TODO: Delete user from Firebase authentication console
			})
			.catch((error) => {
				console.log("The write failed" + error)
			})
	}

	// Function to handle opening and setting values in the EditUserModal
	const handleEditUser = async (userObj, userId) => {
		setUserId(userId)
		const userRef = await getDoc(doc(db, "mobileUsers", userId))
		setUserEditing(userObj)
		setName(userRef.data()["name"])
		setEmail(userRef.data()["email"])
		setBanned(userRef.data()["isBanned"])
		setUserRole(userRef.data()["userRole"])
		setUserEditClick(true)
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
	const handleOptionChange = (e) => {
		setUserRole(e.target.value)
	}

	// Function to handle banned status change
	const handleBannedChange = (e) => {
		setBanned(!banned)
	}

	// Function to handle form submission (updating user data)
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		// User Role change
		auth.currentUser
			.getIdTokenResult()
			.then((idTokenResult) => {
				// Confirm the user is an Admin.
				if (!!idTokenResult.claims.admin) {
					// Change the selected user's privileges as requested
					if (userRole === "Admin") {
						console.log(addAdminRole({ email: user.email }))
					} else if (userRole === "Agency") {
						console.log(addAgencyRole({ email: user.email }))
					} else if (userRole === "User") {
						console.log(addUserRole({ email: user.email }))
					}
					setUserRole(userRole)
				}
			})
			.catch((error) => {
				console.log(error)
			})
		// Name change
		const docRef = doc(db, "mobileUsers", userId)
		await updateDoc(docRef, {
			name: name,
			email: email,
			isBanned: banned,
			userRole: userRole,
		})

		setUserEditClick(false)
	}
	
	// Data fetch on update
	useEffect(() => {
		getData()
	}, [update])

	return (
		<div className='w-full h-full flex flex-col py-5'>
			<Headbar search={search} setSearch={setSearch} customClaims={customClaims} user={user} />
			<div
				className='w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto'
				id='scrollableDiv'>
				<div className='flex flex-col pb-5 md:justify-start'>
					{customClaims.agency ? (
						<span className='text-xs'>{agencyName}</span>
					) : (
						<span className='text-xs'>All Agency</span>
					)}
					<div className='text-center md:text-left text-lg font-bold text-blue-600 tracking-wider pb-2 md:pb-0'>
						Users
					</div>
				</div>
				<div className='flex flex-col h-full'>
					{/* Display loading message or spinner while data is loading */}
					{loading && <p>Loading...</p>}
					{/* Display the table when data is loaded */}
					{!loading && (
					<InfiniteScroll
						className='overflow-x-auto'
						dataLength={endIndex}
						inverse={false}
						scrollableTarget='scrollableDiv'>
						<table className='min-w-full bg-white rounded-xl p-1'>
							<thead className='border-b dark:border-indigo-100 bg-slate-100'>
								<tr>
									<th scope='col' className={tableHeading.default}>
										Name
									</th>
									<th scope='col' className={tableHeading.default_center}>
										Email
									</th>
									{/* {customClaims.admin && ( */}
										<th scope='col' className={tableHeading.default_center}>
											Agency
										</th>
									{/* )} */}
									<th scope='col' className={tableHeading.default_center}>
										Join Date
									</th>
									{customClaims.admin && (
										<th scope='col' className={tableHeading.default_center}>
											Role
										</th>
									)}
									<th scope='col' className={tableHeading.default_center}>
										Banned
									</th>
									{customClaims.admin && (
										<th
											scope='col'
											colSpan={2}
											className={tableHeading.default_center}>
											Delete
										</th>
									)}
								</tr>
							</thead>
							<tbody>
								{loadedMobileUsers.map((userObj, key) => {
									// Directly access user details and user ID
									const userId = userObj.id;
									const listUser = userObj.data;
									let posted = listUser.joiningDate
									// Get list user agency uid & display agency name
									posted = posted * 1000
									posted = new Date(posted)
									posted = posted.toLocaleString("en-US", dateOptions)
									return (
										<tr
												className='border-b transition duration-300 ease-in-out dark:border-indigo-100'
												key={key}
												onClick={
													customClaims.agency
															? () => handleEditUser(listUser, userId)
															: undefined
												}>
											{/* Name */}
											<td scope='row' className={column.data}>
												{listUser.name}
											</td>
											{/* TODO: add geopoint fields as a column in table. */}
											{/* Email */}
											<td className={column.data_center}>{listUser.email}</td>
											{/* Agency */}
											{/* {customClaims.admin && ( */}
												<td className={column.data_center}>{listUser.agencyName}</td>
											{/* )} */}
											{/* Joined date */}
											<td className={column.data_center}>{posted}</td>
											{/* Role */}
											{customClaims.admin && (
												<td className={column.data_center}>
													{listUser.userRole}
												</td>
											)}
											{/* Banned */}
											<td className={column.data_center}>
												{(userObj.isBanned && "yes") || "no"}
											</td>
											{/* Delete */}
											{customClaims.admin && (
												<td
													className={column.data_center}
													onClick={(e) => e.stopPropagation()}>
													<button
														onClick={() => handleMobileUserDelete(userId)}
														data-tip='Delete user'
														className={style.icon}>
														<IoTrash
															size={20}
															className='ml-4 fill-gray-400 hover:fill-red-600'
														/>
														<ReactTooltip
															place='top'
															type='light'
															effect='solid'
															delayShow={500}
														/>
													</button>
												</td>
											)}
										</tr>
									)
								})}
							</tbody>
						</table>
					</InfiniteScroll>
					)}
					<div className='mt-2 self-end text-xs'>
						Total users: {loadedMobileUsers.length}
					</div>
				</div>
			</div>
			{deleteModal && (
				<ConfirmModal
					func={handleDelete}
					title='Are you sure you want to delete this user?'
					subtitle=''
					CTA='Delete'
					closeModal={setDeleteModal}
				/>
			)}
			{userEditClick && (
				<EditUserModal
					customClaims={customClaims}
					userRole={userRole}
					setUserRole={setUserRole}
					setUserEditClick={setUserEditClick}
					userId={userId}
					name={name}
					onNameChange={handleNameChange}
					agencyUserAgency={agencyUserAgency}
					// onAgencyChange={handleAgencyChange}
					email={email}
					onEmailChange={handleEmailChange}
					banned={banned}
					setBanned={setBanned}
					onBannedChange={handleBannedChange}
					onFormSubmit={handleFormSubmit}
					onOptionChange={handleOptionChange}
					userEditing={userEditing} // All mobileUser
				/>
			)}
		</div>
	)
}

export default Users
