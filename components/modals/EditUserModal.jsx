import React, { useState, useRef } from "react"
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import { useAuth } from "../../context/AuthContext"
import Image from "next/image"
import { db, auth } from "../../config/firebase"
import { getDoc, getDocs, doc, setDoc, collection, updateDoc, addDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytes, deleteObject, uploadBytesResumable } from 'firebase/storage';

const EditUserModal = ({customClaims, user, name, onNameChange, onFormSubmit, onFormUpdate, onAdminChange, setEditUser, editUser, setUserInfo}) => {
	// //
	// States
	// //

  const {addAdminRole, addAgencyRole, addUserRole} = useAuth()
	const [image, setImage] = useState([])
	const [update, setUpdate] = useState(false)
	
	const router = useRouter()
	const imgPicker = useRef(null)

	// //
	// Handlers
	// //
	const handleImageChange = (e) => {
    console.log('handle image change run');
			for (let i = 0; i < e.target.files.length; i++) {
					const newImage = e.target.files[i];
					setImage((prevState) => [...prevState, newImage]);
					setUpdate(!update)
			}
	};

  const [selectedOption, setSelectedOption] = useState(null);

  // Function to handle radio option selection and change selected user role
  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };


	const handleChange = (e) => {
		// console.log(e.target.value);
	}

  const handleEditUser = (e) => {
    e.preventDefault()
    auth.currentUser.getIdTokenResult()
    .then((idTokenResult) => {
       // Confirm the user is an Admin.
       if (!!idTokenResult.claims.admin) {
        
        // Change the selected user's privileges as requested
         if (selectedOption === "Admin") {
          console.log(addAdminRole({email: user.email}))
         } else if (selectedOption === "Agency") {
          console.log(addAgencyRole({email: user.email}))
         } else if (selectedOption === "User") {
          console.log(addUserRole({email: user.email}))
         }
       }
       setEditUser(false)
    })
    .catch((error) => {
      console.log(error);
      setEditUser(false)
    });
		const name = ''
  }



	// //
	// Styles
	// //
	const style = {
		modal_background: 'fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto',
		modal_container: 'absolute top-4 md:top-6 md:right-6 md:left-6 flex justify-center items-center z-[1300] sm:overflow-y-scroll',
		modal_wrapper: 'flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible',
		modal_header_container: 'flex justify-between w-full mb-6',
		modal_header_wrapper: 'flex w-full items-baseline',
		modal_header: 'text-2xl font-bold text-blue-600 tracking-wider',
		modal_close: 'text-gray-800',
		modal_form_container: 'grid md:grid-cols-2 md:gap-10 lg:gap-15',
		modal_form_label: 'text-lg font-bold text-black tracking-wider mb-4',
		modal_form_data: 'text-sm bg-white rounded-xl p-4 mb-5',
		modal_form_upload_image: 'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
		modal_form_button: 'flex items-center shadow ml-auto mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
	}

	return (
		<div className={style.modal_background} onClick={() => setEditUser(false)}>
			<div className={style.modal_container}>
				<div className={style.modal_wrapper} onClick={(e) => { e.stopPropagation() }}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>User Info</div>
							<button onClick={() => setEditUser(false)} className={style.modal_close}>
								<IoClose size={25}/>
							</button>
						</div>
					</div>
					<div>
						<form onChange={handleChange} onSubmit={handleEditUser}>
							<div className={style.modal_form_container}>
								<div className={style.modal_form_label}>User name</div>
								<div className={style.modal_form_data}>
								<input
								className="shadow border-none rounded-xl w-full p-3 pr-11 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="name"
								type="text"
								onChange={onNameChange}
								value={name}/>
								</div>
								<div className={style.modal_form_label}>User email</div>
								<div className={style.modal_form_data}>
								{user.email}
								<input
								className="shadow border-none rounded-xl w-full p-3 pr-11 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="search"
								type="text"
								onChange={handleChange}
								defaultValue={user.email}/>
								</div>
								{customClaims.admin &&
									<>
										<div className={style.modal_form_label}>Change user privileges</div>
										<div className="inline">    
											<label>
												<input
													type="radio"
													value="Admin"
													checked={selectedOption === "Admin"}
													onChange={handleOptionChange}
												/>
												Admin
											</label>
											<label>
												<input
													type="radio"
													value="Agency"
													checked={selectedOption === "Agency"}
													onChange={handleOptionChange}
												/>
												Agency
											</label>
											<label>
												<input
													type="radio"
													value="User"
													checked={selectedOption === "User"}
													onChange={handleOptionChange}
												/>
												User
											</label>
										</div>
									</>
								}
								<button onClick={onFormUpdate} className={style.modal_form_button} type="submit">Update User</button> 
								{/* TODO: finish update agency */}
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default EditUserModal