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
	agencyUsersArr,
	logo,
	setLogo,
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
	const [uploadedImageURLs, setImageURLs] = useState([]);
	const [update, setUpdate] = useState(false)
	
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

	// This function handles the upload of images to Firebase Storage.
	const handleUpload = async () => {
		try {
			// Check if there are no images to upload.
			if (images.length === 0) {
				console.error("No images to upload.");
				return;
			}
			
			// Define the list of allowed image types.
			const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
			
			// Filter out invalid images based on their types.
			const invalidImages = images.filter((image) => {
				// Check if the image's type is not in the list of valid types.
				return !validImageTypes.includes(image.type);
			});
			
			// If there are invalid images, log them and exit.
			if (invalidImages.length > 0) {
				console.error("Invalid image(s) detected:", invalidImages);
				return;
			}
			
			// Create an array of upload promises for each image.
			const uploadPromises = images.map(async (image) => {
				// Create a reference to a unique storage location for each image using a timestamp.
				const storageRef = ref(storage, `agencies/logo_${new Date().getTime().toString()}.png`);
				
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
			console.log(images)
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
								{agencyUsersArr.map(txt => <p>{txt}</p>)}
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