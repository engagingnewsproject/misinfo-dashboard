import React, { useState, useEffect } from 'react'
import { useAuth } from "../context/AuthContext"
import {
	collection,
	getDocs,
	getDoc,
	doc,
	deleteDoc,
	updateDoc,
	onSnapshot
} from "firebase/firestore"
import { db, auth } from "../config/firebase"
import ReactTooltip from "react-tooltip"
import { IoTrash } from "react-icons/io5"
import InfiniteScroll from "react-infinite-scroll-component"
import ConfirmModal from './modals/ConfirmModal'
import EditUserModal from './modals/EditUserModal'

// Profile page that allows the user to edit password or logout of their account
const Users = () => {
	// Initialize authentication context
	const { user, addAdminRole, addAgencyRole, addUserRole, customClaims, setCustomClaims } = useAuth()
	
	// State variables for managing user data
	const [userRole, setUserRole] = useState('')
	const [mobileUsers, setMobileUsers] = useState([])
	const [loadedMobileUsers, setLoadedMobileUsers] = useState([])
	const [endIndex, setEndIndex] = useState(0)
	const [deleteModal, setDeleteModal] = useState(false)
	const [userEdit, setUserEdit] = useState([])
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [agency, setAgency] = useState('')
	const [banned, setBanned] = useState('')
	const [userEditClick, setUserEditClick] = useState(null)
	const [userId, setUserId] = useState(null)
	const [update, setUpdate] = useState(false)
	
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
			console.log('The write failed' + error);
		})
	}
	
	// Function to handle opening and setting values in the EditUserModal
	const handleEditUser = async (listUser, userId) => {
		setUserId(userId)
		const userRef = await getDoc(doc(db, "mobileUsers", userId));
		setUserEdit(userRef.data()) 
		setName(userRef.data()['name'])
		setEmail(userRef.data()['email']) 
		setAgency(listUser['agency']) // agency name is derived from the getData call where the mobileUser's 'agency' field has the agency uid
		setBanned(userRef.data()['isBanned'])
		setUserRole(userRef.data()['userRole'])
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
		auth.currentUser.getIdTokenResult()
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
			console.log(error);
		});
		// Name change
		const docRef = doc(db,"mobileUsers",userId)
		await updateDoc(docRef, {
			name: name,
			email: email,
			isBanned: banned,
			userRole: userRole
		});
		
		setUserEditClick(false)
	}	
	
	// Function to fetch user data from Firebase
	const getData = async () => {
		try {
			const usersCollection = collection(db, 'mobileUsers');
			const snapshot = await getDocs(usersCollection);
			const promises = []; // An array to store promises for each user
			var arr = []; // An array to store user data
			
			snapshot.forEach((user) => {
				const userData = user.data();
				const userObject = {
					[user.id]: userData,
				};
				// console.log(user.accountId)
				// console.log(user.data()['agency'])
				if (user.data()['agency']) {
					const agencyDocRef = doc(db, "agency", user.data()['agency']);
					const promise = new Promise((resolve, reject) => {
						const unsub = onSnapshot(agencyDocRef, (docSnap) => {
							// const agencyName = docSnap.data()['name'];
							// userObject[user.id]['agency'] = agencyName;
							unsub(); // Unsubscribe after getting agency data
							resolve(); // Resolve the promise
						});
					});
					promises.push(promise);
				}
				
				arr.push(userObject);
			});
			
			await Promise.all(promises);
			
			setMobileUsers(arr);
			setLoadedMobileUsers(arr);
			setEndIndex(endIndex + 14);
			
		} catch (error) {
			console.log(error);
		}
	};
	
	// Initial data fetch
	useEffect(() => {
		getData()
	})
	
	// Data fetch on update
	useEffect(() => {
		getData()
	}, [update])
	
	const dateOptions = {
		day: "2-digit",
		year: "numeric",
		month: "short",
	}
	
	// CSS style definitions
	const tableHeading = {
		default: "px-3 py-1 text-sm font-semibold text-left tracking-wide",
		default_center: "text-center p-2 text-sm font-semibold tracking-wide",
		small: ""
	}
	const column = {
		data: "whitespace-normal text-sm px-3 py-1",
		data_center: "whitespace-normal md:whitespace-nowrap text-sm px-3 py-1 text-center"
	}
	const style = {
		icon: "hover:fill-cyan-700"
	}
	
  return (
		<div className="w-full h-full flex flex-col py-5">
			<div className="w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto" id="scrollableDiv">
				<div className="flex flex-col md:flex-row pb-5 md:justify-between">
					<div className="text-center md:text-left text-lg font-bold text-blue-600 tracking-wider pb-2 md:pb-0">
						Users
					</div>
				</div>
				<div className="flex flex-col h-full">
					<InfiniteScroll
						className="overflow-x-auto"
						dataLength={endIndex}
						inverse={false} //
						loader={<h4>Loading...</h4>}
						scrollableTarget="scrollableDiv">
						<table className="min-w-full bg-white rounded-xl p-1">
							<thead className="border-b dark:border-indigo-100 bg-slate-100">
								<tr>
									<th scope="col" className={tableHeading.default}>Name</th>
									<th scope="col" className={tableHeading.default_center}>Email</th>
									{customClaims.admin &&
										<th scope="col" className={tableHeading.default_center}>Agency</th>
									}
									<th scope="col" className={tableHeading.default_center}>Join Date</th>
									{customClaims.admin && <th scope="col" className={tableHeading.default_center}>Role</th>}
									<th scope="col" className={tableHeading.default_center}>Banned</th>
									{customClaims.admin &&
										<th scope="col" colSpan={2} className={tableHeading.default_center}>Delete</th>
									}
								</tr>
							</thead>
							<tbody>
								{/*Infinite scroll for the mobileUsers to load more mobileUsers when user scrolls to bottom*/}
								{loadedMobileUsers.slice(0,endIndex).map((userObj,key) => {
									const listUser = Object.values(userObj)[0]
									const userId = Object.keys(userObj)[0]
									let posted = listUser["joiningDate"]
									const numUsers = endIndex;
									// Get list user agency uid & display agency name
									posted = posted * 1000 
									posted = new Date(posted)
									posted = posted.toLocaleString("en-US", dateOptions)
										return (
											<tr
												className="border-b transition duration-300 ease-in-out dark:border-indigo-100"
												key={key} 
  											onClick={customClaims.admin ? () => handleEditUser(listUser, userId) : undefined}
												>
												<td scope="row" className={column.data}>{listUser.name}
                        </td>
												{/* 
												TODO:
												- add geopoint fields as a column in table.
												*/}
												<td className={column.data_center}>{listUser.email}</td>
												{customClaims.admin &&
													<td className={column.data_center}>{listUser['agency']}</td>
												}
												<td className={column.data_center}>{posted}</td>
												{customClaims.admin && 
													<td className={column.data_center}>{listUser.userRole}</td>
												} 
												{/* TODO:
												- finish banned feature (with confirm modal)
												 */}
												<td className={column.data_center}>{listUser.isBanned && 'yes' || 'no'}</td>
												{customClaims.admin &&
													<td className={column.data_center} onClick={(e) => e.stopPropagation()}>
														<button
															onClick={() => handleMobileUserDelete(userId)}
															data-tip="Delete user"
															className={style.icon}>
															<IoTrash size={20} className="ml-4 fill-gray-400 hover:fill-red-600" />
															<ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
														</button>
													</td>
												}
											</tr>
										)
									})}
							</tbody>
						</table>
					</InfiniteScroll>
					<div className='mt-2 self-end text-xs'>Total users: {mobileUsers.length}</div>
				</div>
			</div>
			{deleteModal && <ConfirmModal
				func={handleDelete}
				title="Are you sure you want to delete this user?"
				subtitle=""
				CTA="Delete"
				closeModal={setDeleteModal}
			/>}
      {userEditClick && <EditUserModal 
				customClaims={customClaims} 
				userRole={userRole}
				setUserRole={setUserRole}
				setUserEditClick={setUserEditClick} 
				userEditClick={userEditClick} 
				userEdit={userEdit}
				userId={userId}
				name={name}
				onNameChange={handleNameChange}
				agency={agency}
				// onAgencyChange={handleAgencyChange}
				email={email}
				onEmailChange={handleEmailChange}
				banned={banned}
				setBanned={setBanned}
				onBannedChange={handleBannedChange}
				onFormSubmit={handleFormSubmit}
				onOptionChange={handleOptionChange}
				setUserEdit={setUserEdit} />}
		</div>
  )
}

export default Users