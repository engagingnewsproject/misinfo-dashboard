/**
 * @fileoverview Report System Component - Multi-step form orchestrator
 * 
 * This component orchestrates the multi-step report creation process by managing
 * state and rendering the appropriate step components. It handles:
 * - Step navigation and state management
 * - Data flow between steps
 * - Form validation and submission
 * - Image upload functionality
 * - Firebase integration
 * 
 * @author Misinformation Dashboard Team
 * @version 2.0.0
 * @since 2024
 */

import React, { useState, useEffect, useRef } from "react"
import { IoMdArrowRoundForward, IoMdArrowRoundBack } from "react-icons/io"
import { BiCheckCircle, BiXCircle } from "react-icons/bi"
import {
	setDoc,
	getDoc,
	doc,
	addDoc,
	collection,
	getDocs,
	query,
	where,
	updateDoc,
	arrayUnion
} from "firebase/firestore"
import {
	getStorage,
	ref,
	getDownloadURL,
	uploadBytes,
	deleteObject,
	uploadBytesResumable,
} from "firebase/storage"
import { useAuth } from "../../context/AuthContext"
import { db } from "../../config/firebase"
import { State, City } from "country-state-city"
import Link from "next/link"
import moment from "moment"
import Image from "next/image"
import { useTranslation } from "next-i18next"
import ConfirmModal from "../modals/common/ConfirmModal"
import { IoMdRefresh } from "react-icons/io"
import globalStyles from "../../styles/globalStyles"
import {
	Button,
	IconButton,
	List,
	ListItem,
	Typography,
	Checkbox,
	ListItemPrefix,
} from "@material-tailwind/react"
import { logEvent } from "firebase/analytics"
import { analytics } from "../../config/firebase"
import { useLocalStorage } from "../../hooks/useLocalStorage"

// Import step components
import {
	AgencySelectionStep,
	TopicSelectionStep,
	SourceSelectionStep,
	DetailsStep,
	ReviewStep
} from "./ReportSteps"

/**
 * ReportSystem Component - Multi-step form orchestrator
 * 
 * Manages the report creation process by coordinating between different step
 * components and handling the overall form state and submission.
 * 
 * @param {Object} props - Component props
 * @param {number} props.tab - Current tab index for navigation
 * @param {Function} props.setTab - Function to update tab index
 * @param {number} props.reportSystem - Current step in the report creation process (1-7)
 * @param {Function} props.setReportSystem - Function to update report system step
 * @param {boolean} props.reminderShow - Whether to show the reminder for first-time users
 * @param {Function} props.onChangeCheckbox - Function to handle reminder checkbox changes
 * @param {Function} props.onReminderStart - Function to handle starting the report process
 * @param {Function} props.onReportSystemPrevStep - Function to handle going to previous step
 * @param {boolean} props.disableReminder - Whether the reminder should be disabled
 * @returns {JSX.Element} The ReportSystem component
 */
const ReportSystem = ({
	tab,
	setTab,
	reportSystem,
	setReportSystem,
	reminderShow,
	onChangeCheckbox,
	onReminderStart,
	onReportSystemPrevStep,
	disableReminder,
}) => {
	// Internationalization and authentication
	const { t, i18n } = useTranslation("NewReport")
	const { user, customClaims } = useAuth()

	const storageKey = `misinfo_report_draft_${user?.accountId || 'loading'}`
	const [persistedData, setPersistData, clearPersistData, isExpired] =
		useLocalStorage(
			storageKey,
			null,
			24, // 24 hours
		)

	// Only use persisted data when we have a real user ID
	const validPersistedData = user?.accountId ? persistedData : null

	// Form state management
	const [key, setKey] = useState(self.crypto.randomUUID())
	const [data, setData] = useState({ country: "US", state: null, city: null })
	const [isSearchable, setIsSearchable] = useState(true)
	const [userData, setUserData] = useState(null)
	const storage = getStorage()
	
	// Report data state
	const [reportId, setReportId] = useState("")
	const imgPicker = useRef(null)
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([])
	
	// Form field states
	const [title, setTitle] = useState("")
	const [titleError, setTitleError] = useState(false)
	const [link, setLink] = useState("")
	const [secondLink, setSecondLink] = useState("")
	const [detail, setDetail] = useState("")
	const [detailError, setDetailError] = useState(false)
	
	// Agency and topic selection
	const [allTopicsArr, setAllTopicsArr] = useState([])
	const [agencies, setAgencies] = useState([])
	const [selectedAgency, setSelectedAgency] = useState("")
	const [agencyID, setSelectedAgencyID] = useState("")
	
	// Source selection
	const [selectedTopic, setSelectedTopic] = useState("")
	const [sources, setSources] = useState([])
	const [selectedSource, setSelectedSource] = useState("")
	
	// Form validation and UI state
	const [errors, setErrors] = useState({})
	const [showOtherTopic, setShowOtherTopic] = useState(false)
	const [showOtherSource, setShowOtherSource] = useState(false)
	const [otherTopic, setOtherTopic] = useState("")
	const [otherSource, setOtherSource] = useState("")
	
	// Tag management
	const [topicList, setTopicList] = useState([])
	const [sourceList, setSourceList] = useState([])
	const [active, setActive] = useState([])
	const [activeSources, setActiveSources] = useState([])
	
	// Modal and refresh state
	const [reportResetModal, setReportResetModal] = useState(false)
	const [refresh, setRefresh] = useState(false)
	const formRef = useRef(null)

	// Persistence state
	const [hasCheckedForPersistedData, setHasCheckedForPersistedData] =
		useState(false)
	const [isInitialLoad, setIsInitialLoad] = useState(true)
	const [hasRestored, setHasRestored] = useState(false)

	// Default tag systems for categorization
	const defaultTopics = ["Health","Other","Politics","Weather"]
	const defaultSources = ["Newspaper", "Other","Social","Website"]
	const defaultLabels = ["To Investigate", "Investigated: Flagged", "Investigated: Benign"]

	// Initialize user data on component mount and check for persisted data
	useEffect(() => {
		getUserData()
		if (user?.accountId && !hasCheckedForPersistedData) {
			setHasCheckedForPersistedData(true)
		}

	}, [user?.accountId, hasCheckedForPersistedData])

	// Mark initial load as complete after user data and restoration check
	useEffect(() => {
		if (user?.accountId && hasCheckedForPersistedData) {
			// Give auto-restoration a chance to run, then mark initial load complete
			const timer = setTimeout(() => {
				setIsInitialLoad(false)
			}, 100)

			return () => clearTimeout(timer)
		}
	}, [user?.accountId, hasCheckedForPersistedData])

	// Reset form when starting a new report (but not on initial load)
	useEffect(() => {
		if ((reportSystem === 0 || reportSystem === 1) && !isInitialLoad) {
			resetForm(true) // Clear storage when starting new report
			setHasRestored(false) // Reset restoration flag
		}
	}, [reportSystem, isInitialLoad])

	// Reset form when component unmounts (cleanup)
	useEffect(() => {
		return () => {
			resetForm(false)
		}
	}, [])

	// Auto-save form data when key fields change
	useEffect(() => {
		autoSaveFormData()
	}, [
		selectedAgency,
		selectedTopic,
		selectedSource,
		otherTopic,
		otherSource,
		title,
		link,
		secondLink,
		detail,
		showOtherTopic,
		showOtherSource,
		reportSystem,
		user?.accountId,
		imageURLs,
	])

	// Update current step in persistence when reportSystem changes
	useEffect(() => {
		if (user?.accountId && reportSystem >= 2 && reportSystem <= 6) {
			// Only update if we have existing persisted data to avoid overwriting
			if (validPersistedData && validPersistedData.currentStep !== reportSystem) {
				const updatedData = {
					...validPersistedData,
					currentStep: reportSystem,
					lastSaved: new Date().toISOString(),
				}
				setPersistData(updatedData)
			}
		}
	}, [reportSystem, user?.accountId, validPersistedData])

	// Auto-restore form data when persistedData becomes available
	useEffect(() => {
		if (validPersistedData && !isExpired && user?.accountId && hasCheckedForPersistedData && !hasRestored) {

			const hasContent =
				validPersistedData.formData &&
				(validPersistedData.formData.title ||
					validPersistedData.formData.detail ||
					validPersistedData.formData.selectedAgency ||
					validPersistedData.formData.selectedTopic ||
					validPersistedData.formData.selectedSource)

			if (hasContent) {
				// Check if current form is empty (to avoid overwriting user input)
				const currentFormIsEmpty = !title && !detail && !selectedAgency && !selectedTopic && !selectedSource

				if (currentFormIsEmpty) {
					const { formData, currentStep } = validPersistedData
					setSelectedAgency(formData.selectedAgency || '')
					setSelectedTopic(formData.selectedTopic || '')
					setSelectedSource(formData.selectedSource || '')
					setOtherTopic(formData.otherTopic || '')
					setOtherSource(formData.otherSource || '')
					setTitle(formData.title || '')
					setLink(formData.link || '')
					setSecondLink(formData.secondLink || '')
					setDetail(formData.detail || '')
					setShowOtherTopic(formData.showOtherTopic || false)
					setShowOtherSource(formData.showOtherSource || false)
					setImageURLs(formData.imageURLs || [])

					// Restore current step if valid and not already set
					if (currentStep >= 2 && currentStep <= 6 && reportSystem <= 1) {
						setReportSystem(currentStep)
					}

					setHasRestored(true)
				}
			}
		}
	}, [validPersistedData, isExpired, user?.accountId, hasCheckedForPersistedData, hasRestored, title, detail, selectedAgency, selectedTopic, selectedSource, reportSystem])

	/**
	 * Auto-saves current form state
	 */
	const autoSaveFormData = () => {
		if (user?.accountId && reportSystem >= 2 && reportSystem <= 6) {
			const currentFormData = {
				selectedAgency,
				selectedTopic,
				selectedSource,
				otherTopic,
				otherSource,
				title,
				link,
				secondLink,
				detail,
				showOtherTopic,
				showOtherSource,
				imageURLs,
			}

			const dataToSave = {
				currentStep: reportSystem,
				formData: currentFormData,
				errors,
				lastSaved: new Date().toISOString(),
			}

			setPersistData(dataToSave)
		}
	}

	/**
	 * Fetches user data from Firestore and initializes form data
	 */
	const getUserData = async () => {
		if (!user?.accountId) return

		try {
			const mobileRef = await getDoc(doc(db, "mobileUsers", user.accountId))
			setUserData(mobileRef.data())
			
			// Fetch agencies for user's state
			if (mobileRef.data()?.state) {
				await getAgencies(mobileRef.data().state.name)
			}
			
			// Fetch topics and sources
			await getTopics()
			await getSources()
		} catch (error) {
			console.error("Error fetching user data:", error)
		}
	}

	/**
	 * Fetches agencies for the user's state
	 */
	const getAgencies = async (userState) => {
		try {
			const agencyCollection = collection(db, "agency")
			const q = query(agencyCollection, where("state", "==", userState))
			const querySnapshot = await getDocs(q)
			
			const agencyNames = querySnapshot.docs.map(doc => doc.data().name)
			setAgencies(agencyNames)
		} catch (error) {
			console.error("Error fetching agencies:", error)
		}
	}

	/**
	 * Fetches available topics from Firestore
	 */
	const getTopics = async () => {
		try {
			const topicsDoc = await getDoc(doc(db, "tagSystems", "topic"))
			const topics = topicsDoc.data()?.tags || defaultTopics
			setAllTopicsArr(topics)
		} catch (error) {
			console.error("Error fetching topics:", error)
			setAllTopicsArr(defaultTopics)
		}
	}

	/**
	 * Fetches available sources from Firestore
	 */
	const getSources = async () => {
		try {
			const sourcesDoc = await getDoc(doc(db, "tagSystems", "source"))
			const sources = sourcesDoc.data()?.tags || defaultSources
			setSources(sources)
		} catch (error) {
			console.error("Error fetching sources:", error)
			setSources(defaultSources)
		}
	}

	/**
	 * Handles topic selection and custom topic creation
	 */
	const handleTopicChange = (topic) => {
		setSelectedTopic(topic)
		setShowOtherTopic(topic === "Other")
		if (topic !== "Other") {
			setOtherTopic("")
		}
	}

	/**
	 * Handles custom topic input
	 */
	const handleOtherTopicChange = (e) => {
		setOtherTopic(e.target.value)
	}

	/**
	 * Handles source selection and custom source creation
	 */
	const handleSourceChange = (source) => {
		setSelectedSource(source)
		setShowOtherSource(source === "Other")
		if (source !== "Other") {
			setOtherSource("")
		}
	}

	/**
	 * Handles custom source input
	 */
	const handleOtherSourceChange = (e) => {
		setOtherSource(e.target.value)
	}

	/**
	 * Handles image file selection
	 */
	const handleImageChange = (e) => {
		const selectedImages = []
		for (let i = 0; i < e.target.files.length; i++) {
			selectedImages.push(e.target.files[i])
		}
		setImages(selectedImages)
		// Don't trigger upload immediately - wait for Review button
	}

	/**
	 * Handles image upload to Firebase Storage
	 */
	const handleUpload = async () => {
		if (images.length === 0) {
			return // No images to upload
		}

		const uploadPromises = images.map((image) => {
			const storageRef = ref(
				storage,
				`reports/${user.accountId}_${new Date().getTime().toString()}.png`
			)
			const uploadTask = uploadBytesResumable(storageRef, image)
			return new Promise((resolve, reject) => {
				uploadTask.on(
					'state_changed',
					null,
					(error) => reject(error),
					() => {
						getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
							resolve(downloadURL)
						})
					}
				)
			})
		})

		try {
			const urls = await Promise.all(uploadPromises)
			setImageURLs(urls)
		} catch (error) {
			console.error("Error uploading images:", error)
		}
	}

	/**
	 * Handles form submission
	 */
	const handleSubmitClick = async () => {
		// Validate form
		const newErrors = {}
		if (!title.trim()) newErrors.title = "Title is required"
		if (!detail.trim()) newErrors.detail = "Description is required"
		if (!selectedAgency) newErrors.agency = "Agency is required"
		if (!selectedTopic) newErrors.topic = "Topic is required"
		if (!selectedSource) newErrors.source = "Source is required"

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors)
			return
		}

		// Submit report
		await saveReport()
	}

	/**
	 * Handles moving to review step (does not save report)
	 */
	const handleReviewStep = async () => {
		// Validate form
		const newErrors = {}
		if (!title.trim()) newErrors.title = "Title is required"
		if (!detail.trim()) newErrors.detail = "Description is required"
		if (!selectedAgency) newErrors.agency = "Agency is required"
		if (!selectedTopic) newErrors.topic = "Topic is required"
		if (!selectedSource) newErrors.source = "Source is required"

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors)
			return
		}

		// Upload images if any are selected
		if (images.length > 0) {
			await handleUpload()
		}

		// Move to review step
		setReportSystem(6)
	}

	/**
	 * Saves the report to Firestore
	 */
	const saveReport = async () => {
		try {
			const reportData = {
				userID: user.accountId,
				email: user.email,
				agency: selectedAgency,
				topic: selectedTopic === "Other" ? otherTopic : selectedTopic,
				source: selectedSource === "Other" ? otherSource : selectedSource,
				title: title,
				link: link,
				secondLink: secondLink,
				detail: detail,
				images: imageURLs,
				createdDate: moment().toDate(),
				read: false,
				label: "To Investigate"
			}

			const docRef = await addDoc(collection(db, "reports"), reportData)
			setReportId(docRef.id)

			// Log analytics event
			if (analytics) {
				logEvent(analytics, 'report_submitted', {
					user_id: user.accountId,
					agency: selectedAgency,
					topic: selectedTopic
				})
			}

			clearPersistData()

			// Move to success step
			setReportSystem(7)
		} catch (error) {
			console.error("Error saving report:", error)
		}
	}

	/**
	 * Resets the form to initial state
	 * @param {boolean} clearStorage - Whether to clear localStorage data (default: false)
	 */
	const resetForm = (clearStorage = false) => {
		setTitle("")
		setLink("")
		setSecondLink("")
		setDetail("")
		setSelectedAgency("")
		setSelectedTopic("")
		setSelectedSource("")
		setOtherTopic("")
		setOtherSource("")
		setShowOtherTopic(false)
		setShowOtherSource(false)
		setImages([])
		setImageURLs([])
		setErrors({})

		// Clear file input
		if (imgPicker.current) {
			imgPicker.current.value = ""
		}

		// Only clear persisted data when explicitly requested
		if (clearStorage && user?.accountId) {
			clearPersistData()
		}
	}

	/**
	 * Handles form refresh/reset
	 */
	const handleRefresh = () => {
		setKey(self.crypto.randomUUID())
		resetForm(true) // Clear storage when explicitly refreshing
		setReportSystem(2)
		setReportResetModal(false)
	}

	/**
	 * Handles form change events
	 */
	const handleChange = () => {
		// Handle form change events if needed
	}

	// Removed handleNewReport - form submissions now handled by specific button clicks

	/**
	 * Refresh button component
	 */
	const RefreshButton = () => (
		<IconButton
			color='blue-gray'
			onClick={() => setReportResetModal(true)}
			type='button'>
			<IoMdRefresh size={30} />
		</IconButton>
	)

	/**
	 * Back arrow component
	 */
	const BackArrow = () => (
		<IconButton
			color='blue-gray'
			onClick={onReportSystemPrevStep}
			type='button'>
			<IoMdArrowRoundBack size={30} />
		</IconButton>
	)

	/**
	 * Forward arrow component
	 */
	const ForwardArrow = () => (
		<IconButton
			color='blue-gray'
			onClick={() => setReportSystem(reportSystem + 1)}
			type='button'>
			<IoMdArrowRoundForward size={30} />
		</IconButton>
	)

	return (
		<div className={globalStyles.sectionContainer} key={key}>
			{/* Reminder Step */}
			{reminderShow !== false && reportSystem === 1 && (
				<div className={globalStyles.viewWrapperCenter}>
					<Image
						src='/img/reminder.png'
						width={156}
						height={120}
						alt='reminderShow'
						className='object-cover w-auto'
					/>
					<Typography variant='h5' color='blue'>
						{t("reminder")}
					</Typography>
					<Typography>{t("description")}</Typography>
					<Typography>{t("example")}</Typography>
					<List>
						<ListItem disabled={true} className='opacity-100'>
							<ListItemPrefix>
								<BiCheckCircle size={25} color='green' />
							</ListItemPrefix>
							<Typography color='black'>{t("correct")}</Typography>
						</ListItem>
						<ListItem disabled={true} className='opacity-100'>
							<ListItemPrefix>
								<BiXCircle size={25} color='red' />
							</ListItemPrefix>
							<Typography color='black'>{t("incorrect")}</Typography>
						</ListItem>
					</List>
					<Button onClick={onReminderStart} color='blue'>
						{t("start")}
					</Button>
					<div className='inline-flex items-center'>
						<Checkbox
							onChange={onChangeCheckbox}
							checked={disableReminder}
							label={t("noShow")}
							color='blue'
						/>
					</div>
				</div>
			)}

			{/* Main Form Steps */}
			{reportSystem >= 2 && reportSystem <= 6 && (
				<div className={globalStyles.form.wrap}>
					<form
						onChange={handleChange}
						className={globalStyles.form.element}
						ref={formRef}
						id={key}>
						
						{/* Step 2: Agency Selection */}
						{reportSystem === 2 && (
							<AgencySelectionStep
								agencies={agencies}
								selectedAgency={selectedAgency}
								setSelectedAgency={setSelectedAgency}
								errors={errors}
								onNext={() => setReportSystem(3)}
							/>
						)}

						{/* Step 3: Topic Selection */}
						{reportSystem === 3 && (
							<TopicSelectionStep
								allTopicsArr={allTopicsArr}
								selectedTopic={selectedTopic}
								handleTopicChange={handleTopicChange}
								showOtherTopic={showOtherTopic}
								otherTopic={otherTopic}
								handleOtherTopicChange={handleOtherTopicChange}
								errors={errors}
								onNext={() => setReportSystem(4)}
							/>
						)}

						{/* Step 4: Source Selection */}
						{reportSystem === 4 && (
							<SourceSelectionStep
								sources={sources}
								selectedSource={selectedSource}
								handleSourceChange={handleSourceChange}
								showOtherSource={showOtherSource}
								otherSource={otherSource}
								handleOtherSourceChange={handleOtherSourceChange}
								errors={errors}
								onNext={() => setReportSystem(5)}
							/>
						)}

						{/* Step 5: Details Input */}
						{reportSystem === 5 && (
							<DetailsStep
								title={title}
								setTitle={setTitle}
								titleError={titleError}
								link={link}
								setLink={setLink}
								secondLink={secondLink}
								setSecondLink={setSecondLink}
								detail={detail}
								setDetail={setDetail}
								detailError={detailError}
								handleImageChange={handleImageChange}
								imgPicker={imgPicker}
								handleSubmitClick={handleReviewStep}
								selectedImages={images}
							/>
						)}

						{/* Step 6: Review */}
						{reportSystem === 6 && (
							<ReviewStep
								reportData={{
									selectedAgency,
									selectedTopic: selectedTopic === "Other" ? otherTopic : selectedTopic,
									selectedSource: selectedSource === "Other" ? otherSource : selectedSource,
									title,
									link,
									secondLink,
									detail,
									images: imageURLs
								}}
								onSubmit={handleSubmitClick}
								onBack={() => setReportSystem(5)}
							/>
						)}

						{/* Refresh Button */}
						{reportSystem >= 2 && (
							<div className='flex justify-center'>
								<div className='w-50 opacity-50 hover:opacity-100 mt-2 sm:mt-4'>
									<RefreshButton />
								</div>
							</div>
						)}

						{/* Back Arrow */}
						{reportSystem > 0 && reportSystem < 7 && (
							<div className='absolute opacity-50 hover:opacity-100 bottom-4 left-4 sm:left-6'>
								<BackArrow />
							</div>
						)}
					</form>
				</div>
			)}

			{/* Success Step */}
			{reportSystem === 7 && (
				<div className={`${globalStyles.form.wrap} sm:p-6`}>
					{/* Thank You */}
					{reportSystem === 6 && (
						<div className={globalStyles.form.viewWrapper + " items-center"}>
							<Image
								src='/img/reportSuccess.png'
								width={156}
								height={120}
								alt='report success'
								className='object-cover w-auto'
							/>
							<div className={globalStyles.heading.h1.black}>
								{t("thankyou")}
							</div>
							<div className='text-center'>{t("thanksText")}</div>
							<button
								onClick={() => setReportSystem(reportSystem + 1)}
								className={globalStyles.button.md}>
								{t("view")}
							</button>
						</div>
					)}
					
					{/* View Report */}
					{reportSystem === 7 && (
					<div className={globalStyles.form.view}>
							{/* Title */}
							<div className='mb-6 p-0'>
								<Typography variant='h6' color='blue'>
									{t("title_text")}
								</Typography>
								<Typography>{title}</Typography>
							</div>
							{/* Links */}
							<div className='mb-6 p-0'>
								<Typography variant='h6' color='blue'>
									{t("links")}
								</Typography>
								<Typography>
									{link || secondLink !== "" ? (
										<>
											{link}
											<br></br>
											{secondLink}
										</>
									) : (
										t("noLinks")
									)}
								</Typography>
							</div>
							{/* Image upload */}
							<div className='mb-6 p-0'>
								<Typography variant='h6' color='blue'>
									{t("image")}
								</Typography>
								<div className='flex w-full overflow-y-auto'>
									{imageURLs.map((image, i = self.crypto.randomUUID()) => {
										return (
											<div className='flex mr-2' key={i}>
												<Link href={image} target='_blank'>
													<Image
														src={image}
														width={100}
														height={100}
														alt='image'
														className='object-cover w-auto'
													/>
												</Link>
											</div>
										)
									})}
								</div>
							</div>
							{/* Details */}
							<div className='mb-6 p-0'>
								<Typography variant='h6' color='blue'>
									{t("detailed")}
								</Typography>
								<Typography>
									{detail ? detail : `No description provided.`}
								</Typography>
							</div>
							<Button color='blue' onClick={() => setReportSystem(0)}>
								{t("backReports")}
							</Button>
					</div>
					)}
				</div>
			)}

			{/* Reset Modal */}
			{reportResetModal && (
				<ConfirmModal
					func={handleRefresh}
					title='Are you sure you want to reset the report?'
					subtitle='You cannot undo this action.'
					CTA='Reset Report'
					closeModal={() => setReportResetModal(false)}
				/>
			)}
		</div>
	)
}

export default ReportSystem
