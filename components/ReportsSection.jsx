import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, listCollections, getDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '../config/firebase'
import Link from 'next/link'
import { Switch } from "@headlessui/react";
import {IoMdRefresh} from "react-icons/io";
import ReactTooltip from "react-tooltip";
import InfiniteScroll from 'react-infinite-scroll-component';

const ReportsSection = ({ search }) => {

  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [loadedReports, setLoadedReports] = useState([])
  const [endIndex, setEndIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [reportWeek, setReportWeek] = useState("4")
  const [readFilter, setReadFilter] = useState("All")
  const { user } = useAuth()
  const dateOptions = { day: '2-digit', year: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }

  const tableHeadings = "p-2 text-center text-sm font-semibold tracking-wide"
  const columnData = "text-center text-sm px-2 py-1 flex items-center justify-center"
  const label = {
    default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
    special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl"
  }
  
  const getData = async() => {
    const reportsCollection = collection(db, "reports")
    const snapshot = await getDocs(reportsCollection)
    
    try {
      var arr = []
      snapshot.forEach(doc => {
        arr.push({
          [doc.id]: doc.data(),
        })
      })

      setReports(arr)
      setFilteredReports(arr)
      setLoadedReports(arr
        .filter((reportObj) => {
          const report = Object.values(reportObj)[0]
          return report["createdDate"].toDate() >= new Date(new Date().setDate(new Date().getDate() - reportWeek * 7))
        })
        .sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1))
    } catch (error) {
      console.log(error)
    }
  }

  const handleDateChanged = (e) => {
    e.preventDefault()
    setReportWeek(e.target.value)
    setEndIndex(0)
    
    // Updates loaded reports so that they only feature reports within the selected date range
    const arr = filteredReports
      
      .filter((reportObj) => {
      const report = Object.values(reportObj)[0]
      return report["createdDate"].toDate() >= new Date(new Date().setDate(new Date().getDate() - e.target.value * 7))
    })
    arr = arr.sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1)
    console.log(arr)
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
        setFilteredReports(reports.filter((reportObj) => {
          return Object.values(reportObj)[0].read.toString() == readFilter
        }))
      } else {
        setFilteredReports(reports)
      }
    } else {
      setFilteredReports(reports.filter((reportObj) => {
      const report = Object.values(reportObj)[0]

      var arr = []
      // Collect the searchable fields of the reports data
      for (const key in report) {
        if (report[key]) {
        if (key != "images" && key != "userID") {
          if (key == "createdDate") {
          const posted = report[key].toDate().toLocaleString('en-US', dateOptions).replace(/,/g,"").replace('at', '')
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

      }))
    }
  }, [search])

  // On page load (mount), get the reports from firebase
  useEffect(() => {
    getData()
  }, [])

  const handleReadToggled = async (reportId) => {
	const report = reports.filter(report => Object.keys(report) == reportId)[0]
	const updatedReport = {
		...report,
		[reportId]: {
			...report[reportId],
			read: !report[reportId].read
		}
	}
	const reportIndex = reports.findIndex(report => Object.keys(report) == reportId)
	reports[reportIndex] = updatedReport
	const updatedReports = [...reports]
	setReports([...reports])
	setFilteredReports([...reports])
	if (readFilter !== "All") {
		setFilteredReports(updatedReports.filter((reportObj) => {
			return Object.values(reportObj)[0].read.toString() == readFilter
		}))
	}
	const reportDoc = doc(db, "reports", reportId)
	await updateDoc(reportDoc, { read: !report[reportId].read }).then(function() {
		console.log("Success")
	}).catch(function(error) {
		console.log("error")
	})
  }

  const handleReadFilterChanged = (e) => {
	console.log(e.target.value + "went into function")
	if (e.target.value != "All") {
		setFilteredReports(reports.filter(report => {
			const reportData = Object.values(report)[0]
			return reportData.read.toString() == e.target.value
		}))
	} else {
		setFilteredReports(reports)
	}
	// setFilteredReports(reports.filter(report => {
	// 	const reportData = Object.values(report)[0]
	// 	return reportData.read.toString() == e.target.value
	// }))
	setReadFilter(e.target.value)
  }


  
  return (
		<div class="flex flex-col h-full">
			<div class="flex flex-row justify-between py-5">
				<div class="text-lg font-bold text-blue-600 tracking-wider">
					List of Reports
				</div>
				<div>
					<select
						id="labels"
						onChange={(e) => handleReadFilterChanged(e)}
						defaultValue="All"
						class="text-sm font-semibold bg-white inline-block px-8 border-none text-black py-1 rounded-md mx-2">
						<option value="false">Unread</option>
						<option value="true">Read</option>
						<option value="All">All reports</option>
					</select>
					<select
						id="labels"
						onChange={(e) => handleDateChanged(e)}
						defaultValue="4"
						class="text-sm font-semibold bg-white inline-block px-8 border-none text-black py-1 rounded-md">
						<option value="4">Last four weeks</option>
						<option value="3">Last three weeks</option>
						<option value="2">Last two weeks</option>
						<option value="1">Last week</option>
						<option value="100">All reports</option>
					</select>
				</div>
			</div>
			<div class="bg-white w-full rounded-xl p-1 h-full">
				<div class="grid grid-cols-8">
					<div class={"col-span-2 " + tableHeadings}>Title</div>
					<div class={tableHeadings}>Date/Time</div>
					<div class={tableHeadings}>Candidates</div>
					<div class={tableHeadings}>Topic Tags</div>
					<div class={tableHeadings}>Sources</div>
					<div class={tableHeadings + " p-1"}>
						Labels (
							<ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
							<button
							
								className="relative top-1"
								onClick={() => getData()}
								
								data-tip="Refresh" 
								>
								<IoMdRefresh size={20} />
								
							</button>
						)
					</div>
					<div class={tableHeadings}>Read/Unread</div>
				</div>
				<div class="oveflow-scroll ">
					{filteredReports
						.filter((reportObj) => {
							const report = Object.values(reportObj)[0];
							return (
								report["createdDate"].toDate() >=
								new Date(
									new Date().setDate(new Date().getDate() - reportWeek * 7)
								)
							);
						})
						.sort((objA, objB) =>
							Object.values(objA)[0]["createdDate"] >
							Object.values(objB)[0]["createdDate"]
								? -1
								: 1
						)
						.map((reportObj) => {
							const report = Object.values(reportObj)[0];
							const posted = report["createdDate"]
								.toDate()
								.toLocaleString("en-US", dateOptions)
								.replace(/,/g, "")
								.replace("at", "");
							
							return (
								<Link href={`/dashboard/reports/${Object.keys(reportObj)[0]}`}>
									<a class="grid grid-cols-8 hover:bg-blue-200">
										<div class={"col-span-2 " + columnData}>{report.title}</div>
										<div class={columnData}>{posted}</div>
										<div class={columnData}>-</div>
										<div class={columnData}>{report.topic}</div>
										<div class={columnData}>{report.hearFrom}</div>
										<div class={columnData}>
											<div
												class={!report.label ? label.default : label.special}>
												{report.label || "None"}
											</div>
										</div>
										<div class={columnData}>
											
											<Switch
												// Set checked to the initial reportRead value (false)
												checked={report.read}
												// When switch toggled setReportRead
												onChange={() => handleReadToggled(Object.keys(reportObj)[0])}
												// On click handler
												// onClick={() => setReportRead(handleReadChange)}
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
								</Link>
							);
						})}
				</div>
			</div>
		</div>
	);
}

export default ReportsSection