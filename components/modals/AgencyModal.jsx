import React, { useState, useRef, useEffect } from "react"
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
  handleImageChange,
  handleUpload,
  handleAddAgencyUsers,
  sendAgencyLinks,
  deleteAdmin, // deleteAdmin handler passed from the parent
  handleSubmitClick,
  saveAgency,
  agencyInfo,
  agencyUsersArr,
  images,
  resendEmail,
  sendEmail,
  adminDelete,
	setAddAgencyUsers,
	addAgencyUsers, // handle the input value for new agency emails
  setErrors,
  setSendEmail,
  setResendEmail,
	imgPicker,
	uploadedImageURLs,
	errors }) => {
    const { user, sendSignIn, addUserRole } = useAuth() // Add agency user send signup email

	const storage = getStorage();

  // delete modal
  const [deleteModal, setDeleteModal] = useState(false)
	const [selectedUserToDelete, setSelectedUserToDelete] = useState('')

  // Handler: Show delete confirmation modal
  const handleDeleteClick = (user) => {
    setSelectedUserToDelete(user)
    setDeleteModal(true)
  }

  // Confirm and delete the admin user
  const confirmDeleteAdmin = () => {
    deleteAdmin(selectedUserToDelete) // Call the deleteAdmin function from parent with the selected user
    setDeleteModal(false) // Close the confirmation modal
  }
	
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
					<form onSubmit={handleSubmitClick} id='agencyModal'>
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
                      <button
                        onClick={() => handleDeleteClick(txt)} // Call the handler to show delete modal
                        className={style.modal_delete}
                      >
                        <IoClose size={16} />
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
							{/* Add agency user input and submit button */}
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
									onChange={(e) => setAddAgencyUsers(e.target.value)}
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
							<div>
								{/* Display the existing logo if it exists */}
								{uploadedImageURLs[0] ? (
                  <Image
                    src={uploadedImageURLs[0]}
                    width={100}
                    height={100}
                    alt="Agency logo preview"
                    onLoad={() => URL.revokeObjectURL(uploadedImageURLs[0])}
                  />
                )
								: 
									agencyInfo.logo && (
										<Image
											src={agencyInfo.logo[0]} // Use the first logo URL since it's a single image
											width={100}
											height={100}
											alt="Agency logo"
										/>
									)
								}
								<label className="block">
									<span className="sr-only">Choose files</span>
									<input
										className={style.modal_form_upload_image} 
										id="agency_logo_file" 
										type="file" 
										accept="image/*" 
										onChange={handleImageChange}
										ref={imgPicker}
									/>
								</label>
							</div>
						<button 
							className={style.modal_form_button}
							type="submit">
								Update Agency
							</button> 
							{/* TODO: finish update agency */}
						</div>
					</form>
          {/* Confirm delete modal */}
          {deleteModal && (
            <ConfirmModal
              func={confirmDeleteAdmin} // Use confirmDeleteAdmin as the delete handler
              title="Are you sure you want to remove this admin user?"
              subtitle=""
              CTA="Delete"
              closeModal={() => setDeleteModal(false)}
            />
          )}
				</div>
			</div>
		</div>
	)
}

export default AgencyModal