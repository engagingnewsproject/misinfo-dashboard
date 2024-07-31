import React, { useState, useEffect, useRef } from 'react'
import { IoMdArrowRoundForward, IoMdArrowRoundBack } from 'react-icons/io'
import { BiCheckCircle, BiXCircle } from 'react-icons/bi'
import {
	setDoc,
	getDoc,
	doc,
	collection,
	getDocs,
	query,
	where,
} from 'firebase/firestore'
import {
	getStorage,
	ref,
	getDownloadURL,
	uploadBytesResumable,
} from 'firebase/storage'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { State, City } from 'country-state-city'
import Link from 'next/link'
import moment from 'moment'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import ConfirmModal from './modals/ConfirmModal'
import { IoMdRefresh, IoIosInformationCircle } from 'react-icons/io'
import globalStyles from '../styles/globalStyles'
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
	ListItemPrefix,
} from '@material-tailwind/react'

import AgencySelector from './partials/report/AgencySelector'
import TopicSelector from './partials/report/TopicSelector'
import SourceSelector from './partials/report/SourceSelector'
import ImageUploader from './partials/report/ImageUploader'

const ReportSystem = ({
	reportSystem,
	setReportSystem,
	reminderShow,
	onChangeCheckbox,
	onReminderStart,
	onReportSystemPrevStep,
	disableReminder,
}) => {
	// used for Spanish translations
	const { t, i18n } = useTranslation('NewReport')
	const { user } = useAuth()
	const [key, setKey] = useState(self.crypto.randomUUID())
	const [data, setData] = useState({ country: 'US', state: null, city: null })
	const [userData, setUserData] = useState(null)
	const storage = getStorage()
	const [reportId, setReportId] = useState('')
	const imgPicker = useRef(null)
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([])
	const [update, setUpdate] = useState(false)
	const [title, setTitle] = useState('')
	const [titleError, setTitleError] = useState(false)
	const [link, setLink] = useState('')
	const [secondLink, setSecondLink] = useState('')
	const [detail, setDetail] = useState('')
	const [detailError, setDetailError] = useState(false)
	const [allTopicsArr, setAllTopicsArr] = useState([])
	const [agencies, setAgencies] = useState([])
	const [selectedAgency, setSelectedAgency] = useState('')
	const [agencyID,setSelectedAgencyID] = useState('')
	
	const [selectedTopic, setSelectedTopic] = useState('')
	const [sources, setSources] = useState([])
	const [selectedSource, setSelectedSource] = useState('')

	const [showForwardArrow, setShowForwardArrow] = useState(false)

	const [errors, setErrors] = useState({})
	const [showOtherTopic, setShowOtherTopic] = useState(false)
	const [showOtherSource, setShowOtherSource] = useState(false)
	const [otherTopic, setOtherTopic] = useState('')
	const [otherSource, setOtherSource] = useState('')
	const [list, setList] = useState([])
	const [sourceList, setSourceList] = useState([])
	const [active, setActive] = useState([])
	const [activeSources, setActiveSources] = useState([])
	const [reportResetModal, setReportResetModal] = useState(false)
	const formRef = useRef(null)

	const defaultTopics = ['Health', 'Other', 'Politics', 'Weather'] // tag system 1
	const defaultSources = ['Newspaper', 'Other', 'Social', 'Website'] // tag system 2
	const defaultLabels = ['Important', 'Flagged'] // tag system 3

	// On page load (mount), update the tags from firebase
	useEffect(() => {
		getUserData()
	}, [])


	const getUserData = async () => {
		console.log('Fetching user data...')
		const response = await getDoc(doc(db, 'mobileUsers', user.accountId))
		console.log('User data fetched:', response.data())
		setUserData(response.data())
	}
	async function getAllAgencies() {
		// Get agency collection docs
		const agencyRef = await getDocs(collection(db, 'agency'))
		try {
			// build an array of agency names
			var arr = []
			agencyRef.forEach((doc) => {
				// console.log("doc state is " +doc.data()['state'] )
				// console.log("user location is " +userData?.state?.name )
				if (doc.data()['state'] == userData?.state?.name) {
					arr.push(doc.data()['name'])
				}
			})
			// set the agencies state with the agency names
			setAgencies(arr)
		} catch (error) {
			console.log(error)
		}
	}
	// Get topics
	async function getAllTopics() {
		try {
			// console.log("Current agency's ID is " + agencyID)
			let docRef = await getDoc(doc(db, 'tags', agencyID))
			// TODO: test to make sure not null

			// create tags collection if current agency does not have one
			if (!docRef.exists()) {
				// console.log("Need to create tag collection for agency. ")
				const defaultTopics = ['Health', 'Other', 'Politics', 'Weather'] // tag system 1
				const defaultSources = ['Newspaper', 'Other', 'Social', 'Website'] // tag system 2
				const defaultLabels = ['Important', 'Flagged'] // tag system 3

				// reference to tags collection
				const myDocRef = doc(db, 'tags', agencyID)
				setAllTopicsArr(defaultTopics)
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

				// Otherwise, tag collection already exists.
			} else {
				const tagsData = docRef.data()['Topic']
				setAllTopicsArr(docRef.data()['Topic']['active'])
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
			console.log('Cleanup here'); // cleanup, always executed
		}
	}
	// Get sources
	async function getAllSources() {
    if (!agencyID) {
        console.log("Agency ID is not set.");
        return; // Exit the function if agencyID is not set
    }
    // console.log('Fetching sources for agency ID:', agencyID);
    const sourceDoc = doc(db, 'tags', agencyID);
    try {
        const sourceRef = await getDoc(sourceDoc);
        const sources = sourceRef.exists() ? sourceRef.data()['Source']['active'] : [];
        // console.log('Sources fetched:', sources);
        setSources(sources);
    } catch (error) {
        console.error("Failed to fetch sources:", error);
    }
	}

	useEffect(() => {
		if (update) {
			handleUpload()
		}
	},[update])
	
	useEffect(() => {
		console.log('all topics array', allTopicsArr)
		if (reportSystem >= 2) {
			getAllSources()
		}
	}, [allTopicsArr])

	// When agency is selected, keep track of agency ID
	useEffect(() => {
		if (selectedAgency != '') {
			console.log('selectedAngency is', selectedAgency);
			const agencyCollection = collection(db, 'agency')
			// If current user is an agency user, determine which agency
			const q = query(
				agencyCollection,
				where('name', '==', selectedAgency),
				where('state', '==', userData.state.name),
			)
			let agencyId
			getDocs(q).then((querySnapshot) => {
				querySnapshot.forEach((docAgency) => {
					// Set initial values
					// console.log("im here")
					agencyId = docAgency.id
					console.log(agencyId)
					setSelectedAgencyID(agencyId)
					// console.log(agencyId)
					const docRef = doc(db, 'tags', agencyId)
					getDoc(docRef).then((docSnap) => {
						// TODO: test to make sure not null

						// create tags collection if current agency does not have one
						if (!docSnap.exists()) {
							// reference to tags collection
							const tagsCollection = collection(db, 'tags')

							const myDocRef = doc(tagsCollection, agencyId)

							// create topics document for the new agency
							setDoc(myDocRef, {
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
						} else {
							console.log('Tags collection for this agency exists.')
						}
					})
				})
			})
		}
	}, [selectedAgency])

	useEffect(() => {
		if (userData) {
			getAllAgencies()
		}
	}, [userData])

	useEffect(() => {
		if (agencyID) {
			getAllTopics()
		}
	}, [agencyID])

	const handleImageChange = (image) => {
		// Image upload:
		// (https://github.com/honglytech/reactjs/blob/react-firebase-multiple-images-upload/src/index.js,
		// https://www.youtube.com/watch?v=S4zaZvM8IeI)
		// console.log('handle image change run');
		for (let i = 0; i < image.target.files.length; i++) {
			const newImage = image.target.files[i]
			setImages((prevState) => [...prevState, newImage])
			setUpdate(!update)
		}
	}
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
					// console.log(snapshot);
				},
				(error) => {
					console.log(error)
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
						// console.log('File available at', downloadURL);
						setImageURLs((prev) => [...prev, downloadURL])
					})
				},
			)
		})
		Promise.all(promises).catch((err) => console.log(err))
	}
	const handleTopicChange = (topic) => {
		if (topic.includes('Other')) {
			setSelectedTopic('')
			setShowOtherTopic(true)
		} else {
			setShowOtherTopic(false)
			setSelectedTopic(topic)
			setShowForwardArrow(true) // Show the arrow when a topic is selected
		}
	}
	const handleOtherTopicChange = (topicOther) => {
		setOtherTopic(topicOther.target.value)
		setSelectedTopic(topicOther.target.value)
	}
	const handleSourceChange = (source) => {
		if (source.includes('Other')) {
			setSelectedSource('')
			setShowOtherSource(true)
		} else {
			setShowOtherSource(false)
			setSelectedSource(source)
			setShowForwardArrow(true) // Show the arrow when a topic is selected
		}
	}
	const handleOtherSourceChange = (sourceOther) => {
		setOtherSource(sourceOther.target.value)
		setSelectedSource(sourceOther.target.value)
	}
	const addNewTag = (tag, source, agencyId) => {
		let topicArr = list
		let sourceArr = sourceList
		topicArr.push(tag)
		sourceArr.push(source)
		setList(topicArr)
		setSourceList(sourceArr)
		updateTopicTags(list, agencyId, sourceList)
	}
	const updateTopicTags = async (topicList, agencyId, sourceList) => {
		const docRef = await getDoc(doc(db, 'tags', agencyId))
		const updatedDocRef = await setDoc(doc(db, 'tags', agencyId), {
			...docRef.data(),
			['Topic']: {
				list: topicList,
				active: active,
			},
			['Source']: {
				list: sourceList,
				active: activeSources,
			},
		})
		return updatedDocRef
	}
	const handleChange = (e) => {
		// console.log(e.target.id)
		if (titleError) {
			e.target.id == 'title' && setTitleError(false)
		} else if (detailError) {
			e.target.id == 'link' ||
				'multiple_files' ||
				('detail' && setTitleError(false))
		}
		// console.log('REPORT VALUE CHANGED: ' + e.target.id + ': ' + e.target.value);
	}
	const handleRefresh = () => {
		setKey(self.crypto.randomUUID())
		setReportResetModal(false)
		setReportSystem(0)
	}

	// handle form submit
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		console.log('Submitting form...')

		const allErrors = {}
		let isValid = true // Flag to check if form data is valid

		// Validate form fields
		if (!title) {
			console.log('Validation error: Title is required.')
			setTitleError(true)
			allErrors.title = t('titleRequired')
			isValid = false
		}

		if (images.length === 0 && !detail && !link) {
			console.log('Validation error: Image, detail and links are required.')
			setDetailError(true)
			allErrors.detail = t('atLeast')
			isValid = false
		}

		setErrors(allErrors)

		if (!isValid) {
			console.log('Form validation failed with errors:', allErrors)
			return
		}
		try {
			// Assume saveReport is an async function
			await saveReport(imageURLs) // You might want to ensure saveReport is defined and handled properly
			console.log('Form submitted and data saved successfully.')

			setReportSystem(7) // Advance the report system state on successful save
			console.log('Report saved successfully.')
		} catch (error) {
			console.error('Error during form submission:', error)
		} finally {
			resetForm() // Reset the form regardless of the outcome
		}
	}

	// Save Report
	const saveReport = async (imageURLs) => {
		console.log('Saving report with image URLs:', imageURLs)

		const newReportRef = doc(collection(db, 'reports'))
		setReportId(newReportRef.id) // set report id
		try {
			await setDoc(newReportRef, {
				userID: user.accountId,
				state: userData.state.name,
				city: userData.city.name,
				agency: selectedAgency,
				title: title,
				link: link,
				secondLink: secondLink,
				images: imageURLs,
				detail: detail,
				createdDate: moment().toDate(),
				isApproved: false,
				read: false,
				topic: selectedTopic,
				hearFrom: selectedSource,
			})
			console.log('Report saved successfully with ID:', newReportRef.id)
			addNewTag(selectedTopic, selectedSource, agencyID)
		} catch (error) {
			console.error('Failed to save report:', error)
		}
	}

	const resetForm = () => {
		setTitle('')
		setLink('')
		setSecondLink('')
		setDetail('')
		setSelectedTopic('')
		setSelectedSource('')
		setSelectedAgency('')
		setImageURLs([])
		setImages([])
		setErrors({})
		setShowOtherTopic(false)
		setShowOtherSource(false)
		setOtherTopic('')
		setOtherSource('')
		formRef.current.reset()
	}

	// Elements
	const ForwardArrow = () => {
		return (
			<IconButton
				variant="text"
				color="blue"
				className={`${showForwardArrow ? 'visible' : 'hidden'}`}
				onClick={() => {
					setReportSystem(reportSystem + 1)
					setShowForwardArrow(false)
				}}>
				<IoMdArrowRoundForward size={30} />
			</IconButton>
		)
	}
	const BackArrow = () => {
		return (
			<IconButton
				variant="text"
				color="blue-gray"
				onClick={onReportSystemPrevStep}>
				<IoMdArrowRoundBack size={30} />
			</IconButton>
		)
	}
	const RefreshButton = () => {
		return (
			<IconButton
				variant="text"
				color="blue-gray"
				onClick={() => setReportResetModal(true)}
				type="button">
				<IoMdRefresh size={30} />
			</IconButton>
		)
	}
	// Effects
	useEffect(() => {
		console.log('Report system updated to:', reportSystem)
	}, [reportSystem])

	useEffect(() => {
		console.log('User data updated:', userData)
	}, [userData])

	useEffect(() => {
		if (selectedAgency) {
			console.log(
				'Selected agency changed, fetching sources for:',
				selectedAgency,
			)
			getAllSources()
		}
	}, [selectedAgency])

	return (
		<div className={globalStyles.sectionContainer} key={key}>
			<>
				{reminderShow != false && reportSystem == 1 && (
					<div className={globalStyles.viewWrapperCenter}>
						<Image
							src="/img/reminder.png"
							width={156}
							height={120}
							alt="reminderShow"
							className="object-cover w-auto"
						/>
						<Typography variant="h5" color="blue">
							{t('reminder')}
						</Typography>
						<Typography>{t('description')}</Typography>
						<Typography>{t('example')}</Typography>
						<List>
							<ListItem disabled={true} className="opacity-100">
								<ListItemPrefix>
									<BiCheckCircle size={25} color="green" />
								</ListItemPrefix>
								<Typography color="black">{t('correct')}</Typography>
							</ListItem>
							<ListItem disabled={true} className="opacity-100">
								<ListItemPrefix>
									<BiXCircle size={25} color="red" />
								</ListItemPrefix>
								<Typography color="black">{t('incorrect')}</Typography>
							</ListItem>
						</List>
						<Button onClick={onReminderStart} color="blue">
							{t('start')}
						</Button>
						{/* DO NOT SHOW AGAIN CHECKBOX */}
						<div className="inline-flex items-center">
							<Checkbox
								onChange={onChangeCheckbox}
								checked={disableReminder}
								label={t('noShow')}
								color="blue"
							/>
						</div>
					</div>
				)}
			</>
			{reportSystem >= 2 && reportSystem <= 6 && (
				<div className={globalStyles.form.wrap}>
					<form
						onSubmit={handleFormSubmit}
						className={globalStyles.form.element}
						ref={formRef}
						id={key}>
						{showForwardArrow && (
							<div className="absolute bottom-4 right-4 sm:right-6">
								<ForwardArrow />
							</div>
						)}
						{/* Agency */}
						{reportSystem === 2 && (
							<div className={globalStyles.form.viewWrapper}>
								<AgencySelector
									agencies={agencies}
									selectedAgency={selectedAgency}
									handleAgencyChange={setSelectedAgency}
									showForwardArrow={setShowForwardArrow}
								/>
							</div>
						)}
						{/* Topic tag */}
						{reportSystem == 3 && (
							<div className={globalStyles.form.viewWrapper}>
								<Typography variant="h5">{t('about')}</Typography>
								<Card>
									<List>
										<TopicSelector
											topics={[
												...allTopicsArr.filter((topic) => topic !== 'Other'),
												...allTopicsArr.filter((topic) => topic === 'Other'),
											]}
											selectedTopic={selectedTopic}
											handleTopicChange={handleTopicChange}
											showOtherTopic={showOtherTopic}
											handleOtherTopicChange={handleOtherTopicChange}
											otherTopic={otherTopic}
										/>
									</List>
								</Card>
								{errors.topic && selectedTopic === '' && (
									<span className="text-red-500">{errors.topic}</span>
								)}
							</div>
						)}
						{/* Source tag */}
						{reportSystem == 4 && (
							<div className={globalStyles.form.viewWrapper}>
								<Typography variant="h5">{t('where')}</Typography>
								<Card>
									<List>
										<SourceSelector
											sources={[
												...sources.filter((source) => source !== 'Other'),
												...sources.filter((source) => source === 'Other'),
											]}
											selectedSource={selectedSource}
											handleSourceChange={handleSourceChange}
											showOtherSource={showOtherSource}
											handleOtherSourceChange={handleOtherSourceChange}
											otherSource={otherSource}
											t={t}
										/>
									</List>
								</Card>
								{errors.source && selectedSource === '' && (
									<span className="text-red-500">{errors.source}</span>
								)}
							</div>
						)}
						{/* Details & Submit */}
						{reportSystem == 5 && (
							<div className="flex flex-col gap-6 mb-1">
								<Typography variant="h5">{t('share')}</Typography>
								{/* DESCRIPTION - details */}
								<div className="block">
									<Typography variant="h6" color="blue">
										{t('detail')}
									</Typography>
									<Typography>{t('detailDescription')}</Typography>
								</div>
								{/* TITLE */}
								<div className="block">
									<Input
										variant="outlined"
										color="gray"
										id="title"
										type="text"
										label={t('title')}
										onChange={(e) => setTitle(e.target.value)}
										value={title}
										error={titleError}
									/>
									<Typography
										variant="small"
										color={titleError ? 'red' : 'gray'}
										className="mt-2 flex items-start gap-1 font-normal">
										<IoIosInformationCircle size="15" className="mt-1" />
										{t('provide_title')} {t('max')}
									</Typography>
									{detailError && (
										<Typography color="red" className="mt-2">
											{t('atLeast')}
										</Typography>
									)}
								</div>
								{/* LINKS */}
								<div className="block">
									<Input
										variant="outlined"
										color="gray"
										label={t('linkFirst')}
										id="link"
										type="text"
										onChange={(e) => setLink(e.target.value)}
										value={link}
									/>
									{!link && (
										<Typography
											variant="small"
											color="gray"
											className="mt-2 flex items-start gap-1 font-normal">
											<IoIosInformationCircle size="15" className="mt-1" />
											{t('example')} https://
										</Typography>
									)}
									{/* Link 02 */}
									{link && (
										<>
											<div className="mt-2">
												<Input
													variant="outlined"
													color="gray"
													label={t('linkFirst')}
													id="secondLink"
													type="text"
													onChange={(e) => setSecondLink(e.target.value)}
													value={secondLink}
												/>
											</div>
											<Typography
												variant="small"
												color="gray"
												className="mt-2 flex items-start gap-1 font-normal">
												<IoIosInformationCircle size="15" className="mt-1" />
												{t('example')} https://
											</Typography>
										</>
									)}
								</div>
								{/* IMAGE UPLOAD */}
								<ImageUploader
									handleImageChange={handleImageChange}
									imgPicker={imgPicker}
									imageDescription="imageDescription"
								/>

								{/* DESCRIBE IN DETAIL */}
								<div className="block">
									<Textarea
										type="textarea"
										id="detail"
										onChange={(e) => setDetail(e.target.value)}
										value={detail}
										label={t('detailed')}
										rows={8}
									/>
									<Typography
										variant="small"
										color="gray"
										className="mt-2 flex items-start gap-1">
										<IoIosInformationCircle size="15" className="mt-1" />
										{t('detailedDescription')}
									</Typography>
								</div>
								{/* SUBMIT BUTTON */}
								<button className={globalStyles.button.md_block} type="submit">
									{t('submit')}
								</button>
							</div>
						)}
						{/* REFRESH REPORT BUTTON */}
						{reportSystem >= 2 && (
							<div className="flex justify-center">
								<div className="w-50 opacity-50 hover:opacity-100 mt-2 sm:mt-4">
									<RefreshButton />
								</div>
							</div>
						)}
						{/* BACK ICON */}
						{reportSystem > 0 && reportSystem < 7 && (
							<div className="absolute opacity-50 hover:opacity-100 bottom-4 left-4 sm:left-6">
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
							<div className={globalStyles.form.viewWrapper + ' items-center'}>
								<Image
									src="/img/reportSuccess.png"
									width={156}
									height={120}
									alt="report success"
									className="object-cover w-auto"
								/>
								<div className={globalStyles.heading.h1.black}>
									{t('thankyou')}
								</div>
								<div className="text-center">{t('thanksText')}</div>
								<button
									onClick={() => setReportSystem(reportSystem + 1)}
									className={globalStyles.button.md}>
									{t('view')}
								</button>
							</div>
						)}
						{/* View Report */}
						{reportSystem == 7 && (
							<Card className={globalStyles.form.view}>
								{/* Title */}
								<div className="mb-6 p-0">
									<Typography variant="h6" color="blue">
										{t('title_text')}
									</Typography>
									<Typography>{title}</Typography>
								</div>
								{/* Links */}
								<div className="mb-6 p-0">
									<Typography variant="h6" color="blue">
										{t('links')}
									</Typography>
									<Typography>
										{link || secondLink != '' ? (
											<>
												{link}
												<br></br>
												{secondLink}
											</>
										) : (
											t('noLinks')
										)}
									</Typography>
								</div>
								{/* Image upload */}
								<div className="mb-6 p-0">
									<Typography variant="h6" color="blue">
										{t('image')}
									</Typography>
									<div className="flex w-full overflow-y-auto">
										{imageURLs.map((image, i = self.crypto.randomUUID()) => {
											return (
												<div className="flex mr-2" key={i}>
													<Link href={image} target="_blank">
														<Image
															src={image}
															width={100}
															height={100}
															alt="image"
															className="object-cover w-auto"
														/>
													</Link>
												</div>
											)
										})}
									</div>
								</div>
								{/* Details */}
								<div className="mb-6 p-0">
									<Typography variant="h6" color="blue">
										{t('detailed')}
									</Typography>
									<Typography>
										{detail ? detail : `No description provided.`}
									</Typography>
								</div>
								<Button color="blue" onClick={() => setReportSystem(0)}>
									{t('backReports')}
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
					title="Are you sure you want to reset the report?"
					subtitle="You cannot undo this action."
					CTA="Reset Report"
					closeModal={() => setReportResetModal(false)}
				/>
			)}
		</div>
	)
}
export default ReportSystem
