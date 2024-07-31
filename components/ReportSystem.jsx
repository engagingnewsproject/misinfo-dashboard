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
	updateDoc
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
	const [agencyID, setSelectedAgencyID] = useState('')
	const [selectedAgencyId, setSelectedAgencyId] = useState('')
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

	const [isSubmitting, setIsSubmitting] = useState(false)
	const formRef = useRef(null)

	const defaultTopics = ['Health', 'Other', 'Politics', 'Weather'] // tag system 1
	const defaultSources = ['Newspaper', 'Other', 'Social', 'Website'] // tag system 2
	const defaultLabels = ['Important', 'Flagged'] // tag system 3

	// USER
	// USER
	// USER
	const getUserData = async () => {
		if (!user) {
			console.log('User is not set.')
			return // Exit the function if user is not set
		}
		const response = await getDoc(doc(db, 'mobileUsers', user.accountId))
		// console.log('User data fetched:', response.data())
		setUserData(response.data())
	}
	useEffect(() => {
		getUserData()
	}, [])

	// AGENCIES
	// AGENCIES
	// AGENCIES
	// uses filter and map to avoid direct mutation of the array
	async function getAllAgencies() {
		const agencyRef = await getDocs(collection(db, 'agency'))
		try {
			const arr = agencyRef.docs
				.filter((doc) => doc.data()['state'] === userData?.state?.name)
				.map((doc) => doc.data()['name'])
			setAgencies(arr)
		} catch (error) {
			console.log(error)
		}
	}
	// This function is called when an agency is selected in the AgencySelector component
	const handleAgencyChange = (agency) => {
		setSelectedAgency(agency) // Update the selected agency state
		setShowForwardArrow(true) // Show the arrow when a agency is selected
	}
	// Fetch and set agency ID
	useEffect(() => {
		if (selectedAgency) {
			const agencyCollection = collection(db, 'agency')
			const q = query(
				agencyCollection,
				where('name', '==', selectedAgency),
				where('state', '==', userData.state.name),
			)

			getDocs(q).then((querySnapshot) => {
				querySnapshot.forEach((docAgency) => {
					const agencyId = docAgency.id
					setSelectedAgencyId(agencyId) // Set the agency ID state
					checkAndCreateTags(agencyId) // Check for and possibly create tags
				})
			})
		}
	}, [selectedAgency, userData])

	// Log the selectedAgencyId when it changes
	useEffect(() => {
		console.log('Selected agency name:', selectedAgency)
		console.log('Selected agency id:', selectedAgencyId)
	}, [selectedAgencyId])

	const checkAndCreateTags = (agencyId) => {
		const docRef = doc(db, 'tags', agencyId)
		getDoc(docRef).then((docSnap) => {
			if (!docSnap.exists()) {
				const tagsCollection = collection(db, 'tags')
				const myDocRef = doc(tagsCollection, agencyId)
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
	}

	// get all agencies when userData is set
	useEffect(() => {
		if (userData) {
			getAllAgencies()
		}
	}, [userData])

	// TOPICS
	// TOPICS
	// TOPICS
	useEffect(() => {
		if (selectedAgencyId) {
			getAllTopics()
		}
	}, [selectedAgencyId])

	useEffect(() => {
		console.log('Selected topic:', selectedTopic)
	}, [selectedTopic])

	async function getAllTopics() {
		console.log('Fetching topics for Agency ID:', selectedAgencyId)
		try {
			const docRef = await getDoc(doc(db, 'tags', selectedAgencyId))
			if (!docRef.exists()) {
				const defaultTopics = ['Health', 'Other', 'Politics', 'Weather']
				const defaultSources = ['Newspaper', 'Other', 'Social', 'Website']
				const defaultLabels = ['Important', 'Flagged']

				await setDoc(doc(db, 'tags', selectedAgencyId), {
					Labels: { list: defaultLabels, active: defaultLabels },
					Source: { list: defaultSources, active: defaultSources },
					Topic: { list: defaultTopics, active: defaultTopics },
				})
				setAllTopicsArr(defaultTopics)
				setActive(defaultTopics) // Assuming setActive is meant to be another state setter. Make sure it's defined.
			} else {
				const activeTopics = docRef.data()['Topic']['active']
				activeTopics.sort((a, b) => {
					if (a === t('Other')) return 1
					if (b === t('Other')) return -1
					return a.localeCompare(b)
				})
				setAllTopicsArr(activeTopics)
			}
		} catch (error) {
			console.error('Failed to fetch topics:', error)
		}
	}

	// Handlers
	const handleTopicChange = (topic) => {
		if (topic.includes('Other')) {
			setSelectedTopic('')
			setShowOtherTopic(true)
		} else {
			setSelectedTopic(topic)
			setShowOtherTopic(false)
			setShowForwardArrow(true)
		}
	}

	const handleOtherTopicChange = (event) => {
		const value = event.target.value
		setOtherTopic(value) // Assuming setOtherTopic is a state setter. Make sure it's defined.
		setSelectedTopic(value)
		setShowForwardArrow(!!value)
	}

	// SOURCES
	// SOURCES
	// SOURCES
	const fetchData = async () => {
		const tagsDocRef = doc(db, 'tags', selectedAgencyId)
		try {
			const docSnapshot = await getDoc(tagsDocRef)
			if (!docSnapshot.exists()) {
				console.log('Document does not exist:', selectedAgencyId)
				return
			}
			const data = docSnapshot.data()
			const activeTopics = data.Topic?.active || []
			const activeSources = data.Source?.active || []

			setAllTopicsArr(activeTopics)
			setSources(activeSources)
		} catch (error) {
			console.error('Failed to fetch data:', error)
		}
	}

	useEffect(() => {
		if (selectedAgencyId) {
			fetchData()
		}
	}, [selectedAgencyId])

	useEffect(() => {
		console.log('Selected source:', selectedSource)
	}, [selectedSource])

	const handleSourceChange = (source) => {
		if (source.includes('Other')) {
			setSelectedSource('')
			setShowOtherSource(true)
		} else {
			setSelectedSource(source)
			setShowOtherSource(false)
			setShowForwardArrow(true)
		}
	}

	const handleOtherSourceChange = (event) => {
		const value = event.target.value
		setOtherSource(value) // Update the state bound to the input field
		setSelectedSource(value) // Update the state that holds the currently selected source
		setShowForwardArrow(!!value) // Show or hide the forward arrow based on input presence
		setShowOtherSource(!!value) // Potentially redundant but ensures logic consistency if needed elsewhere
	}


	// MANAGE NEW TAGS
	// MANAGE NEW TAGS
	// MANAGE NEW TAGS
	const addNewTag = (tag, source) => {
		const updatedTopics = [...list, tag]
		const updatedSources = [...sourceList, source]

		setList(updatedTopics)
		setSourceList(updatedSources)

		// Only update Firestore if the agency ID is available
		if (selectedAgencyId) {
			updateTopicTags(updatedTopics, updatedSources, selectedAgencyId)
		}
	}

	const updateTopicTags = async (topicList, sourceList, agencyId) => {
		const tagsDocRef = doc(db, 'tags', agencyId)
		try {
			const docSnapshot = await getDoc(tagsDocRef)
			if (docSnapshot.exists()) {
				await updateDoc(tagsDocRef, {
					'Topic.list': topicList,
					'Topic.active': active, 
					'Source.list': sourceList,
					'Source.active': activeSources, 
				})
				console.log('Tags updated successfully')
			} else {
				console.error('Document does not exist:', agencyId)
			}
		} catch (error) {
			console.error('Failed to update tags:', error)
		}
	}


	// IMAGES
	// IMAGES
	// IMAGES
  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    setImages(prevState => [...prevState, ...files]); // Append new files to existing state array
    // Assume handleUpload() function is available here to start the upload process
  };
const handleUpload = () => {
    const uploadPromises = images.map((image, index) => {
        const timestamp = new Date().getTime();
        const storageRef = ref(storage, `images/report_${timestamp}_${index}.png`); // Ensure unique path for each image

        return uploadBytesResumable(storageRef, image).on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                console.error('Upload error:', error); // More specific error logging
            },
            async () => {
                const downloadURL = await getDownloadURL(storageRef);
                setImageURLs(prev => [...prev, downloadURL]);
                console.log('File available at', downloadURL);
            }
        );
    });

    Promise.all(uploadPromises)
        .then(() => console.log('All files uploaded'))
        .catch(error => console.error('Error in uploading one or more files:', error));
};
// Example of a direct upload trigger, e.g., from a submit button handler
const handleSubmit = () => {
    if (images.length > 0) {
        handleUpload();
    }
};

	// FORM REFRESH
	// FORM REFRESH
	// FORM REFRESH
	const handleRefresh = () => {
		setKey(self.crypto.randomUUID())
		setReportResetModal(false)
		setReportSystem(0)
	}

	// FORM SUBMIT
	// FORM SUBMIT
	// FORM SUBMIT
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		console.log('Submitting form...')

		const newReportRef = doc(collection(db, 'reports'))
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
				createdDate: new Date(), // Use new Date() directly if you're not using moment-specific features
				isApproved: true,
				read: false,
				topic: selectedTopic,
				hearFrom: selectedSource,
			})
			console.log('Success: report saved with ID:', newReportRef.id)

			// Tags handling might need error handling as well
			addNewTag(selectedTopic, selectedSource, selectedAgencyId)

			// Reset form or redirect user
			resetForm() // Define this function to reset all states managing form inputs
			// Optionally redirect user or display a success message
		} catch (error) {
			console.error('Error saving report:', error)
			// Optionally set an error state and display it to the user
			setErrors('Failed to submit report.') // Define this setErrors function
		}
	}


	// RESET FORM
	// RESET FORM
	// RESET FORM
	const resetForm = () => {
    // Reset all related states
    setTitle('');
    setLink('');
    setSecondLink('');
    setImageURLs([]);
    setDetail('');
    setSelectedTopic(null);
    setSelectedSource(null);
    // etc.
};


	// 	console.log('Report saved successfully with ID:', newReportRef.id)
	// 	// addNewTag(selectedTopic,selectedSource,selectedAgencyId)
	// 	setReportSystem(7) // Advance the report system state on successful save
	// 	console.log('Transitioning to thank you view.')
	// } catch (error) {
	// 	console.error('Error during form submission:', error)
	// } finally {
	// 	resetForm() // Reset the form regardless of the outcome
	// 	console.log('reset report: done', isSubmitting)
	// }
	// }

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
	// useEffect(() => {
	// 	console.log('Report system updated to:', reportSystem)
	// }, [reportSystem])

	// useEffect(() => {
	// 	console.log('User data updated:', userData)
	// }, [userData])
	// useEffect(() => {
	// 	console.log(newReportRef);
	// }, [newReportRef])

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
							<div className={`${globalStyles.form.viewWrapper} ${reportSystem === 2 ? '' : 'hidden'}`}>
								<AgencySelector
									agencies={agencies}
									selectedAgency={selectedAgency}
									onAgencyChange={handleAgencyChange}
									showForwardArrow={setShowForwardArrow}
								/>
							</div>
						)}
						{/* Topic tag */}
						{reportSystem == 3 && (
							<div className={`${globalStyles.form.viewWrapper} ${reportSystem === 3 ? '' : 'hidden'}`}>
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
							<div className={`${globalStyles.form.viewWrapper} ${reportSystem === 4 ? '' : 'hidden'}`}>
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
							<div className={`flex flex-col gap-6 mb-1 ${reportSystem === 5 ? '' : 'hidden'}`}>
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
								{/* Display uploaded images */}
								{imageURLs.map((url, index) => (
									<Image key={index} src={url} alt={`Uploaded #${index + 1}`} />
								))}

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
							<div className={`flex justify-center ${reportSystem >= 2 ? '' : 'hidden'}`}>
								<div className="w-50 opacity-50 hover:opacity-100 mt-2 sm:mt-4">
									<RefreshButton />
								</div>
							</div>
						)}
						{/* BACK ICON */}
						{reportSystem > 0 && reportSystem < 7 && (
							<div className={`absolute opacity-50 hover:opacity-100 bottom-4 left-4 sm:left-6  ${reportSystem > 0 && reportSystem < 7 ? '' : 'hidden'}`}>
								<BackArrow />
							</div>
						)}
					</form>
				</div>
			)}
			{reportSystem === 7 && (
				<div className={`${globalStyles.form.wrap} sm:p-6 ${reportSystem === 7 ? '' : 'hidden'}`}>
					<>
						{/* THANK YOU */}
						{reportSystem == 6 && (
							<div className={`${globalStyles.form.viewWrapper} items-center ${reportSystem === 6 ? '' : 'hidden'}`}>
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
							<Card className={`globalStyles.form.view ${reportSystem === 7 ? '' : 'hidden'}`}>
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
