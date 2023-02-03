import React, { useState, useEffect } from 'react'
import { useRouter } from "next/router"
import { useAuth } from '../context/AuthContext'
import { collection, listCollections, getDoc, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '../config/firebase'
import Link from 'next/link'
import { Switch } from "@headlessui/react";

const ReportLink = ({reportObj, report, posted}) => {
    const reportId = Object.keys(reportObj)[0]
    const columnData = "text-center text-sm px-2 py-1 flex items-center justify-center"
    const label = {
      default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
      special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl"
    }
    const readOrNot = report["read"]
    const [info, setInfo] = useState({})
    const [reporterInfo, setReporterInfo] = useState({})
    const [reportRead, setReportRead] = useState(readOrNot)

    const getData = async () => {
		// Reference to the firebase data
		const infoRef = await getDoc(doc(db, "reports", reportId))
		setInfo(infoRef.data())
		// Reference to the user on firebase
		getDoc(doc(db, "mobileUsers", infoRef.data()["userID"])).then((mobileRef) =>
			setReporterInfo(mobileRef.data())
		)
	}

    useEffect(() => {
		getData()
	}, [])

    useEffect(() => {
		// If firebase info: read field changes set to the value
		if (info["read"]) {
			setReportRead(info["read"])
		}
	}, [info])

    async function handleReadChange(e) {
		// Toggle the switch value (true/false)
		e === !e
		// Set a reference to the firebase doc.
		const docRef = doc(db, "reports", reportId)
		// Update firebase doc "read" field
		await updateDoc(docRef, { read: !e })
	}
    
    return (
        <Link href={`/dashboard/reports/${Object.keys(reportObj)[0]}`}>
            <a class="grid grid-cols-8 hover:bg-blue-200">
                <div class={"col-span-2 " + columnData}>{report.title}</div>
                <div class={columnData}>{posted}</div>
                <div class={columnData}>-</div>
                <div class={columnData}>{report.topic}</div>
                <div class={columnData}>{report.hearFrom}</div>
                <div class={columnData}>
                    <div
                        class={!report.label ? label.default : label.special}>
                        {report.label || "None"}
                    </div>
                </div>
                <div class={columnData}>
                    <Switch
                        // Set checked to the initial reportRead value (false)
                        checked={reportRead}
                        // When switch toggled setReportRead
                        onChange={setReportRead}
                        // On click handler
                        onClick={() => setReportRead(handleReadChange)}
                        className={`${
                            reportRead ? "bg-blue-600" : "bg-gray-200"
                        } relative inline-flex h-6 w-11 items-center rounded-full`}>
                        <span className="sr-only">Mark me</span>
                        <span
                            aria-hidden="true"
                            className={`${
                                reportRead ? "translate-x-6" : "translate-x-1"
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                    </Switch>
                </div>
            </a>
        </Link>
    );
}
export default ReportLink