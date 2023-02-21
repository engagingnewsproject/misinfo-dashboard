import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, listCollections, getDoc, getDocs, doc } from "firebase/firestore"; 
import { db } from '../config/firebase';
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link'
import NewReportModal from './modals/NewReportModal'
import { AiOutlinePlus } from 'react-icons/ai'

const ReportsSection = ({ search }) => {

  const [reports, setReports] = useState([])
  const [newReport, setNewReport] = useState(false)
  const [filteredReports, setFilteredReports] = useState([])
  const [loadedReports, setLoadedReports] = useState([])
  const [endIndex, setEndIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [reportWeek, setReportWeek] = useState("4")
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
      setLoadedReports(arr
        .filter((reportObj) => {
          const report = Object.values(reportObj)[0]
          return report["createdDate"].toDate() >= new Date(new Date().setDate(new Date().getDate() - reportWeek * 7))
        })
        .sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1))
    } catch (error) {
      console.log(error)
    }
  }

  const handleDateChanged = (e) => {
    e.preventDefault()
    setReportWeek(e.target.value)
    setEndIndex(0)
    
    // Updates loaded reports so that they only feature reports within the selected date range
    const arr = filteredReports
      
      .filter((reportObj) => {
      const report = Object.values(reportObj)[0]
      return report["createdDate"].toDate() >= new Date(new Date().setDate(new Date().getDate() - e.target.value * 7))
    })
    arr = arr.sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1)
    console.log(arr)
    setLoadedReports(arr)
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

  // Updates the loaded reports whenever a user filters reports based on search.
  useEffect(() => {
    const arr = filteredReports
      .filter((reportObj) => {
        const report = Object.values(reportObj)[0]
        return report["createdDate"].toDate() >= new Date(new Date().setDate(new Date().getDate() - reportWeek * 7))
      })
    arr = arr.sort((objA, objB) => Object.values(objA)[0]["createdDate"] > Object.values(objB)[0]["createdDate"] ? -1 : 1)
    
    // Default values for infinite scrolling, will load reports as they are populated.
    setEndIndex(0)
    setHasMore(true)
    setLoadedReports(arr)
    }, [filteredReports])
    
    // Populates the loaded reports as the user scrolls to bottom of page
    useEffect(() => {
      if (loadedReports.length != 0) {
        handleReportScroll()
      }
    }, [loadedReports])
  
  // Determines if there are more reports to be shown.
  const handleReportScroll = () => {
    // If all of the reports have been loaded
    if (endIndex >= loadedReports.length) {
      setHasMore(false)
    
    // If there is less than 14 reports to load, load remaining reports
    } else if ((endIndex + 14) >=  loadedReports.length) {
      setEndIndex(loadedReports.length)   
      setHasMore(true) 
    
    // Load only 14 additional reports
    } else {
      setEndIndex(endIndex + 14)
      setHasMore(true)
    }
}

  
  return (
    <div class="flex flex-col h-full">
      <div class="flex flex-row justify-between py-5">
        <div class="text-lg font-bold text-blue-600 tracking-wider">List of Reports</div>
        <div>
          <button
            onClick={() => setNewReport(true)}
            class="flex flex-row text-sm bg-white inline-block px-4 border-none text-black py-1 rounded-md">
            <AiOutlinePlus class = "my-1" size = {15}/> 
            Create New Report
          </button>
        </div>
        {newReport && <NewReportModal setNewReport={setNewReport} />}
        <div>
          <select id="labels" onChange={(e) => handleDateChanged(e)} defaultValue="4" class="text-sm font-semibold bg-white inline-block px-8 border-none text-black py-1 rounded-md">
            <option value="4">Last four weeks</option>
            <option value="3">Last three weeks</option>
            <option value="2">Last two weeks</option>
            <option value="1">Last week</option>
          </select>
        </div>
      </div>
      <div class="bg-white w-full h-auto rounded-xl p-1">
        <div class="grid grid-cols-7">
          <div class={"col-span-2 " + tableHeadings}>Title</div>
          <div class={tableHeadings}>Date/Time</div>
          <div class={tableHeadings}>Candidates</div>
          <div class={tableHeadings}>Topic Tags</div>
          <div class={tableHeadings}>Sources</div>
          <div class={tableHeadings + " p-1"}>Labels (<button class="bg-blue-500 py-1 px-2 text-white rounded text-xs hover:bg-blue-700" onClick={() => getData()}>Refresh</button>)</div>
        </div>

  
        <div>

            {/*Infinite scroll for the reports to load more reports when user scrolls to bottom*/}
            <InfiniteScroll
              dataLength={endIndex}
              next={handleReportScroll}
              inverse={false} //
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
              scrollableTarget="scrollableDiv"
            >
          {loadedReports.slice(0, endIndex)
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
            })
          }
          </InfiniteScroll>
        </div>
        
      </div>
    </div>
  )
}

export default ReportsSection