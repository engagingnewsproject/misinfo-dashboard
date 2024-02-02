import React, { useState, useEffect } from "react"
import {
	collection,
	getDoc,
	getDocs,
	doc,
	docs,
	query,
	where,
	updateDoc,
	deleteDoc,
	onSnapshot,
} from "firebase/firestore"
import { db } from "../config/firebase"

export function useReports() {
	const [reports, setReports] = useState([])

	useEffect(() => {
		const unsubscribe = onSnapshot(
			collection(db, "reports"),
			(querySnapshot) => {
				const reportArray = []
				querySnapshot.forEach((doc) => {
					const reportData = doc.data()
					const { id } = doc
					reportArray.push({ id, data: reportData, read: reportData.read })
				})
				setReports(reportArray)
			}
		)

		return () => {
			unsubscribe()
		}
	})

	return reports
}
