import React, { useState, useEffect, useRef } from 'react'
import UpdatePwModal from './modals/UpdatePwModal'
import UpdateEmailModal from './modals/UpdateEmailModal';
import { useAuth } from '../context/AuthContext';
// import { auth } from 'firebase-admin';
import ConfirmModal from './modals/ConfirmModal';
import DeleteModal from './modals/DeleteModal';
import { useRouter } from 'next/router'
import {
	collection,
	getDocs,
	getDoc,
	query,
	where,
	updateDoc,
	doc,
} from "@firebase/firestore"
import {
	getStorage,
	ref,
	uploadBytesResumable,
	getDownloadURL,
} from "firebase/storage"
import { db, auth } from "../config/firebase"
import { State, City } from "country-state-city"
import Select from "react-select"
import Image from "next/image"
// Profile page that allows user to edit password or logout of their account
const Profile = ({ customClaims }) => {
	const {
		user,
		logout,
		verifyRole,
		changeRole,
		addAdminRole,
		addAgencyRole,
		viewRole,
		deleteUser
	} = useAuth()
	const [openModal, setOpenModal] = useState(false)
	const [emailModal, setEmailModal] = useState(false)
	const [logoutModal, setLogoutModal] = useState(false)
	const [deleteModal, setDeleteModal] = useState(false)
	const [agency, setAgency] = useState([])
	const [agencyName, setAgencyName] = useState("")
	const [agencyId, setAgencyId] = useState("")
	const [isAdmin, setIsAdmin] = useState(false)
	const [isAgency, setIsAgency] = useState(false)
	const router = useRouter()
	const [userRoles, setUserRoles] = useState({})

	// LOCATION
	const [agencyState, setAgencyState] = useState(null)
	const [agencyCity, setAgencyCity] = useState(null)

	const [editLocation, setEditLocation] = useState(false)
	const [location, setLocation] = useState([])
	const [data, setData] = useState({ country: "US", state: null, city: null })
	const [isSearchable, setIsSearchable] = useState(true)
	const [errors, setErrors] = useState({})

	// IMAGES
	const imgPicker = useRef(null)
	const storage = getStorage()
	const [editLogo, setEditLogo] = useState(false)
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([])
	const [agencyLogo, setAgencyLogo] = useState([])
	const [update,setUpdate] = useState(false)
  const [showUpdateMessage, setShowUpdateMessage] = useState(false);

	const style = {
		button:
			"bg-blue-500 col-start-3 self-end hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline",
		input:
			"text-md font-light bg-white rounded-xl p-4 border-none w-full focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none resize-none",
		inputSelect:
			"border-gray-300 col-span-1 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline",
		buttonCancel:
			" col-start-3 border-solid border-red-500 self-end hover:bg-blue-700 text-sm text-red-500 font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline",
		fileUploadButton:
			"block flex flex-col text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer",
	}



	// IMAGE UPLOAD
	const handleLogoEdit = (e) => {
		e.preventDefault()
		setEditLogo(!editLogo)
	}

	const handleImageChange = (e) => {
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			// console.log(newImage)
			setImages((prevState) => [...prevState, newImage])
			setUpdate(!update)
		}
	}

	const handleUpload = () => {
		// Image upload to firebase
		const promises = []
		images.map((image) => {
			const storageRef = ref(
				storage,
				`agencies/logo_${agencyId}_${new Date().getTime().toString()}.png`
			)
			const uploadTask = uploadBytesResumable(storageRef, image)
			promises.push(uploadTask)
			uploadTask.on(
				"state_changed",
				(snapshot) => {
					// console.log(snapshot)
				},
				(error) => {
					console.log(error)
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
						setImageURLs((prev) => [...prev, downloadURL])
					})
				}
			)
		})
		Promise.all(promises).catch((err) => console.log(err))
	}

  useEffect(() => {  // Verify role
    verifyRole().then((result) => {
			// console.log(result)
      if (result.admin) {
        setIsAdmin(true)
      } else if (result.agency) {
        setIsAgency(true)
      } else {
        setIsAgency(false)
        setIsAdmin(false)
      }
    })
  }, [])

  
  // GET DATA
  const getData = async () => { // Get data
    if (isAgency) {
      try {
        const agencyCollection = collection(db, 'agency')
        const q = query(agencyCollection, where('agencyUsers', "array-contains", user['email']));
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {

          querySnapshot.forEach((doc) => { // Set initial values
						// console.log(doc.data())
            setAgency(doc.data())
            setAgencyId(doc.id)
            setAgencyName(doc.data()['name'])
            setAgencyState(doc.data()['state'])
            setAgencyCity(doc.data()['city'])
            setAgencyLogo(doc.data()['logo'])
          });
        }
      } catch (error) {
        console.error("Error fetching agency data:", error)
      }
    }
  }

	// SAVE AGENCY
	const saveAgency = (imageURLs) => {
		const docRef = doc(db, "agency", agencyId)
		updateDoc(docRef, {
			name: agencyName,
			logo: imageURLs,
			state: data.state.name,
			city: data.city == null ? "N/A" : data.city.name,
		}).then(() => {
			setUpdate(true)
		})
	}
	
	// Agency updated message
	useEffect(() => {
		if (update && Object.keys(errors).length === 0) {
			setShowUpdateMessage(true);
			console.log('Agency updated. MESSAGE SHOULD SHOW', showUpdateMessage);

			// Hide the message after 5 seconds
			const timeoutId = setTimeout(() => {
				setShowUpdateMessage(false);
			}, 5000);

			// Clean up the timeout to prevent memory leaks
			return () => clearTimeout(timeoutId);
		}
	}, [update, errors]);

	// NAME CHANGE
	const handleAgencyNameChange = (e) => {
		e.preventDefault()
		setAgencyName(e.target.value)
	}
	// LOCATION CHANGE
	const handleAgencyLocationChange = (e) => {
		e.preventDefault()
		setEditLocation(!editLocation)
	}
	const handleAgencyStateChange = (e) => {
		// location STATE
		setData((data) => ({ ...data, state: e, city: null }))
	}
	const handleAgencyCityChange = (e) => {
		setData((data) => ({ ...data, city: e !== null ? e : null }))
	}

	// FORM SUMBMISSION
	const handleSubmitClick = (e) => {
		e.preventDefault()
		const allErrors = {}
		// HANDLE CITY ERRORS
		const handleCityError = (errorMessage) => {
			allErrors.city = errorMessage
			if (
				data.state != null &&
				City.getCitiesOfState(data.state?.countryCode, data.state?.isoCode)
					.length == 0
			) {
				console.log("No cities here")
				delete allErrors.city
			}
			setErrors(allErrors)
			console.log(allErrors)
		}
		// AGENCY NAME
		if (agencyName == "") {
			console.log("No agency name error")
			allErrors.name = "Please enter an agency name."
		}
		// STATE
		if (!data.state || agency["state"] === "") {
			console.log(data.state)
			console.log("state error")
			allErrors.state = "Please enter a state."
		} else {
			setAgencyState(agency["state"])
		}
		// CITY
		if (!data.city || agency["city"] === "") {
			handleCityError("Please enter a city.");
			if (
				data.state != null &&
				City.getCitiesOfState(data.state?.countryCode, data.state?.isoCode)
					.length == 0
			) {
				console.log("No cities here")
				delete allErrors.city
			}
			setErrors(allErrors)
			console.log(allErrors)
		} else if (
				!data.city ||
				data.city === null ||
				data.city === undefined ||
				agency["city"] === ""
			) {
				handleCityError("Please enter a city.");
				if (
					data.state != null &&
					City.getCitiesOfState(data.state?.countryCode, data.state?.isoCode)
						.length === 0
				) {
					console.log("No cities here")
					delete allErrors.city
				}
				setErrors(allErrors)
				console.log(allErrors)
			} else {
				if (!errors.city && data.city === null) {
					console.log("No city error")
					data.city = agency["city"]
				} else if (errors.city) {
					// Handle the case where there are errors related to the city
					console.log("There are city errors:", errors.city)
				}
			}

		// IMAGE/LOGO
		// if (images.length > 0) {
		// 	setUpdate(!update)
		// }
		if (Object.keys(allErrors).length == 0) {
			// handleSubmitClick(e)
			console.log(update)
			setUpdate(true)
			console.log(update, ' no errors')
			saveAgency(imageURLs)
			
		}
	}

	// const handleFormSubmit = async (e) => {
	// 	e.preventDefault()
	// 	console.log('handleFormSubmit processed')
	// 	setUpdate(true)
	// 	const docRef = doc(db, "agency", agencyId)
	// 	updateDoc(docRef, {
	// 		logo: e.target.value,
	// 	})
	// }

	// LOGOUT
	const handleLogout = () => {
		logout().then(() => {
			router.push("/login")
		})
	}
	// Delete
const handleDelete = async () => {
  const uidToDelete = user.accountId;
  
  // Validate UID
  if (!uidToDelete || typeof uidToDelete !== 'string' || uidToDelete.length > 128) {
    console.error('Invalid UID:', uidToDelete);
    return; // Abort deletion
  }
	await deleteUser({ uid: uidToDelete })
    .then(() => {
      console.log('User deletion successful');
      router.push("/login");
    })
    .catch((error) => {
      console.error('Error deleting user:', error);
    });
};


	useEffect(() => { // Get data once we know if the user is an agency or not
    if (user) {
		  getData()
    }
  }, [isAgency]);
  
  useEffect(() => {
    if (agency['name'] !== agencyName) {
      setAgencyName(agencyName)
    } else {
      setAgencyName(agency['name'])
    }
		if (agency['city'] !== agencyCity || agency['state'] == agencyState) {
			setLocation(agency['city'] + ', ' + agency['state'])
    }
    // getData()
  }, [update])
  

	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update])

	// Had to remove it for a sec. Wasn't allowing me to view the profile page.
	// useEffect(() => {
	// 	auth.currentUser
	// 		.getIdTokenResult()
	// 		.then((idTokenResult) => {
	// 			// Confirm the user is an Admin.
	// 			if (!!idTokenResult.claims.admin) {
	// 				// Show admin UI.
	// 				setCustomClaims({ admin: true })
	// 			} else if (!!idTokenResult.claims.agency) {
	// 				// Show regular user UI.
	// 				setCustomClaims({ agency: true })
	// 			}
	// 		})
	// 		.catch((error) => {
	// 			console.log(error)
	// 		})
	// 	getData()
	// })

	useEffect(() => {
		const fetchUserRoles = async () => {
			try {
				const idTokenResult = await auth.currentUser.getIdTokenResult()
				// console.log(idTokenResult)
				setUserRoles(idTokenResult.claims)
			} catch (error) {
				console.error("Error fetching user roles:", error)
			}
		}

		fetchUserRoles()
	},[])
	
	return (
		<div className='w-full h-auto'>
			<div className='z-0 flex-col p-2 md:p-8 lg:p-16 pt-5 md:pt-10'>
				<div className='text-xl font-extrabold text-blue-600 tracking-wider'>
					Account
				</div>
				{isAgency && ( // agency user will see the agency row
					<div className='flex justify-between mx-6 my-6 tracking-normal items-center'>
						<div className='font-light'>
							{agency.length > 1 ? "Agencies" : "Agency"}
						</div>
						<div className='flex gap-2 my-2 tracking-normal items-center'>
							<div className='font-light'>{agencyName}</div>
						</div>
					</div>
				)}
				<div className='flex flex-col md:flex-row justify-start md:justify-between mx-0 md:mx-6 my-6 tracking-normal items-stretch md:items-center'>
					<div className='font-semibold text-sm md:font-light'>Email</div>
					<div className='flex gap-2 my-2 tracking-normal items-center justify-between'>
						<div className='font-light'>{user.email}</div>
						<button
							onClick={() => setEmailModal(true)}
							className='bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl flex justify-self-end'>
							Edit Email
						</button>
					</div>
				</div>
				<div className='flex justify-between mx-0 md:mx-6 my-6 tracking-normal items-center'>
					<div className='font-light'>Reset Password</div>
					<button
						onClick={() => setOpenModal(true)}
						className='bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl'>
						Edit Password
					</button>
				</div>
				<div className='flex justify-between mx-0 md:mx-6 my-6 tracking-normal items-center'>
					<div className='font-light'>Logout</div>
					<button
						onClick={() => setLogoutModal(true)}
						className='bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl'>
						Logout
					</button>
				</div>
				<div className='flex justify-between mx-0 md:mx-6 my-6 tracking-normal items-center'>
					<div className='font-light'>Delete my account</div>
					<button
						onClick={() => setDeleteModal(true)}
						className='bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl'>
						Request Delete
					</button>
				</div>
			</div>
			{isAgency && ( // agency settings
				<div className='z-0 flex-col p-16 pt-10 bg-slate-100'>
					<div className='text-xl font-extrabold text-blue-600 tracking-wider'>
						Agency Settings
					</div>
					<div className='w-full h-auto'>
						<form
							// onSubmit={handleFormSubmit}
							id='agencyDesign'
							className='flex flex-col'>
							<div className='mt-4 mb-4 grid gap-4'>
								<div className='grid grid-cols-4 items-center'>
									<div className='col-span-1'>Agency Name</div>
									<div className='col-span-3'>
										<input
											id='agency_name'
											onChange={handleAgencyNameChange}
											placeholder='Agency name'
											type='text'
											className={style.input}
											defaultValue={agencyName}
										/>
										{agencyName === "" && (
											<span className='text-red-500 text-xs'>
												{errors.name}
											</span>
										)}
									</div>
								</div>
								<div className='grid grid-cols-4 items-center'>
									<div className='col-span-1'>Agency Location</div>

									<div className='col-span-3 grid grid-cols-8 items-center bg-white rounded-md px-3'>
										<div
											className={`col-span-8 ${
												editLocation === false
													? " visible relative"
													: " hidden absolute"
											}`}
											onClick={handleAgencyLocationChange}>
											<div
												className={
													style.input
												}>{`${agency["city"]}, ${agency["state"]}`}</div>
										</div>
										<Select
											className={` col-start-1 row-start-1 col-span-3 ${
												(style.inputSelect,
												editLocation === true
													? " visible relative"
													: " hidden absolute ")
											}`}
											id='state'
											type='text'
											placeholder='State'
											isSearchable={isSearchable}
											value={data.state}
											options={State.getStatesOfCountry(data.country)}
											getOptionLabel={(options) => {
												return options["name"]
											}}
											// isDisabled={editLocation === true ? `false` : `true`}
											getOptionValue={(options) => {
												return options["name"]
											}}
											label='state'
											onChange={handleAgencyStateChange}
										/>
										{errors.state && data.state === null && (
											<span className='text-red-500 text-xs col-start-1 col-span-3'>
												{errors.state}
											</span>
										)}
										<Select
											className={`${
												(style.inputSelect,
												editLocation === true
													? " visible relative"
													: " hidden absolute")
											} ml-4 p-3 col-start-4 col-span-3 row-start-1`}
											id='city'
											type='text'
											placeholder='City'
											value={data.city}
											options={City.getCitiesOfState(
												data.state?.countryCode,
												data.state?.isoCode
											)}
											// isDisabled={editLocation === true ? `false` : `true`}
											getOptionLabel={(options) => {
												return options["name"]
											}}
											getOptionValue={(options) => {
												return options["name"]
											}}
											onChange={handleAgencyCityChange}
										/>
										{errors.city && data.city === null && (
											<span className='text-red-500 text-xs col-span-3 col-start-4'>
												{errors.city}
											</span>
										)}
										<div
											className={`text-red-500 cursor-pointer col-start-7 row-start-1 col-auto${
												editLocation === true
													? " visible block"
													: " hidden absolute"
											}`}
											onClick={handleAgencyLocationChange}>
											Cancel
										</div>
									</div>
								</div>
								<div className='grid grid-cols-4 items-center'>
									<div className='col-span-1'>Agency Logo</div>
									{editLogo ? (
										<div
											className={`${style.inputSelect} bg-white col-span-3 flex items-center`}>
											<label>
												<span className='sr-only'>Choose agency logo</span>
												<input
													className={`${style.fileUploadButton}`}
													id='multiple_files'
													type='file'
													accept='image/*'
													onChange={handleImageChange}
													ref={imgPicker}
												/>
												{errors.images && images === null && (
													<span className='text-red-500'>{errors.images}</span>
												)}
											</label>
											<div className='col-span-2'>
												{imageURLs.map((url, i = self.crypto.randomUUID()) => (
													<Image
														src={url}
														key={i}
														width={100}
														height={50}
														className='inline'
														alt={`image-upload-${i}`}
													/>
												))}
											</div>
											<div
												className='text-red-500 cursor-pointer'
												onClick={handleLogoEdit}>
												Cancel
											</div>
										</div>
									) : (
										<div
											className={`${style.inputSelect} bg-white col-span-3`}
											onClick={handleLogoEdit}>
											{agencyLogo.map((image, i) => {
												return (
													<div className='flex mr-2' key={i}>
														<Image
															src={image}
															width={70}
															height={100}
															className='w-auto'
															alt='image'
														/>
													</div>
												)
											})}
										</div>
									)}
								</div>
							</div>
							<div className='flex justify-end items-center'>
								{showUpdateMessage && (
									<div className='transition-opacity opacity-100'>
										Agency updated
									</div>
								)}
								<button
									onClick={handleSubmitClick}
									className={`${style.button} ml-2`}
									type='submit'>
									Update Agency
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
			{openModal && <UpdatePwModal setOpenModal={setOpenModal} />}
			{emailModal && <UpdateEmailModal setEmailModal={setEmailModal} />}
			{logoutModal && (
				<ConfirmModal
					func={handleLogout}
					title='Are you sure you want to log out?'
					subtitle=''
					CTA='Log out'
					closeModal={setLogoutModal}
				/>
			)}
			{deleteModal && (
				<DeleteModal
					func={handleDelete}
					title='Are you sure you want to delete your account?'
					subtitle=''
					CTA='Delete'
					closeModal={setDeleteModal}
				/>
			)}
		</div>
	)
}

export default Profile
