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
import {
	fetchExperimentConfig,
	getActiveExperimentId,
	newReportAgencyFields,
	newReportExperimentFields,
} from "../../utils/reports-queries"
import {
	fetchTagDefaults,
	getFallbackTagDefaults,
	getRequiredIds,
	buildTagLabelMap,
	buildMergedAgencyTagLabelMap,
	isOtherTagName,
} from "../../utils/tag-defaults"
import { CUSTOM_OTHER_TAG_MAX_LENGTH } from "../../config/tagSystems"
import { formatLocationPart } from "../../utils/format-location"
import { State, City } from "country-state-city"
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
import { DEFAULT_AGENCY_LABELS, DEFAULT_REPORT_LABEL } from "../../config/labels"

// Import step components
import {
	AgencySelectionStep,
	TopicSelectionStep,
	SourceSelectionStep,
	DetailsStep,
	ReviewStep
} from "./ReportSteps"
import ViewReport from "../partials/report/ViewReport"

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
	const [tagLabelMap, setTagLabelMap] = useState({})
	
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

	// Prefer the selected agency's active tags; fall back to global defaults
	useEffect(() => {
		loadTagsForAgency(selectedAgency || "")
	}, [selectedAgency])

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
					setOtherTopic(
						(formData.otherTopic || '').slice(0, CUSTOM_OTHER_TAG_MAX_LENGTH),
					)
					setOtherSource(
						(formData.otherSource || '').slice(0, CUSTOM_OTHER_TAG_MAX_LENGTH),
					)
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
			
			// Global defaults until an agency is chosen
			await loadTagsForAgency("")
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
	 * Loads Topic/Source pickers from the selected agency's active tags,
	 * falling back to global admin defaults when no agency is selected.
	 *
	 * @param {string} agencyName
	 */
	const loadTagsForAgency = async (agencyName) => {
		const fallback = getFallbackTagDefaults()
		try {
			const defaults = await fetchTagDefaults()
			setTagLabelMap(buildTagLabelMap(defaults))
			const topicIds = getRequiredIds(defaults, 'Topic')
			const sourceIds = getRequiredIds(defaults, 'Source')
			if (!agencyName) {
				setSelectedAgencyID("")
				setAllTopicsArr(topicIds)
				setSources(sourceIds)
				return
			}

			const agencyCollection = collection(db, "agency")
			const q = query(agencyCollection, where("name", "==", agencyName))
			const querySnapshot = await getDocs(q)
			if (querySnapshot.empty) {
				setAllTopicsArr(topicIds)
				setSources(sourceIds)
				return
			}

			const agencyId = querySnapshot.docs[0].id
			setSelectedAgencyID(agencyId)
			const tagsSnap = await getDoc(doc(db, "tags", agencyId))
			if (tagsSnap.exists()) {
				const data = tagsSnap.data()
				const topicActive = data?.Topic?.active || topicIds
				const sourceActive = data?.Source?.active || sourceIds
				setAllTopicsArr(topicActive)
				setSources(sourceActive)
				setTagLabelMap(buildMergedAgencyTagLabelMap(defaults, data))
			} else {
				setAllTopicsArr(topicIds)
				setSources(sourceIds)
			}
		} catch (error) {
			console.error("Error loading tags for agency:", error)
			setTagLabelMap(buildTagLabelMap(fallback))
			setAllTopicsArr(getRequiredIds(fallback, 'Topic'))
			setSources(getRequiredIds(fallback, 'Source'))
		}
	}

	/**
	 * Handles topic selection and custom topic creation
	 */
	const handleTopicChange = (topic) => {
		setSelectedTopic(topic)
		setShowOtherTopic(isOtherTagName(topic))
		if (!isOtherTagName(topic)) {
			setOtherTopic("")
		}
	}

	/**
	 * Handles custom topic input (capped for public Other submissions).
	 */
	const handleOtherTopicChange = (e) => {
		setOtherTopic(e.target.value.slice(0, CUSTOM_OTHER_TAG_MAX_LENGTH))
	}

	/**
	 * Handles source selection and custom source creation
	 */
	const handleSourceChange = (source) => {
		setSelectedSource(source)
		setShowOtherSource(isOtherTagName(source))
		if (!isOtherTagName(source)) {
			setOtherSource("")
		}
	}

	/**
	 * Handles custom source input (capped for public Other submissions).
	 */
	const handleOtherSourceChange = (e) => {
		setOtherSource(e.target.value.slice(0, CUSTOM_OTHER_TAG_MAX_LENGTH))
	}

	/**
	 * Handles image file selection
	 */
	const handleImageChange = (e) => {
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			setImages((prevState) => [...prevState, newImage])
		}
		// Don't trigger upload immediately - wait for Review button
	}

	const handleRemoveImage = (index) => {
		setImages((prev) => prev.filter((_, i) => i !== index))
		if (imgPicker.current) imgPicker.current.value = ''
	}

	/**
	 * Handles image upload to Firebase Storage
	 * @returns {Promise<string[]>} Download URLs (empty if nothing to upload)
	 */
	const handleUpload = async () => {
		if (images.length === 0) {
			return []
		}

		const stamp = Date.now()
		const uploadPromises = images.map((image, index) => {
			// Include index so parallel uploads in the same ms never share a Storage path
			const safeName =
				(image?.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_') || 'image'
			const storageRef = ref(
				storage,
				`reports/${user.accountId}_${stamp}_${index}_${safeName}`,
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

		const urls = await Promise.all(uploadPromises)
		setImageURLs(urls)
		return urls
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

		// Upload images if any are selected; keep URLs in state before leaving this step
		if (images.length > 0) {
			try {
				await handleUpload()
			} catch (error) {
				console.error("Error uploading images:", error)
				setErrors((prev) => ({
					...prev,
					images: "Failed to upload images. Please try again.",
				}))
				return
			}
		}

		// Move to review step
		setReportSystem(6)
	}

	/**
	 * Saves the report to Firestore
	 */
	const saveReport = async () => {
		try {
			const experimentConfig = await fetchExperimentConfig()
			const experimentId = getActiveExperimentId(experimentConfig)
			if (!agencyID) {
				console.error("Cannot save report without agencyId")
				setErrors((prev) => ({
					...prev,
					agency: "Agency is required",
				}))
				return
			}
			// Snapshot reporter location from their profile (public flow has no city/state picker)
			const city =
				formatLocationPart(userData?.city) || 'N/A'
			const state = formatLocationPart(userData?.state)
			const reportData = {
				userID: user.accountId,
				email: user.email,
				...newReportAgencyFields({
					agencyName: selectedAgency,
					agencyId: agencyID,
				}),
				topic: isOtherTagName(selectedTopic) ? otherTopic : selectedTopic,
				// `hearFrom` matches the established schema: tags.{agency}.Source.active -> reports.hearFrom.
				hearFrom: isOtherTagName(selectedSource) ? otherSource : selectedSource,
				// `origin` marks the submission channel; ReportSystem is the public /report flow.
				origin: 'public',
				title: title,
				link: link,
				secondLink: secondLink,
				detail: detail,
				images: imageURLs,
				city,
				...(state ? { state } : {}),
				createdDate: moment().toDate(),
				read: false,
				label: DEFAULT_REPORT_LABEL,
				...newReportExperimentFields(experimentId),
			}

			const docRef = await addDoc(collection(db, "reports"), reportData)
			setReportId(docRef.id)

			// Log analytics event
			if (analytics) {
				logEvent(analytics, 'report_submitted', {
					user_id: user.accountId,
					agency: selectedAgency,
					agencyId: agencyID,
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
		<div data-component="ReportSystem" className={globalStyles.sectionContainer} key={key}>
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
				<div className={`report-form-wrap ${globalStyles.form.wrap} w-full`}>
					<form
						onChange={handleChange}
						className={`report-form ${globalStyles.form.element}`}
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
								labelMap={tagLabelMap}
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
								labelMap={tagLabelMap}
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
								handleRemoveImage={handleRemoveImage}
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
									selectedTopic: isOtherTagName(selectedTopic) ? otherTopic : selectedTopic,
									selectedSource: isOtherTagName(selectedSource) ? otherSource : selectedSource,
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
					
					<ViewReport
						title={title}
						link={link}
						secondLink={secondLink}
						imageURLs={imageURLs}
						detail={detail}
						reportSystem={reportSystem}
						setReportSystem={setReportSystem}
					/>
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
