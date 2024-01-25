import React, { useState, useEffect } from "react"
import TestModal from "./modals/TestModal"
import { getDoc, doc, updateDoc, onSnapshot, collection } from "firebase/firestore"
import { db } from "../config/firebase"

const TestComponent = () => {
	const userId = localStorage.getItem("userId")
	const [testModalShow, setTestModalShow] = useState(false)
	const [reports, setReports] = useState([])
	const [report, setReport] = useState("")
	const [activeLabels, setActiveLabels] = useState([])
	const [selectedLabel, setSelectedLabel] = useState("")

	const handleTestModalShow = async (reportId) => {
		setTestModalShow(true)

		// Fetch the specific report by ID
		const docRef = await getDoc(doc(db, "reports", reportId))
		const reportData = docRef.data()

		// Set the report object and its ID
		setReport({ id: reportId, ...reportData })

		// Set the selected label
		setSelectedLabel(reportData["label"])

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
  const unsubscribe = onSnapshot(collection(db, "reports"), (querySnapshot) => {
    const reportArray = [];
    querySnapshot.forEach((doc) => {
      reportArray.push({ id: doc.id, data: doc.data() });
    });
    setReports(reportArray);
  });

  return () => {
    // Unsubscribe when the component unmounts
    unsubscribe();
  };
}, []);

	
	return (
		<>
			{/* map over reports */}
			{reports.map((item, index) => (
				<ol key={index}>
					<li
						className={`flex justify-between mx-2`}
						onClick={() => handleTestModalShow(item.id)}>
						<span>{item.id}</span>: <span>{item.data.title}</span>:{" "}
						<span>{`--> ${item.data.label}`}</span>
					</li>
				</ol>
			))}
			{/* MODAL */}
			{testModalShow && (
				<TestModal
					report={report}
					setTestModalShow={setTestModalShow}
					activeLabels={activeLabels}
					selectedLabel={selectedLabel}
					onLabelChange={handleLabelChange}
					onFormSubmit={handleFormSubmit}
				/>
			)}
		</>
	)
}

export default TestComponent
