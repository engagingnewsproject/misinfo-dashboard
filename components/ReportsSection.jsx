import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, listCollections, getDoc, getDocs, doc } from "firebase/firestore"; 
import { db } from '../config/firebase'
import Link from 'next/link'

const ReportsSection = () => {

  const [reports, setReports] = useState([])
  const { user } = useAuth()

  const tableHeadings = "p-2 text-center text-sm font-semibold tracking-wide"
  const columnData = "text-center text-sm px-2 py-1 flex items-center justify-center"

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
      //console.log(arr)
      setReports(arr)
    } catch (error) {
      console.log(error)
    }
  }

  // On page load (mount), get the reports from firebase
  useEffect(() => {
    getData()
  }, [])

  return (
    <div class="flex flex-col">
      <div class="text-lg font-bold text-blue-600 tracking-wider py-5">List of Reports</div>
      <div class="bg-white w-full rounded-xl p-1 overflow-auto h-72">
        <div class="grid grid-cols-7">
          <div class={"col-span-2 " + tableHeadings}>Title</div>
          <div class={tableHeadings}>Date/Time</div>
          <div class={tableHeadings}>Candidates</div>
          <div class={tableHeadings}>Topic Tags</div>
          <div class={tableHeadings}>Sources</div>
          <div class={tableHeadings}>Labels</div>
        </div>
        {reports.map((reportObj) => {
          const report = Object.values(reportObj)[0]
          const options = { day: '2-digit', year: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }
          const posted = report["createdDate"].toDate().toLocaleString('en-US', options).replace(/,/g,"").replace('at', '')
          return (
            <Link href={`/dashboard/reports/${Object.keys(reportObj)[0]}`}>
              <a target="_blank" class="grid grid-cols-7 hover:bg-blue-200">
                <div class={"col-span-2 truncate " + columnData}>{report.title}</div>
                <div class={columnData}>{posted}</div>
                <div class={columnData}>None</div>
                <div class={columnData}>{report.topic}</div>
                <div class={columnData}>{report.source}</div>
                <div class={columnData}>
                  <div class="overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl">{report.label || "None"}</div>
                </div>
              </a>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default ReportsSection