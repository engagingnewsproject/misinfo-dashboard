import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, listCollections, getDoc, getDocs, doc } from "firebase/firestore"; 
import { db } from '../config/firebase'
import Link from 'next/link'

const ReportsSection = ({ search }) => {

  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const { user } = useAuth()
  const dateOptions = { day: '2-digit', year: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }

  const tableHeadings = "p-2 text-center text-sm font-semibold tracking-wide"
  const columnData = "text-center text-sm px-2 py-1 flex items-center justify-center"
  const label = {
    default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
    special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl"
  }

  const getData = async() => {
    const reportsCollection = collection(db, "reports")
    const snapshot = await getDocs(reportsCollection)
    
    try {
      var arr = []
      snapshot.forEach(doc => {
        arr.push({
          [doc.id]: doc.data(),
        })
      })

      setReports(arr)
      setFilteredReports(arr)
    } catch (error) {
      console.log(error)
    }
  }

  // Filter the reports based on the search text
  useEffect(() => {
    setFilteredReports(reports.filter((reportObj) => {
      const report = Object.values(reportObj)[0]
      var arr = []
      // Collect the searchable fields of the reports data
      for (const key in report) {
        if (report[key]) {
          if (key != "images" && key != "userID") {
            if (key == "createdDate") {
              const posted = report[key].toDate().toLocaleString('en-US', dateOptions).replace(/,/g,"").replace('at', '')
              arr.push(posted.toLowerCase())
            } else {
              arr.push(report[key].toString().toLowerCase())
            }
          }
        }
      }

      // check if the search text is in the collected fields
      for (const str of arr) {
        if (str.includes(search.toLowerCase())) {
          return true
        }
      }

    }))
  }, [search])

  // On page load (mount), get the reports from firebase
  useEffect(() => {
    getData()
  }, [])


  return (
    <div class="flex flex-col">
      <div class="text-lg font-bold text-blue-600 tracking-wider py-5">List of Reports</div>
      <div class="bg-white w-full rounded-xl p-1 h-72">
        <div class="grid grid-cols-7">
          <div class={"col-span-2 " + tableHeadings}>Title</div>
          <div class={tableHeadings}>Date/Time</div>
          <div class={tableHeadings}>Candidates</div>
          <div class={tableHeadings}>Topic Tags</div>
          <div class={tableHeadings}>Sources</div>
          <div class={tableHeadings}>Labels</div>
        </div>
        <div class="overflow-auto h-56 md:h-60">
          {filteredReports
            .sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1)
            .map((reportObj) => {
            const report = Object.values(reportObj)[0]
            const posted = report["createdDate"].toDate().toLocaleString('en-US', dateOptions).replace(/,/g,"").replace('at', '')
            return (
              <Link href={`/dashboard/reports/${Object.keys(reportObj)[0]}`}>
                <a target="_blank" class="grid grid-cols-7 hover:bg-blue-200">
                  <div class={"col-span-2 " + columnData}>{report.title}</div>
                  <div class={columnData}>{posted}</div>
                  <div class={columnData}>-</div>
                  <div class={columnData}>{report.topic}</div>
                  <div class={columnData}>{report.hearFrom}</div>
                  <div class={columnData}>
                    <div class={!report.label ? label.default : label.special}>{report.label || "None"}</div>
                  </div>
                </a>
              </Link>
            )
          })}
        </div>
        
      </div>
    </div>
  )
}

export default ReportsSection