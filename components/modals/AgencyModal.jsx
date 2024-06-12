import React, { useState, useRef, useEffect } from "react"
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import Image from "next/image"
import ConfirmModal from "./ConfirmModal"

import { db } from "../../config/firebase"
import { 
	doc, 
	updateDoc,
	arrayUnion,
	} from 'firebase/firestore'

import { auth } from '../../config/firebase'

import { useAuth } from '../../context/AuthContext'

import { getStorage, ref, uploadBytesResumable, getDownloadURL, getMetadata, updateMetadata } from 'firebase/storage';

const AgencyModal = ({
	setAgencyModal, 
	handleAgencyUpdateSubmit, 
	agencyInfo, 
	agencyUsersArr,
	logo,
	setLogo,
	agencyId,
	onFormSubmit }) => {
    const { user, sendSignIn, addUserRole } = useAuth() // Add agency user send signup email

	const router = useRouter()
	const imgPicker = useRef(null)
	const storage = getStorage();
	// //
	// States
	// //
  const [addAgencyUsers, setAddAgencyUsers] = useState([])
	const [errors, setErrors] = useState({})
	const [images, setImages] = useState([])
	const [uploadedImageURLs, setImageURLs] = useState([]);
	const [update, setUpdate] = useState(false)

  // used to indicate if email was resent to user, or if user was added as agency admin
  const [resendEmail, setResendEmail] = useState("")
  const [sendEmail, setSendEmail] = useState("") 


  // delete modal
  const [deleteModal, setDeleteModal] = useState(false)
  const [adminDelete, setAdminDelete] = useState("")

// This function handles the change event when the user selects one or more images.
// It updates the 'images' state and triggers a re-render.
const handleImageChange = (e) => {
  // Clear the 'images' state to start with an empty array.
  setImages([]);
  
  // Loop through each selected image in the event.
  for (let i = 0; i < e.target.files.length; i++) {
    const newImage = e.target.files[i];
    // console.log(newImage); // Log the new image for debugging.
    
    // Update the 'images' state by adding the new image to the previous state.
    setImages((prevState) => [...prevState, newImage]);
    
    // Trigger a re-render by changing the 'update' state (if needed).
    setUpdate(!update);
  }
}

  const handleNewAgencyEmails = (e) => {
    e.preventDefault()
    let usersArr = e.target.value
		usersArr = usersArr.split(',')
    setAddAgencyUsers(usersArr)
  }


  // Adds agency users by sending them the sign-in link.
  // Updates Firebase document and adds the user to the Agency's user list.
  const handleAddAgencyUsers = async (e) => {
    e.preventDefault()
    let tempUsersArr = agencyUsersArr
    console.log(tempUsersArr)
    for (const userEmail of addAgencyUsers) {
      if (!tempUsersArr.includes(userEmail)) {
        tempUsersArr.push(userEmail)
      } else {
				setSendEmail(`${userEmail} is already an admin for this agency.`)
				break
			}
      // await sendSignIn(userEmail)
      // setSendEmail("Sign-in link was sent.")

    }
    const agencyRef = doc(db, "agency", agencyId);
		updateDoc(agencyRef, {
      agencyUsers: arrayUnion(...tempUsersArr),
		}).then(() => {
			handleAgencyUpdateSubmit(); // Send a signal to ReportsSection so that it updates the list 
		})
  }

  // Resends sign-in link to agency user.
  const sendAgencyLinks = async (email) => {
    await sendSignIn(email)
    setResendEmail("Email was sent.")
  }

	// This function handles the upload of images to Firebase Storage.
	const handleUpload = async () => {
		try {
			// Check if there are no images to upload.
			if (images.length === 0) {
				console.error("No images to upload.");
				return;
			}
			
			// Define the list of allowed image types.
			// const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
			
			// // Filter out invalid images based on their types.
			// const invalidImages = images.filter((image) => {
			// 	// Check if the image's type is not in the list of valid types.
			// 	return !validImageTypes.includes(image.type);
			// });
			
			// // If there are invalid images, log them and exit.
			// if (invalidImages.length > 0) {
			// 	console.error("Invalid image(s) detected:", invalidImages);
			// 	return;
			// }
			
			// Create an array of upload promises for each image.
			const uploadPromises = images.map(async (image) => {
				// Create a reference to a unique storage location for each image using a timestamp.
				const storageRef = ref(storage, `${new Date().getTime().toString()}.png`);
				
				// Start the upload task for the current image.
				const uploadTask = uploadBytesResumable(storageRef, image);
				
				// Wait for the upload to complete and get the download URL.
				await uploadTask;
				const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
				
				// Return the download URL for this image.
				return downloadURL;
			});
			
			// Wait for all upload promises to complete and get an array of image URLs.
			const imageURLs = await Promise.all(uploadPromises);
			
			// Update the 'imageURLs' state with the uploaded image URLs.
			setImageURLs([...imageURLs]);
			setLogo(imageURLs)
		} catch (error) {
			console.error("Error uploading images:", error);
		}
	};

  const handleDeleteAdmin = (user) => {
    setAdminDelete(user)
    setDeleteModal(true)
  }

  const deleteAdmin = () => {

    setDeleteModal(false)
    auth.currentUser
    .getIdTokenResult()
    .then((idTokenResult) => {
      // Confirm the user is an Admin.
      if (!!idTokenResult.claims.admin) {
        // Change the selected user's privileges as requested
        console.log(addUserRole({ email: adminDelete}))
      }
    })
    .catch((error) => {
      console.log(error)
    })
    let tempUsersArr = 
    [
      ...agencyUsersArr.slice(0, agencyUsersArr.indexOf(adminDelete)),
      ...agencyUsersArr.slice(agencyUsersArr.indexOf(adminDelete) + 1)
    ]
    console.log(tempUsersArr)
    const agencyRef = doc(db, "agency", agencyId);
		updateDoc(agencyRef, {
      agencyUsers: tempUsersArr,
		}).then(() => {
      setUpdate(!update);
      // Send a signal to ReportsSection so that it updates the list 
		})
  }

		
	// Form button click handler
	const handleSubmitClick = (e) => {
		e.preventDefault()
		if (images.length > 0) {
			setUpdate(!update)
			saveAgency(uploadedImageURLs)
			setAgencyModal(false)
		}
	}
		
	// Save Agency
	const saveAgency = (uploadedImageURLs) => {
		const agencyRef = doc(db, "agency", agencyId);
		updateDoc(agencyRef, {
			logo: uploadedImageURLs,
		}).then(() => {
			handleAgencyUpdateSubmit(); // Send a signal to ReportsSection so that it updates the list 
		})
	}
		
	// Effects
	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update]);
	
	// Styles
	const style = {
		modal_background: 'fixed z-[9998] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto',
		modal_container: 'absolute top-4 md:top-6 md:right-6 md:left-6 flex justify-center items-center z-[9999] sm:overflow-y-scroll',
		modal_wrapper: 'flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible',
		modal_header_container: 'flex justify-between w-full mb-6',
		modal_header_wrapper: 'flex w-full justify-between items-baseline',
		modal_header: 'text-lg font-bold text-blue-600 tracking-wider',
		modal_close: 'text-gray-800',
		modal_form_container: 'grid md:grid-cols-3 md:gap-10 lg:gap-15',
		modal_form_label: 'text-black tracking-wider mb-4',
		modal_form_data: 'col-span-2 text-sm bg-white rounded-xl p-4 mb-5',
    modal_form_add_agency: 'col-span-2 text-sm rounded-xl p-1 mb-5',
		modal_form_upload_image: 'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
		modal_form_button: 'bg-blue-600 col-start-3 self-end hover:bg-blue-700 text-sm text-white font-semibold ml-1 py-2 px-6 rounded-md focus:outline-none focus:shadow-outline',
    modal_form_button_sent: "bg-green-500 col-start-3 self-end hover:bg-green-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline",
    modal_notification_text: "text-green-700",
    modal_dismiss_button: "bg-green-700 self-end hover:bg-green-800 text-sm text-white font-semibold ml-1 px-2 rounded-lg focus:outline-none focus:shadow-outline",
    modal_resend_button: "bg-blue-600 col-start-3 self-end hover:bg-blue-700 text-sm text-white font-semibold ml-1 px-2 rounded-lg focus:outline-none focus:shadow-outline",
    modal_delete:"bg-red-500 text-white font-semibold ml-1 px-1 mr-2 rounded-lg"
  }
	// TODO: filter reports, tags & users by agency login
	return (
		<div className={style.modal_background} onClick={() => setAgencyModal(false)}>
			<div className={style.modal_container}>
				<div className={style.modal_wrapper} onClick={(e) => { e.stopPropagation()}}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>Agency Info</div>
							<button onClick={() => setAgencyModal(false)} className={style.modal_close}>
								<IoClose size={25}/>
							</button>
						</div>
					</div>
					<form onSubmit={onFormSubmit} id='agencyModal'>
						<div className={style.modal_form_container}>
							<div className={style.modal_form_label}>Agency name</div>
							<div className={style.modal_form_data}>{agencyInfo.name}</div>
							<div className={style.modal_form_label}>Agency location</div>
							<div className={style.modal_form_data}>{`${agencyInfo.city}, ${agencyInfo.state}`}</div>
							<div className={style.modal_form_label}>Agency admin users</div>

							<div className={style.modal_form_data}>
								{agencyUsersArr.map((txt, i = self.crypto.randomUUID()) => 
                  <div className="grid grid-cols-2 py-1" key={i}>
                    <div className="flex">
                      <button onClick={()=>handleDeleteAdmin(txt)} className={style.modal_delete}>
								        <IoClose size={16}/>
							        </button>

                      <p>{txt}</p>

                    </div>
                    {/* <div>
                      <button onClick={()=>sendAgencyLinks(txt)} className={style.modal_resend_button} type="submit">Resend link</button>
                    </div>  */}
                  </div>)}
                  {/* {resendEmail && 
                        <div className="flex py-2">
                          <p className={style.modal_notification_text}>{resendEmail}</p>                       
                          <span><button onClick={()=>setResendEmail("")} className={style.modal_dismiss_button} type="submit">Dismiss</button></span>
                        </div>} */}
              </div>
              <div className={style.modal_form_label}>
                Add agency user
              </div>
              <div className={style.modal_form_add_agency}>
                    <input // New agency emails
                      className="rounded-xl"
                      id="agencyUser"
                      type="text"
                      placeholder="Agency User Email"
                      value={addAgencyUsers}
                      onChange={handleNewAgencyEmails}
                      autoComplete='nope'
                      />
                      {errors.email ? (
                        <p className="error">
                        Email should be at least 15 characters long
                        </p>
                        ) : null}
                      <button onClick={handleAddAgencyUsers} className={style.modal_form_button} type="submit">Add agency user</button>
                      {sendEmail && 
                        <div className="flex py-2">
                          <p className={style.modal_notification_text}>{sendEmail}</p>                       
                          <span><button onClick={()=>setSendEmail("")} className={style.modal_dismiss_button} type="submit">Dismiss</button></span>
                        </div>}

              </div>

							{/* TODO: user should be able to add an admin user */}
							{/* <input onChange={onAdminChange} defaultValue='this' placeholder="Admin user email" className={style.modal_form_data}/> */} 
							<div>
								{
								logo ?
									<div className="flex w-full overflow-y-auto">
										{logo.map((image, i) => {
											return (
												<div className="flex mr-2" key={i}>
													<Image src={`${image}`} width={100} height={100} className="w-auto" alt="agency image"/>
												</div>
											)
										})}
									</div> :
									<div className="italic font-light">No agency logo uploaded.</div>
								}
								<label className="block">
									<span className="sr-only">Choose files</span>
									<input className={style.modal_form_upload_image} 
									id="agency_logo_file" 
									type="file" 
									accept="image/*" 
									onChange={handleImageChange}
									ref={imgPicker}
									/>
								</label>
							</div>
						<button onClick={handleSubmitClick} className={style.modal_form_button} type="submit">Update Agency</button> 
							{/* TODO: finish update agency */}
						</div>
					</form>
        {deleteModal && <ConfirmModal
				func={deleteAdmin}
				title="Are you sure you want to remove this admin user?"
				subtitle=""
				CTA="Delete"
				closeModal={setDeleteModal}
			/>}
				</div>
			</div>
		</div>
	)
}

export default AgencyModal