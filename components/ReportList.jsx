import React, { useState, useEffect } from "react"
import Link from "next/link"


import {
	collection,
	getDoc,
	getDocs,
	doc,
	updateDoc,
	deleteDoc,
} from "firebase/firestore"
import { db } from "../config/firebase"

const ReportList = () => {
	const [reports, setReports] = useState([])
	const [update, setUpdate] = useState("")
	const [reportId, setReportId] = useState('')
	
	const getData = async () => {
		const reportsCollection = collection(db, "reports")
		const snapshot = await getDocs(reportsCollection)
		try {
			var arr = []
			var reportId
			snapshot.forEach((doc) => {
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
	useEffect(() => {
		getData()
	}, [update])
	
	return (
		<>
			<div className="bg-slate-100 p-4 rounded-lg">
				{reports.map((reportObj, i) => {
					const report = Object.values(reportObj)[0]
					const reportId = Object.keys(reportObj)[0]
					const posted = report["createdDate"]
						.toDate()
						.toLocaleString("en-US", dateOptions)
						.replace(/,/g, "")

					return (
							<Link href="" key={reportId} className="flex gap-4">
								<div>{posted}</div>
								<div>{report.title}</div>
							</Link>
					)
				})}
			</div>
		</>
	)
	
}
	
export default ReportList