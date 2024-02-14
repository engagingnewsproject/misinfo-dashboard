import React, { useState, useEffect } from 'react'
import { 
	doc, 
	collection, 
	getDocs, 
	getDoc, 
	updateDoc,
	deleteDoc,
	addDoc,
	arrayUnion,
	query,
	where
	} from '@firebase/firestore'
import { db, auth } from "../config/firebase"
import { useAuth } from '../context/AuthContext'
import Image from 'next/image'
import AgencyModal from './modals/AgencyModal'
import NewAgencyModal from './modals/NewAgencyModal'
import ConfirmModal from "./modals/ConfirmModal"
import { Tooltip } from 'react-tooltip'
import { IoTrash } from "react-icons/io5"
import { FaPlus } from 'react-icons/fa'

const Agencies = ({handleAgencyUpdateSubmit}) => {
	// //
	// States
	// //
	const [agencies, setAgencies] = useState([])
	const [agencyInfo, setAgencyInfo] = useState('')
	const [agencyId, setAgencyId] = useState('')
	const [agencyUsersArr, setAgencyUsersArr] = useState([])
	const [agencyAdminUsers, setAgencyAdminUsers] = useState('')
	// EXISTING Agency Modal
	const [agencyModal, setAgencyModal] = useState(false)
	const [update,setUpdate] = useState('')
	const [logo, setLogo] = useState('')
	const [search, setSearch] = useState('')
	const [endIndex, setEndIndex] = useState(10)
	const [deleteModal, setDeleteModal] = useState(false)
	// NEW Agency Modal
	const { user, sendSignIn } = useAuth() // Add agency user send signup email
	const [newAgencyModal, setNewAgencyModal] = useState(false)
	const [newAgencySubmitted, setNewAgencySubmitted] = useState(0);
	const [newAgencyName, setNewAgencyName] = useState("")
	const [newAgencyEmails, setNewAgencyEmails] = useState([])
	const [data, setData] = useState({ country: "US", state: null, city: null })
	const [emailSent, setEmailSent] = useState(false) // check if email was sent
	// validation states
	const [errors, setErrors] = useState({});

	// Data
	// The getData function retrieves agency data from a Firebase Firestore collection and populates the agencies state variable.
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
	
	// Handler: new agency MODAL
	// Modal for new agencies. Modal is displayed when users click the button to add a new agency.
	const handleAddNewAgencyModal = (e) => {
		e.preventDefault()
		setNewAgencyModal(true)
	}
	// Handler: new agency NAME
	const handleNewAgencyName = (e) => {
		e.preventDefault()
		setNewAgencyName(e.target.value)
	}
	// Handler: new agency EMAIL
	const handleNewAgencyEmails = (e) => {
		e.preventDefault()
		let usersArr = e.target.value
		usersArr = usersArr.split(',')
		setNewAgencyEmails(usersArr)
	}
	// Handler: new agency state
	const handleNewAgencyState = (e) => {
		setData(data=>({...data, state: e, city: null })) 
	}
	// Handler: new agency city
	const handleNewAgencyCity = (e) => {
		setData(data=>({...data,city: e !== null ? e : null })) 
	}
	// Handler: new agency SAVE & send confirmation email to user
	const saveAgency = () => {
		const dbInstance = collection(db, 'agency');
		addDoc(dbInstance, {
			name: newAgencyName,
			agencyUsers: arrayUnion(...newAgencyEmails),
			state: data.state.name,
			city: data.city == null ? "N/A" : data.city.name,
			logo: []
		}).then(async() => { // send email to agency admin emails
			try {
				await sendSignIn(...newAgencyEmails)
				// When user signs in from the email they recieved,
				// they will added to the mobileUsers database collection
				setEmailSent(true)
			} catch (err) {
				console.log(err)
			} finally {
				// Reset add agency form fields
				setNewAgencyName('')
				setNewAgencyEmails('')
				// setData('') // reset State & City?
			}
		})
	}
	// Handler: Form submit NEW & EXISTING AGENCY
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		setUpdate(!update)
		// check form id
		if (e.target.id == 'newAgencyModal') { // NEW AGENCY
			saveAgency()
			setNewAgencyModal(false)
		} else if (e.target.id == 'agencyModal') { // EXISTING AGENCY
			handleAgencyUpdate(e)
		}
	}
	
	// Handler: Delete agency modal
	const handleAgencyDelete = async (agencyId) => {
		setDeleteModal(true)
		setAgencyId(agencyId)
	}
	// Handler: delete agency from database and remove related user's agency field
const handleDelete = async (e) => {
  e.preventDefault();

  try {
    // Get agency data
    const agencyRef = doc(db, 'agency', agencyId);
    const agencySnapshot = await getDoc(agencyRef);
    const agencyData = agencySnapshot.data();

    // Get agency users
    const agencyUsers = agencyData['agencyUsers'];

    // Update agency field for each user
    const updatePromises = [];

    for (const userEmail of agencyUsers) {
      const userRef = query(collection(db, 'mobileUsers'), where('email', '==', userEmail));
      const querySnapshot = await getDocs(userRef);

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(userData);


        // TODO: Change privilege for user since we're deleting agency
        // TODO: Check if user account exists - if it does, get rid of agency privilege.
        // Update the agency field for the user
        const userUpdatePromise = updateDoc(doc.ref, { agency: '' });
        updatePromises.push(userUpdatePromise);
      });
    }

    // Wait for all user updates to complete
    await Promise.all(updatePromises);

    // Delete the agency document
    await deleteDoc(agencyRef);

    console.log('Agency and user updates completed successfully.');
    setDeleteModal(false);
  } catch (error) {
    console.error('Error deleting agency:', error);
  }
};


	// Handler: Agency modal
	// Modal for existing agencies. Modals displayed when user click's the list item to view agency details, or delete an agency.
	const handleAgencyModalShow = async (agencyId) => {
		setAgencyModal(true)
		const docRef = await getDoc(doc(db, 'agency', agencyId))
		setAgencyInfo(docRef.data())
		setAgencyUsersArr(docRef.data()['agencyUsers'])
		setAgencyId(agencyId)
		setLogo(docRef.data()['logo'])
	}
	// Handler: Agency update
	const handleAgencyUpdate = async (e) => {
		e.preventDefault()
		// TODO: Check for any errors
		const allErrors = {}
		setErrors(allErrors)
		console.log(e.target.value);
		console.log(allErrors.length + "Error array length")
	}
	// Handler: On agency admin user change
	const handleAgencyUserChange = async (e) => {
		const docRef = doc(db, "agency", agencyId)
		await updateDoc(docRef, {
			agencyUsers: 'true'
		})
	}
	// Handler: Update form
	const handleFormUpdate = async (e) => {
		e.preventDefault()
		setUpdate(true)
		const docRef = doc(db, 'agency', agencyId)
		console.log(docRef);
		updateDoc(docRef, {
			agencyUsers: e.target.value
		})
	}
	// Effects
	// The useEffect hook is used to trigger the getData function when the component mounts, 
	// ensuring that agency data is fetched from Firestore.
	useEffect(() => {
		getData()
	})

	// Styles
	const style = {
		section_container: 'w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto',
		section_wrapper: 'flex flex-col h-full',
		section_header: 'flex justify-between ml-10 md:mx-0 py-5',
		section_title: 'text-xl font-extrabold text-blue-600 tracking-wider',
		section_filters: '',
		section_filtersWrap: 'p-0 px-4 md:p-4 md:py-0 md:px-4 flex items-center',
		table_main: 'min-w-full bg-white rounded-xl p-1',
		table_thead: 'border-b dark:border-indigo-100 bg-slate-100',
		table_th: 'px-3 p-3 text-sm font-semibold text-left tracking-wide',
		table_tr: 'border-b transition duration-300 ease-in-out hover:bg-indigo-100 dark:border-indigo-100 dark:hover:bg-indigo-100',
		table_td: 'whitespace-normal text-sm px-3 p-2 cursor-pointer',
		table_button: 'hover:fill-cyan-700',
		table_icon: 'ml-4 fill-gray-400 hover:fill-red-600',
		button: 'flex items-center shadow ml-auto bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
	}
	// The return statement defines the JSX structure of the component. 
	// It renders a table with agency information,including logos,names, 
	// locations,and admin users.Users can interact with this table to view,
	// edit,or delete agency data.
	return (
		<div className={style.section_container}>
			<div className={style.section_wrapper}>
				<div className={style.section_header}>
					<div className={style.section_title}>
						Agencies
					</div>
					<div className={style.section_filtersWrap}>
					<button className={style.button} onClick={handleAddNewAgencyModal}><FaPlus className="text-blue-600 mr-2" size={12}/>Add Agency</button>
						{/* TODO: add filters to agency list */}
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
							i = Object.keys(agencyObj)[0]
							return (
								<tr 
								onClick={() => handleAgencyModalShow(Object.keys(agencyObj)[0])} 
								className={style.table_tr} 
								key={i}>
									<td className={style.table_td}>
										{agency['logo'] && agency['logo'][0] ?
											<div className="flex w-full overflow-y-auto">
												{agency['logo'].map((image, i) => {
													return (
														<div className="flex mr-2" key={i}>
															<Image src={`${image}`} width={70} height={100} className='w-auto' alt="image"/>
														</div>
													)
												})}
											</div> :
											<div className="italic font-light">No logo for this agency</div>
										}
									</td>
									<td className={style.table_td}>{agency.name}</td>
									<td className={style.table_td}>
										{agency.city}, {agency.state}
									</td>
									<td className={style.table_td}>
									{agency['agencyUsers'].map((user, i = self.crypto.randomUUID()) => {
										return(
											<div key={i}>{user}</div>
										)
									})}
									</td>
									<td className={style.table_td} onClick={(e) => e.stopPropagation()}>
										<button
											onClick={() => handleAgencyDelete(Object.keys(agencyObj)[0]) }
											className={`${style.table_button} tooltip-delete`}>
											<IoTrash size={20} className={style.table_icon} />
											<Tooltip anchorSelect=".tooltip-delete" place="bottom" delayShow={500}>Delete Agency</Tooltip>
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
				agencyUsersArr={agencyUsersArr}
				setAgencyInfo={setAgencyInfo}
				logo={logo}
				setLogo={setLogo}
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
				setNewAgencyModal={setNewAgencyModal}
				newAgencyName={newAgencyName}
				onNewAgencyName={handleNewAgencyName}
				newAgencyEmails={newAgencyEmails}
				onNewAgencyEmails={handleNewAgencyEmails}
				data={data}
				onNewAgencyState={handleNewAgencyState}
				onNewAgencyCity={handleNewAgencyCity}
				onFormSubmit={handleFormSubmit} 
				errors={errors}
			/>}
		</div>
	)
}

export default Agencies