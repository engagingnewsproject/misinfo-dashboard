import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import Toggle from './Toggle'

import OverviewGraph from './OverviewGraph'

const TagGraph = () => {
  const [viewVal, setViewVal] = useState("overview")

  const [topicReports, setTopicReports] = useState([])
  const styles = {
    checked: "bg-blue-600 text-white py-2 px-5 shadow-sm text-sm font-light tracking-wide",
    unchecked: "bg-white py-2 px-5 shadow-sm text-sm font-light tracking-wide"
  }

  const getStartOfDay = () => {
    var days = 1
    var starting_date = new Date()
    // Gets the start of yesterday, it will begin topic search
    // at this time
    starting_date.setHours(-24,0,0,0) // Sets time to midnight of yesterday
    const timestamp = Timestamp.fromDate(starting_date)
    return timestamp
  }

  const getEndOfDay = () => {

    const now = new Date()
    now.setHours(0, 0, 0, 0) // Sets time to midnight of today

    // Convert to Firebase timestamp to easily compare
    // Gets the time: 11:59 yesterday so it will limit the queries to that date
    const timestamp = Timestamp.fromDate(now)
    return timestamp // ex. 1631246400
  }

  // Sorts array that stores topics and their number of reports in trending topics order
  const sortTopics = () => {
    const sortedArray = [...topicReports].sort((a,b) => b.numReports - a.numReports);
    // Sets topic reports to the top three trending topics
    setTopicReports(sortedArray)
  };


  async function getTopicReports() {
    const reportsList = collection(db, "reports");
  
    // Retrieve array of all topics
    const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
    const topicRef = await getDoc(topicDoc);
    const topics = topicRef.get("Topic")['list']
    
    // Maintain count of reports for each topic in the previous day
    const topicReportArr = []
    for (let index = 0; index < topics.length; index++) {
      console.log(topics[index])
      // Filters report collection so it only shows reports from yesterday and for the current topic
      const q = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay()),
      where("createdDate", "<", getEndOfDay()))      
      const topicData = await getDocs(q);

      const newReport = {
        topic: topics[index],
        reports: topicData.size
      }

      // Maps current topic to the topic's reports and pushes to array
      topicReportArr.push(newReport)
    }
    console.log(topicReportArr.length)
    // TODO: Work out sorting issue
    //const sortedArray = [...topicReportArr].sort((a,b) => b.numReports - a.numReports).slice(0,3);

    setTopicReports(topicReportArr)

    // Logs each topic name and the number of times it was reported in the previous day
    topicReports.forEach(item=> {
      console.log(item.topic + ": " + item.numReports)
    })
    console.log(topicReports.length)
    //sortTopics()
  };
  
  // On page load (mount), retrieve the reports collection to determine top three trending topics
  // TODO: figure out how to get Topic Reports before printing
  useEffect(() => {
      getTopicReports()
      
      // Logs each topic name and the number of times it was reported in the previous day
      topicReports.forEach(item=> {
        console.log(item.topic + ": " + item.numReports)
      })
      console.log(topicReports.length)
  }, [])

  // Query into the reports collection to only retrieve reports whose dates are within the past 3 days
  return (
    <div>
    <Toggle viewVal={viewVal} setViewVal={setViewVal}/>
    { viewVal == "overview" ? <OverviewGraph topicReports={topicReports}/> : <h1>Comparison view</h1>}
    </div>
    // {/* Following code will be used to determing which display to show. 
    //     Components need to be made for each display.*/}
  )
}
export default TagGraph