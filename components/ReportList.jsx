/**
 * @fileoverview ReportList Component
 * 
 * A simple list component that displays user-specific reports with date-based sorting.
 * Provides a clickable list interface that transitions to detailed report view.
 * Fetches reports from Firestore based on user's account ID and displays them
 * in chronological order (newest first).
 * 
 * Key Features:
 * - User-specific report filtering by account ID
 * - Date-based sorting (newest reports first)
 * - Clickable list items for report navigation
 * - Conditional rendering between list and detail view
 * - Responsive design with hover effects
 * - Internationalization support
 * 
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

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

/**
 * ReportList Component
 * 
 * Displays a list of user-specific reports with navigation to detailed view.
 * Handles data fetching, sorting, and view state management between list
 * and detail views.
 * 
 * @param {Object} props - Component props
 * @param {number} props.reportView - Current view state (0 = list, 1 = detail)
 * @param {Function} props.setReportView - Function to change view state
 * @returns {JSX.Element} The rendered report list or detail view component
 * 
 * @example
 * <ReportList 
 *   reportView={0}
 *   setReportView={setReportView}
 * />
 */
const ReportList = ({reportView, setReportView}) => {
  // Internationalization hook for text translations
  const {t} = useTranslation("Home")
  
  // Component state management
  const [reports, setReports] = useState([]) // Array of report objects
  const [reportId, setReportId] = useState('') // Currently selected report ID
  const { user } = useAuth() // Authentication context

  /**
   * Fetches user-specific reports from Firestore
   * Filters reports by user's account ID and sorts by creation date
   * 
   * @async
   * @function getData
   * @returns {Promise<void>}
   */
  const getData = async () => {
    const reportsRef = collection(db, "reports")
    // Get only reports belonging to the user's accountId
    const q = query(reportsRef, where('userID', "==", user.accountId));
    const snapshot = await getDocs(q)
    try {
      var arr = []
      snapshot.forEach((doc) => {
        setReportId(doc.id) // get and set the report ID
        arr.push({
          [doc.id]: doc.data(),
        })
      })
      // Sort based on creation date (newest first)
      arr.sort((a, b) => {
        const dateA = Object.values(a)[0].createdDate.toDate();
        const dateB = Object.values(b)[0].createdDate.toDate();
        return dateB - dateA; // Sort descending by date
      });
      setReports(arr)
    } catch (error) {
      console.log(error)
    }
  }
  
  // Date formatting options for display
  const dateOptions = {
    month: "2-digit",
    day: "2-digit",
  }
  
  /**
   * Handles report selection and transitions to detail view
   * 
   * @function handleReportView
   * @param {string} reportId - ID of the selected report
   */
  const handleReportView = (reportId) => {
    setReportView(1) // Switch to detail view
    setReportId(reportId) // Set the selected report ID
  }
  
  // Data fetching effect - triggers when user changes
  useEffect(() => {
    if (user && user.accountId) {
      getData();
    }
  }, [user])

  return (
    <>
      {/* Report List View (reportView === 0) */}
      {reportView == 0 &&
        <ul className="bg-white p-4 rounded-lg mt-2 flex flex-col divide-y divide-gray-100">
          {reports.map((reportObj, i) => {
            const report = Object.values(reportObj)[0] // Extract report data
            const reportId = Object.keys(reportObj)[0] // Extract report ID
            const posted = report["createdDate"]
              .toDate()
              .toLocaleString("en-US", dateOptions)
              .replace(/,/g, "") // Format date for display

            return (
              <li 
                onClick={() => handleReportView(Object.keys(reportObj)[0])} 
                key={i} 
                className="flex gap-4 py-5 pl-4 text-left rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <div>{posted}</div> {/* Display formatted date */}
                <div>{report.title}</div> {/* Display report title */}
              </li>
            )
          })}
          {/* No reports message */}
          {reports == 0 && <div>{t("noReports")}</div>}
        </ul>
      }
      
      {/* Report Detail View (reportView === 1) */}
      {reportView == 1 &&
        <ReportView 
          reportView={reportView} 
          setReportView={setReportView} 
          reportId={reportId} 
          setReportId={setReportId} 
        />
      }
    </>
  )
}

export default ReportList