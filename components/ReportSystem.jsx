/**
 * @fileoverview Report System Component - Multi-step form for creating and submitting reports
 * 
 * This component provides a comprehensive multi-step form interface for users to create
 * and submit reports about potential misinformation. The form includes:
 * - Agency selection (filtered by user's state)
 * - Topic categorization with custom topic support
 * - Source identification with custom source support
 * - Detailed information input (title, links, images, description)
 * - Form validation and error handling
 * - Image upload functionality with Firebase Storage
 * - Real-time data fetching from Firestore
 * - Internationalization support (English/Spanish)
 * - Google Analytics event tracking
 * 
 * The component uses a step-based navigation system (reportSystem state) to guide users
 * through the report creation process, with validation at each step and the ability to
 * navigate forward/backward. It also includes a reminder system for first-time users
 * and supports custom tag creation for topics and sources.
 * 
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect, useRef } from "react"
import { reportSystems } from "../pages/report"
import { IoMdArrowRoundForward, IoMdArrowRoundBack } from "react-icons/io"
import { BiCheckCircle, BiXCircle, BiRightArrowCircle } from "react-icons/bi"
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
import { useAuth } from "../context/AuthContext"
import { db } from "../config/firebase"
import { State, City } from "country-state-city"
import Link from "next/link"
import moment from "moment"
import Image from "next/image"
import Select from "react-select"
import { useTranslation } from "next-i18next"
import { RiPrinterLine } from "react-icons/ri"
import ConfirmModal from "./modals/ConfirmModal"
import {
	IoMdRefresh,
	IoIosInformationCircle,
	IoMdCheckmark,
} from "react-icons/io"
import globalStyles from "../styles/globalStyles"
import {
	Button,
	IconButton,
	List,
	ListItem,
	Card,
	Input,
	Typography,
	Textarea,
	Checkbox,
	Tooltip,
	ListItemPrefix,
	ListItemSuffix,
	Chip,
} from "@material-tailwind/react"
import { logEvent } from "firebase/analytics"
import { analytics } from "../config/firebase"

/**
 * ReportSystem Component - Multi-step form for creating and submitting reports
 * 
 * This component provides a comprehensive interface for users to create reports about
 * potential misinformation. It uses a step-based navigation system to guide users through
 * the report creation process, with validation at each step.
 * 
 * The component handles:
 * - Multi-step form navigation (steps 1-7)
 * - Agency selection filtered by user's state
 * - Topic and source categorization with custom options
 * - Image upload and storage
 * - Form validation and error handling
 * - Real-time data fetching from Firestore
 * - Google Analytics event tracking
 * - Internationalization support
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
	const { t, i18n } = useTranslation("NewReport") // Translation hook for Spanish/English
	const { user, customClaims } = useAuth() // User authentication and custom claims
	
	// Form state management
	const [key, setKey] = useState(self.crypto.randomUUID()) // Unique key for form reset
	const [data, setData] = useState({ country: "US", state: null, city: null }) // Location data
	const [isSearchable, setIsSearchable] = useState(true) // Search functionality toggle
	const [userData, setUserData] = useState(null) // User profile data from Firestore
	const storage = getStorage() // Firebase Storage instance
	
	// Report data state
	const [reportId, setReportId] = useState("") // Generated report ID
	const imgPicker = useRef(null) // File input reference for image upload
	const [images, setImages] = useState([]) // Selected image files
	const [imageURLs, setImageURLs] = useState([]) // Uploaded image URLs
	const [update, setUpdate] = useState(false) // Trigger for image upload
	
	// Form field states
	const [title, setTitle] = useState("") // Report title
	const [titleError, setTitleError] = useState(false) // Title validation error
	const [link, setLink] = useState("") // Primary link URL
	const [secondLink, setSecondLink] = useState("") // Secondary link URL
	const [detail, setDetail] = useState("") // Report description
	const [detailError, setDetailError] = useState(false) // Detail validation error
	
	// Agency and topic selection
	const [allTopicsArr, setAllTopicsArr] = useState([]) // All available topics
	const [agencies, setAgencies] = useState([]) // Available agencies for user's state
	const [selectedAgency, setSelectedAgency] = useState("") // Selected agency name
	const [agencyID, setSelectedAgencyID] = useState("") // Selected agency ID
	
	// Source selection
	const [selectedTopic, setSelectedTopic] = useState("") // Selected topic
	const [sources, setSources] = useState([]) // Available sources
	const [selectedSource, setSelectedSource] = useState("") // Selected source
	
	// Form validation and UI state
	const [errors, setErrors] = useState({}) // Form validation errors
	const [showOtherTopic, setShowOtherTopic] = useState(false) // Show custom topic input
	const [showOtherSource, setShowOtherSource] = useState(false) // Show custom source input
	const [otherTopic, setOtherTopic] = useState("") // Custom topic value
	const [otherSource, setOtherSource] = useState("") // Custom source value
	
	// Tag management
	const [topicList, setTopicList] = useState([]) // Topic tags list
	const [sourceList, setSourceList] = useState([]) // Source tags list
	const [active, setActive] = useState([]) // Active topic tags
	const [activeSources, setActiveSources] = useState([]) // Active source tags
	
	// Modal and refresh state
	const [reportResetModal, setReportResetModal] = useState(false) // Reset confirmation modal
	const [refresh, setRefresh] = useState(false) // Form refresh trigger
	const formRef = useRef(null) // Form element reference

	// Default tag systems for categorization
	const defaultTopics = ["Health","Other","Politics","Weather"] // Tag system 1: Topic categories
	const defaultSources = ["Newspaper", "Other","Social","Website"] // Tag system 2: Source types
	const defaultLabels = ["To Investigate", "Investigated: Flagged", "Investigated: Benign"] // Tag system 3: Investigation status

	// Initialize user data on component mount
	useEffect(() => {
		getUserData()
	}, [])

	// Trigger image upload when update flag is set
	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update])
	/**
	 * Saves a new report to Firestore with all collected form data
	 * 
	 * This function creates a new report document in the Firestore 'reports' collection
	 * with all the form data including user information, location, agency, topic,
	 * source, title, links, images, and detailed description. It also handles
	 * Google Analytics event tracking for non-admin users and custom tag creation.
	 * 
	 * @param {string[]} imageURLs - Array of uploaded image URLs to associate with the report
	 * @returns {Promise<void>} Promise that resolves when the report is saved
	 * @throws {Error} If user is not authenticated or Firestore operation fails
	 */
	const saveReport = (imageURLs) => {
		// Validate user authentication
		if (!user) {
			console.error('User is not authenticated');
			return;
		}
		
		// Create new report document reference
		const newReportRef = doc(collection(db, "reports"))
		setReportId(newReportRef.id) // Set report ID for tracking
		console.log(newReportRef.id);
		
		// Save report data to Firestore
		setDoc(newReportRef, {
			userID: user.accountId, // User who submitted the report
			state: userData.state.name, // User's state
			city: userData.city.name, // User's city
			agency: selectedAgency, // Selected agency
			title: title, // Report title
			link: link, // Primary link
			secondLink: secondLink, // Secondary link
			images: imageURLs, // Array of image URLs
			detail: detail, // Detailed description
			createdDate: moment().toDate(), // Current timestamp
			isApproved: true, // Auto-approve user submissions
			read: false, // Mark as unread
			topic: selectedTopic, // Selected topic category
			hearFrom: selectedSource, // Selected source
		}).then(() => {
			console.log('Success: report saved: ' + reportId)

			// Track analytics event for non-admin users
			if (!customClaims.admin) {
				console.log('Logging event to Google Analytics')
				logEvent(analytics, 'report_submitted', {
					userID: user.accountId,
					agencyID: selectedAgency?.id || selectedAgency,
					reportID: newReportRef.id,
				})
			}

			// Create custom tags if user selected "Other" options
			if (showOtherSource || showOtherTopic) {
				addNewTag(selectedTopic, selectedSource, agencyID)
			}
			
			// Refresh form after successful save
			handleRefresh()
		}).catch((error) => {
			console.error("Error saving report: ", error);
		});
	}

	/**
	 * Fetches user profile data from Firestore
	 * 
	 * Retrieves the current user's profile information from the 'mobileUsers' collection
	 * and stores it in the userData state. This data includes location information
	 * needed for agency filtering.
	 * 
	 * @returns {Promise<void>} Promise that resolves when user data is fetched
	 */
	const getUserData = async () => {
		await getDoc(doc(db, "mobileUsers", user.accountId)).then((mobileRef) =>
			setUserData(mobileRef.data())
		)
	}
	
	/**
	 * Fetches and filters agencies based on user's state
	 * 
	 * Retrieves all agencies from the 'agency' collection and filters them to only
	 * show agencies that operate in the user's state. This ensures users only see
	 * relevant agencies for their location.
	 * 
	 * @returns {Promise<void>} Promise that resolves when agencies are fetched and filtered
	 */
	async function getAllAgencies() {
		// Get all agency documents from Firestore
		const agencyRef = await getDocs(collection(db, "agency"))
		try {
			// Filter agencies by user's state
			var arr = []
			agencyRef.forEach((doc) => {
				// Only include agencies that match user's state
				if (doc.data()["state"] == userData?.state?.name) {
					arr.push(doc.data()["name"])
				}
			})
			// Update agencies state with filtered list
			setAgencies(arr)
		} catch (error) {
			console.log(error)
		}
	}
	// 
	useEffect(() => {
		// console.log(reportSystem);
		if (reportSystem >= 2) {
			getAllSources()
		}
	},[allTopicsArr])
	
  // When agency is selected, keep track of agency ID
  useEffect(()=> {
    if (selectedAgency != "") {

      
      const agencyCollection = collection(db,"agency")
      // console.log(user)

      // If current user is an agency, determine which agency
      
      const q = query(agencyCollection, where("name", "==", selectedAgency), where("state","==", userData.state.name))
      let agencyId;
      getDocs(q).then((querySnapshot) => {       
        querySnapshot.forEach((docAgency) => { // Set initial values
          // console.log("im here")
          agencyId = docAgency.id
          // console.log(agencyId)
          setSelectedAgencyID(agencyId)
          // console.log(agencyId)
          const docRef = doc(db, 'tags', agencyId)
          getDoc(docRef).then((docSnap)=> {
        // TODO: test to make sure not null

          // create tags collection if current agency does not have one
          if (!docSnap.exists()) {
         
              // reference to tags collection 
              const tagsCollection = collection(db, "tags")

              const myDocRef = doc(tagsCollection, agencyId)

              // create topics document for the new agency
              setDoc(myDocRef, {
          
								Labels: {
									list: defaultLabels,
                  active: defaultLabels
								},

								Source: {
									list: defaultSources,
                  active: defaultSources
								},
								Topic: {
									list: defaultTopics,
                  active: defaultTopics
                }
							})
						} else {
            // console.log("Tags collection for this agency exists.")
          }
        });
				})
			})
		}
	}, [selectedAgency])

  useEffect(()=> {
    if (userData) {
      getAllAgencies()
    }
  }, [userData])

  useEffect(()=> {
    if (agencyID){
      getAllTopics()
    }
  }, [agencyID])

  // useEffect(()=> {
  //   if (allTopicsArr.length > 0) {
  //     getAllSources()
      
  //   }
  // }, [allTopicsArr])

	/**
	 * Fetches and manages topic tags for the selected agency
	 * 
	 * This function retrieves topic tags from the 'tags' collection for the selected agency.
	 * If no tags document exists for the agency, it creates one with default topics.
	 * The topics are sorted with "Other" moved to the end for better UX.
	 * 
	 * @returns {Promise<void>} Promise that resolves when topics are fetched/created
	 */
	async function getAllTopics() {
		try {
			// Get the tags document for the current agency
			let docRef = await getDoc(doc(db, 'tags', agencyID));

			// Create tags collection if agency doesn't have one
			if (!docRef.exists()) {
				// Default tag values for new agencies
				const defaultTopics = ["Health","Other","Politics","Weather"] // tag system 1
				const defaultSources = ["Newspaper", "Other","Social","Website"] // tag system 2
				const defaultLabels = ["Important", "Flagged"] // tag system 3

				// Set initial topics array
				const myDocRef = doc(db, "tags", agencyID);
				setAllTopicsArr(defaultTopics)
				setActive(defaultTopics['active'])

				// Create new tags document for the agency
				await setDoc(myDocRef, {
					Labels: {
						list: defaultLabels,
						active: defaultLabels
					},
					Source: {
						list: defaultSources,
						active: defaultSources
					},
					Topic: {
						list: defaultTopics,
						active: defaultTopics
					}
				})
			} else {
				// Agency already has tags, retrieve and sort them
				const tagsData = docRef.data()['Topic']
				setAllTopicsArr(docRef.data()['Topic']['active']);
				
				// Sort topics with "Other" at the end
				tagsData['active'].sort((a, b) => {
					if (a === t('Other')) return 1; // Move "Other" to the end
					if (b === t('Other')) return -1; // Move "Other" to the end
					return a.localeCompare(b); // Default sorting for other elements
				});
				setActive(tagsData['active']);
			}
		} catch (error) {
			console.log(error);
		}
	}
	
	/**
	 * Fetches source tags for the selected agency
	 * 
	 * Retrieves the active source tags from the agency's tags document.
	 * If no agency is selected, clears the sources array.
	 * 
	 * @returns {Promise<void>} Promise that resolves when sources are fetched
	 */
	async function getAllSources() {
		if (selectedAgency == "") {
			setSources([]) // Clear sources if no agency selected
		} else {
			// Get sources from agency's tags document
			const sourceDoc = doc(db, 'tags', agencyID);
			const sourceRef = await getDoc(sourceDoc);
			const sources = sourceRef.get('Source')['active'];
			setSources(sources);
		}
	}
	
	/**
	 * Handles form submission validation and processing
	 * 
	 * Validates required fields (title and at least one of: images, detail, or link)
	 * before submitting the report. Triggers image upload if images are selected,
	 * then saves the report to Firestore.
	 * 
	 * @param {Event} e - Form submission event
	 */
	const handleSubmitClick = (e) => {
		e.preventDefault()
		
		// Validate title is provided
		if (!title) {
			setTitleError(true)
			alert(t("titleRequired"))
		} 
		// Validate at least one of: images, detail, or link is provided
		else if (images == "" && !detail && !link) {
			setDetailError(true)
			alert(t("atLeast"))
		} else {
			// Trigger image upload if images are selected
			if (images.length > 0) {
				setUpdate(!update)
			}
			// Save report to Firestore
			saveReport(imageURLs)
		}
	}
	const handleNewReport = async (e) => {
		e.preventDefault()
		const allErrors = {}
		// if (data.state == null) {
		// 	console.log("state error")
		// 	allErrors.state = t("state")
		// }
		// if (data.city == null) {
		// 	// Don't display the report, show an error message
		// 	console.log("city error")
		// 	allErrors.city = t("city")
		// 	if (
		// 		data.state != null &&
		// 		City.getCitiesOfState(data.state?.countryCode, data.state?.isoCode)
		// 			.length == 0
		// 	) {
		// 		console.log("No cities here")
		// 		delete allErrors.city
		// 	}
		// }
		if (selectedSource == "") {
			console.log("No source error")
			allErrors.source = t("source")
		}
		if (selectedTopic == "") {
			console.log("No topic selected")
			allErrors.topic = t("specify_topic")
		}
		if (images == "") {
			console.log("no images")
		}
		setErrors(allErrors)
		console.log(allErrors.length + "Error array length")
		if (Object.keys(allErrors).length == 0) {
			handleSubmitClick(e)
		}
	}
	/**
	 * Handles image file selection from file input
	 * 
	 * Processes multiple image files selected by the user and adds them to the
	 * images state array. Triggers the upload process by setting the update flag.
	 * 
	 * @param {Event} e - File input change event
	 */
	const handleImageChange = (e) => {
		// Process each selected file
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			setImages((prevState) => [...prevState, newImage])
			setUpdate(!update) // Trigger upload process
		}
	}
	
	/**
	 * Uploads selected images to Firebase Storage
	 * 
	 * Creates unique filenames for each image and uploads them to Firebase Storage.
	 * Tracks upload progress and retrieves download URLs upon completion.
	 * Uses Promise.all to handle multiple concurrent uploads.
	 */
	const handleUpload = () => {
		const promises = []
		
		// Upload each image with unique filename
		images.map((image) => {
			const storageRef = ref(
				storage,
				`report_${new Date().getTime().toString()}.png`
			)
			const uploadTask = uploadBytesResumable(storageRef, image)
			promises.push(uploadTask)
			
			// Track upload progress and handle completion
			uploadTask.on(
				"state_changed",
				(snapshot) => {
					// Upload progress tracking (can be implemented if needed)
				},
				(error) => {
					console.log(error)
				},
				() => {
					// Get download URL when upload completes
					getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
						setImageURLs((prev) => [...prev, downloadURL])
					})
				}
			)
		})
		
		// Wait for all uploads to complete
		Promise.all(promises).catch((err) => console.log(err))
	}
	/**
	 * Handles topic selection changes
	 * 
	 * If "Other" is selected, shows the custom topic input field.
	 * Otherwise, sets the selected topic and hides the custom input.
	 * 
	 * @param {string} e - Selected topic value
	 */
	const handleTopicChange = (e) => {
		if (e.includes("Other")) {
			setSelectedTopic("")
			setShowOtherTopic(true) // Show custom topic input
		} else {
			setShowOtherTopic(false) // Hide custom topic input
			setSelectedTopic(e)
		}
	}
	
	/**
	 * Handles custom topic input changes
	 * 
	 * Updates both the otherTopic state and the selectedTopic when user
	 * types in the custom topic field.
	 * 
	 * @param {Event} e - Input change event
	 */
	const handleOtherTopicChange = (e) => {
		setOtherTopic(e.target.value)
		setSelectedTopic(e.target.value)
	}
	
	/**
	 * Handles source selection changes
	 * 
	 * If "Other" is selected, shows the custom source input field.
	 * Otherwise, sets the selected source and hides the custom input.
	 * 
	 * @param {string} e - Selected source value
	 */
	const handleSourceChange = (e) => {
		if (e.includes("Other")) {
			setSelectedSource("")
			setShowOtherSource(true) // Show custom source input
		} else {
			setShowOtherSource(false) // Hide custom source input
			setSelectedSource(e)
		}
	}
	
	/**
	 * Handles custom source input changes
	 * 
	 * Updates both the otherSource state and the selectedSource when user
	 * types in the custom source field.
	 * 
	 * @param {Event} e - Input change event
	 */
	const handleOtherSourceChange = (e) => {
		setOtherSource(e.target.value)
		setSelectedSource(e.target.value)
	}
	/**
	 * Adds new custom tags to the agency's tag collection
	 * 
	 * Prepares new topic and source tags for addition to the agency's tag system.
	 * Calls updateTopicTags to persist the changes to Firestore and clears
	 * temporary arrays after successful update.
	 * 
	 * @param {string} tag - Custom topic tag to add
	 * @param {string} source - Custom source tag to add
	 * @param {string} agencyId - Agency ID for the tag collection
	 */
	const addNewTag = (tag, source, agencyId) => {
		let tempTopicArr = [...topicList]
		let tempSourceArr = [...sourceList]
		
		// Add new topic tag if provided
		if (tag) {
			tempTopicArr.push(tag)
			setTopicList(tempTopicArr)
		}

		// Add new source tag if provided
		if (source) {
			tempSourceArr.push(source)
			setSourceList(tempSourceArr)
		}

		// Update Firestore with new tags
		updateTopicTags(
			tag ? tempTopicArr : null,
			source ? tempSourceArr : null,
			agencyId,
		).then(() => {
			// Clear temporary arrays after successful update
			setTopicList([])
			setSourceList([])
		})
	}
	/**
	 * Updates the agency's tag collection with new topics and sources
	 * 
	 * Fetches the current tag document for the agency and adds new topics/sources
	 * that don't already exist. Uses Firestore's arrayUnion to append new tags
	 * without duplicates. Only updates if there are new tags to add.
	 * 
	 * @param {string[]} topic - Array of topic tags to add
	 * @param {string[]} source - Array of source tags to add
	 * @param {string} agencyId - Agency ID for the tag collection
	 * @returns {Promise<DocumentReference|null>} Promise that resolves to document reference or null
	 */
	const updateTopicTags = async (topic, source, agencyId) => {
		try {
			// Reference to the agency's tags document
			const docRef = doc(db, 'tags', agencyId)

			// Fetch current document data
			const docSnap = await getDoc(docRef)

			if (docSnap.exists()) {
				const currentData = docSnap.data()
				const updateData = {}

				// Process new topic tags
				if (topic) {
					const currentTopicList = currentData.Topic?.list || []
					const newTopicList = topic.filter(
						(item) => !currentTopicList.includes(item), // Only add non-duplicates
					)
					if (newTopicList.length > 0) {
						updateData['Topic.list'] = arrayUnion(...newTopicList)
					}
				}

				// Process new source tags
				if (source) {
					const currentSourceList = currentData.Source?.list || []
					const newSourceList = source.filter(
						(item) => !currentSourceList.includes(item), // Only add non-duplicates
					)
					if (newSourceList.length > 0) {
						updateData['Source.list'] = arrayUnion(...newSourceList)
					}
				}

				// Update document only if there are new tags to add
				if (Object.keys(updateData).length > 0) {
					await updateDoc(docRef, updateData)
					console.log('Document updated successfully')
				} else {
					console.log('No new topics or sources to add')
				}

				return docRef
			} else {
				console.log('No such document!')
				return null
			}
		} catch (error) {
			console.error('Error updating document: ', error)
		}
	}
	
	/**
	 * Logs current form data for debugging purposes
	 * 
	 * Creates a comprehensive object containing all form field values
	 * for debugging and development purposes. Called on reportSystem
	 * and update state changes.
	 */
	const logFormData = () => {
		const formData = {
			Agency: selectedAgency,
			"Agency ID": agencyID,
			Topic: selectedTopic,
			"Show other Topic": showOtherTopic ? 'true' : 'false',
			"Other Topic": otherTopic,
			Source: selectedSource,
			"Show other Source": showOtherSource ? 'true' : 'false',
			"Other Source": otherSource,
			"Report title": title,
			"Report link1": link,
			"Report link2": secondLink,
			"Report images": imageURLs,
			"Report description": detail,
			"Report ID": reportId,
			"Report KEY": key
		};
		
		// Debug logging (commented out in production)
		// console.log("Form Data: ", formData);
	};
	
	// Log form data when report system step or update state changes
	useEffect(() => {
		logFormData()
	}, [reportSystem, update])
	
	/**
	 * Handles form field changes and clears validation errors
	 * 
	 * Clears title error when user starts typing in title field.
	 * Clears detail error when user provides content in any required field.
	 * 
	 * @param {Event} e - Form field change event
	 */
	const handleChange = (e) => {
		// Clear title error when user starts typing
		if (titleError) {
			e.target.id == 'title' && setTitleError(false)
		} 
		// Clear detail error when user provides content
		else if (detailError) {
			e.target.id == 'link' || 'multiple_files' || 'detail' && setTitleError(false)
		}
	}
	
	/**
	 * Resets the entire form to initial state
	 * 
	 * Generates a new unique key, resets the form element, clears all state
	 * variables, and returns to the initial step (0). This provides a complete
	 * form reset for starting a new report.
	 */
	const handleRefresh = () => {
		// Generate new unique key for form reset
		setKey(self.crypto.randomUUID())
		
		// Reset form element if available
		if (formRef.current) {
			formRef.current.reset(); // Reset all input fields to initial values
		}
		
		// Reset all state variables
		setSelectedAgency("")
		setSelectedAgencyID('')
		
		// Reset topic-related state
		setSelectedTopic("")
		setShowOtherTopic(false)
		setOtherTopic('')
		setAllTopicsArr([])
		
		// Reset source-related state
		setSelectedSource("")
		setShowOtherSource(false)
		setOtherSource('')
		
		// Reset form fields
		setTitle("")
		setLink("")
		setSecondLink("")
		setImageURLs([])
		setDetail("")
		setReportId('')
		
		// Reset UI state
		setReportResetModal(false)
		setReportSystem(0) // Return to initial step
	}
	
	/**
	 * Forward navigation arrow component
	 * 
	 * Renders a forward arrow button that advances to the next step
	 * in the report creation process.
	 * 
	 * @returns {JSX.Element} Forward arrow button
	 */
	const ForwardArrow = () => {
		return (
			<IconButton
				variant='text'
				color='blue'
				onClick={() => setReportSystem(reportSystem + 1)}>
				<IoMdArrowRoundForward size={30} />
			</IconButton>
		)
	}
	
	/**
	 * Back navigation arrow component
	 * 
	 * Renders a back arrow button that returns to the previous step
	 * in the report creation process.
	 * 
	 * @returns {JSX.Element} Back arrow button
	 */
	const BackArrow = () => {
		return (
			<IconButton
				variant='text'
				color='blue-gray'
				onClick={onReportSystemPrevStep}>
				<IoMdArrowRoundBack size={30} />
			</IconButton>
		)
	}
	
	/**
	 * Refresh/reset button component
	 * 
	 * Renders a refresh button that opens the reset confirmation modal
	 * to allow users to start over with a new report.
	 * 
	 * @returns {JSX.Element} Refresh button
	 */
	const RefreshButton = () => {
		return (
			<IconButton
				variant='text'
				color='blue-gray'
				onClick={() => setReportResetModal(true)}
				type='button'>
				<IoMdRefresh size={30} />
			</IconButton>
		)
	}
	return (
		<div className={globalStyles.sectionContainer} key={key}>
			<>
				{reminderShow != false && reportSystem == 1 && (
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
						{/* DO NOT SHOW AGAIN CHECKBOX */}
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
			</>
			{reportSystem >= 2 && reportSystem <= 6 && (
				<div className={globalStyles.form.wrap}>
					<form
						onChange={handleChange}
						onSubmit={handleNewReport}
						className={globalStyles.form.element}
						ref={formRef}
						id={key}>
						{/* Agency */}
						{reportSystem == 2 && (
							<div className={globalStyles.form.viewWrapper}>
								<Typography variant='h5'>{t("which_agency")}</Typography>
								<Card>
									<List>
										{agencies.length == 0 && t("noAgencies")}
										{agencies.map((agency, i = self.crypto.randomUUID()) => (
											<ListItem
												id='agency'
												key={i}
												selected={agency === selectedAgency}
												value={agency}
												onClick={() => setSelectedAgency(agency)}>
												{agency}
											</ListItem>
										))}
									</List>
								</Card>
								{errors.agency && selectedAgency === "" && (
									<span className='text-red-500'>{errors.agency}</span>
								)}
								{/* FORWARD ARROW */}
								{selectedAgency != "" && (
									<div className='absolute bottom-4 right-4 sm:right-6'>
										<ForwardArrow />
									</div>
								)}
							</div>
						)}
						{/* Topic tag */}
						{reportSystem == 3 && (
							<div className={globalStyles.form.viewWrapper}>
								<Typography variant='h5'>{t("about")}</Typography>
								<Card>
									<List>
										{[
											...allTopicsArr.filter((topic) => topic !== "Other"),
											...allTopicsArr.filter((topic) => topic === "Other"),
										].map((topic, i = self.crypto.randomUUID()) => (
											<ListItem
												id='topic'
												key={i}
												selected={topic === selectedTopic}
												value={topic}
												onClick={() => handleTopicChange(topic)}>
												{defaultTopics.includes(topic) ? t("topics."+topic) : topic}
											</ListItem>
										))}
									</List>
								</Card>
								{errors.topic && selectedTopic === "" && (
									<span className='text-red-500'>{errors.topic}</span>
								)}
								{showOtherTopic && (
									<div className='w-full'>
										<Input
											label={t("custom_topic")}
											value={otherTopic}
											onChange={handleOtherTopicChange}
										/>
										<Typography
											variant='small'
											color='gray'
											className={globalStyles.mdInput.hint}>
											<IoIosInformationCircle />
											{t("specify_topic")}
										</Typography>
									</div>
								)}
								{/* FORWARD ARROW */}
								{selectedTopic != "" && (
									<div className='absolute bottom-4 right-4 sm:right-6'>
										<ForwardArrow />
									</div>
								)}
							</div>
						)}
						{/* Source tag */}
						{reportSystem == 4 && (
							<div className={globalStyles.form.viewWrapper}>
								<Typography variant='h5'>{t("where")}</Typography>
								<Card>
									<List>
										{[
											...sources.filter((source) => source !== "Other"),
											...sources.filter((source) => source === "Other"),
										].map((source, i = self.crypto.randomUUID()) => (
											<ListItem
												id='source'
												key={i}
												selected={source === selectedSource}
												value={t(source)}
												onClick={() => handleSourceChange(source)}>
												{defaultSources.includes(source) ? t("sources."+source) : source}
											</ListItem>
										))}
									</List>
								</Card>
								{errors.source && selectedSource === "" && (
									<span className='text-red-500'>{errors.source}</span>
								)}
								{showOtherSource && (
									<div className='w-full'>
										<Input
											label={t("custom_source")}
											value={otherSource}
											onChange={handleOtherSourceChange}
										/>
										<Typography
											variant='small'
											color='gray'
											className={globalStyles.mdInput.hint}>
											<IoIosInformationCircle />
											{t("custom_source")}
										</Typography>
									</div>
								)}
								{selectedSource != "" && (
									<div className='absolute bottom-4 right-4 sm:right-6'>
										<ForwardArrow />
									</div>
								)}
							</div>
						)}
						{/* Details */}
						{reportSystem == 5 && (
							<div className='flex flex-col gap-6 mb-1'>
								<div className='block'>
									<Typography variant='h5'>{t("share")}</Typography>
									<Typography
										variant='small'
										color='gray'
										className='mt-2 flex items-start gap-1 italic'>
										<IoIosInformationCircle size="12" className='mt-1' />
										{t("personalInfo")}
									</Typography>
								</div>
								{/* TITLE */}
								<div className='block'>
									<Typography>{t("detailDescription")}</Typography>
									<Input
										variant='outlined'
										color='gray'
										id='title'
										type='text'
										label={t("title")}
										onChange={(e) => setTitle(e.target.value)}
										value={title}
										error={titleError}
									/>
									<Typography
										variant='small'
										color={titleError ? 'red' : 'gray'}
										className='mt-2 flex items-start gap-1 font-normal'>
										<IoIosInformationCircle size="12" className='mt-1' />
										{t("provide_title")} {t("max")}
									</Typography>
									{detailError && (
										<Typography color="red" className="mt-2">{t("atLeast")}</Typography>
									)}
								</div>
								{/* LINKS */}
								<div className='block'>
									<Input
										variant='outlined'
										color='gray'
										label={t("linkFirst")}
										id='link'
										type='text'
										onChange={(e) => setLink(e.target.value)}
										value={link}
									/>
									{!link && (
										<Typography
											variant='small'
											color='gray'
											className='mt-2 flex items-start gap-1 font-normal'>
											<IoIosInformationCircle size="12" className='mt-1' />
											{t("example")} https://
										</Typography>
									)}
									{/* Link 02 */}
									{link && (
										<>
											<div className='mt-2'>
												<Input
													variant='outlined'
													color='gray'
													label={t("linkFirst")}
													id='secondLink'
													type='text'
													onChange={(e) => setSecondLink(e.target.value)}
													value={secondLink}
												/>
											</div>
											<Typography
												variant='small'
												color='gray'
												className='mt-2 flex items-start gap-1 font-normal'>
												<IoIosInformationCircle size="12" className='mt-1' />
												{t("example")} https://
											</Typography>
										</>
									)}
								</div>
								{/* IMAGE UPLOAD */}
								<div className='block'>
									<Input
										variant='static'
										id='multiple_files'
										multiple
										className={globalStyles.inputImage}
										accept='image/*'
										onChange={handleImageChange}
										ref={imgPicker}
										type='file'
										label={t("image")}
									/>
									<Typography
										variant='small'
										color='gray'
										className='mt-2 flex items-start gap-1'>
										<IoIosInformationCircle size="12" className='mt-1' />
										{t("imageDescription")}
									</Typography>
								</div>
								{/* DESCRIBE IN DETAIL */}
								<div className='block'>
									<Textarea
										type="textarea"
										id='detail'
										onChange={(e) => setDetail(e.target.value)}
										value={detail}
										label={t("detailed")}
										rows={8}
										/>
									<Typography
										variant='small'
										color='gray'
										className='mt-2 flex items-start gap-1'>
										<IoIosInformationCircle size="15" className='mt-1' />
										{t("detailedDescription")}
									</Typography>
								</div>
								{/* SUBMIT BUTTON */}
								<button
									onClick={handleSubmitClick}
									className={globalStyles.button.md_block}
									type='submit'>
									{t("submit")}
								</button>
							</div>
						)}
						{/* REFRESH REPORT BUTTON */}
						{reportSystem >= 2 && (
							<div className='flex justify-center'>
								<div className='w-50 opacity-50 hover:opacity-100 mt-2 sm:mt-4'>
									<RefreshButton />
								</div>
							</div>
						)}
						{/* BACK ICON */}
						{reportSystem > 0 && reportSystem < 7 && (
							<div className='absolute opacity-50 hover:opacity-100 bottom-4 left-4 sm:left-6'>
								<BackArrow />
							</div>
						)}
					</form>
				</div>
			)}
			{reportSystem === 7 && (
				<div className={`${globalStyles.form.wrap} sm:p-6`}>
					<>
						{/* THANK YOU */}
						{reportSystem == 6 && (
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
						{reportSystem == 7 && (
							<Card className={globalStyles.form.view}>
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
										{link || secondLink != "" ? (
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
							</Card>
						)}
					</>
				</div>
			)}
			{/* Reset MODAL */}
			{reportResetModal && (
				<ConfirmModal
					func={handleRefresh} // Pass the handleRefresh function to the ConfirmModal component
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
