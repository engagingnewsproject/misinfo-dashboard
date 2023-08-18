import React, { useState, useEffect } from "react"
import ReportView from "./ReportView"
import { useAuth } from "../context/AuthContext"
import {
	collection,
	getDocs,
	query,
	where
} from "firebase/firestore"
import { db } from "../config/firebase"

const ReportList = ({reportView, setReportView}) => {
	const [reports, setReports] = useState([])
	const [reportId, setReportId] = useState('')
	const { user } = useAuth()

	const getData = async () => {
		const reportsRef = collection(db, "reports")
		// Get only reports belonging to the user's accountId
		const q = query(reportsRef, where('userID', "==", user.accountId));
		const snapshot = await getDocs(q)
		try {
			var arr = []
			var reportId
			snapshot.forEach((doc) => {
				setReportId(doc.id) // get and set the report ID
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
	})

	return (
		<>
		{reportView == 0 &&
			<div className="bg-slate-100 p-4 rounded-lg mt-2">
				{reports.map((reportObj, i) => {
					const report = Object.values(reportObj)[0]
					const reportId = Object.keys(reportObj)[0]
					const posted = report["createdDate"]
						.toDate()
						.toLocaleString("en-US", dateOptions)
						.replace(/,/g, "")

					return (
							<button onClick={() => handleReportView(Object.keys(reportObj)[0])} key={i} className="flex gap-4 text-left">
								<div>{posted}</div>
								<div>{report.title}</div>
							</button>
					)
				})}
				{reports == 0 && <div>No reports yet.</div>}
			</div>
		}
		{reportView == 1 &&
			<ReportView reportView={reportView} setReportView={setReportView} reportId={reportId} setReportId={setReportId} />
		}
		</>
	)
	
}
	
export default ReportList