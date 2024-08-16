import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/router"
import { IoClose } from "react-icons/io5"
import { useAuth } from "../../context/AuthContext"
import moment from "moment"
import Image from "next/image"
import { db } from "../../config/firebase"
import {
	getDoc,
	getDocs,
	doc,
	setDoc,
	collection,
	updateDoc,
	addDoc,
} from "firebase/firestore"
import {
	getStorage,
	ref,
	getDownloadURL,
	uploadBytes,
	deleteObject,
	uploadBytesResumable,
} from "firebase/storage"
import { useTranslation } from "react-i18next"

const ContactHelpModal = ({ setContactHelpModal, handleContactHelpSubmit }) => {
	const { t } = useTranslation("Navbar")
	const dbInstance = collection(db, "helpRequests")
	const router = useRouter()
	const { user } = useAuth()
	const storage = getStorage()
	//image upload
	const imgPicker = useRef(null)

	//set form fields
	const [subject, setSubject] = useState("")
	const [message, setMessage] = useState("")
	const [update, setUpdate] = useState(false)
	const [contactHelpState, setContactHelpState] = useState(0)
	const [errors, setErrors] = useState({})
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([])
	const saveContactHelp = async () => {
		try {
			const email = user.email // Fetch the user's email from the user object
			const data = {
				userID: user.accountId,
				email: email, // Include the user's email in the data
				createdDate: moment().toDate(),
				subject: subject,
				message: message,
				images: imageURLs,
			}
			await addDoc(dbInstance, data)
			setContactHelpModal(false)
			clearForm()
		} catch (error) {
			console.error("Error saving contact help:", error)
		}
	}

	const clearForm = () => {
		setSubject("")
		setMessage("")
		setImages([])
		setImageURLs([])
	}

	const handleImageChange = (e) => {
		// console.log("handle image change run")
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			setImages((prevState) => [...prevState, newImage])
			setUpdate(!update)
		}
	}

	// Image upload to firebase
	const handleUpload = () => {
		const promises = []
		images.map((image) => {
			const storageRef = ref(
				storage,
				`report_${new Date().getTime().toString()}.png`
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
						console.log("File available at", downloadURL)
						setImageURLs((prev) => [...prev, downloadURL])
					})
				}
			)
		})

		Promise.all(promises).catch((err) => console.log(err))
	}

	const handleSubjectChange = (e) => {
		e.preventDefault()
		setSubject(e.target.value)
		//setContactHelpState(1)
	}

	const handleMessageChange = (e) => {
		e.preventDefault()
		setMessage(e.target.value)
		//setReportState(2)
	}

	const handleContactHelpClose = async (e) => {
		e.preventDefault()
		setContactHelpModal(false)
	}

	const handleSubmitButton = (e) => {
		e.preventDefault()
		if (!subject) {
			alert("Subject is required")
		} else if (!message) {
			alert("Message is required")
		} else if (images == "") {
			alert("We need at least one screenshot.")
		} else {
			if (images.length > 0) {
				setUpdate(!update)
			}
			saveContactHelp(imageURLs)
			setContactHelpModal(false)
		}
	}

	const handleContactHelp = async (e) => {
		e.preventDefault()
		handleSubmitButton(e)
	}
	const handleChange = (e) => {
		// console.log('Report value changed.');
	}

	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update])

	return (
		<div className='fixed z-[9998] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto'>
			<div
				onClick={handleContactHelpClose}
				className={`flex overflow-y-auto justify-center items-center z-[9999] absolute top-0 left-0 w-full h-full`}>
				<div
					onClick={(e) => {
						e.stopPropagation()
					}}
					className={`flex-col justify-center items-center bg-white md:w-8/12 lg:w-6/12 h-auto rounded-2xl py-10 px-10 z-50`}>
					<div className='flex justify-between w-full mb-5'>
						<div className='text-md font-bold text-blue-600 tracking-wide'>
							{t("Navbar:chfModalTitle")}
						</div>
						<button onClick={handleContactHelpClose} className='text-gray-800'>
							<IoClose size={25} />
						</button>
					</div>
					<form onChange={handleChange} onSubmit={handleContactHelp}>
						<div className='mt-4 mb-0.5'>
							<input
								className='border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
								id='subject'
								type='text'
								placeholder={t("Navbar:chfModalSubject")}
								required
								onChange={handleSubjectChange}
								value={subject}
							/>
						</div>

						<div className='mt-4 mb-0.5'>
							<textarea
								className='peer h-full min-h-[200px] resize-none border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight px-3 py-2.5 focus:outline-none focus:shadow-outline transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 disabled:resize-none disabled:border-0 disabled:bg-blue-gray-50'
								id='message'
								type='text'
								placeholder={t("Navbar:chfModalMessage")}
								required
								onChange={handleMessageChange}
								value={message}></textarea>
						</div>
						<div className='text-sm font-bold text-blue-600 tracking-wide mt-4'>
							{t("Navbar:chfModalScreenshots")}
						</div>
						<div className='mt-4 mb-0.5'>
							<label className='block'>
								<span className='sr-only'>
									{t("Navbar:chfModalChooseFiles")}
								</span>
								<input
									className='block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer'
									id='multiple_files'
									type='file'
									multiple
									accept='image/*'
									onChange={(e) => {
										handleImageChange(e)
									}}
									ref={imgPicker}
								/>
							</label>
							<div className='flex shrink-0 mt-2 space-x-2'>
								{imageURLs.map((url, i = self.crypto.randomUUID()) => (
									<div className='relative' key={i}>
										<Image
											src={url}
											width={100}
											height={100}
											alt={`image-upload-${i}`}
										/>
									</div>
								))}
							</div>
						</div>

						<div className='mt-3 sm:mt-6'>
							<button
								className='w-full bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline'
								onClick={handleSubmitButton}
								type='submit'>
								{t('Navbar:chfModalSubmit')}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default ContactHelpModal
