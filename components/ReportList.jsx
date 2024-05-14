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
import { useTranslation } from "next-i18next"

const ReportList = ({reportView, setReportView}) => {
  const {t} = useTranslation("Home")
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
			<ul className="bg-white p-4 rounded-lg mt-2 flex flex-col divide-y divide-gray-100">
				{reports.map((reportObj, i) => {
					const report = Object.values(reportObj)[0]
					const reportId = Object.keys(reportObj)[0]
					const posted = report["createdDate"]
						.toDate()
						.toLocaleString("en-US", dateOptions)
						.replace(/,/g, "")

					return (
							<li onClick={() => handleReportView(Object.keys(reportObj)[0])} key={i} className="flex gap-4 py-5 pl-4 text-left rounded-lg hover:bg-slate-100 cursor-pointer">
								<div>{posted}</div>
								<div>{report.title}</div>
							</li>
					)
				})}
				{reports == 0 && <div>{t("noReports")}</div>}
			</ul>
		}
		{reportView == 1 &&
			<ReportView reportView={reportView} setReportView={setReportView} reportId={reportId} setReportId={setReportId} />
		}
		</>
	)
	
}
	
export default ReportList