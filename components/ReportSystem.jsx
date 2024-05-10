import React, { useState, useEffect, useRef } from "react"
import { reportSystems } from "../pages/report"
import { IoMdArrowRoundBack } from "react-icons/io"
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
	// console.log('disableReminder: '+disableReminder+' ||| reminderShow: '+reminderShow);
	const dbInstance = collection(db, "reports")
	const { user } = useAuth()
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
	// //
	// Styles
	// //
	const style = {
		sectionContainer: "w-full h-full flex flex-col mb-5 overflow-y-visible",
		sectionWrapper: "flex items-center",
		sectionH1: "text-2xl font-bold",
		sectionH2: "text-blue-600",
		sectionSub: "text-sm",
		sectionIconButtonWrap: "self-end",
		sectionIconButton: "fill-blue-600 hover:fill-blue-800",
		form: "flex w-96 h-full justify-center self-center",
		viewWrapper: "flex justify-center gap-2 mt-4 px-5",
		viewWrapperCenter: "flex flex-col gap-2 mt-8 items-center",
		inputSelect:
			"border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline",
		inputSingle:
			"border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline",
		inputCheckboxWrap: "flex",
		inputRadio:
			"bg-blue-600 hover:bg-blue-500 flex rounded-lg p-2 text-white justify-center checked:bg-blue-500",
		inputRadioChecked:
			"bg-blue-800 flex rounded-lg p-2 text-white justify-center checked:bg-blue-500",
		inputImage:
			"block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer",
		inputTextarea:
			"border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline",
		button:
			"w-80 self-center mt-4 mb-8 shadow bg-blue-600 hover:bg-blue-500 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline",
		buttonBack: "hover:-translate-x-1 transition-transform md:px-4",
	}
	// //
	// Save Report
	// //
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

	// //
	// Data
	// //
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

	// //
	// Handlers
	// //

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

	// Image upload (https://github.com/honglytech/reactjs/blob/react-firebase-multiple-images-upload/src/index.js, https://www.youtube.com/watch?v=S4zaZvM8IeI)
	const handleImageChange = (e) => {
		// console.log('handle image change run');
		for (let i = 0; i < e.target.files.length; i++) {
			const newImage = e.target.files[i]
			setImages((prevState) => [...prevState, newImage])
			setUpdate(!update)
		}
	}

	// Image upload to firebase
	const handleUpload = () => {
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
		setSelectedTopic(e.target.value)
		if (e.target.value === "Other") {
			setShowOtherTopic(true)
		} else {
			setShowOtherTopic(false)
		}
	}
	const handleSourceChangeOther = (e) => {
		setSelectedSource(e.target.value)
		if (e.target.value === "Other") {
			setShowOtherSource(true)
		} else {
			setShowOtherSource(false)
		}
	}
	const handleOtherTopicChange = (e) => {
		setOtherTopic(e.target.value)
		setSelectedTopic(e.target.value)
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

	// //
	// Effects
	// //
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

	const handleRefresh = () => {
		if (formRef.current) {
			setSelectedAgency("")
			setSelectedTopic("")
			setSelectedSource("")
			setTitle("")
			setLink("")
			setSecondLink("")
			setImages([])
			setDetail("")
			setReportResetModal(false)
			setReportSystem(0)
		} else {
			console.log("not current form")
		}
	}
	return (
		<div className={style.sectionContainer}>
			<>
				<div className={`${style.sectionWrapper} flex justify-between`}>
					{reportSystem > 0 && reportSystem < 7 && (
						<button
							onClick={onReportSystemPrevStep}
							className={style.buttonBack}>
							<IoMdArrowRoundBack size={25} />
						</button>
					)}
					{/* Button to display the ConfirmModal component */}
					{reportSystem >= 3 && (
						<button
							className='top-1 right-2 m-0 md:m-0 tooltip-refresh'
							onClick={() => setReportResetModal(true)}
							type='button'>
							<IoMdRefresh size={20} />
							<Tooltip
								anchorSelect='.tooltip-refresh'
								place='bottom'
								delayShow={500}>
								Reset Report
							</Tooltip>
						</button>
					)}
				</div>
				{reminderShow != false && reportSystem == 1 && (
					<div className={style.viewWrapperCenter}>
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
						<button
							onClick={onReminderStart}
							className={globalStyles.button.md}>
							{t("start")}
						</button>
						{/* DO NOT SHOW AGAIN CHECKBOX */}
						<div className='inline-flex items-center'>
							<label
								className='relative flex items-center p-3 rounded-full cursor-pointer'
								htmlFor='check'>
								<input
									className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-gray-900 checked:bg-gray-900 checked:before:bg-gray-900 hover:before:opacity-10"
									onChange={onChangeCheckbox}
									checked={disableReminder}
									type='checkbox'
									id='noShow'
									name='noShow'
								/>
								<span className='absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100'>
									<IoMdCheckmark />
								</span>
							</label>
							<label
								className='mt-px font-light text-gray-700 cursor-pointer select-none'
								htmlFor='noShow'>
								{t("noShow")}
							</label>
						</div>
					</div>
				)}
			</>
			{reportSystem >= 2 && (
				<div className={globalStyles.form.wrap}>
					<form
						onChange={handleChange}
						onSubmit={handleNewReport}
						className={globalStyles.form.element}
						ref={formRef}>
						<>
							{/* Agency */}
							{reportSystem == 2 && (
								<div className={globalStyles.form.viewWrapper}>
									<div className={style.sectionH1}>{t("which_agency")}</div>
									{agencies.length == 0 && t("noAgencies")}
									{agencies.map((agency, i = self.crypto.randomUUID()) => (
										<>
											<label
												key={i}
												className={
													agency === selectedAgency
														? globalStyles.button.md_selected
														: globalStyles.button.md
												}>
												{/* Agency Input */}
												<input
													className='absolute opacity-0'
													id='agency'
													type='radio'
													checked={selectedAgency === agency}
													onChange={(e) => setSelectedAgency(e.target.value)}
													value={agency}
												/>
												{agency}
											</label>
										</>
									))}
									{errors.agency && selectedAgency === "" && (
										<span className='text-red-500'>{errors.agency}</span>
									)}
									{selectedAgency != "" && (
										<button
											onClick={() => setReportSystem(reportSystem + 1)}
											className={`${globalStyles.icon_wrap} self-end`}>
											<BiRightArrowCircle
												size={40}
												className={globalStyles.icon.filled}
											/>
										</button>
									)}
								</div>
							)}
							{/* Topic tag */}
							{reportSystem == 3 && (
								<div className={globalStyles.form.viewWrapper}>
									<div className={style.sectionH1}>{t("about")}</div>
									{[
										...allTopicsArr.filter((topic) => topic !== "Other"),
										...allTopicsArr.filter((topic) => topic === "Other"),
									].map((topic, i = self.crypto.randomUUID()) => (
										<>
											<label
												key={i}
												className={
													topic === selectedTopic
														? globalStyles.button.md_selected
														: globalStyles.button.md
												}>
												{/* Topic Tag Input */}
												<input
													className='absolute opacity-0'
													id='topic'
													type='radio'
													checked={selectedTopic === topic}
													onChange={
														// create a custom function
														// (e) => setSelectedTopic(e.target.value)
														handleTopicChange
													}
													value={topic}
												/>
												{t("topics." + topic)}
											</label>
										</>
									))}
									{errors.topic && selectedTopic === "" && (
										<span className='text-red-500'>{errors.topic}</span>
									)}
									{showOtherTopic && (
										<div className=''>
											<div className='text-zinc-500'>{t("custom_topic")}</div>
											<input
												id='topic-other'
												className='rounded shadow-md border-zinc-400 w-full'
												type='text'
												placeholder={t("specify_topic")}
												onChange={handleOtherTopicChange}
												value={otherTopic}
												style={{ fontSize: "14px" }}
											/>
										</div>
									)}
									{selectedTopic != "" && (
										<button
											onClick={() => setReportSystem(reportSystem + 1)}
											className={`${globalStyles.icon_wrap} self-end`}>
											<BiRightArrowCircle
												size={40}
												className={globalStyles.icon.filled}
											/>
										</button>
									)}
								</div>
							)}
							{/* Source tag */}
							{reportSystem == 4 && (
								<div className={globalStyles.form.viewWrapper}>
									<div className={style.sectionH1}>{t("where")}</div>
									{[
										...sources.filter((source) => source !== "Other"),
										...sources.filter((source) => source === "Other"),
									].map((source, i = self.crypto.randomUUID()) => (
										<>
											<label
												key={i}
												className={
													source === selectedSource
														? globalStyles.button.md_selected
														: globalStyles.button.md
												}>
												{/* Source tag input */}
												<input
													className='absolute opacity-0'
													id='source'
													type='radio'
													checked={selectedSource === source}
													onChange={handleSourceChangeOther}
													value={source}
												/>
												{console.log(source)}
												{t("sources." + source)}
											</label>
										</>
									))}
									{errors.source && selectedSource === "" && (
										<span className='text-red-500'>{errors.source}</span>
									)}
									{showOtherSource && (
										<div className=''>
											<div className='text-zinc-500'>{t("custom_source")}</div>
											<input
												id='topic-other'
												className='rounded shadow-md border-zinc-400 w-full'
												type='text'
												placeholder='Please specify the source.'
												onChange={handleOtherSourceChange}
												value={otherSource}
												style={{ fontSize: "14px" }}
											/>
										</div>
									)}
									{selectedSource != "" && (
										<button
											onClick={() => setReportSystem(reportSystem + 1)}
											className={`${globalStyles.icon_wrap} self-end`}>
											<BiRightArrowCircle
												size={40}
												className={globalStyles.icon.filled}
											/>
										</button>
									)}
								</div>
							)}
							{/* TODO: add agency dropdown */}
							{/* Details */}
							{reportSystem == 5 && (
								<div className='flex flex-col gap-6 mb-1'>
									<h1 className={globalStyles.heading.h1.black}>
										{t("share")}
									</h1>
									{/* DESCRIPTION - details */}
									<>
										<h6 className={globalStyles.form.input_title}>
											{t("detail")}
										</h6>
										<p className={globalStyles.p.default}>
											{t("detailDescription")}
										</p>
									</>
									{/* TITLE */}
									<>
										<h6 className={globalStyles.form.input_title}>
											{t("title_text")}
										</h6>
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
											<p className={globalStyles.input.hint}>
												<IoIosInformationCircle />
												{t("provide_title")} <br />
												{t("max")}
											</p>
										</div>
									</>
									{/* LINKS */}
									<>
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
											<p className={globalStyles.input.hint}>
												<IoIosInformationCircle />
												Example: https://
											</p>
										</div>
									</>
									{/* IMAGE UPLOAD */}
									<>
										<h6 className={globalStyles.form.input_title}>
											{t("image")}
										</h6>
										<div className='block'>
											<div className={globalStyles.form.input_wrap}>
												<label className='block'>
													<span className='sr-only'>{t("choose_files")}</span>
													<input
														className={style.inputImage}
														id='multiple_files'
														type='file'
														multiple
														accept='image/*'
														onChange={handleImageChange}
														ref={imgPicker}
													/>
												</label>
											</div>
											<p className={globalStyles.input.hint}>
												<IoIosInformationCircle />
												{t("imageDescription")}
											</p>
										</div>
									</>
									{/* DESCRIBE IN DETAIL */}
									<>
										<h6 className={globalStyles.form.input_title}>
											{t("detailed")}
										</h6>
										<div className='block'>
											<div className='relative w-full min-w-[200px] mt-3'>
												<textarea
													className={style.inputTextarea}
													id='detail'
													placeholder=' '
													onChange={(e) => setDetail(e.target.value)}
													value={detail}
													rows='6'></textarea>
												<label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
													{t("describe")}
												</label>
											</div>
											<p className={globalStyles.textarea.hint}>
												<IoIosInformationCircle />
												{t("detailedDescription")}
											</p>
										</div>
									</>
									{/* SUBMIT BUTTON */}
									<>
										<button
											onClick={handleSubmitClick}
											className={globalStyles.button.md}
											type='submit'>
											{t("submit")}
										</button>
									</>
								</div>
							)}
						</>
					</form>
					{/* Render the ConfirmModal component */}
					{reportResetModal && (
						<ConfirmModal
							func={handleRefresh} // Pass the handleRefresh function to the ConfirmModal component
							title='Are you sure you want to reset the report?'
							subtitle='You cannot undo this action.'
							CTA='Reset Report'
							closeModal={() => setReportResetModal(false)}
						/>
					)}
					<>
						{/* Thank you */}
						{reportSystem == 6 && (
							<div className={globalStyles.form.viewWrapper + " items-center"}>
								<Image
									src='/img/reportSuccess.png'
									width={156}
									height={120}
									alt='report success'
									className='object-cover w-auto'
								/>
								<div className={style.sectionH1}>{t("thankyou")}</div>
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
							<div className={globalStyles.form.viewWrapper}>
								{/* Title */}
								<div className={style.inputSingle}>
									<div className={style.sectionH2}>{t("title_text")}</div>
									{title}
								</div>
								{/* Links */}
								<div className={style.inputSingle}>
									<div className={style.sectionH2}>{t("links")}</div>
									{link || secondLink != "" ? (
										<>
											{link}
											<br></br>
											{secondLink}
										</>
									) : (
										t("noLinks")
									)}
								</div>
								{/* Image upload */}
								<div className={style.inputSingle}>
									<div className={style.sectionH2}>{t("image")}</div>
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
								<div className={style.inputSingle}>
									<div className={style.sectionH2}>{t("detailed")}</div>
									{detail ? detail : `No description provided.`}
								</div>
								<button
									onClick={() => setReportSystem(0)}
									className={globalStyles.button.md}>
									{t("backReports")}
								</button>
							</div>
						)}
					</>
				</div>
			)}
		</div>
	)
}
export default ReportSystem
