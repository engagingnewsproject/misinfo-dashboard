import React, { useState, useEffect } from "react"
import TestModal from "./modals/TestModal"
import { getDoc, doc, updateDoc, onSnapshot, collection } from "firebase/firestore"
import { db } from "../config/firebase"
import { Switch } from '@headlessui/react'

const TestComponent = () => {
	// user
	const userId = localStorage.getItem("userId")
	// report
	const [reports, setReports] = useState([])
	const [report,setReport] = useState("")
	// modal
	const [testModalShow,setTestModalShow] = useState(false)
	// labels
	const [activeLabels, setActiveLabels] = useState([])
	const [selectedLabel,setSelectedLabel] = useState("")
	// read/unread
	const [enabledStates, setEnabledStates] = useState({}); // Object to store enabled state for each report

	const handleTestModalShow = async (reportId) => {
		setTestModalShow(true)

		// Fetch the specific report by ID
		const docRef = await getDoc(doc(db, "reports", reportId))
		const reportData = docRef.data()

		// Set the report object and its ID
		setReport({ id: reportId, ...reportData })

		// Set read to true when user clicks report in list
		setEnabledStates(prevStates => ({
				...prevStates,
				[reportId]: true, // Set enabled state for the clicked report
		}));
		
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

		// Update the label in the Firestore database
		const docRef = doc(db, "reports", report.id)

		// Check if 'label' field exists, if not, create it
		const reportData = {}
		if (report && report.data && !("label" in report.data)) {
			reportData.label = selectedLabel
		}

		// Update the document
		await updateDoc(docRef, reportData)

		// Close the modal
		setTestModalShow(false)
	}

	useEffect(() => {
		// console.log('use effect run')
		const unsubscribe = onSnapshot(collection(db,"reports"),(querySnapshot) => {
			const reportArray = [];
			querySnapshot.forEach((doc) => {
				reportArray.push({ id: doc.id, data: doc.data() });
			});
			setReports(reportArray);
			// console.log("unsubscribe run")
		});

		return () => {
			// Unsubscribe when the component unmounts
			unsubscribe();
		};
	}, [testModalShow]);

	
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
							<Switch
									checked={enabledStates[item.id] || false}
									onChange={(newState) => setEnabledStates(prevStates => ({
											...prevStates,
											[item.id]: newState,
									}))}
									className={`${
											enabledStates[item.id] ? "bg-blue-600" : "bg-gray-200"
									} relative inline-flex h-6 w-11 items-center rounded-full`}>
									<span className='sr-only'>Enable notifications</span>
									<span
											className={`${
													enabledStates[item.id] ? "translate-x-6" : "translate-x-1"
											} inline-block h-4 w-4 transform rounded-full bg-white transition`}
									/>
							</Switch>
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
					// modal
					setTestModalShow={setTestModalShow}
					// labels
					activeLabels={activeLabels}
					selectedLabel={selectedLabel}
					onLabelChange={handleLabelChange}
					// read/unread
					enabled={enabledStates[report.id] || false}
					setEnabled={(newState) => setEnabledStates(prevStates => ({
							...prevStates,
							[report.id]: newState,
					}))}
					// form submit
					onFormSubmit={handleFormSubmit}
				/>
			)}
		</>
	)
}

export default TestComponent
