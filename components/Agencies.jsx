import React, { useState, useEffect } from 'react'
import { 
	doc, 
	collection, 
	getDocs, 
	setDoc, 
	getDoc, 
	updateDoc, 
	onSnapshot,
	query,
	where
	} from '@firebase/firestore'
import { db, auth } from "../config/firebase"
import { getAuth } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import Image from 'next/image'
import AgencyModal from './modals/AgencyModal'
import NewAgencyModal from './modals/NewAgencyModal'
import ConfirmModal from "./modals/ConfirmModal"
import ReactTooltip from "react-tooltip"
import { IoTrash } from "react-icons/io5"

const Agencies = ({handleAgencyUpdateSubmit}) => {
	// //
	// States
	// //
	const [agencies, setAgencies] = useState([])
	const [agencyInfo, setAgencyInfo] = useState('')
	const [agencyId, setAgencyId] = useState('')
	const [agencyAdminUsers, setAgencyAdminUsers] = useState('')
	const [agencyModal, setAgencyModal] = useState(false)
	const [newAgencyModal, setNewAgencyModal] = useState(false)
	const [update, setUpdate] = useState('')
	const [search, setSearch] = useState('')
	const [endIndex, setEndIndex] = useState(10)
	const [deleteModal, setDeleteModal] = useState(false)

	// //
	// Styles
	// //
	const style = {
		section_container: 'w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto',
		section_wrapper: 'flex flex-col h-full',
		section_header: 'flex flex-col md:flex-row py-5 md:justify-between',
		section_title: 'text-center md:text-left text-lg font-bold text-blue-600 tracking-wider pb-2 md:pb-0',
		section_filters: 'flex flex-row flex-wrap md:flex-nowrap items-center justify-center md:justify-evenly',
		section_filtersWrap: 'p-0 px-4 md:p-4 md:py-0 md:px-4',
		table_main: 'min-w-full bg-white rounded-xl p-1',
		table_thead: 'border-b dark:border-indigo-100 bg-slate-100',
		table_th: 'px-3 p-3 text-sm font-semibold text-left tracking-wide',
		table_tr: 'border-b transition duration-300 ease-in-out hover:bg-indigo-100 dark:border-indigo-100 dark:hover:bg-indigo-100',
		table_td: 'whitespace-normal text-sm px-3 p-2 cursor-pointer',
		table_button: 'hover:fill-cyan-700',
		table_icon: 'ml-4 fill-gray-400 hover:fill-red-600'
	}
	
	// //
	// Data
	// //
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
	
	// //
	// Handlers
	// //
	
	const handleDelete = async (e) => {
		e.preventDefault()
	}
	
	// Handler: Agency modal
	const handleAgencyModalShow = async (agencyId) => {
		setAgencyModal(true)
		const docRef = await getDoc(doc(db, 'agency', agencyId))
		setAgencyInfo(docRef.data())
		setAgencyId(agencyId)
	}
	
	// Handler: Delete agency
	const handleAgencyDelete = async (e) => {
		setDeleteModal(true)
	}
	
	// Handler: On agency admin user change
	const handleAgencyUserChange = async (e) => {
		const docRef = doc(db, "agency", agencyId)
		await updateDoc(docRef, {
			agencyUsers: 'true'
		})
	}
	// Handler: Form submit
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		setUpdate(true)
		const docRef = doc(db, 'agency', agencyId)
	}
	
	// Handler: Update form
	const handleFormUpdate = async (e) => {
		e.preventDefault()
		setUpdate(true)
		const docRef = doc(db, 'agency', agencyId)
		updateDoc(docRef, {
			agencyUsers: e.target.value
		})
	}
	
	// //
	// Effects
	// //
	useEffect(() => {
		getData()
	})
	
	return (
		<div className={style.section_container}>
			<div className={style.section_wrapper}>
				<div className={style.section_header}>
					<div className={style.section_title}>
						Agencies
					</div>
					<div className={style.section_filters}>
						<div className={style.section_filtersWrap}>
							<pre>-- Filters here--</pre>
						</div>
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
							return (
								<tr onClick={() => handleAgencyModalShow(Object.keys(agencyObj)[0])} className={style.table_tr} key={i}>
									<td className={style.table_td}>
										{agency['logo'] && agency['logo'][0] ?
											<div className="flex w-full overflow-y-auto">
												{agency['logo'].map((image, i) => {
													return (
														<div className="flex mr-2" key={i}>
															<Image src={image} width={100} height={100} alt="image"/>
														</div>
													)
												})}
											</div> :
											<div className="italic font-light">No images for this report</div>
										}
									</td>
									<td className={style.table_td}>{agency.name}</td>
									<td className={style.table_td}>
										{agency.city}, {agency.state}
									</td>
									<td className={style.table_td}>
									{agency['agencyUsers'].map((user, i) => {return(<div>{user}</div>)})}
									</td>
									<td className={style.table_td}>
										<button
											onClick={() =>
												handleAgencyDelete(Object.keys(agencyObj)[0])
											}
											data-tip="Delete agency"
											className={style.table_button}>
											<IoTrash size={20} className={style.table_icon} />
											<ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
										</button>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
			{agencyModal && <AgencyModal 
				handleAgencyUpdateSubmit={handleAgencyUpdateSubmit}
				agencyId={agencyId}
				agencyInfo={agencyInfo}
				setAgencyInfo={setAgencyInfo}
				onFormSubmit={handleFormSubmit}
				onFormUpdate={handleFormUpdate}
				setAgencyModal={setAgencyModal}
				onAgencyUserChange={handleAgencyUserChange} 
				setAgencyAdminUsers={agencyAdminUsers}/>
			}
			{deleteModal && <ConfirmModal
				func={handleDelete}
				title="Are you sure you want to delete this agency?"
				subtitle=""
				CTA="Delete"
				closeModal={setDeleteModal}
			/>}
			{newAgencyModal && 
				<NewAgencyModal 
				// tagSystems={tagSystems}
				// tagSystem={tagSystem}
				// list={list}
				// setList={setList}
				setNewAgencyModal={setNewAgencyModal}
				// addNewUser={addNewUser} 
			/>}
		</div>
	)
}

export default Agencies