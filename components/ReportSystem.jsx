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
import { Tooltip } from "react-tooltip"
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
} from "@material-tailwind/react"

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
	const { t } = useTranslation("NewReport")
	const { user } = useAuth()
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
	const [title, setTitle] = useState("")
	const [link, setLink] = useState("")
	const [secondLink, setSecondLink] = useState("")
	const [detail, setDetail] = useState("")
	const [allTopicsArr, setAllTopicsArr] = useState([])
	const [agencies, setAgencies] = useState([])
	const [selectedAgency, setSelectedAgency] = useState("")
	const [selectedTopic, setSelectedTopic] = useState("")
	const [sources, setSources] = useState([])
	const [selectedSource, setSelectedSource] = useState("")
	const [errors, setErrors] = useState({})
	const [showOtherTopic, setShowOtherTopic] = useState(false)
	const [showOtherSource, setShowOtherSource] = useState(false)
	const [otherTopic, setOtherTopic] = useState("")
	const [otherSource, setOtherSource] = useState("")
	const [list, setList] = useState([])
	const [sourceList, setSourceList] = useState([])
	const [active, setActive] = useState([])
	const [activeSources, setActiveSources] = useState([])
	const [reportResetModal, setReportResetModal] = useState(false)
	const [refresh, setRefresh] = useState(false)
	const formRef = useRef(null)

	// On page load (mount), update the tags from firebase
	useEffect(() => {
		getUserData()
	}, [])
	useEffect(() => {
		if (userData) {
			getAllAgencies()
			getAllTopics()
			getAllSources()
			getTopicList()
			getSourceList()
		}
	}, [userData])
	useEffect(() => {
		if (update) {
			handleUpload()
		}
	}, [update])
	// Save Report
	const saveReport = (imageURLs) => {
		const newReportRef = doc(collection(db, "reports"))
		setReportId(newReportRef.id) // set report id
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
			console.log("Success: report saved: " + reportId)
			addNewTag(selectedTopic, selectedSource)
		})
	}
	// Data
	const getData = async () => {
		const docRef = await getDoc(doc(db, "reports", user.uid))
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
	// Get topics
	async function getAllTopics() {
		const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
		const topicRef = await getDoc(topicDoc)
		let topics = topicRef.get("Topic")["active"]
		let topicsSorted = topics
		topicsSorted.sort((a, b) => {
			if (a === "Other") return 1 // Move "Other" to the end
			if (b === "Other") return -1 // Move "Other" to the end
			return a.localeCompare(b) // Default sorting for other elements
		})
		setAllTopicsArr(topicsSorted)
	}
	// Get sources
	async function getAllSources() {
		const sourceDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
		const sourceRef = await getDoc(sourceDoc)
		const sources = sourceRef.get("Source")["active"]
		let sourcesSorted = sources
		sourcesSorted.sort((a, b) => {
			if (a === "Other") return 1 // Move "Other" to the end
			if (b === "Other") return -1 // Move "Other" to the end
			return a.localeCompare(b) // Default sorting for other elements
		})
		setSources(sourcesSorted)
	}
	// Handlers
	const handleSubmitClick = (e) => {
		e.preventDefault()
		if (!title) {
			alert(t("titleRequired"))
		} else if (images == "" && !detail && !link) {
			alert(t("atLeast"))
		} else {
			if (images.length > 0) {
				setUpdate(!update)
			}
			saveReport(imageURLs)
			setReportSystem(7)
		}
	}
	const handleNewReport = async (e) => {
		e.preventDefault()
		const allErrors = {}
		if (data.state == null) {
			console.log("state error")
			allErrors.state = t("state")
		}
		if (data.city == null) {
			// Don't display the report, show an error message
			console.log("city error")
			allErrors.city = t("city")
			if (
				data.state != null &&
				City.getCitiesOfState(data.state?.countryCode, data.state?.isoCode)
					.length == 0
			) {
				console.log("No cities here")
				delete allErrors.city
			}
		}
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
	const addNewTag = (tag, source) => {
		let topicArr = list
		let sourceArr = sourceList
		topicArr.push(tag)
		sourceArr.push(source)
		setList(topicArr)
		setSourceList(sourceArr)
		updateTopicTags(list, user, sourceList)
	}
	const updateTopicTags = async (topicList, user, sourceList) => {
		const docRef = await getDoc(doc(db, "tags", user.uid))
		const updatedDocRef = await setDoc(doc(db, "tags", user.uid), {
			...docRef.data(),
			["Topic"]: {
				list: topicList,
				active: active,
			},
			["Source"]: {
				list: sourceList,
				active: activeSources,
			},
		})
		return updatedDocRef
	}
	const getTopicList = async () => {
		try {
			const docRef = await getDoc(doc(db, "tags", user.uid))
			const { ["Topic"]: tagsData } = docRef.data()
			setList(tagsData.list)
			tagsData.active.sort((a, b) => {
				if (a === "Other") return 1 // Move "Other" to the end
				if (b === "Other") return -1 // Move "Other" to the end
				return a.localeCompare(b) // Default sorting for other elements
			})
			setActive(tagsData.active)
		} catch (error) {
			console.log(error)
		}
	}
	const getSourceList = async () => {
		try {
			const docRef = await getDoc(doc(db, "tags", user.uid))
			const { ["Source"]: tagsData } = docRef.data()
			setSourceList(tagsData.list)
			tagsData.active.sort((a, b) => {
				if (a === "Other") return 1 // Move "Other" to the end
				if (b === "Other") return -1 // Move "Other" to the end
				return a.localeCompare(b) // Default sorting for other elements
			})
			setActiveSources(tagsData.active)
		} catch (error) {
			console.log(error)
		}
	}
	const handleChange = (e) => {
		// console.log('REPORT VALUE CHANGED: ' + e.target.id + ': ' + e.target.value);
	}
	const handleRefresh = () => {
		setKey(self.crypto.randomUUID())
		// if (formRef.current) {
		// setSelectedAgency("")
		// setSelectedTopic("")
		// setSelectedSource("")
		// setTitle("")
		// setLink("")
		// setSecondLink("")
		// setImages([])
		// setDetail("")
		setReportResetModal(false)
		setReportSystem(0)
		// } else {
		// console.log("not current form")
		// }
	}

	const ForwardArrow = () => {
		return (
			<IconButton
				variant='text'
				color='blue'
				onClick={() => setReportSystem(reportSystem + 1)}>
				<IoMdArrowRoundForward
					size={30}
					className={globalStyles.icon_button.icon}
				/>
			</IconButton>
		)
	}
	const BackArrow = () => {
		return (
			<IconButton
				variant='text'
				color='blue-gray'
				onClick={onReportSystemPrevStep}>
				<IoMdArrowRoundBack
					size={30}
					className={globalStyles.icon_button.icon_gray}
				/>
			</IconButton>
		)
	}
	const RefreshButton = () => {
		return (
			<IconButton
				variant='text'
				color='blue-gray'
				className='tooltip-refresh'
				onClick={() => setReportResetModal(true)}
				type='button'>
				<IoMdRefresh size={30} />
				<Tooltip anchorSelect='.tooltip-refresh' place='bottom' delayShow={500}>
					Reset Report
				</Tooltip>
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
						<div className='text-xl px-5 font-extrabold text-blue-600 tracking-wider'>
							{reportSystem == 1 ? t("reminder") : reportSystems[reportSystem]}
						</div>
						<div>{t("description")}</div>
						<div>{t("example")}</div>
						<div className='flex flex-col gap-2'>
							<div className='flex gap-3'>
								<BiCheckCircle size={25} color='green' />
								{t("correct")}
							</div>
							<div className='flex gap-3'>
								<BiXCircle size={25} color='red' />
								{t("incorrect")}
							</div>
						</div>
						<Button
							onClick={onReminderStart}
							className={globalStyles.button.md}>
							{t("start")}
						</Button>
						{/* DO NOT SHOW AGAIN CHECKBOX */}
						<div className='inline-flex items-center'>
							<label
								className={globalStyles.checkbox.input_label}
								htmlFor='check'>
								<input
									className={globalStyles.checkbox.input}
									onChange={onChangeCheckbox}
									checked={disableReminder}
									type='checkbox'
									id='noShow'
									name='noShow'
								/>
								<span className={globalStyles.checkbox.icon}>
									<IoMdCheckmark />
								</span>
							</label>
							<label className={globalStyles.checkbox.label} htmlFor='noShow'>
								{t("noShow")}
							</label>
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
						<>
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
													{topic}
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
												label='Custom topic'
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
													value={source}
													onClick={() => handleSourceChange(source)}>
													{source}
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
												label='Custom source'
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
									<Typography variant='h5'>{t("share")}</Typography>
									{/* DESCRIPTION - details */}
									<div>
										<Typography variant='h6' color='blue'>
											{t("detail")}
										</Typography>
										<Typography>{t("detailDescription")}</Typography>
									</div>
									{/* TITLE */}
									<div>
										<Typography variant='h6' color='blue'>
											{t("title_text")}
										</Typography>
										<div className='block'>
											<div className={globalStyles.form.input_wrap}>
												<input
													id='title'
													type='text'
													className={globalStyles.input.input}
													placeholder=' '
													onChange={(e) => setTitle(e.target.value)}
													value={title}
												/>
												<label className={globalStyles.input.label}>
													{t("briefly")}
												</label>
											</div>
											<Typography
												variant='small'
												color='gray'
												className='mt-2 flex items-center gap-1 font-normal'>
												{" "}
												<IoIosInformationCircle />
												{t("provide_title")} <br />
												{t("max")}
											</Typography>
										</div>
									</div>
									{/* LINKS */}
									<div>
										<h6 className={globalStyles.form.input_title}>
											{t("links")}
										</h6>
										{/* Link 01 */}
										<div className='block'>
											<div
												className={`${globalStyles.form.input_wrap} flex flex-col gap-2`}>
												<input
													className={globalStyles.input.input}
													id='link'
													type='text'
													placeholder=' '
													onChange={(e) => setLink(e.target.value)}
													value={link}
												/>
												<label className={globalStyles.input.label}>
													{t("linkFirst")}
												</label>
												{/* Link 02 */}
												{link && (
													<div className='relative h-10 w-full min-w-[200px]'>
														<input
															className={globalStyles.input.input}
															id='secondLink'
															type='text'
															placeholder=' '
															onChange={(e) => setSecondLink(e.target.value)}
															value={secondLink}
														/>
														<label className={globalStyles.input.label}>
															{t("linkFirst")}
														</label>
													</div>
												)}
											</div>
											{/* Link 01 - info subtext */}
											<Typography
												variant='small'
												color='gray'
												className='mt-2 flex items-center gap-1 font-normal'>
												{" "}
												<IoIosInformationCircle />
												Example: https://
											</Typography>
										</div>
									</div>
									{/* IMAGE UPLOAD */}
									<div>
										<h6 className={globalStyles.form.input_title}>
											{t("image")}
										</h6>
										<div className='block'>
											<div className={globalStyles.form.input_wrap}>
												<label className='block'>
													<span className='sr-only'>{t("choose_files")}</span>
													<input
														className={globalStyles.inputImage}
														id='multiple_files'
														type='file'
														multiple
														accept='image/*'
														onChange={handleImageChange}
														ref={imgPicker}
													/>
												</label>
											</div>
											<Typography
												variant='small'
												color='gray'
												className='mt-2 flex items-center gap-1 font-normal'>
												<IoIosInformationCircle />
												{t("imageDescription")}
											</Typography>
										</div>
									</div>
									{/* DESCRIBE IN DETAIL */}
									<div>
										<h6 className={globalStyles.form.input_title}>
											{t("detailed")}
										</h6>
										<div className='block'>
											<div className='relative w-full min-w-[200px] mt-3'>
												<Textarea
													id='detail'
													onChange={(e) => setDetail(e.target.value)}
													value={detail}
													label={t("describe")}
													rows='6'></Textarea>
											</div>
											<Typography
												variant='small'
												color='gray'
												className='mt-2 flex items-center gap-1 font-normal'>
												<IoIosInformationCircle />
												{t("detailedDescription")}
											</Typography>
										</div>
									</div>
									{/* SUBMIT BUTTON */}
									<>
										<button
											onClick={handleSubmitClick}
											className={globalStyles.button.md_block}
											type='submit'>
											{t("submit")}
										</button>
									</>
								</div>
							)}
						</>
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
					{/* View Form */}
				</div>
			)}
			{reportSystem === 7 && (
				<div className={globalStyles.form.wrap}>
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
							<Card
								color='transparent'
								shadow={false}
								className='w-full max-w-[26rem] mb-6'>
								{/* Title */}
								<div className='mb-6 p-0'>
									<Typography variant='h6' className='text-blue-600'>
										{t("title_text")}
									</Typography>
									<Typography>{title}</Typography>
								</div>
								{/* Links */}
								<div className='mb-6 p-0'>
									<Typography variant='h6' className='text-blue-600'>
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
									<Typography variant='h6' className='text-blue-600'>
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
									<Typography variant='h6' className='text-blue-600'>
										{t("detailed")}
									</Typography>
									<Typography>
										{detail ? detail : `No description provided.`}
									</Typography>
								</div>
								<Button
									onClick={() => setReportSystem(0)}
									className={globalStyles.button.md_block}>
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
