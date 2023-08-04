import React, { useState, useEffect } from 'react'
import { useAuth } from "../context/AuthContext"
import {
	collection,
	getDocs,
	doc,
	addDoc,
	getUser,
	deleteDoc,
} from "firebase/firestore"
import { db } from "../config/firebase"
import ReactTooltip from "react-tooltip"
import { IoTrash } from "react-icons/io5"
import { IoMdRefresh } from "react-icons/io"
import { FaPlus } from 'react-icons/fa'
import InfiniteScroll from "react-infinite-scroll-component"
import Headbar from '../components/Headbar'
import NewUserModal from './modals/NewUserModal'
import ConfirmModal from './modals/ConfirmModal'
// Profile page that allows user to edit password or logout of their account
const Users = () => {
	const [mobileUsers, setMobileUsers] = useState([])
	const [search, setSearch] = useState("")
	const [loadedMobileUsers, setLoadedMobileUsers] = useState([])
	const [mobileUserName, setMobileUserName] = useState('')
	const [mobileUsersUpdated, setMobileUsersUpdated] = useState(false) // TODO: finish user update
	const [endIndex, setEndIndex] = useState(0)
	const [deleteModal, setDeleteModal] = useState(false)
	const [newUserModal, setNewUserModal] = useState(false)
	const [users, setUsers] = useState([]);

  const {verifyRole} = useAuth()

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
	
	useEffect(() => {
		getData()
	})
	
	// Delete report
	const handleMobileUserDelete = async (e) => {
		setDeleteModal(true)
	}
		
	const handleDelete = async (e) => {
		e.preventDefault()
		const docRef = doc(db, "mobileUsers", userId)
		deleteDoc(docRef)
			.then(() => {
				getData()
				setDeleteModal(false)
			})
			.catch((error) => {
				console.log('The write failed' + error);
			})
	}
	
	const addNewUser = (user) => {
		let arr = list
		arr.push(user)
	}
	
	const handleAddNew = (e) => {
		e.preventDefault()
		setNewUserModal(true)
	}
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
					<div className='flex justify-between'>
						<button
							className='flex items-center shadow ml-auto mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
							type="submit"
							onClick={handleAddNew}>
							<FaPlus className="text-blue-600" size={12}/>
							<div className='px-2 font-normal tracking-wide'>Add New User</div>
						</button>
					</div>
				</div>
				<div className="flex flex-col h-full">

					<InfiniteScroll
						className="overflow-x-auto"
						dataLength={endIndex}
						inverse={false} //
						loader={<h4>Loading...</h4>}
						scrollableTarget="scrollableDiv"
						mobileUserName={mobileUserName}>
						<table className="min-w-full bg-white rounded-xl p-1">
							<thead className="border-b dark:border-indigo-100 bg-slate-100">
								<tr>
									<th scope="col" className={tableHeading.default}>Name</th>
									<th scope="col" className={tableHeading.default_center}>Email</th>
									<th scope="col" className={tableHeading.default_center}>Join Date</th>
									<th scope="col" className={tableHeading.default_center}>Banned</th>
									<th scope="col" colSpan={2} className={tableHeading.default_center}>Delete</th>
								</tr>
							</thead>
							<tbody>
								{/*Infinite scroll for the mobileUsers to load more mobileUsers when user scrolls to bottom*/}
									{loadedMobileUsers.slice(0, endIndex).map((userObj, key) => {
										const user = Object.values(userObj)[0]
										let posted = user["joiningDate"]
										posted = posted * 1000 
										posted = new Date(posted)
										posted = posted.toLocaleString("en-US", dateOptions)
										return (
											<tr
												className="border-b transition duration-300 ease-in-out dark:border-indigo-100"
												key={key}>
												<td scope="row" className={column.data}>{user.name}</td>
												{/* 
												TODO:
												- add geopoint fields as a column in table.
												*/}
												<td className={column.data_center}>{user.email}</td>
												{/* TODO
												- format joined date
												 */}
												<td className={column.data_center}>{posted}</td>
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
														onClick={() =>
															handleMobileUserDelete(Object.keys(userObj)[0])
														}
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
			{newUserModal && 
				<NewUserModal 
				// tagSystems={tagSystems}
				// tagSystem={tagSystem}
				// list={list}
				// setList={setList}
				setNewUserModal={setNewUserModal}
				// addNewUser={addNewUser} 
			/>}
		</div>
  )
}

export default Users