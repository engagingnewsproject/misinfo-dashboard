import React, { useState, useEffect } from "react"
import Link from "next/link"
import ReportView from "./ReportView"
import { reportSystems } from './SettingsReport'
import SettingsReport from "./SettingsReport"

import {
	collection,
	getDoc,
	getDocs,
	doc,
	updateDoc,
	deleteDoc,
} from "firebase/firestore"
import { db } from "../config/firebase"

const ReportList = ({reportView, setReportView}) => {
	const [reports, setReports] = useState([])
	const [report, setReport] = useState('')
	const [reportId, setReportId] = useState('')
	const [update, setUpdate] = useState("")

	const getData = async () => {
		const reportsCollection = collection(db, "reports")
		const snapshot = await getDocs(reportsCollection)
		try {
			var arr = []
			var reportId
			snapshot.forEach((doc) => {
				setReportId(doc.id)
				arr.push({
					[doc.id]: doc.data(),
				})
			})
			arr.sort((a, b) => a > b ? -1 : 1)
			setReports(arr)
		} catch (error) {
			console.log(error)
		}
	}
	const dateOptions = {
		month: "2-digit",
		day: "2-digit",
	}
	
	const handleReportView = (reportId) => {
		setReportView(1)
		setReportId(reportId)
	}
	
	useEffect(() => {
		getData()
	}, [update])
	return (
		<>
		{reportView == 0 &&
			<div className="bg-slate-100 p-4 rounded-lg">
				{reports.map((reportObj, i) => {
					const report = Object.values(reportObj)[0]
					const reportId = Object.keys(reportObj)[0]
					const posted = report["createdDate"]
						.toDate()
						.toLocaleString("en-US", dateOptions)
						.replace(/,/g, "")

					return (
							<button onClick={() => handleReportView(Object.keys(reportObj)[0])} key={i} className="flex gap-4">
								<div>{posted}</div>
								<div>{report.title}</div>
							</button>
					)
				})}
			</div>
		}
		{reportView == 1 &&
			<ReportView reportView={reportView} setReportView={setReportView} reportId={reportId} setReportId={setReportId} />
		}
		</>
	)
	
}
	
export default ReportList