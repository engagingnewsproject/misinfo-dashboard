import React, { useState, useRef, useEffect } from "react"
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import Image from "next/image"
import { db } from "../../config/firebase"
import { doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, getMetadata, updateMetadata } from 'firebase/storage';

const AgencyModal = ({
	setAgencyModal, 
	handleAgencyUpdateSubmit, 
	agencyInfo, 
	agencyId,
	onFormSubmit }) => {
	const router = useRouter()
	const imgPicker = useRef(null)
	const storage = getStorage();
	// //
	// States
	// //
	const [errors, setErrors] = useState({})
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([]);
	const [update, setUpdate] = useState(false)
	const [agencyUsers, setAgencyUsers] = useState([])
	
	// Handlers //
	// TODO: Need to figure out why Apple's HEIC filetypes are not showing on the dashboard.
	// Image upload
	const handleImageChange = (e) => {
			for (let i = 0; i < e.target.files.length; i++) {
				const newImage = e.target.files[i];
				console.log(newImage)
					setImages((prevState) => [...prevState, newImage]);
					setUpdate(!update)
			}
	}
	
	// Image upload to firebase
	const handleUpload = () => {
		const promises = [];
		images.map((image) => {
			const storageRef = ref(storage, `agencies/logo_${new Date().getTime().toString()}.png`)
			const uploadTask = uploadBytesResumable(storageRef, image)
			promises.push(uploadTask);
			uploadTask.on( "state_changed",
			(snapshot) => {
				console.log(snapshot);
			},
			(error) => {
				console.log(error);
			},
			() => {
				getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
					// console.log('File available at', downloadURL);
					setImageURLs(
						(prev) => [...prev, downloadURL]
						)
					});
				}
				);
			});
			
			Promise.all(promises)
			.catch((err) => console.log(err));
	}

		
	// Form button click handler
	const handleSubmitClick = (e) => {
		e.preventDefault()
		if (images.length > 0) {
			setUpdate(!update)
			saveAgency(imageURLs)
			setAgencyModal(false)
		}
	}
		
	// Save Agency
	const saveAgency = (imageURLs) => {
		const agencyRef = doc(db, "agency", agencyId);
		updateDoc(agencyRef, {
			logo: imageURLs,
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
		modal_background: 'fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto',
		modal_container: 'absolute top-4 md:top-6 md:right-6 md:left-6 flex justify-center items-center z-[1300] sm:overflow-y-scroll',
		modal_wrapper: 'flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible',
		modal_header_container: 'flex justify-between w-full mb-6',
		modal_header_wrapper: 'flex w-full justify-between items-baseline',
		modal_header: 'text-lg font-bold text-blue-600 tracking-wider',
		modal_close: 'text-gray-800',
		modal_form_container: 'grid md:grid-cols-3 md:gap-10 lg:gap-15',
		modal_form_label: 'text-black tracking-wider mb-4',
		modal_form_data: 'col-span-2 text-sm bg-white rounded-xl p-4 mb-5',
		modal_form_upload_image: 'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
		modal_form_button: 'bg-blue-500 col-start-3 self-end hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline'
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
							<div className={style.modal_form_label}>Agency admin user</div>
							<div className={style.modal_form_data}>
								{agencyInfo['agencyUsers']}
							</div>
							{/* TODO: user should be able to add an admin user */}
							{/* <input onChange={onAdminChange} defaultValue='this' placeholder="Admin user email" className={style.modal_form_data}/> */} 
							<div>
								{agencyInfo['logo'] && agencyInfo['logo'][0] ?
									<div className="flex w-full overflow-y-auto">
										{agencyInfo['logo'].map((image, i) => {
											return (
												<div className="flex mr-2" key={i}>
													<Image src={image} width={100} height={100} alt="image"/>
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
				</div>
			</div>
		</div>
	)
}

export default AgencyModal