import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { IoClose } from 'react-icons/io5'
import { useAuth } from '../../context/AuthContext'
import moment from 'moment'
import Image from 'next/image'
import { db } from '../../config/firebase'
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
	deleteObject,
	uploadBytesResumable,
} from 'firebase/storage'
import Select from 'react-select'
import { useTranslation } from 'next-i18next'
import { Typography } from '@material-tailwind/react'

const NewReportModal = ({
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

	const [imageList, setImageList] = useState([])
	// Get a reference to the storage service, which is used to create references in your storage bucket
	const storage = getStorage()
	const imgPicker = useRef(null)
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([])
	// const [progress, setProgress] = useState(0);
	const [update, setUpdate] = useState(false)
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
	const [reportState, setReportState] = useState(0)
	const [errors, setErrors] = useState({})

	const { t } = useTranslation('NewReport')

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
	const saveReport = (imageURLs) => {
		addDoc(dbInstance, {
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
			label: '',
			read: false,
			topic: selectedTopic,
			hearFrom: selectedSource,
		}).then(() => {
			handleNewReportSubmit() // Send a signal to ReportsSection so that it updates the list
			addNewTag(selectedTopic, selectedSource, selectedAgencyId)
		})
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
	 *    - Triggers a re-render by toggling the `update` state.
	 *
	 * @param {Event} e - The change event triggered when the user selects files.
	 */
	const handleImageChange = (e) => {
		// Image upload (https://github.com/honglytech/reactjs/blob/react-firebase-multiple-images-upload/src/index.js, https://www.youtube.com/watch?v=S4zaZvM8IeI)
		console.log('handle image change run')
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			setImages((prevState) => [...prevState, newImage])
			setUpdate(!update)
		}
	}

	/**
	 * handleUpload
	 *
	 * This function handles the upload of images to Firebase storage.
	 * It performs the following tasks:
	 *
	 * 1. Creates an empty array `promises` to store the promises returned by the upload tasks.
	 * 2. Iterates over the `images` array, where each image is uploaded to Firebase storage:
	 *    - Creates a unique storage reference for each image based on the current timestamp.
	 *    - Uses `uploadBytesResumable` to upload the image and monitors the upload state.
	 *    - Logs the upload progress, errors, and completion.
	 *    - On successful upload, retrieves the download URL for the image and adds it to the `imageURLs` state.
	 * 3. Uses `Promise.all` to ensure all uploads are completed, catching any errors in the process.
	 */
	const handleUpload = () => {
		// Image upload to firebase
		const promises = []
		images.map((image) => {
			const storageRef = ref(
				storage,
				`report_${new Date().getTime().toString()}.png`,
			)
			const uploadTask = uploadBytesResumable(storageRef, image)
			promises.push(uploadTask)
			uploadTask.on(
				'state_changed',
				(snapshot) => {
					// console.log(snapshot)
				},
				(error) => {
					console.log(error)
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
						console.log('File available at', downloadURL)
						setImageURLs((prev) => [...prev, downloadURL])
					})
				},
			)
		})

		Promise.all(promises).catch((err) => console.log(err))
	}

	// TODO: delete file option after upload
	// TODO: also. . . on report delete, delete the attached images as well
	// const handleImageDelete = (image) => {
	// console.log(image);
	//     // Create a reference to the file to delete
	//     const storageRef = ref(storage, `images/report_${new Date().getTime().toString()}-${image.name}`)

	//     // Delete the file
	//     deleteObject(storageRef).then(() => {
	//     // File deleted successfully
	//         console.log('File deleted successfully');
	//     }).catch((error) => {
	//     // Uh-oh, an error occurred!
	//     });
	// }

	const handleChange = (e) => {
		// console.log('Report value changed.');
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
          // Create default tags if they don't exist
          const defaultTopics = ['Health', 'Other', 'Politics', 'Weather']
          const defaultSources = ['Newspaper', 'Other/Otro', 'Social', 'Website']
          const defaultLabels = ["To Investigate", "Investigated: Flagged", "Investigated: Benign"]

          await setDoc(docRef, {
            Labels: { list: defaultLabels, active: defaultLabels },
            Source: { list: defaultSources, active: defaultSources },
            Topic: { list: defaultTopics, active: defaultTopics },
          })

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
	}

	/**
	 * handleTopicChange
	 *
	 * This function handles the change event for the topic selection.
	 * It performs the following tasks:
	 *
	 * 1. Updates the `selectedTopic` state with the value selected by the user.
	 * 2. If the selected topic is 'Other', it sets `showOtherTopic` to true, otherwise, it hides it.
	 * 3. Sets the report state to 5.
	 *
	 * @param {Event} e - The change event triggered when the user selects a topic.
	 */
	const handleTopicChange = (e) => {
		setSelectedTopic(e.value)
		if (e.value === t('Other')) {
			setShowOtherTopic(true)
		} else {
			setShowOtherTopic(false)
		}
		setReportState(5)
	}

	/**
	 * handleSourceChangeOther
	 *
	 * This function handles the change event for the source selection.
	 * It performs the following tasks:
	 *
	 * 1. Updates the `selectedSource` state with the value selected by the user.
	 * 2. If the selected source is 'Other', it sets `showOtherSource` to true, otherwise, it hides it.
	 * 3. Sets the report state to 6.
	 *
	 * @param {Event} e - The change event triggered when the user selects a source.
	 */
	const handleSourceChangeOther = (e) => {
		setSelectedSource(e.value)
		if (e.value === t('Other')) {
			setShowOtherSource(true)
		} else {
			setShowOtherSource(false)
		}
		setReportState(6)
	}

	/**
	 * addNewTag
	 *
	 * This function adds a new tag and source to the existing lists.
	 * It performs the following tasks:
	 *
	 * 1. Checks if the tag and source already exist in their respective arrays.
	 * 2. If the tag or source is new, it adds them to the corresponding array.
	 * 3. Updates the `list` and `sourceList` states with the updated arrays.
	 * 4. Calls `updateTopicTags` to save the updated tag and source lists.
	 *
	 * @param {string} tag - The new tag to add.
	 * @param {string} source - The new source to add.
	 * @param {string} agencyId - The ID of the agency for which to update the tags.
	 */
	const addNewTag = (tag, source, agencyId) => {
		let topicArr = list
		let sourceArr = sourceList
		if (!topicArr.includes(tag)) {
			topicArr.push(tag)
		}
		if (!sourceArr.includes(source)) {
			sourceArr.push(source)
		}
		setList(topicArr)
		setSourceList(sourceArr)
		updateTopicTags(list, agencyId, sourceList)
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
				const defaultTopics = ['Health', 'Other', 'Politics', 'Weather'] // tag system 1
				const defaultSources = ['Newspaper', 'Other/Otro', 'Social', 'Website'] // tag system 2
				const defaultLabels = ["To Investigate", "Investigated: Flagged", "Investigated: Benign"] // tag system 3

				// reference to tags collection
				const myDocRef = doc(db, 'tags', selectedAgencyId)
				setTopics(defaultTopics)
				setActive(defaultTopics['active'])

				// create topics document for the new agency
				await setDoc(myDocRef, {
					Labels: {
						list: defaultLabels,
						active: defaultLabels,
					},
					Source: {
						list: defaultSources,
						active: defaultSources,
					},
					Topic: {
						list: defaultTopics,
						active: defaultTopics,
					},
				})
				// retrieve list of topics again after creating document of tags for agency
				console.log('in if statement')

				// Otherwise, tag collection already exists.
			} else {
				const tagsData = docRef.data()['Topic']
				setTopics(docRef.data()['Topic']['list'])
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
	 * updateTopicTags
	 *
	 * This asynchronous function updates the topic and source tags for the selected agency.
	 * It performs the following tasks:
	 *
	 * 1. Retrieves the 'tags' document for the specified agency.
	 * 2. Updates the 'list' and 'active' arrays for both 'Topic' and 'Source' fields.
	 * 3. Logs success or any errors that occur during the update process.
	 *
	 * @param {Array} topicList - The list of topics to update.
	 * @param {string} agencyId - The ID of the agency whose tags are being updated.
	 * @param {Array} sourceList - The list of sources to update.
	 */
	const updateTopicTags = async (topicList, agencyId, sourceList) => {
		try {
			const docRef = doc(db, 'tags', agencyId)

			// Update the 'list' and 'active' arrays for both 'Topic' and 'Source' fields
			await updateDoc(docRef, {
				'Topic.list': arrayUnion(...topicList), // Add new topics to the 'list' array
				'Topic.active': arrayUnion(...active), // Add new topics to the 'active' array
				'Source.list': arrayUnion(...sourceList), // Add new sources to the 'list' array
				'Source.active': arrayUnion(...activeSources), // Add new sources to the 'active' array
			})

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
	}

	/**
	 * handleSubmitClick
	 *
	 * This function handles the form submission when the user creates a new report.
	 * It performs the following tasks:
	 *
	 * 1. Prevents the default form submission behavior.
	 * 2. Validates the form fields and displays an alert if any required fields are missing.
	 * 3. If the form is valid, triggers the image upload process and saves the report.
	 * 4. Closes the new report modal after the report is saved.
	 *
	 * @param {Event} e - The submit event triggered when the user submits the form.
	 */
	const handleSubmitClick = (e) => {
		e.preventDefault()
		if (!title) {
			alert(t('titleRequired'))
		} else if (images == '' && !detail && !link) {
			alert(t('atLeast'))
		} else {
			if (images.length > 0) {
				setUpdate(!update)
			}
			saveReport(imageURLs)
			setNewReportModal(false)
		}
	}

	/**
	 * handleNewReport
	 *
	 * This asynchronous function handles the form submission for creating a new report.
	 * It performs the following tasks:
	 *
	 * 1. Prevents the default form submission behavior.
	 * 2. Validates the form fields and collects any errors.
	 * 3. If there are no errors, it proceeds to call `handleSubmitClick` to save the report.
	 *
	 * @param {Event} e - The submit event triggered when the user submits the form.
	 */
	const handleNewReport = async (e) => {
		e.preventDefault()
		// TODO: Check for any errors
		const allErrors = {}
		if (data.state == null) {
			console.log('state error')
			allErrors.state = t('state')
		}
		if (data.city == null) {
			// Don't display the report, show an error message
			console.log('city error')
			allErrors.city = t('city')
			if (
				data.state != null &&
				City.getCitiesOfState(data.state?.countryCode, data.state?.isoCode)
					.length == 0
			) {
				console.log('No cities here')
				delete allErrors.city
			}
		}
		if (selectedSource == '') {
			console.log('No source error')
			allErrors.source = t('source')
		}
		// TODO: some topics show up in dropdown as "topics.News" or "topics.Social"
		if (selectedTopic == '') {
			console.log('No topic selected')
			allErrors.topic = t('specify_topic')
		}
		if (images == '') {
			console.log('no images')
		}
		setErrors(allErrors)
		console.log(allErrors.length + 'Error array length')

		if (Object.keys(allErrors).length == 0) {
			handleSubmitClick(e)
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
	 * useEffect hook - Handle image upload when the `update` state changes.
	 *
	 * This hook runs whenever the `update` state changes.
	 * It performs the following tasks:
	 *
	 * 1. If `update` is set to true, it triggers the image upload process by calling `handleUpload`.
	 */
	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update])

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
		} else {
			const docRef = doc(db, 'tags', selectedAgencyId)
			const docSnap = await getDoc(docRef)
			if (docSnap.exists()) {
				const topicData = docSnap.get('Topic')['active']
				const sourceData = docSnap.get('Source')['active']
				setTopics(topicData)
				setSources(sourceData)
			}
		}
	}

	/**
	 * handleNewReportModalClose
	 *
	 * This asynchronous function handles the closing of the new report modal.
	 * It performs the following tasks:
	 *
	 * 1. Prevents the default form submission behavior.
	 * 2. Updates the `setNewReportModal` state to false, closing the modal.
	 *
	 * @param {Event} e - The event triggered when the user closes the modal.
	 */
	const handleNewReportModalClose = async (e) => {
		e.preventDefault()
		setNewReportModal(false)
	}

	return (
		<div className="bk-white h-full w-full">
			<div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-[9999]">
				<div
					onClick={handleNewReportModalClose}
					className={`flex overflow-y-auto justify-center items-center z-[1300] absolute top-6 left-0 w-full h-full`}>
					{/* <div onClick={handleNewReportModalClose} className="flex overflow-y-auto justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full"> */}
					<div
						onClick={(e) => {
							e.stopPropagation()
						}}
						className={`flex-col justify-center items-center bg-white w-full h-full py-10 px-10 z-50 md:w-8/12 md:h-auto lg:w-6/12 rounded-2xl`}>
						<div className="flex justify-between w-full mb-5">
							<div className="text-md font-bold text-blue-600 tracking-wide">
								{t('add_report')}
							</div>
							<button
								onClick={handleNewReportModalClose}
								className="text-gray-800">
								<IoClose size={25} />
							</button>
						</div>
						<form onChange={handleChange} onSubmit={handleNewReport}>
							<div className="mt-4 mb-0.5">
								<Select
									className="border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									id="state"
									type="text"
									required
									placeholder={t('state_text')}
									value={data.state}
									options={State.getStatesOfCountry(data.country)}
									getOptionLabel={(options) => {
										return options['name']
									}}
									getOptionValue={(options) => {
										return options['name']
									}}
									label="state"
									onChange={handleStateChange}
								/>
								{errors.state && data.state === null && (
									<span className="text-red-500">{errors.state}</span>
								)}
							</div>

							<div className="mt-4 mb-0.5">
								<Select
									className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									id="city"
									type="text"
									placeholder={t('city_text')}
									value={data.city}
									options={City.getCitiesOfState(
										data.state?.countryCode,
										data.state?.isoCode,
									)}
									getOptionLabel={(options) => {
										return options['name']
									}}
									getOptionValue={(options) => {
										return options['name']
									}}
									onChange={handleCityChange}
								/>
								{errors.city && data.city === null && (
									<span className="text-red-500">{errors.city}</span>
								)}
							</div>

							<div className="mt-4 mb-0.5">
								{/* 1) function: handleAgencyChange
                  <Select
                    className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="agency-selection"
                    type="text"
                    placeholder={t('agency')}
                    options={agencies.map((agency) => ({
                      label: agency, // The agency name displayed
                      value: agency, // The agency name used as the value
                    }))}
                    onChange={handleAgencyChange}
                    value={selectedAgency} // Ensure this is a string
                  />
                  {errors.agency && !selectedAgency && (
                    <span className="text-red-500">{errors.agency}</span>
                  )}
                */}
								{/* 2) function: getAgencyForUser */}
								<Typography>Agency: {selectedAgency}</Typography>
							</div>

							<div className="mt-4 mb-0.5">
								<input
									className="border-gray-300 rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									id="title"
									type="text"
									placeholder={t('add_title')}
									required
									onChange={handleTitleChange}
									value={title}
								/>
							</div>

							<div className="mt-4 mb-0.5">
								<Select
									className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									id="topic-selection"
									type="text"
									placeholder={t('topic')}
									// TODO: fix label & values
									options={allTopicsArr.map((topic) => ({
										label: t('topics.' + topic),
										value: t('topics.' + topic),
									}))}
									onChange={handleTopicChange}
									value={selectedTopic.topic}
								/>
								{errors.topic && selectedTopic === '' && (
									<span className="text-red-500">{errors.topic}</span>
								)}
								<div className="mt-4 mb-0.5">
									{showOtherTopic && (
										<div className="flex">
											<div className="mt-4 mb-0.5 text-zinc-500 pr-3">
												{t('custom_topic')}
											</div>
											<input
												id="topic-other"
												className="rounded shadow-md border-zinc-400 w-60"
												type="text"
												placeholder={t('specify_topic')}
												onChange={handleOtherTopicChange}
												value={otherTopic}
												style={{ fontSize: '14px' }}
											/>
										</div>
									)}
								</div>
							</div>
							<div className="mt-4 mb-0.5">
								<Select
									className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									id="source-selection"
									type="text"
									placeholder="Source"
									options={allSourcesArr.map((source) => ({
										label: t('sources.' + source),
										value: t('sources.' + source),
									}))}
									onChange={handleSourceChangeOther}
									value={selectedSource.hearFrom}
								/>

								{errors.source && selectedSource === '' && (
									<span className="text-red-500">{errors.source}</span>
								)}
								<div className="mt-4 mb-0.5">
									{showOtherSource && (
										<div className="flex">
											<div className="mt-4 mb-0.5 text-zinc-500 pr-3">
												{t('custom_source')}
											</div>
											<input
												id="source-other"
												className="rounded shadow-md border-zinc-400 w-60"
												type="text"
												placeholder={t('source')}
												onChange={handleOtherSourceChange}
												value={otherSource}
												style={{ fontSize: '14px' }}
											/>
										</div>
									)}
								</div>
							</div>
							<>
								<div className="mt-4 mb-0.5">{t('detailed')}</div>
								<div className="mt-4 mb-0.5">
									<input
										className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
										id="link"
										type="text"
										placeholder={t('link')}
										onChange={(e) => setLink(e.target.value)}
										value={link}
									/>
								</div>
								<div className="mt-4 mb-0.5">
									<input
										className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
										id="secondLink"
										type="text"
										placeholder={t('second_link')}
										onChange={(e) => setSecondLink(e.target.value)}
										value={secondLink}
									/>
								</div>
								<div className="mt-4 mb-0.5">
									<textarea
										className="border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
										id="detail"
										type="text"
										placeholder={t('detailed')}
										onChange={(e) => setDetail(e.target.value)}
										value={detail}
										rows="5"></textarea>
								</div>
								<div className="mt-4 mb-0.5">
									<label className="block">
										<span className="sr-only">{t('choose_files')}</span>
										<input
											className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer"
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
											<div className="relative">
												<Image
													src={url}
													key={url}
													width={100}
													height={100}
													alt={`image-upload-${i}`}
												/>
												{/* TODO: delete file after upload */}
												{/* <IoClose size={15} color='white' className='absolute top-0 right-0' onClick={handleImageDelete}/> */}
											</div>
										))}
									</div>
								</div>
							</>
							<div className="mt-3 sm:mt-6">
								<button
									className="w-full bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
									onClick={handleSubmitClick}
									type="submit">
									{t('createReport')}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default NewReportModal
