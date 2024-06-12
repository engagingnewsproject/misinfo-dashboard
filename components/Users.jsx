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
	addDoc,
} from "firebase/firestore"
import { db, auth } from "../config/firebase"
import {Tooltip} from "react-tooltip"
import { IoTrash } from "react-icons/io5"
import InfiniteScroll from "react-infinite-scroll-component"
import ConfirmModal from "./modals/ConfirmModal"
import EditUserModal from "./modals/EditUserModal"
import NewUserModal from './modals/NewUserModal'
import { FaPlus } from 'react-icons/fa'
import globalStyles from "../styles/globalStyles"
// adelgado@freepress.com prior userID: 6PCpGTofClOv9FSvFgo3l9zHBTB2
// Profile page that allows the user to edit password or logout of their account
const Users = () => {
	// Initialize authentication context
	const {
		user,
		addAdminRole,
		addAgencyRole,
		addUserRole,
		sendSignIn,
		customClaims,
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
	const [agenciesArray, setAgenciesArray] = useState([])
	const [selectedAgency,setSelectedAgency] = useState("")
	const [agencyName, setAgencyName] = useState("")
	const [agencyNameNew, setAgencyNameNew] = useState("")
	const [banned, setBanned] = useState("")
	const [userEditModal, setUserEditModal] = useState(null)
	const [userId, setUserId] = useState(null)
	const [update,setUpdate] = useState('')
	
	// Add new user
	// Add new user
	// Add new user
	const [newUserModal, setNewUserModal] = useState(false)
	const [data, setData] = useState({
		email: '',
 })
	const [newUserEmail, setNewUserEmail] = useState('')
	const [errors, setErrors] = useState({})
	
	const saveUser = () => { // Save new user
		const dbInstance = collection(db, 'mobileUsers')
		addDoc(dbInstance, {
			email: newUserEmail,
		}).then(async() => {
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
		section_container: 'w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto',
		section_wrapper: 'flex flex-col h-full',
		section_header: 'flex justify-between ml-10 md:mx-0 py-5',
		section_title: 'text-xl font-extrabold text-blue-600 tracking-wider',
		section_filtersWrap: 'p-0 px-4 md:p-4 md:py-0 md:px-4 flex items-center',
		table_main: 'min-w-full bg-white rounded-xl p-1',
		button: 'flex items-center shadow ml-auto bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
	}

	// Function to fetch user data from Firebase
	const getData = async () => {
		const mobileUsersQuerySnapshot = await getDocs(collection(db,'mobileUsers'))
		const mobileUsersArr = []
		mobileUsersQuerySnapshot.forEach((doc) => {
			const data = doc.data()
			data.mobileUserId = doc.id
			mobileUsersArr.push(data)
		});
		
		// AGNECY USERS ONLY
		if (customClaims.agency) {
			// console.log('only for agencies!')			
			// get current user's emial
			// user.email
			// get list of all agencies
			const q = query(collection(db,"agency"),where("agencyUsers","array-contains",user.email))
			// select the agency with current user's email in agencyUsers array
			let name
			const querySnapshot = await getDocs(q)
			querySnapshot.forEach((doc) => {
				// get that agency name
				name = doc.data().name
			})			
			// get all reports with agency name
			const r = query(collection(db,"reports"),where('agency',"==",name))
			// from those reports get the userID
			let userIds = []
			const reportSnapshot = await getDocs(r)
			// add each userID to an array
			reportSnapshot.forEach((doc) => {
				// get that agency name
				const uID = doc.data().userID
				userIds.push(uID)
			})			
			// get all mobile users and
			// Filter the mobileUsersArr to include only users whose mobileUserId is in the ids array
			const filteredUsers = mobileUsersArr.filter(user => userIds.includes(user.mobileUserId));
			setLoadedMobileUsers(filteredUsers)
			// DONE
			// ADMIN ONLY
		} else {
			setLoadedMobileUsers(mobileUsersArr)
		}
	}
		
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
		await deleteDoc(docRef)
		setDeleteModal(false)
	}

	// MODAL: Function to handle opening and setting values in the EditUserModal
	const handleEditUser = async (userObj, userId) => {
		setUserId(userId)
		const userRef = await getDoc(doc(db,"mobileUsers",userId))
		setUserEditing(userObj)
		setUserEditModal(true)
		// Fetch and set user agency
			const q = query(collection(db,"agency"),where("agencyUsers","array-contains",userRef.data().email))
			// select the agency with current user's email in agencyUsers array
			let aName
			const querySnapshot = await getDocs(q)
			querySnapshot.forEach((doc) => {
				// get that agency name
				aName = doc.data().name
			})

		setAgencyName(name)
		let agencyArr = []
		const agencySnapshot = await getDocs(collection(db,"agency"));
			agencySnapshot.forEach((doc) => {
				const n = doc.data().name
        agencyArr.push(n)
			})
		setAgenciesArray(agencyArr)
		// if (!agencySnapshot.empty) {
		// 	setSelectedAgency(agencySnapshot.docs.data().name)
		// }
		setName(userRef.data()["name"])
		setEmail(userRef.data()["email"])
		setBanned(userRef.data()["isBanned"])
		setUserRole(userRef.data()["userRole"])
	}

	const handleAgencyChange = async (e) => {
		e.preventDefault()
		const selectedValue = e.target.value
		console.log(agenciesArray)
		setAgencyName(selectedValue)
		const selectedAgency = agenciesArray.find(
			(agency) => agency === selectedValue
		)
		console.log(selectedAgency)

		if (selectedAgency) {
			try {
				// Fetch the current data of the agency document to which the user is being added
        const newDocRef = doc(db, "agency", selectedAgency); // Use agency ID as document ID
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
	const handleRoleChange = (role) => {
		setUserRole(role);
	}

	// Function to handle banned status change
	const handleBannedChange = (e) => {
		setBanned(!banned)
	}

	// Function to handle form submission (updating user data)
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		const docRef = doc(db,"mobileUsers",userId)
		const docSnap = await getDoc(docRef);
		// update agency name on mobileUser doc
		// add user email to agency agencyUsers doc
		await updateDoc(docRef, {
			name: name,
			email: email,
			isBanned: banned,
			userRole: userRole,
		})
		// set role on the server side
		// Check if the user's role has been modified
		if (userRole !== userEditing.userRole) {
			// If the userRole is set to "Admin", call the addAdminRole function
			if (userRole === "Admin") {
				try {
					// Call the addAdminRole function
					await addAdminRole({ email: email })
				} catch (error) {
					console.error("Error adding admin role:",error)
				}
			} else if (userRole === "Agency") {
				// Call the addAgencyRole function
				try {
					await addAgencyRole({ email: email })
				} catch (error) {
					console.error("Error adding agency role:",error)
					// Handle error if needed
				}
			} else if (userRole === "User") {
				// Call the addUserRole function
				try {
					await addUserRole({ email: email })
				} catch (error) {
					console.error("Error adding general user role:",error)
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
					: userObj
			)
		)
		setUserEditModal(false)
		setUpdate(!update)
	}
	
	// Data fetch on update
	useEffect(() => {
		getData()
	},[update])
	
	return (
		<div className={style.section_container}>
			<div className={style.section_wrapper}>
				<div className={style.section_header}>
					<div className={style.section_title}>
					{customClaims.admin ? (
							<span className='text-xs'>{agencyName}</span>
						) : (
							<span className='text-xs'>All Agency</span>
						)}
						<div className={globalStyles.heading.h1.blue}>
							Users
						</div>
					</div>
					<div className={style.section_filtersWrap}>
						<button className={style.button} onClick={handleAddNewUserModal}>
							<FaPlus className="text-blue-600 mr-2" size={12}/>
							Add User
						</button>
					</div>
				</div>
				<div className={style.table_main}>
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
										let userId = userObj.mobileUserId
										let joined = userObj.joiningDate
										joined = joined * 1000
										joined = new Date(joined)
										joined = joined.toLocaleString("en-US", dateOptions)
										return (
											<tr
												className='border-b transition duration-300 ease-in-out dark:border-indigo-100'
												key={key}
												onClick={
													customClaims.admin
														? () => handleEditUser(userObj, userId)
														: undefined
												}>
												{/* Name */}
												<td scope='row' className={column.data}>
													{userObj.name}
												</td>
												{/* TODO: add geopoint fields as a column in table. */}
												{/* Email */}
												<td className={column.data_center}>{userObj.email}</td>
												{/* Agency */}
												{customClaims.admin && (
													<td className={column.data_center}>
													{userObj.agencyName}
													</td>
												)}
												{/* Joined date */}
												<td className={column.data_center}>{joined}</td>
												{/* Role */}
												{customClaims.admin && (
													<td className={column.data_center}>
														{userObj.userRole}
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
			{newUserModal && 
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
			/>}
		</div>
	)
}

export default Users
