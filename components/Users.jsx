import React, { useState, useEffect } from 'react'
import { useAuth } from "../context/AuthContext"
import {
	collection,
	getDocs,
	getDoc,
	doc,
	deleteDoc,
	updateDoc,
} from "firebase/firestore"
import { db, auth } from "../config/firebase"
import ReactTooltip from "react-tooltip"
import { IoTrash } from "react-icons/io5"
import InfiniteScroll from "react-infinite-scroll-component"
import ConfirmModal from './modals/ConfirmModal'
import EditUserModal from './modals/EditUserModal'

// Profile page that allows user to edit password or logout of their account
const Users = ({customClaims}) => {
	const {addAdminRole, addAgencyRole, addUserRole} = useAuth()
	const [userRole, setUserRole] = useState('')
	const [mobileUsers, setMobileUsers] = useState([])
	const [loadedMobileUsers, setLoadedMobileUsers] = useState([])
	const [endIndex, setEndIndex] = useState(0)
	const [deleteModal, setDeleteModal] = useState(false)
	const [user, setUser] = useState('')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [banned, setBanned] = useState('')
  const [editUser, setEditUser] = useState(null)
	const [userId, setUserId] = useState(null)
	const [update, setUpdate] = useState(false)
	// Delete report
	const handleMobileUserDelete = async (userId) => {
		setDeleteModal(true)
		setUserId(userId)
	}
	// Handle user delete
	const handleDelete = async (e) => {
		e.preventDefault()
		auth.onAuthStateChanged((user) => {
			if (user) {
				setUserId(user.uid)
				const uid = user.uid;
			}
		});
		const docRef = doc(db, "mobileUsers", userId)
		deleteDoc(docRef)
		.then(() => {
			getData()
			setDeleteModal(false)
			// to do: delete user from firebase authentification console
		})
		.catch((error) => {
			console.log('The write failed' + error);
		})
	}
	// Handle EditUserModal open/close & set values
	const handleEditUser = async (userId) => {
		// On user click set user id
		setUserId(userId)
		// with userId get mobileUsers doc ref
		const userRef = await getDoc(doc(db, "mobileUsers", userId));
		setUser(userRef.data()) 
		setName(userRef.data()['name'])
		setEmail(userRef.data()['email'])
		setBanned(userRef.data()['isBanned'])
		setUserRole(userRef.data()['userRole'])
    setEditUser(true)
	}
	// Handle form submit
	const handleFormSubmit = (e) => {
		e.preventDefault()
		// User Role change
		auth.currentUser.getIdTokenResult()
		.then((idTokenResult) => {
			// Confirm the user is an Admin.
			if (!!idTokenResult.claims.admin) {
				// Change the selected user's privileges as requested
				if (userRole === "Admin") {
					console.log(addAdminRole({email: user.email}))
				} else if (userRole === "Agency") {
					console.log(addAgencyRole({email: user.email}))
				} else if (userRole === "User") {
					console.log(addUserRole({email: user.email}))
				}
				setUserRole(userRole)
			}
		})
		.catch((error) => {
			console.log(error);
		});
		// Name change
		const docRef = doc(db, "mobileUsers", userId)
		if (name != user.name) {
			updateDoc(docRef, { name: name })
			setName(name)
		}
		// Email change
		if (email != user.email) {
			updateDoc(docRef, { email: email })
			setEmail(email)
		}
		// Banned change
		if (banned != user.isBanned) {
			updateDoc(docRef, { isBanned: banned })
			setBanned(banned)
		}
		if (userRole != user.userRole) {
			updateDoc(docRef, { userRole: userRole })
		}
		setEditUser(false)
	}
	// Handle user permissions
	const handleOptionChange = (e) => {
		setUserRole(e.target.value)
  }
	// Handle name change
	const handleNameChange = (e) => {
		e.preventDefault()
		setName(e.target.value)
	}
	// Handle email change
	const handleEmailChange = (e) => {
		e.preventDefault()
		setEmail(e.target.value)
	}
	// Handle banned change
	const handleBannedChange = (e) => {
		setBanned(!banned)
	}
	// Handle getting data
	const getData = async () => {
		const usersCollection = collection(db, 'mobileUsers')
		const snapshot = await getDocs(usersCollection)
		
		try {
			var arr = []
			snapshot.forEach((doc) => {
				arr.push({
					[doc.id]: doc.data(),
				})
			})
			
			setMobileUsers(arr)
			setLoadedMobileUsers(arr)
			setEndIndex(endIndex + 14)
			
		} catch (error) {
			console.log(error)
		}
	}
	// Get data
	useEffect(() => {
		getData()
	})
	
	// Handle updates
	useEffect(() => {
		getData()
	}, [update])

	const dateOptions = {
		day: "2-digit",
		year: "numeric",
		month: "short",
	}
	// Styles
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
				<div className="flex flex-col md:flex-row py-5 md:justify-between">
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
									<th scope="col" className={tableHeading.default_center}>Join Date</th>
									{customClaims.admin && <th scope="col" className={tableHeading.default_center}>Role</th>}
									<th scope="col" className={tableHeading.default_center}>Banned</th>
									<th scope="col" colSpan={2} className={tableHeading.default_center}>Delete</th>
								</tr>
							</thead>
							<tbody>
								{/*Infinite scroll for the mobileUsers to load more mobileUsers when user scrolls to bottom*/}
									{loadedMobileUsers.slice(0, endIndex).map((userObj, key) => {
										const user = Object.values(userObj)[0]
										const userId = Object.keys(userObj)[0]
										let posted = user["joiningDate"]
										posted = posted * 1000 
										posted = new Date(posted)
										posted = posted.toLocaleString("en-US", dateOptions)
										return (
											<tr
												className="border-b transition duration-300 ease-in-out dark:border-indigo-100"
												key={key} 
												onClick={()=>handleEditUser(userId)}>
												<td scope="row" className={column.data}>{user.name}
                        </td>
												{/* 
												TODO:
												- add geopoint fields as a column in table.
												*/}
												<td className={column.data_center}>{user.email}</td>
												{/* TODO
												- format joined date
												 */}
												<td className={column.data_center}>{posted}</td>
												{customClaims.admin && 
													<td className={column.data_center}>{user.userRole}</td>
												} 
												{/* TODO:
												- finish banned feature (with confirm modal)
												 */}
												<td className={column.data_center}>{user.isBanned && 'yes' || 'no'}</td>
												{/* TODO:
												- make sure the user is deleted, or the name is removed 
												- dont want to tie the user after deletion to their prior data.
												 */}
												<td className={column.data_center} onClick={(e) => e.stopPropagation()}>
													<button
														onClick={() => handleMobileUserDelete(userId) }
														data-tip="Delete user"
														className={style.icon}>
														<IoTrash size={20} className="ml-4 fill-gray-400 hover:fill-red-600" />
														<ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
													</button>
												</td>
											</tr>
										)
									})}
							</tbody>
						</table>
					</InfiniteScroll>
				</div>
			</div>
			{deleteModal && <ConfirmModal
				func={handleDelete}
				title="Are you sure you want to delete this user?"
				subtitle=""
				CTA="Delete"
				closeModal={setDeleteModal}
			/>}
      {editUser && <EditUserModal 
			customClaims={customClaims} 
			userRole={userRole}
			setUserRole={setUserRole}
			setEditUser={setEditUser} 
			editUser={editUser} 
			user={user}
			userId={userId}
			name={name}
			onNameChange={handleNameChange}
			email={email}
			onEmailChange={handleEmailChange}
			banned={banned}
			setBanned={setBanned}
			onBannedChange={handleBannedChange}
			onFormSubmit={handleFormSubmit}
			userRole={userRole}
			onOptionChange={handleOptionChange}
			setUser={setUser} />}
		</div>
  )
}

export default Users