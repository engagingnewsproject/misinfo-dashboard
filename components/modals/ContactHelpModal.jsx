import React, { useState, useEffect, useRef } from "react"
import { IoClose } from "react-icons/io5"
import { useAuth } from "../../context/AuthContext"
import moment from "moment"
import { db } from "../../config/firebase"
import {
	collection,
	addDoc,
} from "firebase/firestore"
import {
	getStorage,
	ref,
	getDownloadURL,
	uploadBytesResumable,
} from "firebase/storage"
import { useTranslation } from "react-i18next"
import FormInput from "../ui/FormInput"
import FormTextarea from "../ui/FormTextarea"
import MediaUploadField from "../ui/MediaUploadField"

const ContactHelpModal = ({ setContactHelpModal }) => {
	const { t } = useTranslation("Navbar")
	const dbInstance = collection(db, "helpRequests")
	const { user } = useAuth()
	const storage = getStorage()
	const imgPicker = useRef(null)

	const [subject, setSubject] = useState("")
	const [message, setMessage] = useState("")
	const [update, setUpdate] = useState(false)
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([])

	const saveContactHelp = async () => {
		try {
			const email = user.email
			const data = {
				userID: user.accountId,
				email: email,
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
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			setImages((prevState) => [...prevState, newImage])
			setUpdate(!update)
		}
	}

	const handleRemoveImage = (index) => {
		setImages((prev) => prev.filter((_, i) => i !== index))
		if (imgPicker.current) imgPicker.current.value = ''
	}

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
				() => {},
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

	const handleSubjectChange = (e) => {
		e.preventDefault()
		setSubject(e.target.value)
	}

	const handleMessageChange = (e) => {
		e.preventDefault()
		setMessage(e.target.value)
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
		} else if (images.length === 0) {
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
					<form onSubmit={handleContactHelp}>
						<div className='mt-4 mb-0.5'>
							<FormInput
								id='subject'
								type='text'
								label={t("Navbar:chfModalSubject")}
								required
								onChange={handleSubjectChange}
								value={subject}
							/>
						</div>

						<div className='mt-4 mb-0.5'>
							<FormTextarea
								id='message'
								label={t("Navbar:chfModalMessage")}
								required
								onChange={handleMessageChange}
								value={message}
								rows={8}
							/>
						</div>
						<div className='mt-4 mb-0.5'>
							<MediaUploadField
								id='multiple_files'
								inputRef={imgPicker}
								onChange={handleImageChange}
								onRemoveFile={handleRemoveImage}
								files={images}
								label={t("Navbar:chfModalScreenshots")}
								actionText={t("Navbar:chfModalChooseFiles")}
							/>
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
