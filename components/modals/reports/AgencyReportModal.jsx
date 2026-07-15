import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { IoClose } from 'react-icons/io5'
import { useAuth } from '../../../context/AuthContext'
import moment from 'moment'
import { db } from '../../../config/firebase'
import {
	fetchExperimentConfig,
	getActiveExperimentId,
	newReportExperimentFields,
} from '../../../utils/reports-queries'
import {
	buildLabelOptions,
	CUSTOM_LABEL_MAX_LENGTH,
	DEFAULT_AGENCY_LABELS,
	DEFAULT_REPORT_LABEL,
	OTHER_LABEL,
	validateCustomLabel,
} from '../../../config/labels'
import { addAgencyCustomLabel } from '../../../utils/label-tags'
import LabelOptionWithDot from '../../reports/LabelOptionWithDot'
import { State, City } from 'country-state-city'
import {
	getDoc,
	getDocs,
	doc,
	setDoc,
	collection,
	updateDoc,
	addDoc,
	query,
	where,
	arrayUnion,
} from 'firebase/firestore'
import {
	getStorage,
	ref,
	getDownloadURL,
	uploadBytes,
} from 'firebase/storage'
import ConfirmModal from '../common/ConfirmModal'
import FormInput from '../../ui/FormInput'
import FormTextarea from '../../ui/FormTextarea'
import FormSelect from '../../ui/FormSelect'
import MediaUploadField from '../../ui/MediaUploadField'
import { useTranslation } from 'next-i18next'
import { Typography } from '@material-tailwind/react'
import { maxActiveTags } from '../../../config/tagSystems'
import { seedAgencyTagsDoc } from '../../../utils/tag-defaults'

const TOPICS_KEY_PREFIX = 'topics.'
const SOURCES_KEY_PREFIX = 'sources.'
const MAX_ACTIVE_TOPICS = maxActiveTags[1]
const MAX_ACTIVE_SOURCES = maxActiveTags[2]

/**
 * If a tag id was stored with an i18n key prefix by mistake, strip it so we resolve
 * `topics.Sports` instead of `topics.topics.Sports`.
 */
function stripTopicsKeyPrefix(topicId) {
	if (typeof topicId !== 'string') return topicId
	let s = topicId
	while (s.startsWith(TOPICS_KEY_PREFIX)) {
		s = s.slice(TOPICS_KEY_PREFIX.length)
	}
	return s
}

function stripSourcesKeyPrefix(sourceId) {
	if (typeof sourceId !== 'string') return sourceId
	let s = sourceId
	while (s.startsWith(SOURCES_KEY_PREFIX)) {
		s = s.slice(SOURCES_KEY_PREFIX.length)
	}
	return s
}

/** True when this topic id is the “Other” row, including legacy `topics.Other` (or repeated prefix) in Firestore. */
function isOtherTopicValue(value) {
	if (typeof value !== 'string') return false
	return stripTopicsKeyPrefix(value) === 'Other'
}

/** True when this source id is the “Other” row, including legacy `sources.Other` / `sources.Other/Otro`. */
function isOtherSourceValue(value) {
	if (typeof value !== 'string') return false
	const id = stripSourcesKeyPrefix(value)
	return id === 'Other' || id === 'Other/Otro'
}

/** Returns true when empty or a valid http(s) URL (protocol optional in input). */
function isValidLink(value) {
	const trimmed = value.trim()
	if (!trimmed) return true
	try {
		const withProtocol = /^https?:\/\//i.test(trimmed)
			? trimmed
			: `https://${trimmed}`
		const parsed = new URL(withProtocol)
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return false
		}

		const host = parsed.hostname.toLowerCase()
		if (!host) return false
		if (host === 'localhost') return true
		if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true

		// Reject bare words like "adfadfadf" — require a domain with a TLD (e.g. example.com)
		if (
			!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(
				host,
			)
		) {
			return false
		}

		const tld = host.split('.').pop()
		return Boolean(tld && tld.length >= 2)
	} catch {
		return false
	}
}

const AgencyReportModal = ({
	setNewReportModal,
	handleNewReportSubmit,
}) => {
	const dbInstance = collection(db, 'reports')
	const { user } = useAuth()
	// useStates
	const [data, setData] = useState({ country: 'US', state: null, city: null })

	const [title, setTitle] = useState('')
	const [link, setLink] = useState('')
	const [secondLink, setSecondLink] = useState('')
	const [detail, setDetail] = useState('')
	// Image upload

	const storage = getStorage()
	const imgPicker = useRef(null)
	const [images, setImages] = useState([])
	const [allTopicsArr, setTopics] = useState([])
	const [agencies, setAgencies] = useState([])
	const [selectedAgency, setSelectedAgency] = useState('')
	const [selectedAgencyId, setSelectedAgencyId] = useState('')
	const [selectedTopic, setSelectedTopic] = useState('')
	const [otherTopic, setOtherTopic] = useState('')
	const [otherSource, setOtherSource] = useState('')
	const [showOtherTopic, setShowOtherTopic] = useState(false)
	const [showOtherSource, setShowOtherSource] = useState(false)
	const [list, setList] = useState([])
	const [sourceList, setSourceList] = useState([])
	const [active, setActive] = useState([])
	const [activeSources, setActiveSources] = useState([])
	const [allSourcesArr, setSources] = useState([])
	const [selectedSource, setSelectedSource] = useState('')
	const [activeLabels, setActiveLabels] = useState([])
	const [agencyLabelColors, setAgencyLabelColors] = useState({})
	const [selectedLabel, setSelectedLabel] = useState(DEFAULT_REPORT_LABEL)
	const [otherLabelDraft, setOtherLabelDraft] = useState('')
	const [reportState, setReportState] = useState(0)
	const [errors, setErrors] = useState({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState('')
	const [showCloseConfirm, setShowCloseConfirm] = useState(false)

	const { t } = useTranslation('NewReport')

	const clearFieldError = (field) => {
		setErrors((prev) => {
			if (!prev[field]) return prev
			const { [field]: _, ...rest } = prev
			return rest
		})
	}

	const resolveTopicValue = () => {
		if (isOtherTopicValue(selectedTopic)) {
			return otherTopic.trim()
		}
		return (selectedTopic || '').trim()
	}

	const resolveSourceValue = () => {
		if (isOtherSourceValue(selectedSource)) {
			return otherSource.trim()
		}
		return (selectedSource || '').trim()
	}
	const isFormDirty = () =>
		Boolean(title.trim()) ||
		Boolean(link.trim()) ||
		Boolean(secondLink.trim()) ||
		Boolean(detail.trim()) ||
		images.length > 0 ||
		data.state != null ||
		data.city != null ||
		Boolean(selectedTopic) ||
		Boolean(otherTopic.trim()) ||
		Boolean(selectedSource) ||
		Boolean(otherSource.trim()) ||
		selectedLabel !== DEFAULT_REPORT_LABEL ||
		Boolean(otherLabelDraft.trim())

	const requestClose = (e) => {
		e?.preventDefault?.()
		if (isSubmitting) return
		if (isFormDirty()) {
			setShowCloseConfirm(true)
			return
		}
		setNewReportModal(false)
	}

	const confirmDiscardAndClose = () => {
		setShowCloseConfirm(false)
		setNewReportModal(false)
	}

	const validateForm = () => {
		const allErrors = {}

		if (data.state == null) {
			allErrors.state = t('state')
		}

		if (data.city == null) {
			const cities =
				data.state != null
					? City.getCitiesOfState(
							data.state?.countryCode,
							data.state?.isoCode,
						)
					: []
			if (cities.length > 0) {
				allErrors.city = t('city')
			}
		}

		if (!title.trim()) {
			allErrors.title = t('titleRequired')
		}

		if (!resolveTopicValue()) {
			allErrors.topic = t('specify_topic')
		}

		if (!resolveSourceValue()) {
			allErrors.source = t('source')
		}

		if (selectedLabel === OTHER_LABEL) {
			const labelError = validateCustomLabel(otherLabelDraft)
			if (labelError) {
				allErrors.label = labelError
			}
		}

		const hasImages = images.length > 0
		const hasContent = Boolean(detail.trim()) || Boolean(link.trim())
		if (!hasImages && !hasContent) {
			allErrors.content = t('atLeast')
		}

		if (link.trim() && !isValidLink(link)) {
			allErrors.link = t('invalidLink')
		}

		if (secondLink.trim() && !isValidLink(secondLink)) {
			allErrors.secondLink = t('invalidLink')
		}

		return allErrors
	}

	const scrollToFirstError = (allErrors) => {
		const fieldOrder = [
			'state',
			'city',
			'title',
			'topic',
			'source',
			'label',
			'content',
			'link',
			'secondLink',
			'detail',
		]
		const fieldToId = {
			state: 'state',
			city: 'city',
			title: 'title',
			topic: showOtherTopic ? 'topic-other' : 'topic-selection',
			source: showOtherSource ? 'source-other' : 'source-selection',
			label: 'label-other',
			content: 'link',
			link: 'link',
			secondLink: 'secondLink',
			detail: 'detail',
		}

		for (const field of fieldOrder) {
			if (!allErrors[field]) continue
			const el = document.getElementById(fieldToId[field])
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' })
				el.focus?.()
				break
			}
		}
	}

	const FieldError = ({ message }) =>
		message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null

	/**
	 * saveReport
	 *
	 * This function is responsible for saving a new report to the Firestore database.
	 * It performs the following tasks:
	 *
	 * 1. Add Report: Adds a new document to the `reports` collection in Firestore using the `addDoc` method.
	 *    The document contains various details about the report, including:
	 *    - `userID`: The ID of the user who created the report.
	 *    - `state`: The name of the state selected by the user.
	 *    - `city`: The name of the city selected by the user, or 'N/A' if no city is selected.
	 *    - `agency`: The agency selected by the user.
	 *    - `title`: The title of the report.
	 *    - `link` and `secondLink`: Optional links provided by the user.
	 *    - `images`: An array of image URLs uploaded by the user.
	 *    - `detail`: Detailed description provided by the user.
	 *    - `createdDate`: The date and time when the report is created, generated using `moment`.
	 *    - `isApproved`: A boolean flag set to `false`, indicating that the report is not approved by default.
	 *    - `label`: An empty string for any labeling system.
	 *    - `read`: A boolean flag set to `false`, indicating that the report is unread by default.
	 *    - `topic`: The topic selected by the user.
	 *    - `hearFrom`: The source of information selected by the user.
	 *
	 * 2. Handle New Report Submission: After the report is successfully saved, it calls `handleNewReportSubmit`
	 *    to signal the `ReportsSection` component to update the list of reports.
	 *
	 * 3. Add New Tag: Calls the `addNewTag` function to add the new topic and source to the agency's tag collection
	 *    in Firestore.
	 *
	 * @param {Array} imageURLs - An array of URLs of the images uploaded by the user.
	 */
	const resolveReportLabel = () => {
		if (selectedLabel === OTHER_LABEL) {
			return otherLabelDraft.trim() || DEFAULT_REPORT_LABEL
		}
		return selectedLabel || DEFAULT_REPORT_LABEL
	}

	const saveReport = async (imageURLs) => {
		const experimentConfig = await fetchExperimentConfig()
		const experimentId = getActiveExperimentId(experimentConfig)
		const resolvedLabel = resolveReportLabel()
		await addDoc(dbInstance, {
			userID: user.accountId,
			state: data.state.name,
			city: data.city == null ? 'N/A' : data.city.name,
			agency: selectedAgency,
			title: title,
			link: link,
			secondLink: secondLink,
			images: imageURLs,
			detail: detail,
			createdDate: moment().toDate(),
			isApproved: false,
			label: resolvedLabel,
			read: false,
			topic: resolveTopicValue(),
			hearFrom: resolveSourceValue(),
			// `origin` marks the submission channel; AgencyReportModal is the agency-side dashboard flow.
			origin: 'agency',
			...newReportExperimentFields(experimentId),
		})
		if (
			selectedLabel === OTHER_LABEL &&
			otherLabelDraft.trim() &&
			selectedAgencyId
		) {
			await addAgencyCustomLabel(selectedAgencyId, otherLabelDraft.trim())
		}
		handleNewReportSubmit() // Send a signal to ReportsSection so that it updates the list
		addNewTag(resolveTopicValue(), resolveSourceValue(), selectedAgencyId)
	}

	/**
	 * handleImageChange
	 *
	 * This function handles the change event when the user selects images for upload.
	 * It performs the following tasks:
	 *
	 * 1. Logs the start of the image change process to the console.
	 * 2. Iterates over the list of files selected by the user (from the event's target).
	 * 3. For each file:
	 *    - Adds the new image to the `images` state array using the `setImages` function.
	 *
	 * @param {Event} e - The change event triggered when the user selects files.
	 */
	const handleImageChange = (e) => {
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			setImages((prevState) => [...prevState, newImage])
		}
		clearFieldError('content')
	}

	/**
	 * handleRemoveImage
	 *
	 * This function handles the removal of an image from the `images` state array.
	 * It performs the following tasks:
	 *
	 * 1. Removes the image from the `images` state array using the `setImages` function.
	 * 2. Resets the `imgPicker` input value to an empty string.
	 */
	const handleRemoveImage = (index) => {
		setImages((prevState) => prevState.filter((_, i) => i !== index))
		if (imgPicker.current) imgPicker.current.value = ''
	}

	/**
	 * Uploads selected images to Firebase Storage and returns their download URLs.
	 * Called on submit so uploads are not started until the user clicks Create.
	 *
	 * @param {File[]} files
	 * @returns {Promise<string[]>}
	 */
	const uploadImages = async (files) => {
		if (!files.length) return []

		return Promise.all(
			files.map(async (image, index) => {
				const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image'
				const storageRef = ref(
					storage,
					`report_${Date.now()}_${index}_${safeName}`,
				)
				const snapshot = await uploadBytes(storageRef, image)
				return getDownloadURL(snapshot.ref)
			}),
		)
	}

	/**
	 * handleStateChange
	 *
	 * This function is triggered when a user selects a state from the dropdown.
	 * It performs the following tasks:
	 *
	 * 1. Update State: Sets the selected state in the `data` state object and resets the city selection to `null`.
	 *
	 * 2. Update Report State: Sets the report's state tracking variable `reportState` to `1`, indicating that a state has been selected.
	 *
	 * @param {object} e - The event object containing the selected state.
	 */
	const handleStateChange = (e) => {
		setData((data) => ({ ...data, state: e, city: null }))
		setReportState(1)
		clearFieldError('state')
		clearFieldError('city')
	}

	/**
	 * handleCityChange
	 *
	 * This function is triggered when a user selects a city from the dropdown.
	 * It performs the following tasks:
	 *
	 * 1. Update City: Sets the selected city in the `data` state object or sets it to `null` if no city is selected.
	 *
	 * 2. Update Report State: Sets the report's state tracking variable `reportState` to `2`, indicating that a city has been selected.
	 *
	 * @param {object} e - The event object containing the selected city.
	 */
	const handleCityChange = (e) => {
		setData((data) => ({ ...data, city: e !== null ? e : null }))
		setReportState(2)
		clearFieldError('city')
	}

	/**
	 *
	 * Two options for agency selection
	 * 1) function: handleAgencyChange (uncomment)
	 * - - automatically set agency from agency user's assigned agency
	 * 2) function: getAgencyForUser
	 * - - let user choose agency from agency selector
	 *
	 */

	/**
	 * handleAgencyChange
	 *
	 * This function is triggered when a user selects an agency from a dropdown menu.
	 * It performs the following tasks:
	 *
	 * 1. **Extract Agency Name**: Retrieves the selected agency name from the event and sets it to the state `selectedAgency`.
	 *
	 * 2. **Query Firebase for Agency Document**: Uses Firebase Firestore to query the 'agency' collection and find the document that matches the selected agency name.
	 *
	 * 3. **Handle Found Agency Document**:
	 *    - If a matching agency document is found, it retrieves the agency's ID and updates the state `selectedAgencyId`.
	 *    - The function then checks if a corresponding document exists in the 'tags' collection (using the agency ID).
	 *
	 * 4. **Create Default Tags if Not Exists**:
	 *    - If the 'tags' document for the agency does not exist, it creates one with default tags for `Topic`, `Source`, and `Labels`.
	 *
	 * 5. **Log and Handle Errors**:
	 *    - Logs messages based on whether the tags document exists or was created.
	 *    - If no matching agency is found, an error is logged.
	 *    - Catches and logs any errors that occur during the process.
	 *
	 * @param {object} e - The event object from the dropdown menu selection, containing the selected agency name.
	 */

	/**
  const handleAgencyChange = async (e) => {
    try {
      const selectedAgencyName = e.value
      setSelectedAgency(selectedAgencyName) // Keep selectedAgency as a string

      // Query for the agency by name
      const agencyCollection = collection(db, 'agency')
      const q = query(agencyCollection, where('name', '==', selectedAgencyName))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const agencyDoc = querySnapshot.docs[0]
        const agencyId = agencyDoc.id

        // Update the selected agency ID state
        setSelectedAgencyId(agencyId)

        // Check if tags exist for the selected agency
        const docRef = doc(db, 'tags', agencyId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          console.log('Creating default tags for agency')
          await seedAgencyTagsDoc(agencyId)
          console.log('Created default tags for the agency.')
        } else {
          console.log('Tags collection for this agency exists.')
        }
      } else {
        console.error('No matching agency found.')
      }
    } catch (error) {
      console.error('Error in handleAgencyChange:', error)
    }
  }
  */

	/**
	 * getAgencyForUser
	 *
	 * This asynchronous function fetches the agency associated with the currently logged-in user.
	 * It performs the following tasks:
	 *
	 * 1. Queries the 'agency' collection to find a document where the 'agencyUsers' array contains the user's email.
	 * 2. If a matching agency is found, it extracts the agency's ID and name.
	 * 3. Updates the state with the agency name and ID.
	 *
	 * @returns {void}
	 */
	const getAgencyForUser = async () => {
		try {
			// Query the 'agency' collection for the document where the 'agencyUsers' array contains the user's email
			const agencyCollectionRef = collection(db, 'agency')
			const agencyQuery = query(
				agencyCollectionRef,
				where('agencyUsers', 'array-contains', user.email),
			)
			const querySnapshot = await getDocs(agencyQuery)

			if (!querySnapshot.empty) {
				// Assuming there is only one agency that contains the user's email, you can get the first document
				const agencyDoc = querySnapshot.docs[0]
				const agencyId = agencyDoc.id
				const agencyName = agencyDoc.data().name

				// console.log('Agency ID:', agencyId);
				// console.log('Agency Name:', agencyName);

				// You can now use this agency name and ID as needed, e.g., setting them in state
				setSelectedAgency(agencyName)
				setSelectedAgencyId(agencyId)
			} else {
				console.warn('No agency found for the current user.')
			}
		} catch (error) {
			console.error('Error fetching agency for user:', error)
		}
	}

	/**
	 * handleTitleChange
	 *
	 * This function handles the change event for the report title input.
	 * It performs the following tasks:
	 *
	 * 1. Prevents the default form submission behavior.
	 * 2. Updates the `title` state with the value entered by the user.
	 * 3. If the report state is less than 4, it sets the report state to 4.
	 *
	 * @param {Event} e - The change event triggered when the user modifies the title input.
	 */
	const handleTitleChange = (e) => {
		e.preventDefault()
		setTitle(e.target.value)
		reportState < 4 && setReportState(4)
		clearFieldError('title')
	}

	/**
	 * handleTopicChange
	 *
	 * This function handles the change event for the topic selection.
	 * It performs the following tasks:
	 *
	 * 1. Updates the `selectedTopic` state with the value selected by the user.
	 * 2. If the selected topic is the agency “Other” topic (including legacy ids like `topics.Other`), it sets `showOtherTopic` to true, otherwise it hides it.
	 * 3. Sets the report state to 5.
	 *
	 * @param {Event} e - The change event triggered when the user selects a topic.
	 */
	const handleTopicChange = (e) => {
		setSelectedTopic(e.value)
		if (isOtherTopicValue(e.value)) {
			setShowOtherTopic(true)
		} else {
			setShowOtherTopic(false)
		}
		setReportState(5)
		clearFieldError('topic')
	}

	/**
	 * handleSourceChangeOther
	 *
	 * This function handles the change event for the source selection.
	 * It performs the following tasks:
	 *
	 * 1. Updates the `selectedSource` state with the value selected by the user.
	 * 2. If the selected source is the agency “Other” source (including legacy ids like `sources.Other` or `sources.Other/Otro`), it sets `showOtherSource` to true, otherwise it hides it.
	 * 3. Sets the report state to 6.
	 *
	 * @param {Event} e - The change event triggered when the user selects a source.
	 */
	const handleSourceChangeOther = (e) => {
		setSelectedSource(e.value)
		if (isOtherSourceValue(e.value)) {
			setShowOtherSource(true)
		} else {
			setShowOtherSource(false)
		}
		setReportState(6)
		clearFieldError('source')
	}

	/**
	 * Adds topic/source values from an agency report into the agency tag catalog.
	 * New tags are added to `list` and turned on in `active` immediately when under
	 * the live-tag limit (same behavior as TagSystem "+ New Topic/Source").
	 *
	 * @param {string} tag - Resolved topic value from the report form.
	 * @param {string} source - Resolved source value from the report form.
	 * @param {string} agencyId - Agency whose `tags` document to update.
	 */
	const addNewTag = (tag, source, agencyId) => {
		if (!agencyId) return

		const topicArr = list.includes(tag) ? [...list] : [...list, tag]
		const sourceArr = sourceList.includes(source)
			? [...sourceList]
			: [...sourceList, source]

		let nextActive = [...active]
		let nextActiveSources = [...activeSources]

		const activateTopic =
			Boolean(tag) &&
			!nextActive.includes(tag) &&
			nextActive.length < MAX_ACTIVE_TOPICS
		const activateSource =
			Boolean(source) &&
			!nextActiveSources.includes(source) &&
			nextActiveSources.length < MAX_ACTIVE_SOURCES

		if (activateTopic) nextActive = [...nextActive, tag]
		if (activateSource) nextActiveSources = [...nextActiveSources, source]

		setList(topicArr)
		setSourceList(sourceArr)
		setActive(nextActive)
		setActiveSources(nextActiveSources)
		updateTopicTags(tag, source, agencyId, activateTopic, activateSource)
	}

	/**
	 * getTopicList
	 *
	 * This asynchronous function retrieves the list of topics for the selected agency.
	 * It performs the following tasks:
	 *
	 * 1. Checks if a 'tags' document exists for the selected agency.
	 * 2. If not, it creates a default set of tags (topics, sources, labels) for the agency.
	 * 3. If the document exists, it retrieves the list of topics and sorts them.
	 * 4. Updates the `allTopicsArr` and `active` states with the retrieved data.
	 *
	 * @returns {void}
	 */
	const getTopicList = async () => {
		try {
			// console.log("Current agency's ID is " + selectedAgencyId)
			let docRef = await getDoc(doc(db, 'tags', selectedAgencyId))

			// create tags collection if current agency does not have one
			if (!docRef.exists()) {
				console.log('Need to create tag collection for agency. ')
				// One fetch/write — reuse returned payload so UI matches the saved doc
				const payload = await seedAgencyTagsDoc(selectedAgencyId)
				if (payload) {
					setTopics(payload.Topic.list)
					setList(payload.Topic.list)
					setActive(payload.Topic.active)
				}
				console.log('in if statement')

				// Otherwise, tag collection already exists.
			} else {
				const tagsData = docRef.data()['Topic']
				setTopics(docRef.data()['Topic']['list'])
				setList(docRef.data()['Topic']['list'] || [])
				tagsData['active'].sort((a, b) => {
					if (a === t('Other')) return 1 // Move "Other" to the end
					if (b === t('Other')) return -1 // Move "Other" to the end
					return a.localeCompare(b) // Default sorting for other elements
				})
				// console.log(tagsData['active'])
				setActive(tagsData['active'])
			}
		} catch (error) {
			console.log(error)
		} finally {
			// console.log('Cleanup here') // cleanup, always executed
		}
	}

	/**
	 * getSourceList
	 *
	 * This asynchronous function retrieves the list of sources for the selected agency.
	 * It performs the following tasks:
	 *
	 * 1. Retrieves the 'tags' document for the selected agency.
	 * 2. Extracts and sorts the list of sources from the document.
	 * 3. Updates the `allSourcesArr` and `activeSources` states with the retrieved data.
	 *
	 * @returns {void}
	 */
	const getSourceList = async () => {
		try {
			getDoc(doc(db, 'tags', selectedAgencyId)).then((docRef) => {
				if (docRef.exists()) {
					// console.log(docRef.data())
					const tagsData = docRef.data()['Source']
					setSources(docRef.data()['Source']['active'])
					setSourceList(docRef.data()['Source']['list'])
					tagsData['active'].sort((a, b) => {
						if (a === 'Other') return 1 // Move "Other" to the end
						if (b === 'Other') return -1 // Move "Other" to the end
						return a.localeCompare(b) // Default sorting for other elements
					})
					setActiveSources(docRef.data()['Source']['active'])
				}
			})
		} catch (error) {
			console.log(error)
		}
	}

	/**
	 * Writes topic/source values into the agency tags document.
	 * Always unions into `list`; unions into `active` only when the caller asks
	 * to auto-activate (under the live-tag max).
	 *
	 * @param {string} tag - Topic to add.
	 * @param {string} source - Source to add.
	 * @param {string} agencyId - Agency tags document id.
	 * @param {boolean} activateTopic - Whether to also activate `tag`.
	 * @param {boolean} activateSource - Whether to also activate `source`.
	 */
	const updateTopicTags = async (
		tag,
		source,
		agencyId,
		activateTopic,
		activateSource,
	) => {
		try {
			const docRef = doc(db, 'tags', agencyId)
			const updates = {}

			if (tag) {
				updates['Topic.list'] = arrayUnion(tag)
				if (activateTopic) updates['Topic.active'] = arrayUnion(tag)
			}
			if (source) {
				updates['Source.list'] = arrayUnion(source)
				if (activateSource) updates['Source.active'] = arrayUnion(source)
			}

			if (Object.keys(updates).length === 0) return

			await updateDoc(docRef, updates)
			console.log('Tags updated successfully')
		} catch (error) {
			console.error('Error updating tags:', error.message)
		}
	}

	/**
	 * handleOtherTopicChange
	 *
	 * This function handles the change event for the custom topic input.
	 * It performs the following tasks:
	 *
	 * 1. Updates the `otherTopic` and `selectedTopic` states with the value entered by the user.
	 *
	 * @param {Event} e - The change event triggered when the user enters a custom topic.
	 */
	const handleOtherTopicChange = (e) => {
		setOtherTopic(e.target.value)
		setSelectedTopic(e.target.value)
		clearFieldError('topic')
	}

	/**
	 * handleOtherSourceChange
	 *
	 * This function handles the change event for the custom source input.
	 * It performs the following tasks:
	 *
	 * 1. Updates the `otherSource` and `selectedSource` states with the value entered by the user.
	 *
	 * @param {Event} e - The change event triggered when the user enters a custom source.
	 */
	const handleOtherSourceChange = (e) => {
		setOtherSource(e.target.value)
		setSelectedSource(e.target.value)
		clearFieldError('source')
	}

	const handleLabelChange = (e) => {
		setSelectedLabel(e.value)
		if (e.value === OTHER_LABEL) {
			setOtherLabelDraft('')
		}
		clearFieldError('label')
	}

	const handleOtherLabelChange = (e) => {
		setOtherLabelDraft(e.target.value)
		clearFieldError('label')
	}

	const handleNewReport = async (e) => {
		e.preventDefault()
		setSubmitError('')

		const allErrors = validateForm()
		setErrors(allErrors)

		if (Object.keys(allErrors).length > 0) {
			scrollToFirstError(allErrors)
			return
		}

		setIsSubmitting(true)
		try {
			const uploadedImageURLs = await uploadImages(images)
			await saveReport(uploadedImageURLs)
			setNewReportModal(false)
		} catch (err) {
			console.error('Failed to save report:', err)
			setSubmitError(
				t('saveFailed', {
					defaultValue: 'Failed to save report. Please try again.',
				}),
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	/**
	 * useEffect hook - Fetch all agencies and the agency associated with the current user when the component mounts.
	 *
	 * This hook runs only once, when the component first mounts. It performs the following tasks:
	 *
	 * 1. Calls `getAllAgencies` to retrieve and set the list of all available agencies.
	 * 2. Calls `getAgencyForUser` to find and set the agency that the current user is associated with, based on their email.
	 */
	useEffect(() => {
		getAllAgencies()
		getAgencyForUser()
	}, [])

	/**
	 * useEffect hook - Fetch topics and sources when the selected agency changes.
	 *
	 * This hook runs whenever the `selectedAgency` state changes.
	 * It performs the following tasks:
	 *
	 * 1. If `selectedAgency` is set, it calls functions to fetch topics and sources associated with that agency.
	 * 2. Specifically, it triggers `getTopicList`, `getAllTopics`, and `getAllSources` to fetch and update the respective states.
	 */
	useEffect(() => {
		if (selectedAgency) {
			getTopicList()
			getAllTags()
		}
	}, [selectedAgency])

	/**
	 * useEffect hook - Fetch sources after topics are retrieved.
	 *
	 * This hook runs whenever the `allTopicsArr` state changes.
	 * It performs the following tasks:
	 *
	 * 1. If `selectedAgencyId` is set and topics have been retrieved, it calls `getSourceList` to fetch the sources associated with the agency.
	 */
	useEffect(() => {
		// waits to retrieve sources until topics are retrieved
		if (selectedAgencyId && allTopicsArr.length > 0) {
			// console.log(active)
			getSourceList()
		}
	}, [allTopicsArr])

	/**
	 * getAllAgencies
	 *
	 * This asynchronous function fetches the list of all agencies from the database.
	 * It performs the following tasks:
	 *
	 * 1. Retrieves all documents from the 'agency' collection.
	 * 2. Builds an array of agency names from the documents.
	 * 3. Updates the `agencies` state with the array of agency names.
	 *
	 * @returns {void}
	 */
	async function getAllAgencies() {
		// Get agency collection docs
		const agencyRef = await getDocs(collection(db, 'agency'))
		try {
			// build an array of agency names
			var arr = []
			agencyRef.forEach((doc) => {
				arr.push(doc.data()['name'])
			})
			// console.log(arr)
			// set the agencies state with the agency names
			setAgencies(arr)
		} catch (error) {
			console.log(error)
		}
	}

	/**
	 * getAllTopics
	 *
	 * This asynchronous function fetches the list of active topics for the selected agency.
	 * It performs the following tasks:
	 *
	 * 1. Checks if a `selectedAgency` is set.
	 * 2. If so, it retrieves the 'tags' document for the selected agency.
	 * 3. Extracts the list of active topics from the document and updates the `allTopicsArr` state.
	 *
	 * @returns {void}
	 */
	async function getAllTopics() {
		if (selectedAgency == '') {
			setTopics([])
		} else {
			const topicDoc = doc(db, 'tags', selectedAgencyId)
			const topicRef = await getDoc(topicDoc)
			const topics = topicRef.get('Topic')['active']
			setTopics(topics)
		}
	}

	/**
	 * getAllSources
	 *
	 * This asynchronous function fetches the list of active sources for the selected agency.
	 * It performs the following tasks:
	 *
	 * 1. Checks if a `selectedAgency` is set.
	 * 2. If so, it retrieves the 'tags' document for the selected agency.
	 * 3. Extracts the list of active sources from the document and updates the `allSourcesArr` state.
	 *
	 * @returns {void}
	 */
	async function getAllSources() {
		if (selectedAgency == '') {
			setSources([])
		} else {
			const sourceDoc = doc(db, 'tags', selectedAgencyId)
			const sourceRef = await getDoc(sourceDoc)
			const sources = sourceRef.get('Source')['active']
			setSources(sources)
		}
	}

	// combo and run them in parallel instead of sequentially
	async function getAllTags() {
		if (selectedAgency === '') {
			setTopics([])
			setSources([])
			setActiveLabels([])
			setAgencyLabelColors({})
		} else {
			const docRef = doc(db, 'tags', selectedAgencyId)
			const docSnap = await getDoc(docRef)
			if (docSnap.exists()) {
				const topicData = docSnap.get('Topic')['active']
				const sourceData = docSnap.get('Source')['active']
				const labelData = docSnap.get('Labels')?.active || []
				setTopics(topicData)
				setSources(sourceData)
				setActiveLabels(labelData)
				setAgencyLabelColors(docSnap.get('Labels')?.colors || {})
			} else {
				setActiveLabels(DEFAULT_AGENCY_LABELS)
				setAgencyLabelColors({})
			}
		}
	}

	/**
	 * Closes the modal immediately, or prompts if the form has unsaved changes.
	 */
	const handleNewReportModalClose = requestClose

	const topicOptions = allTopicsArr.map((topic) => ({
		label: t('topics.' + stripTopicsKeyPrefix(topic), topic),
		value: topic,
	}))

	const topicSelectValue =
		topicOptions.find((o) => o.value === selectedTopic) ??
		(selectedTopic
			? {
					label: t(
						'topics.' + stripTopicsKeyPrefix(selectedTopic),
						selectedTopic,
					),
					value: selectedTopic,
				}
			: null)

	const sourceOptions = allSourcesArr.map((source) => ({
		label: t('sources.' + stripSourcesKeyPrefix(source), source),
		value: source,
	}))

	const sourceSelectValue =
		sourceOptions.find((o) => o.value === selectedSource) ??
		(selectedSource
			? {
					label: t(
						'sources.' + stripSourcesKeyPrefix(selectedSource),
						selectedSource,
					),
					value: selectedSource,
				}
			: null)

	const labelOptions = buildLabelOptions(activeLabels).map((label) => ({
		label,
		value: label,
	}))

	const labelSelectValue =
		labelOptions.find((o) => o.value === selectedLabel) ??
		(selectedLabel ? { label: selectedLabel, value: selectedLabel } : null)

	const hasFieldErrors = Object.keys(errors).length > 0

	return (
		<div className="bk-white h-full w-full">
			<div
				className="fixed inset-0 z-[9999] bg-black bg-opacity-50 overflow-y-auto"
				onClick={handleNewReportModalClose}>
				<div className="flex min-h-full justify-center items-start p-4 md:p-6">
					<div
						onClick={(e) => {
							e.stopPropagation()
						}}
						className="flex flex-col bg-white w-full max-h-[calc(100dvh-2rem)] overflow-y-auto py-10 px-10 md:w-10/12 lg:w-8/12 xl:max-w-4xl rounded-2xl">
						<div className="flex justify-between items-start w-full mb-5">
							<div className="text-md font-bold text-blue-600 tracking-wide">
								<Typography variant='h5'>{t('add_report')}</Typography>
							</div>
							<button
								onClick={handleNewReportModalClose}
								className="text-gray-800">
								<IoClose size={25} />
							</button>
						</div>
						<form noValidate onSubmit={handleNewReport}>
							{hasFieldErrors && (
								<div
									role="alert"
									className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
									{t('formErrorsSummary', {
										defaultValue:
											'Please fix the highlighted fields below.',
									})}
								</div>
							)}
							<div className="mt-4 mb-0.5">
								<FormInput
									id="title"
									type="text"
									label={t('add_title')}
									onChange={handleTitleChange}
									value={title}
								/>
								<FieldError message={errors.title} />
							</div>

							<div className="mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-4">
								<div>
									<FormSelect
										id="state"
										label={t('state_text')}
										value={data.state}
										options={State.getStatesOfCountry(data.country)}
										getOptionLabel={(options) => options['name']}
										getOptionValue={(options) => options['name']}
										onChange={handleStateChange}
									/>
									<FieldError message={errors.state} />
								</div>

								<div>
									<FormSelect
										id="city"
										label={t('city_text')}
										value={data.city}
										options={City.getCitiesOfState(
											data.state?.countryCode,
											data.state?.isoCode,
										)}
										getOptionLabel={(options) => options['name']}
										getOptionValue={(options) => options['name']}
										onChange={handleCityChange}
									/>
									<FieldError message={errors.city} />
								</div>
							</div>

							<div className="mt-4 grid grid-cols-1 md:grid-cols-2 md:gap-4">
								<div>
									<FormSelect
										id="topic-selection"
										label={t('topic')}
										options={topicOptions}
										onChange={handleTopicChange}
										value={topicSelectValue}
									/>
									<FieldError message={errors.topic} />
									{showOtherTopic && (
										<div className="mt-4">
											<FormInput
												id="topic-other"
												type="text"
												label={t('specify_topic')}
												onChange={handleOtherTopicChange}
												value={otherTopic}
											/>
										</div>
									)}
								</div>

								<div>
									<FormSelect
										id="source-selection"
										label="Source"
										options={sourceOptions}
										onChange={handleSourceChangeOther}
										value={sourceSelectValue}
									/>
									<FieldError message={errors.source} />
									{showOtherSource && (
										<div className="mt-4">
											<FormInput
												id="source-other"
												type="text"
												label={t('source')}
												onChange={handleOtherSourceChange}
												value={otherSource}
											/>
										</div>
									)}
								</div>
							</div>

							<div className="mt-4 mb-0.5">
								<FormSelect
									id="label-selection"
									label={t('label_optional')}
									options={labelOptions}
									onChange={handleLabelChange}
									value={labelSelectValue}
									formatOptionLabel={(option) => (
										<LabelOptionWithDot
											label={option.label}
											agencyLabelColors={agencyLabelColors}
										/>
									)}
								/>
								{selectedLabel === OTHER_LABEL && (
									<div className="mt-4 mb-0.5">
										<FormInput
											id="label-other"
											type="text"
											label={t('custom_label', {
												max: CUSTOM_LABEL_MAX_LENGTH,
											})}
											onChange={handleOtherLabelChange}
											value={otherLabelDraft}
											maxLength={CUSTOM_LABEL_MAX_LENGTH}
										/>
										<FieldError message={errors.label} />
									</div>
								)}
							</div>
							<section className="mt-4 rounded-xl border border-slate-200 bg-sky-300 px-4 py-6 md:px-6">
								<Typography variant='h6' className="mb-2">
									{t('detailed')}
								</Typography>
								{/* Link 1 */}
								<div className="mb-4">
									<FormInput
										id="link"
										type="url"
										label={t('linkFirst')}
										onChange={(e) => {
											setLink(e.target.value)
											clearFieldError('content')
											clearFieldError('link')
										}}
										value={link}
									/>
									<FieldError message={errors.link} />
								</div>
								{/* Link 2 */}
								<div className="mb-4">
									<FormInput
										id="secondLink"
										type="url"
										label={t('second_link')}
										onChange={(e) => {
											setSecondLink(e.target.value)
											clearFieldError('secondLink')
										}}
										value={secondLink}
									/>
									<FieldError message={errors.secondLink} />
								</div>
								{/* Detailed */}
								<div className="mb-4">
									<FormTextarea
										id="detail"
										label={t('detailed')}
										resizable
										onChange={(e) => {
											setDetail(e.target.value)
											clearFieldError('content')
										}}
										value={detail}
										rows={5}
									/>
								</div>
								<FieldError message={errors.content} />
								{/* Media Upload */}
								<MediaUploadField
									id="multiple_files"
									inputRef={imgPicker}
									onChange={handleImageChange}
									onRemoveFile={handleRemoveImage}
									files={images}
									label={t('imageBtn')}
									actionText={t('choose_files')}
								/>
							</section>
							<div className="mt-3 sm:mt-6">
								<FieldError message={submitError} />
								<button
									className="w-full bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
									type="submit"
									disabled={isSubmitting}>
									{isSubmitting ? t('createReport') + '…' : t('createReport')}
								</button>
								<div className='flex items-center justify-center gap-2 pt-4'>
									<Typography className='uppercase text-xs font-bold' color='gray'>Agency:</Typography>
									<Typography className='uppercase text-xs font-medium' color='gray'>
										{selectedAgency}
									</Typography>
								</div>
							</div>
						</form>
					</div>
				</div>
				{showCloseConfirm && (
					<ConfirmModal
						func={confirmDiscardAndClose}
						title={t('discardReportTitle', {
							defaultValue: 'Discard this report?',
						})}
						subtitle={t('discardReportSubtitle', {
							defaultValue:
								'You have unsaved changes. If you close now, your work will be lost.',
						})}
						CTA={t('discardReportCTA', { defaultValue: 'Discard' })}
						closeModal={setShowCloseConfirm}
					/>
				)}
			</div>
		</div>
	)
}

export default AgencyReportModal
