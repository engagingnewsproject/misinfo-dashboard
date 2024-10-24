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
	// used for Spanish translations
	const { t, i18n } = useTranslation("NewReport")
	const { user, customClaims } = useAuth()
	const [key, setKey] = useState(self.crypto.randomUUID())
	const [data, setData] = useState({ country: "US", state: null, city: null })
	const [isSearchable, setIsSearchable] = useState(true)
	const [userData, setUserData] = useState(null)
	const storage = getStorage()
	const [reportId, setReportId] = useState("")
	const imgPicker = useRef(null)
	const [images, setImages] = useState([])
	const [imageURLs, setImageURLs] = useState([])
	const [update, setUpdate] = useState(false)
	const [title,setTitle] = useState("")
	const [titleError, setTitleError] = useState(false)
	const [link, setLink] = useState("")
	const [secondLink, setSecondLink] = useState("")
	const [detail,setDetail] = useState("")
	const [detailError, setDetailError] = useState(false)
	const [allTopicsArr, setAllTopicsArr] = useState([])
	const [agencies, setAgencies] = useState([])
	const [selectedAgency, setSelectedAgency] = useState("")
  const [agencyID, setSelectedAgencyID] = useState("");

	const [selectedTopic, setSelectedTopic] = useState("")
	const [sources, setSources] = useState([])
	const [selectedSource, setSelectedSource] = useState("")
	const [errors, setErrors] = useState({})
	const [showOtherTopic, setShowOtherTopic] = useState(false)
	const [showOtherSource, setShowOtherSource] = useState(false)
	const [otherTopic, setOtherTopic] = useState("")
	const [otherSource, setOtherSource] = useState("")
	const [topicList, setTopicList] = useState([])
	const [sourceList, setSourceList] = useState([])
	const [active, setActive] = useState([])
	const [activeSources, setActiveSources] = useState([])
	const [reportResetModal, setReportResetModal] = useState(false)
	const [refresh, setRefresh] = useState(false)
	const formRef = useRef(null)

  const defaultTopics = ["Health","Other","Politics","Weather"] // tag system 1
  const defaultSources = ["Newspaper", "Other","Social","Website"] // tag system 2
  const defaultLabels = ["To Investigate", "Investigated: Flagged", "Investigated: Benign"] // tag system 3

	// useEffect(() => {
	// 	console.log('Authenticated user:', user);
	// }, [])
	
	
	// On page load (mount), update the tags from firebase
	useEffect(() => {
		getUserData()
	}, [])

	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update])
	// Save Report
	const saveReport = (imageURLs) => {
		if (!user) {
			console.error('User is not authenticated');
			return;
		}
		const newReportRef = doc(collection(db, "reports"))
		setReportId(newReportRef.id) // set report id
		console.log(newReportRef.id);
		
		setDoc(newReportRef, {
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
			isApproved: true,
			read: false,
			topic: selectedTopic,
			hearFrom: selectedSource,
		}).then(() => {
			console.log('Success: report saved: ' + reportId)

			// Track the event with Google Analytics if the user is not an admin
			if (!customClaims.admin) {
				console.log('Logging event to Google Analytics')
				logEvent(analytics, 'report_submitted', {
					userID: user.accountId,
					agencyID: selectedAgency?.id || selectedAgency,
					reportID: newReportRef.id,
				})
			}

			if (showOtherSource || showOtherTopic) {
				addNewTag(selectedTopic, selectedSource, agencyID)
			}
			handleRefresh()
		}).catch((error) => {
      console.error("Error saving report: ", error);
    });
	}

	const getUserData = async () => {
		await getDoc(doc(db, "mobileUsers", user.accountId)).then((mobileRef) =>
			setUserData(mobileRef.data())
		)
	}
	async function getAllAgencies() {
		// Get agency collection docs
		const agencyRef = await getDocs(collection(db, "agency"))
		try {
			// build an array of agency names
			var arr = []
			agencyRef.forEach((doc) => {
				// console.log("doc state is " +doc.data()['state'] )
				// console.log("user location is " +userData?.state?.name )
				if (doc.data()["state"] == userData?.state?.name) {
					arr.push(doc.data()["name"])
				}
			})
			// set the agencies state with the agency names
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

	// Get topics
	async function getAllTopics() {
    try {
      // console.log("Current agency's ID is " + agencyID)
      let docRef = await getDoc(doc(db, 'tags', agencyID));
       // TODO: test to make sure not null

       // create tags collection if current agency does not have one
       if (!docRef.exists()) {
          // console.log("Need to create tag collection for agency. ")
          const defaultTopics = ["Health","Other","Politics","Weather"] // tag system 1
          const defaultSources = ["Newspaper", "Other","Social","Website"] // tag system 2
          const defaultLabels = ["Important", "Flagged"] // tag system 3

          // reference to tags collection 
          const myDocRef = doc(db, "tags", agencyID);
          setAllTopicsArr(defaultTopics)
          setActive(defaultTopics['active'])

          // create topics document for the new agency
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
        // retrieve list of topics again after creating document of tags for agency
        // console.log("in if statement")
       
    
  

      // Otherwise, tag collection already exists.
      } else {
				 const tagsData = docRef.data()['Topic']
				//  console.log(docRef.ref.path);
				//  console.log('tagData-> ', tagsData);
        setAllTopicsArr(docRef.data()['Topic']['active']);
        tagsData['active'].sort((a, b) => {
          if (a === t('Other')) return 1; // Move "Other" to the end
          if (b === t('Other')) return -1; // Move "Other" to the end
          return a.localeCompare(b); // Default sorting for other elements
        });
        // console.log(tagsData['active'])
        setActive(tagsData['active']);
      }
  
    } catch (error) {
      console.log(error);
    } finally {
      // console.log('Cleanup here'); // cleanup, always executed
  }		
  // const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
		// const topicRef = await getDoc(topicDoc)
		// let topics = topicRef.get("Topic")["active"]
		// let topicsSorted = topics
		// topicsSorted.sort((a, b) => {
		// 	if (a === "Other") return 1 // Move "Other" to the end
		// 	if (b === "Other") return -1 // Move "Other" to the end
		// 	return a.localeCompare(b) // Default sorting for other elements
		// })
		// setAllTopicsArr(topicsSorted)
	}
	// Get sources
	async function getAllSources() {
    if (selectedAgency == "") {
      setSources([])
		} else {
      const sourceDoc = doc(db, 'tags', agencyID);
      const sourceRef = await getDoc(sourceDoc);
			const sources = sourceRef.get('Source')['active'];
      setSources(sources);
			}
    }
	
	// Handlers
	const handleSubmitClick = (e) => {
		e.preventDefault()
		if (!title) {
			setTitleError(true)
			alert(t("titleRequired"))
		} else if (images == "" && !detail && !link) {
			setDetailError(true)
			alert(t("atLeast"))
		} else {
			if (images.length > 0) {
				setUpdate(!update)
			}
			saveReport(imageURLs)
			// setReportSystem(7)
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
  const handleImageChange = (e) => {
		// Image upload:
		// (https://github.com/honglytech/reactjs/blob/react-firebase-multiple-images-upload/src/index.js,
		// https://www.youtube.com/watch?v=S4zaZvM8IeI)
		// console.log('handle image change run');
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
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
				`report_${new Date().getTime().toString()}.png`
			)
			const uploadTask = uploadBytesResumable(storageRef, image)
			promises.push(uploadTask)
			uploadTask.on(
				"state_changed",
				(snapshot) => {
					// You can track the upload progress here if needed
				},
				(error) => {
					console.log(error)
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
						// console.log('File available at', downloadURL);
						setImageURLs((prev) => [...prev, downloadURL])					})
				}
			)
		})
		Promise.all(promises).catch((err) => console.log(err))
	}
	const handleTopicChange = (e) => {
		if (e.includes("Other")) {
			setSelectedTopic("")
			setShowOtherTopic(true)
		} else {
			setShowOtherTopic(false)
			setSelectedTopic(e)
		}
	}
	const handleOtherTopicChange = (e) => {
		setOtherTopic(e.target.value)
		setSelectedTopic(e.target.value)
	}
	const handleSourceChange = (e) => {
		if (e.includes("Other")) {
			setSelectedSource("")
			setShowOtherSource(true)
		} else {
			setShowOtherSource(false)
			setSelectedSource(e)
		}
	}
	const handleOtherSourceChange = (e) => {
		setOtherSource(e.target.value)
		setSelectedSource(e.target.value)
	}
	const addNewTag = (tag, source, agencyId) => {
		let tempTopicArr = [...topicList]
		let tempSourceArr = [...sourceList]
		if (tag) {
			tempTopicArr.push(tag)
			setTopicList(tempTopicArr)
		}

		if (source) {
			tempSourceArr.push(source)
			setSourceList(tempSourceArr)
		}

		updateTopicTags(
			tag ? tempTopicArr : null,
			source ? tempSourceArr : null,
			agencyId,
		).then(() => {
			// Clear the temporary arrays after updating the document
			setTopicList([])
			setSourceList([])
		})
	}
	const updateTopicTags = async (topic, source, agencyId) => {
		try {
			// Reference to the document
			const docRef = doc(db, 'tags', agencyId)

			// Fetch the current document data
			const docSnap = await getDoc(docRef)

			if (docSnap.exists()) {
				const currentData = docSnap.data()
				const updateData = {}

				// Check if topic is provided and update it
				if (topic) {
					const currentTopicList = currentData.Topic?.list || []
					const newTopicList = topic.filter(
						(item) => !currentTopicList.includes(item),
					)
					if (newTopicList.length > 0) {
						updateData['Topic.list'] = arrayUnion(...newTopicList)
					}
				}

				// Check if source is provided and update it
				if (source) {
					const currentSourceList = currentData.Source?.list || []
					console.log('currentSourceList--> ', currentSourceList);
					const newSourceList = source.filter(
						(item) => !currentSourceList.includes(item),
					)
					if (newSourceList.length > 0) {
						updateData['Source.list'] = arrayUnion(...newSourceList)
					}
				}

				// Update the document with the prepared update data
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
		
		// console.log("Form Data: ", formData);
	};
	useEffect(() => {
		logFormData()
	}, [reportSystem, update])
	
	const handleChange = (e) => {
		// console.log('handleChange--> ', e.target.value)
		if (titleError) {
			e.target.id == 'title' && setTitleError(false)
		} else if (detailError) {
			e.target.id == 'link' || 'multiple_files' || 'detail' && setTitleError(false)
		}
	}
	const handleRefresh = () => {
		setKey(self.crypto.randomUUID())
		// Reset the form directly if the ref is currently pointing to the form element
    if (formRef.current) {
        formRef.current.reset();  // Resets all input fields to their initial values
    }
		// if (formRef.current) {
		setSelectedAgency("")
		setSelectedAgencyID('')
		// Topics
		setSelectedTopic("")
		setShowOtherTopic(false)
		setOtherTopic('')
		setAllTopicsArr([])
		// Sources
		setSelectedSource("")
		setShowOtherSource(false)
		setOtherSource('')
		setTitle("")
		setLink("")
		setSecondLink("")
		setImageURLs([])
		setDetail("")
		setReportId('')
		setReportResetModal(false)
		setReportSystem(0)
		// } else {
		// console.log("not current form")
		// }
	}
	// Elements
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
