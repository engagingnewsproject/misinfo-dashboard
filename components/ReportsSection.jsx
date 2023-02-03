import React, { useState, useEffect } from 'react'
import { useRouter } from "next/router"
import { useAuth } from '../context/AuthContext'
import { collection, listCollections, getDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '../config/firebase'
import Link from 'next/link'
import { Switch } from "@headlessui/react";
import ReportLink from './ReportLink'
const ReportsSection = ({ search }) => {

  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [reportWeek, setReportWeek] = useState("4")
  const { user } = useAuth()
  const dateOptions = { day: '2-digit', year: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }

  const tableHeadings = "p-2 text-center text-sm font-semibold tracking-wide"
  const columnData = "text-center text-sm px-2 py-1 flex items-center justify-center"
  const label = {
    default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
    special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl"
  }
  
  const [reportRead, setReportRead] = useState(false)
  const [info, setInfo] = useState({})
  // const router = useRouter()
  // const { reportId } = router.query

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
	  // console.log(arr + "testing")
      setFilteredReports(arr)
    } catch (error) {
      console.log(error)
    }
  }

  const getReadData = async() => {
	const infoRef = await getDoc(doc(db, "reports", reportId))
		setInfo(infoRef.data())
		// Reference to the user on firebase
		getDoc(doc(db, "mobileUsers", infoRef.data()["userID"])).then((mobileRef) =>
			setReporterInfo(mobileRef.data())
		)
  }
  const handleDateChanged = (e) => {
    e.preventDefault()
    setReportWeek(e.target.value)
  }

  // Filter the reports based on the search text
  useEffect(() => {
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
  }, [search])

  // On page load (mount), get the reports from firebase
  useEffect(() => {
    getData()
	// Initialize read or not
	reports.forEach(doc => {
		const initRead = info["read"]
		setReportRead(initRead)
	})
  }, [])



  useEffect(() => {
	// If firebase info: read field changes set to the value
	if (reports["read"]) {
		setReportRead(reports["read"])
	}
	}, [reports])

	async function handleReadChange(e, reportId) {
		// Toggle the switch value (true/false)
		e === !e
		// Set a reference to the firebase doc.
		// const docRef = doc(db, "reports", "C0o4XlHgSLWUE9vbJUZP")
		console.log(reportId+ "success")
		// Update firebase doc "read" field
		// await updateDoc(docRef, { read: !e })
		//console.log("success")
	}

	function handleChangeSwitch() {
		setReportRead(!reportRead)
	}

  return (
		<div class="flex flex-col h-full">
			<div class="flex flex-row justify-between py-5">
				<div class="text-lg font-bold text-blue-600 tracking-wider">
					List of Reports
				</div>
				
				
				<div>
					<select
						id="read"
						onChange={(e) => handleDateChanged(e)}
						defaultValue="3"
						class="text-sm font-semibold bg-white inline-block px-8 border-none text-black py-1 rounded-md">
						<option value="3">Unread</option>
						<option value="2">Read</option>
						<option value="1">All</option>
						
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
						<button
							class="bg-blue-500 py-1 px-2 text-white rounded text-xs hover:bg-blue-700"
							onClick={() => getData()}>
							Refresh
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
							const reportId = Object.keys(reportObj)[0]
							// console.log(reportId + "testing")
							const posted = report["createdDate"]
								.toDate()
								.toLocaleString("en-US", dateOptions)
								.replace(/,/g, "")
								.replace("at", "");
							let read = report["read"]
							const readOrNot = read ? true : false
							// if (report["read"]) {
							// 	console.log("read!")
							// 	let read = "yes"
							// } else {
							// console.log("NOT read!")
							// 	let read = "no"
							// }
							
							return (
								// <Link href={`/dashboard/reports/${Object.keys(reportObj)[0]}`}>
								// 	<a class="grid grid-cols-8 hover:bg-blue-200">
								// 		<div class={"col-span-2 " + columnData}>{report.title}</div>
								// 		<div class={columnData}>{posted}</div>
								// 		<div class={columnData}>-</div>
								// 		<div class={columnData}>{report.topic}</div>
								// 		<div class={columnData}>{report.hearFrom}</div>
								// 		<div class={columnData}>
								// 			<div
								// 				class={!report.label ? label.default : label.special}>
								// 				{report.label || "None"}
								// 			</div>
								// 		</div>
								// 		<div class={columnData}>
								// 			<Switch
								// 			// Set checked to the initial reportRead value (false)
								// 			checked={readOrNot}
								// 			// When switch toggled setReportRead
								// 			onChange={setReportRead}
								// 			// On click handler
								// 			// Find a way to pass in the id into the handleReadChange function
								// 			// onClick={() => setReportRead(handleReadChange.bind(Object.keys(reportObj)[0]))}
								// 			onClick={() => console.log("test")}
								// 			className={`${
								// 				readOrNot ? "bg-blue-600" : "bg-gray-200"
								// 			} relative inline-flex h-6 w-11 items-center rounded-full`}>
								// 			<span className="sr-only">Mark me</span>
								// 			<span
								// 				aria-hidden="true"
								// 				className={`${
								// 					readOrNot ? "translate-x-6" : "translate-x-1"
								// 				} inline-block h-4 w-4 transform rounded-full bg-white transition`}
								// 			/>
								// 			</Switch>
								// 		</div>
								// 	</a>
								// </Link>
								<ReportLink reportObj={reportObj} report={report} posted={posted}/>
							);
						})}
				</div>
			</div>
		</div>
	);
}

export default ReportsSection