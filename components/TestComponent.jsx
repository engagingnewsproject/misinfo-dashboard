import React, { useEffect, useState } from "react"
import TestModal from "./modals/TestModal"
import { db } from "../config/firebase"
import {
	onSnapshot,
	getDoc,
	collection,
	doc,
	updateDoc,
} from "firebase/firestore"
import Switch from "react-switch"

const TestComponent = () => {
	const userId = localStorage.getItem("userId")
	const [reports, setReports] = useState([])
	const [agencies, setAgencies] = useState([])
	const [report, setReport] = useState([])
	const [testModalShow, setTestModalShow] = useState(false)
	const [activeLabels, setActiveLabels] = useState([])
	const [selectedLabel, setSelectedLabel] = useState("")
	const [reportsRead, setReportsRead] = useState({}) // Store checked state for each report
	const [update, setUpdate] = useState(false)

	useEffect(() => {
		const reportsUnsubscribe = onSnapshot(
			collection(db, "reports"),
			(querySnapshot) => {
				const reportsArray = []
				querySnapshot.forEach((doc) => {
					reportsArray.push({
						id: doc.id,
						data: doc.data(),
						read: doc.data().read,
					})
				})
				setReports(reportsArray)

				// Initialize reportsRead with read status of each report
				const initialReportsRead = reportsArray.reduce((acc, report) => {
					acc[report.id] = report.read // Use report ID as key and read status as value
					return acc
				}, {})
				// Set reportsRead state
				console.log(initialReportsRead)
				setReportsRead(initialReportsRead)
				// const fetchActiveLabels = async () => {
				// 	// Fetch active labels from Firebase or any other source
				// 	setActiveLabels(["Important", "Flagged"])
				// }
			}
		)
		const agencyUnsubscribe = onSnapshot(
			collection(db, "agency"),
			(querySnapshot) => {
				const agencyArray = []
				querySnapshot.forEach((doc) => {
					agencyArray.push({
						id: doc.id,
						data: doc.data(),
					})
				})
				setAgencies(agencyArray)
			}
		)
		return () => {
			// Unsubscribe when the component unmounts
			reportsUnsubscribe()
			agencyUnsubscribe()
		}
	}, [])
	
	useEffect(() => {
		console.log(reports)
		console.log(agencies)
	}, [])

	const handleLabelChange = async (e) => {
		setSelectedLabel(e.target.value)
		// Update label in Firestore or any other action you need
	}

	// show the modal
	const handleTestModalShow = async (reportId) => {
		// Fetch the specific report by ID
		const docRef = await getDoc(doc(db, "reports", reportId))
		const reportData = docRef.data()

		// Set the report object and its ID
		setReport({ id: reportId, ...reportData })

		// Show the modal
		setTestModalShow(true)

		// Fetch and set active labels
		const tagsRef = await getDoc(doc(db, "tags", userId))
		setActiveLabels(tagsRef.data()["Labels"]["active"])
	}

	// list item handle read change
	const handleChangeRead = async (reportId, checked) => {
		setReportsRead((prevReportsRead) => ({
			...prevReportsRead,
			[reportId]: checked,
		}))
		// Update the Firestore document with the new read status
		const docRef = doc(db, "reports", reportId)
		await updateDoc(docRef, { read: checked })
	}

	// modal item read change
	const handleChangeReadModal = async (reportId, checked) => {
		const docRef = doc(db, "reports", reportId)
		await updateDoc(docRef, { read: checked })
		setUpdate(!update)
	}

	const handleFormSubmit = async (e) => {
		e.preventDefault()
	}
	console.log(reportsRead[report.id])
	return (
		<>
			{reports.map((report) => (
				<div key={report.id} onClick={() => handleTestModalShow(report.id)}>
					<span>{report.data.title}</span>
					<span
						onClick={(e) => {
							e.stopPropagation()
						}}>
						<Switch
							onChange={(checked) => handleChangeRead(report.id, checked)}
							checked={reportsRead[report.id]}
						/>
					</span>
					{`${report.data.read === true ? "Read" : "unread"}`}
				</div>
			))}
			{testModalShow && (
				<TestModal
					report={report}
					setTestModalShow={setTestModalShow}
					activeLabels={activeLabels}
					selectedLabel={selectedLabel}
					onLabelChange={handleLabelChange}
					checked={reportsRead[report.id]} // Pass the checked state for the selected report
					onReadChange={handleChangeReadModal}
					onFormSubmit={handleFormSubmit}
				/>
			)}
		</>
	)
}

export default TestComponent
