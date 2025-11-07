/**
 * @fileoverview Custom Hooks - Firestore data hooks
 *
 * This file provides custom React hooks for working with Firestore data.
 * Features include:
 * - Real-time subscription to the "reports" collection
 * - Paginated user fetching with infinite scroll support
 * - Returns an array of report/user objects with id, data, and status
 *
 * Integrates with:
 * - Firebase Firestore (modular SDK)
 * - Project-wide Firestore instance
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
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

/**
 * useReports Hook
 *
 * Subscribes to the "reports" collection in Firestore and returns an array of reports.
 * Each report object contains the document id, data, and read status.
 *
 * @returns {Array<Object>} Array of report objects: { id, data, read }
 */
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

// Export pagination hooks
export { useUsersPagination, useUserDetailsBatch } from './useUsersPagination'