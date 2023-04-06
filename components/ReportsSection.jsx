import React, { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"

import {
	collection,
	getDoc,
	getDocs,
	doc,
	updateDoc,
	deleteDoc,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { Switch } from "@headlessui/react"
// Icons
import { IoMdRefresh } from "react-icons/io"
import { IoAdd } from "react-icons/io5"

// Icons END
import ReactTooltip from "react-tooltip"
import InfiniteScroll from "react-infinite-scroll-component"
import NewReport from "./modals/NewReportModal"
import ReportModal from "./modals/ReportModal"

const ReportsSection = ({ search }) => {
	const userId = localStorage.getItem("userId")
	const [reports, setReports] = useState([])
	const [reporterInfo, setReporterInfo] = useState({})
	const [newReportModal, setNewReportModal] = useState(false)
	const [filteredReports, setFilteredReports] = useState([])
	const [loadedReports, setLoadedReports] = useState([])
	const [endIndex, setEndIndex] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [reportWeek, setReportWeek] = useState("4")
	const [readFilter, setReadFilter] = useState("All")
	const [reportTitle, setReportTitle] = useState('')
	const { user } = useAuth()
	const dateOptions = {
		day: "2-digit",
		year: "numeric",
		month: "short",
		hour: "numeric",
		minute: "numeric",
	}
	// Styles
	const tableHeadings = "p-2 text-center text-sm font-semibold tracking-wide"
	const columnData =
		"text-center text-sm px-2 py-1 flex items-center justify-center"
	const headerStyle = "text-lg font-bold text-black tracking-wider mb-4"
	const linkStyle = "font-light mb-1 text-sm underline underline-offset-1"
	const label = {
		default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
		special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl",
	}
	// Report modal states
	const [reportModal, setReportModal] = useState(false)
	const [reportModalId, setReportModalId] = useState(false)
	const [note, setNote] = useState("")
	const [title, setTitle] = useState('')
	const [detail, setDetail] = useState()
	const [info, setInfo] = useState({})
	const [selectedLabel, setSelectedLabel] = useState("")
	const [activeLabels, setActiveLabels] = useState([])
	const [changeStatus, setChangeStatus] = useState("")
	const [postedDate, setPostedDate] = useState("")
	const [update, setUpdate] = useState("")
	
	const getData = async () => {
		const reportsCollection = collection(db, "reports")
		const snapshot = await getDocs(reportsCollection)

		try {
			var arr = []
			snapshot.forEach((doc) => {
				arr.push({
					[doc.id]: doc.data(),
				})
			})

			setReports(arr)
			if (readFilter !== "All") {
				arr = arr.filter((reportObj) => {
				  return Object.values(reportObj)[0].read.toString() === readFilter
				})
			}
			setFilteredReports(arr)
			setLoadedReports(
				arr
					.filter((reportObj) => {
						const report = Object.values(reportObj)[0]
						return (
							report["createdDate"].toDate() >=
							new Date(
								new Date().setDate(new Date().getDate() - reportWeek * 7)
							)
						)
					})
					.sort((objA, objB) =>
						Object.values(objA)[0]["createdDate"] >
						Object.values(objB)[0]["createdDate"]
							? -1
							: 1
					)
			)
		} catch (error) {
			console.log(error)
		}
	}

	const handleDateChanged = (e) => {
		e.preventDefault()
		setReportWeek(e.target.value)
		setEndIndex(0)

		// Updates loaded reports so that they only feature reports within the selected date range
		let arr = filteredReports.filter((reportObj) => {
			const report = Object.values(reportObj)[0]
			return (
				report["createdDate"].toDate() >=
				new Date(new Date().setDate(new Date().getDate() - e.target.value * 7))
			)
		})

		arr = arr.sort((objA, objB) =>
			Object.values(objA)[0]["createdDate"] >
			Object.values(objB)[0]["createdDate"]
				? -1
				: 1
		)
		setLoadedReports(arr)
	}

	const handleReadFilter = (e) => {
		e.preventDefault()
		setFilterRead(e.target.value)
	}

	// Filter the reports based on the search text
	useEffect(() => {
		if (search == "") {
			if (readFilter != "All") {
				setFilteredReports(
					reports.filter((reportObj) => {
						return Object.values(reportObj)[0].read.toString() == readFilter
					})
				)
			} else {
				setFilteredReports(reports)
			}
		} else {
			setFilteredReports(
				reports.filter((reportObj) => {
					const report = Object.values(reportObj)[0]

					var arr = []
					// Collect the searchable fields of the reports data
					for (const key in report) {
						if (report[key]) {
							if (key != "images" && key != "userID") {
								if (key == "createdDate") {
									const posted = report[key]
										.toDate()
										.toLocaleString("en-US", dateOptions)
										.replace(/,/g, "")
										.replace("at", "")
									arr.push(posted.toLowerCase())
								} else {
									arr.push(report[key].toString().toLowerCase())
								}
							}
						}
					}

					// check if the search text is in the collected fields
					for (const str of arr) {
						if (str.includes(search.toLowerCase())) {
							return true
						}
					}
				})
			)
		}
	}, [search])

	// On page load (mount), get the reports from firebase
	useEffect(() => {
		getData()
	}, [])

	// Updates the loaded reports whenever a user filters reports based on search.
	useEffect(() => {
		let arr = filteredReports.filter((reportObj) => {
			const report = Object.values(reportObj)[0]
			return (
				report["createdDate"].toDate() >=
				new Date(new Date().setDate(new Date().getDate() - reportWeek * 7))
			)
		})
		arr = arr.sort((objA, objB) =>
			Object.values(objA)[0]["createdDate"] >
			Object.values(objB)[0]["createdDate"]
				? -1
				: 1
		)

		// Default values for infinite scrolling, will load reports as they are populated.

		// FIXED SCROLLING BUG MAYBE???? *****
		// setEndIndex(0)
		// setHasMore(true)
		if (arr.length === 0) {
			setHasMore(false)
		} else {
			setHasMore(true)
		}
		setLoadedReports(arr)
	}, [filteredReports])

	// Populates the loaded reports as the user scrolls to bottom of page
	useEffect(() => {
		if (loadedReports.length != 0) {
			handleReportScroll()
		}
	}, [loadedReports])

	// Determines if there are more reports to be shown.
	const handleReportScroll = () => {
		// If all of the reports have been loaded
		if (endIndex >= loadedReports.length) {
			setHasMore(false)

			// If there is less than 14 reports to load, load remaining reports
		} else if (endIndex + 14 >= loadedReports.length) {
			setEndIndex(loadedReports.length)
			setHasMore(true)

			// Load only 14 additional reports
		} else {
			setEndIndex(endIndex + 14)
			setHasMore(true)
		}
	}

	const handleReadToggled = async (reportId) => {
		const report = reports.filter(
			(report) => Object.keys(report) == reportId
		)[0]
		const updatedReport = {
			...report,
			[reportId]: {
				...report[reportId],
				read: !report[reportId].read,
			},
		}
		console.log(updatedReport)
		const reportIndex = reports.findIndex(
			(report) => Object.keys(report) == reportId
		)
		reports[reportIndex] = updatedReport
		const updatedReports = [...reports]
		setReports([...reports])
		setFilteredReports([...reports])
		if (readFilter !== "All") {
			setFilteredReports(
				updatedReports.filter((reportObj) => {
					return Object.values(reportObj)[0].read.toString() == readFilter
				})
			)
		}
		const reportDoc = doc(db, "reports", reportId)
		await updateDoc(reportDoc, { read: !report[reportId].read })
			.then(function () {
				console.log("Success")
			})
			.catch(function (error) {
				console.log("error")
			})
	}

	const handleReadFilterChanged = (e) => {
		console.log(e.target.value + "went into function")
		if (e.target.value != "All") {
			setFilteredReports(
				reports.filter((report) => {
					const reportData = Object.values(report)[0]
					return reportData.read.toString() == e.target.value
				})
			)
		} else {
			setFilteredReports(reports)
		}
		// setFilteredReports(reports.filter(report => {
		// 	const reportData = Object.values(report)[0]
		// 	return reportData.read.toString() == e.target.value
		// }))
		setReadFilter(e.target.value)
	}

	function SendLinkByMail(href) {
		var subject = "Misinformation Report"
		var body = "Link to report:\r\n"
		body += window.location.href
		var uri = "mailto:?subject="
		uri += encodeURIComponent(subject)
		uri += "&body="
		uri += encodeURIComponent(body)
		window.open(uri)
	}

	const handleNewReportModal = (e) => {
		e.preventDefault()
		setNewReportModal(true)
	}

	const handleModalShow = async (reportId) => {
		// get doc

		const docRef = await getDoc(doc(db, "reports", reportId))
		// get note
		setNote(docRef.data()["note"])
		setReportTitle(docRef.data()["title"])
		setDetail(docRef.data()["detail"])
		setSelectedLabel(docRef.data()["selectedLabel"])

		if (setSelectedLabel(!selectedLabel)) {
			console.log("changed!!!!!!")
		}

		setInfo(docRef.data())
		getDoc(doc(db, "mobileUsers", docRef.data()["userID"])).then((mobileRef) =>
			setReporterInfo(mobileRef.data())
		)

		const tagsRef = await getDoc(doc(db, "tags", userId))
		setActiveLabels(tagsRef.data()["Labels"]["active"])

		// set report id var
		let reportIdRef = reportId
		setReportModal(true)
		setReportModalId(reportIdRef)
	} // end handleModalShow

	const handleFormSubmit = async (e) => {
		setReportModal(false)
	}

	const handleNoteChange = (e) => {
		if (e.target.value != note) {
			setUpdate(e.target.value)
		} else {
			setUpdate("")
		}
	}

	const handleTitleChange = async (e) => {
		if (e.target.value !== info['title']) {
			setTitle(info['title'])
			setUpdate(e.target.value)
		} else {
			setUpdate("")
		}
	}

	const handleDetailChange = async (e) => {
		if (e.target.value !== info['detail']) {
			setDetail(info['detail'])
			setUpdate(e.target.value)
		} else {
			setUpdate("")
		}
	}

	const handleLabelChange = async (e) => {
		e.preventDefault()
		let reportId = reportModalId
		if (e.target.value !== info['label']) {
				const docRef = doc(db, "reports", reportId)
				await updateDoc(docRef, { label: e.target.value })
				setUpdate(e.target.value)
		} else {
			setUpdate("")
		}
	}

	const handleFormUpdate = async (e) => {
		e.preventDefault()
		setUpdate(true)
		
		let reportId = reportModalId
		const docRef = doc(db, "reports", reportId)
		updateDoc(docRef, {
			note: document.getElementById("note").value,
			title: document.getElementById("title").value,
			detail: document.getElementById("detail").value,
		})
		
		setNote(note)
		setReportTitle(title)
		handleFormSubmit(e)
	}
	
	const handleReportDelete = async (e) => {
		e.preventDefault()
		let reportId = reportModalId
		const docRef = doc(db, "reports", reportId)
		deleteDoc(docRef)
			.then(() => {
				setUpdate(e.target.value)
				setReportModal(false)
				console.log(reportId + ' deleted');
			})
			.catch((error) => {
				console.log('The write failed' + error);
			});
	}

	useEffect(() => {
		// getData()
		if (info["createdDate"]) {
			const options = {
				day: "2-digit",
				year: "numeric",
				month: "short",
				hour: "numeric",
				minute: "numeric",
			}
			setPostedDate(
				info["createdDate"]
					.toDate()
					.toLocaleString("en-US", options)
					.replace(/,/g, "")
					.replace("at", "")
			)
		}
	}, [reportModal])


	useEffect(() => {
		if (info["createdDate"]) {
			const options = {
				day: "2-digit",
				year: "numeric",
				month: "short",
				hour: "numeric",
				minute: "numeric",
			}
			setPostedDate(
				info["createdDate"]
					.toDate()
					.toLocaleString("en-US", options)
					.replace(/,/g, "")
					.replace("at", "")
			)
		}
		if (info["label"]) {
			setSelectedLabel(info["label"])
		}
	}, [info, reportModal])

	useEffect(() => {
		getData()
	}, [update])
	
	return (
		<div className="flex flex-col h-full">
			<div className="flex flex-col md:flex-row py-5 md:justify-between">
				<div className="text-lg font-bold text-blue-600 tracking-wider">
					List of Reports
				</div>
				<div className="flex flex-row justify-between md:justify-evenly">
          <div className="px-4">
            <ReactTooltip
                id="refreshTooltip"
                place="top"
                type="light"
                effect="solid"
                delayShow={500}
              />
              <button
                className="relative top-1"
                onClick={() => getData()}
                data-tip="Refresh"
                data-for="refreshTooltip">
                <IoMdRefresh size={20} />
              </button>
          </div>
					<div>
            <button
              onClick={() => setNewReportModal(true)}
              className="text-sm bg-white px-4 border-none shadow text-black py-1 rounded-md hover:shadow-none active:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600">
              <div className="flex items-center">
              <IoAdd className="mr-1" size={15} />
              New Report
              </div>
            </button>
            				

          </div>


				  <div>
            <select
              id="labels"
              onChange={(e) => handleReadFilterChanged(e)}
              defaultValue="All"
              className="text-sm font-semibold shadow bg-white inline-block px-8 border-none text-black py-1 rounded-md md:mx-2 hover:shadow-none">
              <option value="false">Unread</option>
              <option value="true">Read</option>
              <option value="All">All reports</option>
            </select>
          </div>
          <div>
            <select
              id="labels"
              onChange={(e) => handleDateChanged(e)}
              defaultValue="4"
              className="text-sm font-semibold shadow bg-white inline-block px-8 border-none text-black py-1 rounded-md hover:shadow-none">
              <option value="4">Last four weeks</option>
              <option value="3">Last three weeks</option>
              <option value="2">Last two weeks</option>
              <option value="1">Last week</option>
              <option value="100">All reports</option>
            </select>
          </div>
          </div>
			</div>
			<div className="bg-white w-full rounded-xl p-1">
				<div className="grid grid-cols-8">
					<div className={"col-span-2 " + tableHeadings}>Title</div>
					<div className={tableHeadings}>Date/Time</div>
					<div className={tableHeadings}>Candidates</div>
					<div className={tableHeadings}>Topic Tags</div>
					<div className={tableHeadings}>Sources</div>
					<div className={tableHeadings + " p-1"}>
						Labels 
					</div>
					<div className={tableHeadings}>Read/Unread</div>
				</div>
				<div className="report-list">
					{/*Infinite scroll for the reports to load more reports when user scrolls to bottom*/}
					<InfiniteScroll
						dataLength={endIndex}
						next={handleReportScroll}
						inverse={false} //
						hasMore={hasMore}
						loader={<h4>Loading...</h4>}
						scrollableTarget="scrollableDiv"
						reportTitle={reportTitle}>
						{loadedReports.slice(0, endIndex).map((reportObj) => {
							const report = Object.values(reportObj)[0]
							let reportOGTitle = Object.values(reportObj)[0].title
							
							const posted = report["createdDate"]
								.toDate()
								.toLocaleString("en-US", dateOptions)
								.replace(/,/g, "")
								.replace("at", "")
							const reportIdKey = Object.keys(reportObj)[0].toString()
							
							return (
								<>
									<a
										onClick={() => handleModalShow(Object.keys(reportObj)[0])}
										className="grid grid-cols-8 hover:bg-blue-200 cursor-pointer"
										key={reportIdKey}>
										
										
										
										<div className={"col-span-2 " + columnData}>
											{report.title}
										</div>
										
										
										
										
										
										<div className={columnData}>{posted}</div>
										<div className={columnData}>-</div>
										<div className={columnData}>{report.topic}</div>
										<div className={columnData}>{report.hearFrom}</div>
										<div className={columnData}>
											<div
												className={
													!report.label ? label.default : label.special
												}>
												{report.label || "None"}
											</div>
										</div>
										<div className={columnData}>
											<Switch
												// Set checked to the initial reportRead value (false)
												checked={report.read}
												// When switch toggled setReportRead
												onChange={() =>
													handleReadToggled(Object.keys(reportObj)[0])
												}
												// On click handler
												onClick={(e) => e.stopPropagation()}
												className={`${
													report.read ? "bg-blue-600" : "bg-gray-200"
												} relative inline-flex h-6 w-11 items-center rounded-full`}>
												<span className="sr-only">Mark me</span>
												<span
													aria-hidden="true"
													className={`${
														report.read ? "translate-x-6" : "translate-x-1"
													} inline-block h-4 w-4 transform rounded-full bg-white transition`}
												/>
											</Switch>
										</div>
									</a>
								</>
							)
						})}
					</InfiniteScroll>
					{reportModal && (
						<ReportModal
							reportTitle={reportTitle}
							note={note}
							detail={detail}
							info={info}
							reporterInfo={reporterInfo}
							setReportModal={setReportModal}
							setReportModalId={reportModalId}
							onNoteChange={handleNoteChange}
							onTitleChange={handleTitleChange}
							onDetailChange={handleDetailChange}
							onLabelChange={handleLabelChange}
							selectedLabel={selectedLabel}
							activeLabels={activeLabels}
							changeStatus={changeStatus}
							onFormSubmit={handleFormSubmit}
							onFormUpdate={handleFormUpdate}
							onReportDelete={handleReportDelete}
							setPostedDate={postedDate}
						/>
					)}
				</div>
			</div>
			{newReportModal && (
				<NewReport
					setNewReportModal={setNewReportModal}
				/>
			)}
		</div>
	)
}

export default ReportsSection