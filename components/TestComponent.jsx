import React, { useEffect, useState } from "react"
import TestModal from "./modals/TestModal"
import { getDocs, getDoc, collection, doc, updateDoc } from "firebase/firestore"
import { db } from "../config/firebase"
import Switch from "react-switch"

const TestComponent = () => {
	const userId = localStorage.getItem("userId")
	const [reports, setReports] = useState([])
	const [report, setReport] = useState([])
	const [testModalShow, setTestModalShow] = useState(false)
	const [activeLabels, setActiveLabels] = useState([])
	const [selectedLabel, setSelectedLabel] = useState("")
	const [checkedReports, setCheckedReports] = useState({}) // Store checked state for each report
	const [checked, setChecked] = useState(false) // Store checked state for each report
	const [update, setUpdate] = useState(false)
	const [changedId, setChangedID] = useState("")
	// Modify your existing useEffect to set checkedReports state
	useEffect(() => {
		const fetchReports = async () => {
			const reportsCollection = await getDocs(collection(db, "reports"))
			const reportsArray = reportsCollection.docs.map((doc) => {
				const reportData = doc.data()
				return { id: doc.id, data: reportData, read: reportData.read }
			})
			// Set reports state
			setReports(reportsArray)

			// Initialize checkedReports with read status of each report
			const initialCheckedReports = reportsArray.reduce((acc, report) => {
				acc[report.id] = report.read // Use report ID as key and read status as value
				return acc
			}, {})
			// Set checkedReports state
			setCheckedReports(initialCheckedReports)
		}

		const fetchActiveLabels = async () => {
			// Fetch active labels from Firebase or any other source
			setActiveLabels(["Important", "Flagged"])
		}

		// Call functions to fetch reports and active labels
		fetchReports()
		fetchActiveLabels()
	}, [])

	const handleLabelChange = async (e) => {
		setSelectedLabel(e.target.value)
		// Update label in Firestore or any other action you need
	}

	// Pass this function as a prop to the TestModal component
	const handleModalReadChange = (reportId, newChecked) => {
		setChecked((prevChecked) => ({
			...prevChecked,
			[reportId]: newChecked,
		}))
	}

	const handleReadChange = async () => {
		// console.log(reportId, newReadStatus)
		// setChecked(!checked)
		// Update the read status of the report in Firestore
		console.log(report.id, checked)
		const docRef = doc(db, "reports", report.id)
		await updateDoc(docRef, {
			read: checked,
		})
	}

	const handleFormSubmit = async (e) => {
		e.preventDefault()
		try {
			// Update the 'read' field of the report in Firestore
			console.log(checkedReports[report.id])
			const docRef = doc(db, "reports", report.id)
			await updateDoc(docRef, { read: checkedReports[report.id] })
			// Reset the report state
			setReport({})
			// Close the modal after updating the report
			setTestModalShow(false)
		} catch (error) {
			console.error("Error updating report read status:", error)
			// Handle any errors or display error messages to the user
		}
	}

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

	const handleChange = async (reportId, checked) => {
    setCheckedReports((prevCheckedReports) => ({
        ...prevCheckedReports,
        [reportId]: checked,
    }));

    // Update the Firestore document with the new read status
    const docRef = doc(db, "reports", reportId);
    await updateDoc(docRef, { read: checked });
	}

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
							onChange={(checked) => handleChange(report.id, checked)}
							checked={checkedReports[report.id]}
						/>
					</span>
					{`${report.data.read === true ? "Read" : "unread"}`}
				</div>
			))}
			{testModalShow && (
				<TestModal
					report={report}
					testModalShow={testModalShow}
					setTestModalShow={setTestModalShow}
					activeLabels={activeLabels}
					selectedLabel={selectedLabel}
					onLabelChange={handleLabelChange}
					onReadChange={handleReadChange}
					checked={checkedReports[report.id]} // Pass the checked state for the selected report
					onFormSubmit={handleFormSubmit}
					onModalReadChange={handleModalReadChange} // Add this prop
				/>
			)}
		</>
	)
}

export default TestComponent
