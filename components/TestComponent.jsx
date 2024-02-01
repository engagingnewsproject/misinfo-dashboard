import React, { useState, useEffect } from "react"
import TestModal from "./modals/TestModal"
import {
	getDoc,
	doc,
	updateDoc,
	onSnapshot,
	collection,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { Switch } from "@headlessui/react"
// Checkbox HELL: https://www.codemzy.com/blog/react-checkbox-not-updating
const TestComponent = () => {
	// user
	const userId = localStorage.getItem("userId")
	// report
	const [reports, setReports] = useState([])
	const [report, setReport] = useState("")
	// modal
	const [testModalShow, setTestModalShow] = useState(false)
	// labels
	const [activeLabels, setActiveLabels] = useState([])
	const [selectedLabel, setSelectedLabel] = useState("")
	// read/unread
	const [read, setRead] = useState(false)
	const [update, setUpdate] = useState(false)

	const handleReadChange = async (reportId) => {
		// Update the read status of the report in Firestore
		const docRef = doc(db, "reports", reportId)
		await updateDoc(docRef, {
			read: read,
		})
		// Toggle the read state
		// setRead(read => !read)
		setRead((prevRead) => !prevRead)
		// setUpdate(!update)
		// Log the value of the read state
		console.log(`Read state after toggling in ID:${reportId} handleReadChange:`, !read)
	}

	// Define a function to update the read state in modal
	const updateReadState = (newReadState) => {
		setRead(newReadState)
	}

	const handleTestModalShow = async (reportId) => {
		// Fetch the specific report by ID
		const docRef = await getDoc(doc(db, "reports", reportId))
		const reportData = docRef.data()

		// Set the report object and its ID
		setReport({ id: reportId, ...reportData })

		// if report is unread, mark it as read
		if (!reportData.read) {
			handleReadChange(reportId)
		}

		// Show the modal
		setTestModalShow(true)

		// Fetch and set active labels
		const tagsRef = await getDoc(doc(db, "tags", userId))
		setActiveLabels(tagsRef.data()["Labels"]["active"])
	}

	const handleLabelChange = async (e) => {
		e.preventDefault()
		const selectedValue = e.target.value
		setSelectedLabel(selectedValue)
		const docRef = doc(db, "reports", report.id) // Use report.id instead of reportId
		await updateDoc(docRef, { label: e.target.value })
	}

	const handleFormSubmit = async (e) => {
		e.preventDefault()

		// Update the label and read status in the Firestore database
		const docRef = doc(db, "reports", report.id)
		await updateDoc(docRef, {
			label: selectedLabel,
			read: read, // Update the "read" field in Firestore
		})

		// Close the modal
		setTestModalShow(false)
	}

	useEffect(() => {
		const unsubscribe = onSnapshot(
			collection(db, "reports"),
			(querySnapshot) => {
				const reportArray = []
				querySnapshot.forEach((doc) => {
					const reportData = doc.data()
					const { id } = doc
					const read = reportData.read // Fetch read field from Firestore
					reportArray.push({ id, data: reportData, read }) // Include read field in report object
				})
				setReports(reportArray)
			}
		)

		return () => {
			unsubscribe()
		}
	}, [update])

	// Inside your useEffect hook in TestComponent where you fetch reports:
	// useEffect(() => {
	// 	console.log("Reports in useEffect:", reports)
	// }, [reports])

	return (
		<>
			{/* map over reports */}
			{reports.map((item, index) => (
				<ol key={index}>
					<li
						className={`flex justify-between mx-2`}
						onClick={() => handleTestModalShow(item.id)}>
						<span>{item.id}</span>: <span>{item.data.title}</span>:{" "}
						<span onClick={(e) => e.stopPropagation()}>
							{" "}
							<input
								type='checkbox'
								id={`checkbox-${item.id}`}
								checked={item.read}
								onChange={() => {
									console.log(
										`Read state before toggling in ID:${item.id} <input>:`,
										item.read
									)
									handleReadChange(item.id)
								}}
							/>
						</span>
						<span>{`--> ${item.data.label}`}</span>
					</li>
				</ol>
			))}
			{/* MODAL */}
			{testModalShow && (
				<TestModal
					// report
					report={report}
					reports={reports}
					// modal
					testModalShow={testModalShow}
					setTestModalShow={setTestModalShow}
					// labels
					activeLabels={activeLabels}
					selectedLabel={selectedLabel}
					onLabelChange={handleLabelChange}
					// read/unread
					read={read} // Pass the read state to TestModal
					onReadChange={updateReadState} // Pass the function to update the read state
					// form submit
					onFormSubmit={handleFormSubmit}
				/>
			)}
		</>
	)
}

export default TestComponent
