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
import {Tooltip} from "react-tooltip"
import { IoTrash } from "react-icons/io5"
import InfiniteScroll from "react-infinite-scroll-component"
import ConfirmModal from "./modals/ConfirmModal"
import EditUserModal from "./modals/EditUserModal"

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
		getUserByEmail,
		viewRole
	} = useAuth()

	// State variables for managing user data
	const [userRole, setUserRole] = useState("")
	const [loadedMobileUsers, setLoadedMobileUsers] = useState([])
	const [endIndex, setEndIndex] = useState(0)
	const [deleteModal, setDeleteModal] = useState(false)
	const [userEditing, setUserEditing] = useState([])
	const [name, setName] = useState("")
	const [email,setEmail] = useState("")
	// agency
	// table agency
	const [agencyUserAgency,setAgencyUserAgency] = useState("")
	const [agenciesArray, setAgenciesArray] = useState([])
	const [selectedAgency,setSelectedAgency] = useState("")
	// const [agencyUserAgency,setAgencyUserAgency] = useState("")
	// const [agenciesArray, setAgenciesArray] = useState([])
	const [agencyName, setAgencyName] = useState("")
	const [banned, setBanned] = useState("")
	const [userEditModal, setUserEditModal] = useState(null)
	const [userId, setUserId] = useState(null)
	const [update,setUpdate] = useState(false)
	const [listOfUsers, setListOfUsers] = useState([])
	const [userRoleFromUID, setUserRoleFromUID] = useState([])
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

	// Function to fetch user data from Firebase
	const getData = async () => {

		if (customClaims.admin) {
			// List ALL users for admin
			try {
				const mobileUsersQuery = query(collection(db,'mobileUsers'))
				const mobileUsersQuerySnapshot = await getDocs(mobileUsersQuery)

				const mobileUsersArray = []

				// Iterate over each mobile user
				for (const doc of mobileUsersQuerySnapshot.docs) {
					const userData = {
						id: doc.id,
						data: doc.data()
					}
					// console.log(userData)

					// Check if the user is associated with any agency
					const agencyRef = collection(db,'agency')
					const agencyQuery = query(agencyRef,where('agencyUsers','array-contains',userData.data.email))
					const agencySnapshot = await getDocs(agencyQuery)

					if (!agencySnapshot.empty) {
						const agencyData = agencySnapshot.docs[0].data()
						userData.data.agencyName = agencyData.name
						// Set the agency state
						setSelectedAgency(userData.data.agencyName)
					}

					mobileUsersArray.push(userData)
					// console.log(agency)
				}
				// need to itterate over the 'agency' collection 
				// to see if the mobileUser's email is in the 
				// 'agency'(s) 'agencyUsers' array
				setLoadedMobileUsers(mobileUsersArray)
			} catch (error) {
				console.error('Error in getData:',error)
			}
		} else {
			// List users for Agencies
			try {
				const agencyRef = collection(db,'agency')
				const q = query(agencyRef,where('agencyUsers','array-contains',user['email']))

				let agencyName
				const querySnapshot = await getDocs(q)
				querySnapshot.forEach((doc) => { // Set initial values
					agencyName = doc.data()['name']

				})

				// Check if there is at least one document
				if (!querySnapshot.empty) {
					// const firstDocument = querySnapshot.docs[0]
					// const name = firstDocument.data().name

					// Use the 'name' value in another query
					const reportsQuery = query(collection(db,'reports'),where('agency','==',agencyName))
					const reportsQuerySnapshot = await getDocs(reportsQuery)

					// Build an array of 'userID' from the reports documents
					const userIDs = []
					reportsQuerySnapshot.forEach((doc) => {
						const userID = doc.data().userID
						// console.log(userID)

						userIDs.push(userID)
					})

					// Query 'mobileUsers' collection for each 'userID'
					const mobileUsersArray = []
					// Query 'mobileUsers' collection for each userID
					for (const userID of userIDs) {
						const mobileUserDocRef = doc(db,'mobileUsers',userID)
						const mobileUserDocSnapshot = await getDoc(mobileUserDocRef)

						if (mobileUserDocSnapshot.exists()) {
							// Document exists, add it to the array
							mobileUsersArray.push({
								id: mobileUserDocSnapshot.id,
								data: mobileUserDocSnapshot.data()
							})

							// Check to see if user exists
						}
					}
					setLoadedMobileUsers(mobileUsersArray)
				} else {
					console.log('No matching documents.')
				}
			} catch (error) {
				console.error('Error in getData:',error)
			}
		}
		const agenciesQuery = query(collection(db,'agency'))
		const agenciesQuerySnapshot = await getDocs(agenciesQuery)
		const newAgenciesArray = [];

		agenciesQuerySnapshot.forEach((doc) => {
				// doc.data() is never undefined for query doc snapshots
				// console.log(doc.id," => ",doc.data());
				const agencyData = {
						id: doc.id,
						data: doc.data()
				};
				newAgenciesArray.push(agencyData);
		});
		// Set the state variable agenciesArray with the new array
		setAgenciesArray(newAgenciesArray);
	};
	
	// TODO: AGENCIES SELECTOR: need to get the selctor populated with the agency names for an admin user to choose
	
	useEffect(() => {
		getData();
	}, []);

	// Function to trigger delete user modal
	const handleMobileUserDelete = async (userId) => {
		setDeleteModal(true)
		setUserId(userId)
	}

	// Function to handle user deletion
	const handleDelete = async (e) => {
		e.preventDefault()
		const docRef = doc(db, "mobileUsers", userId);
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

	const getUserData = async (email) => {
		// console.log(email); // Ensure you're getting the correct email
		try {
			return await getUserByEmail({ email }) // Pass the email directly
		} catch (error) {
			return console.error("Error fetching user data:", error)
		}
	}
	
	const getAgencies = () => {
	
	}
	
	// MODAL: Function to handle opening and setting values in the EditUserModal
	const handleEditUser = async (userObj, userId) => {
		setUserId(userId)
		const userRef = await getDoc(doc(db,"mobileUsers",userId))
		setUserEditing(userObj)
		try {
			// Role from user email
			const user = await getUserData(userRef.data()["email"])
			if (user.data.customClaims === undefined) {
				console.log('ROLE: user')
				setUserRole('User')
			} else if (user.data.customClaims.agency) {
				console.log('ROLE: agency')
				setUserRole('Agency')
			} else if (user.data.customClaims.admin) {
				console.log('ROLE: admin')
				setUserRole('Admin')
			}
		} catch (error) {
			console.error("Error fetching user editing data:", error)
			// Handle error if needed
		}
		// Fetch and set user agency
		const agencyRef = collection(db,'agency')
		const agencyQuery = query(agencyRef,where('agencyUsers','array-contains',userRef.data()["email"]))
		const agencySnapshot = await getDocs(agencyQuery)
		if (!agencySnapshot.empty) {
			setSelectedAgency(agencySnapshot.docs[0].data().name)
			// const agencyData = agencySnapshot.docs[0].data().name
			// console.log(agencyData)
			// userData.data.agencyName = agencyData.name
			// Set the agency state
			// setAgencyUserAgency(userData.data.agencyName)
		}
		// agencies END
		
		setName(userRef.data()["name"])
		setEmail(userRef.data()["email"])
		setBanned(userRef.data()["isBanned"])
		setSelectedAgency(agencySnapshot.docs[0].data().name)
		// setUserRole(userRef.data()["userRole"])
		setUserEditModal(true)
	}

	const handleAgencyChange = async (e) => {
		e.preventDefault()
		const selectedValue = e.target.value
		setSelectedAgency(selectedValue)
		const selectedAgency = agenciesArray.find(
			(agency) => agency.data.name === selectedValue
		)

		if (selectedAgency) {
			try {
				// Fetch the current data of the agency document to which the user is being added
        const newDocRef = doc(db, "agency", selectedAgency.id); // Use agency ID as document ID
				const newDocSnap = await getDoc(newDocRef)
				if (newDocSnap.exists()) {
					const newAgencyData = newDocSnap.data()
					// Check if the user's email is already in the agencyUsers array of the new agency
					const newAgencyUsers = newAgencyData.agencyUsers || []
					if (!newAgencyUsers.includes(email)) {
						// Fetch all agency documents where the user's email is listed in the agencyUsers array
						const agenciesQuery = query(
							collection(db, "agency"),
							where("agencyUsers", "array-contains", email)
						)
						const agenciesQuerySnapshot = await getDocs(agenciesQuery)
						// Loop through the documents to remove the user's email from their current agency (if any)
						agenciesQuerySnapshot.forEach(async (doc) => {
							const docData = doc.data()
							const updatedAgencyUsers = (docData.agencyUsers || []).filter(
								(userEmail) => userEmail !== email
							)
							await updateDoc(doc.ref, { agencyUsers: updatedAgencyUsers })
						})

						// Update the new agency document by appending the user's email
						const updatedNewAgencyUsers = [...newAgencyUsers, email]
						await updateDoc(newDocRef, { agencyUsers: updatedNewAgencyUsers })
					}
				} else {
					console.log("New agency document does not exist")
				}
			} catch (error) {
				console.error("Error updating agency documents:", error)
			}
		} else {
			console.log("Selected agency not found in agenciesArray")
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
	const handleRoleChange = (e) => {
		setUserRole(e.target.value)
	}

	// Function to handle banned status change
	const handleBannedChange = (e) => {
		setBanned(!banned)
	}

	// Function to handle form submission (updating user data)
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		const docRef = doc(db, "mobileUsers", userId);
		await updateDoc(docRef,{
			name: name,
			email: email,
			isBanned: banned,
			userRole: userRole,
		})
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
					: userObj
			)
		);
		setUserEditModal(false)
		setUpdate(!update)
	}

	// Data fetch on update
	useEffect(() => {
		getData()
	},[update])
	
	// Dev logs
	// useEffect(() => {
		// console.log(userEditing)
		// if (userEditingClaims === undefined) {
		// 	console.log('ROLE: user')
		// 	setUserRole('User')
		// } else if (userEditingClaims.agency) {
		// 	console.log('ROLE: agency')
		// 	setUserRole('Agency')
		// } else if (userEditingClaims.admin) {
		// 	console.log('ROLE: admin')
		// 	setUserRole('Admin')
		// }
		// console.log(`logged in user claims ${JSON.stringify(customClaims)}`)
		// console.log(`user editing obj ${JSON.stringify(userEditing)}`)
	// }, [selectedAgency])
	

	return (
		<div className='w-full h-full flex flex-col py-5'>
			<div
				className='w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto'
				id='scrollableDiv'>
				<div className='flex flex-col pb-5 md:justify-start'>
					{customClaims.admin ? (
						<span className='text-xs'>{agencyName}</span>
					) : (
						<span className='text-xs'>All Agency</span>
					)}
					<div className='text-center md:text-left text-lg font-bold text-blue-600 tracking-wider pb-2 md:pb-0'>
						Users
					</div>
				</div>
				<div className='flex flex-col h-full'>
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
									{customClaims.admin && (
										<th scope='col' className={tableHeading.default_center}>
											Agency
										</th>
									)}
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
												customClaims.admin
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
											{customClaims.admin && (
												<td className={column.data_center}>
												{listUser.agencyName}
												</td>
											)}
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
												{(userObj.data.isBanned && "yes") || "no"}
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
															className='ml-4 fill-gray-400 hover:fill-red-600'
														/>
														<Tooltip
															anchorSelect=".tooltip-delete-user"
															place='top'
															delayShow={500}
														>Delete User</Tooltip>
													</button>
												</td>
											)}
										</tr>
									)
								})}
							</tbody>
						</table>
					</InfiniteScroll>
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
		</div>
	)
}

export default Users
