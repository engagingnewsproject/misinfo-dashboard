import React, { useState, useRef, useEffect } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'
import { collection, getDocs } from '@firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db, auth } from "../config/firebase"
import Image from "next/image"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const AgencyDesign = ({customClaims}) => {
	const imgPicker = useRef(null)
	const storage = getStorage();
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([]);
	const [update, setUpdate] = useState(false)
		
	// Image upload
	const handleImageChange = (e) => {
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i];
			setImages((prevState) => [...prevState, newImage]);
			setUpdate(!update)
		}
	}
	
	// Image upload to firebase
	const handleUpload = () => {
		const promises = [];
		images.map((image) => {
			const storageRef = ref(storage, `agencies/agencyDesign/logo_${new Date().getTime().toString()}.png`)
			const uploadTask = uploadBytesResumable(storageRef, image)
			promises.push(uploadTask);
			uploadTask.on( "state_changed",
			(snapshot) => { console.log(snapshot)},
			(error) => { console.log(error) },
			() => {
				getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
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
		console.log(imageURLs)
		
	// Form button click handler
	const handleSubmitClick = (e) => {
		e.preventDefault()
		if (images.length > 0) {
			setUpdate(!update)
			saveDesign(imageURLs)
			setAgencyModal(false)
		}
	}
	
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
	
	const saveAgency = (imageURLs) => {
		const agencyRef = doc(db, "agency", agencyId);
		updateDoc(agencyRef, {
			logo: imageURLs,
		}).then(() => {
			handleAgencyUpdateSubmit(); // Send a signal to ReportsSection so that it updates the list 
		})
	}
		
	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update]);


	return (
		<div className='w-full  h-auto bg-slate-100'>
			<div className='z-0 flex-col p-16 pt-10'>
			<form onSubmit={handleFormSubmit} id='agencyModal'>
				<div className="mt-4 mb-0.5">
				<label className="block">
				<span className="sr-only">Choose files</span>
				<input className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer" 
				id="multiple_files" 
				type="file" 
				multiple 
				accept="image/*" 
				// onChange={(e) => {onImageChange(e) }}
				onChange={(e) => {
					handleImageChange(e)
				}}
				ref={imgPicker}
				/>
				</label>
				<div className="flex shrink-0 mt-2 space-x-2">
				{imageURLs.map((url, i) => (
					<div className='relative'>
					<Image src={url} key={i} width={100} height={100} alt={`image-upload-${i}`}/>
					{/* TODO: delete file after upload */}
					{/* <IoClose size={15} color='white' className='absolute top-0 right-0' onClick={handleImageDelete}/> */}
					</div>
					))}
					</div>
					</div>
				</form>
			</div>
		</div>
		);
	};
	
	export default AgencyDesign;