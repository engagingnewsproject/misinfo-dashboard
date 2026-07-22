import React, { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import moment from 'moment'
import { db } from '../../config/firebase'
import { collection, addDoc } from 'firebase/firestore'
import {
	getStorage,
	ref,
	getDownloadURL,
	uploadBytes,
} from 'firebase/storage'
import { useTranslation } from 'react-i18next'
import FormInput from '../ui/FormInput'
import FormTextarea from '../ui/FormTextarea'
import MediaUploadField from '../ui/MediaUploadField'
import ModalCloseButton from '../ui/ModalCloseButton'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

const ContactHelpModal = ({ open, setContactHelpModal }) => {
	const { t } = useTranslation('Navbar')
	const dbInstance = collection(db, 'helpRequests')
	const { user } = useAuth()
	const storage = getStorage()
	const imgPicker = useRef(null)

	const [subject, setSubject] = useState('')
	const [message, setMessage] = useState('')
	const [images, setImages] = useState([])
	const [isSubmitting, setIsSubmitting] = useState(false)

	const clearForm = () => {
		setSubject('')
		setMessage('')
		setImages([])
		if (imgPicker.current) imgPicker.current.value = ''
	}

	const handleClose = () => {
		clearForm()
		setContactHelpModal(false)
	}

	/**
	 * Uploads selected screenshot files to Storage and returns their download URLs.
	 * Called on submit so help request docs are not written before uploads finish.
	 *
	 * @param {File[]} files
	 * @returns {Promise<string[]>}
	 */
	const uploadImages = async (files) => {
		if (!files.length) return []

		return Promise.all(
			files.map(async (image, index) => {
				const safeName =
					image.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image'
				const storageRef = ref(
					storage,
					`help_${Date.now()}_${index}_${safeName}`,
				)
				const snapshot = await uploadBytes(storageRef, image)
				return getDownloadURL(snapshot.ref)
			}),
		)
	}

	/**
	 * Writes the help request to Firestore with the given image URLs.
	 *
	 * @param {string[]} uploadedImageURLs
	 */
	const saveContactHelp = async (uploadedImageURLs) => {
		const email = user.email
		const data = {
			userID: user.accountId,
			email: email,
			createdDate: moment().toDate(),
			subject: subject,
			message: message,
			images: uploadedImageURLs,
		}
		await addDoc(dbInstance, data)
		setContactHelpModal(false)
		clearForm()
	}

	const handleImageChange = (e) => {
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			setImages((prevState) => [...prevState, newImage])
		}
	}

	const handleRemoveImage = (index) => {
		setImages((prev) => prev.filter((_, i) => i !== index))
		if (imgPicker.current) imgPicker.current.value = ''
	}

	const handleSubjectChange = (e) => {
		e.preventDefault()
		setSubject(e.target.value)
	}

	const handleMessageChange = (e) => {
		e.preventDefault()
		setMessage(e.target.value)
	}

	const handleSubmitButton = async (e) => {
		e.preventDefault()
		if (!subject) {
			alert('Subject is required')
			return
		}
		if (!message) {
			alert('Message is required')
			return
		}
		if (images.length === 0) {
			alert('We need at least one screenshot.')
			return
		}

		setIsSubmitting(true)
		try {
			const uploadedImageURLs = await uploadImages(images)
			await saveContactHelp(uploadedImageURLs)
		} catch (error) {
			console.error('Error saving contact help:', error)
			alert('Failed to submit help request. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog data-component="ContactHelpModal"
			open={open}
			handler={handleClose}
			size="lg"
			className="contact-help-modal rounded-md">
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					{t('Navbar:chfModalTitle')}
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody className="overflow-y-auto max-h-[70vh]">
				<form onSubmit={handleSubmitButton}>
					<div className="mt-4 mb-0.5">
						<FormInput
							id="subject"
							type="text"
							label={t('Navbar:chfModalSubject')}
							required
							onChange={handleSubjectChange}
							value={subject}
						/>
					</div>

					<div className="mt-4 mb-0.5">
						<FormTextarea
							id="message"
							label={t('Navbar:chfModalMessage')}
							required
							onChange={handleMessageChange}
							value={message}
							rows={8}
						/>
					</div>
					<div className="mt-4 mb-0.5">
						<MediaUploadField
							id="multiple_files"
							inputRef={imgPicker}
							onChange={handleImageChange}
							onRemoveFile={handleRemoveImage}
							files={images}
							label={t('Navbar:chfModalScreenshots')}
							actionText={t('Navbar:chfModalChooseFiles')}
						/>
					</div>

					<div className="mt-3 sm:mt-6">
						<Button
							type="submit"
							variant="filled"
							fullWidth
							disabled={isSubmitting}>
							{isSubmitting
								? `${t('Navbar:chfModalSubmit')}…`
								: t('Navbar:chfModalSubmit')}
						</Button>
					</div>
				</form>
			</DialogBody>
		</Dialog>
	)
}

export default ContactHelpModal
