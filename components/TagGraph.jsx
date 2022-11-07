import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import Toggle from './Toggle'

import OverviewGraph from './OverviewGraph'

const TagGraph = () => {
  const [viewVal, setViewVal] = useState("overview")
  const [topicReports, setTopicReports] = useState([])
  const [numTrendingTopics, setNumTrendingTopics] = useState(0)
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
    const topics = topicRef.get("Topic")['active']
    
    // Maintain count of reports for each topic in the previous day
    const topicReportArr = []
    for (let index = 0; index < topics.length; index++) {

      // Filters report collection so it only shows reports from yesterday and for the current topic
      const q = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay()),
      where("createdDate", "<", getEndOfDay()))      
      const topicData = await getDocs(q);
      
      // Excludes topics who had no reports yesterday 
      if (topicData.size != 0)
        {
          const newReport = {
            topic: topics[index],
            reports: topicData.size
          }
          
          // Maps current topic to the topic's reports and pushes to array
          topicReportArr.push([topics[index], topicData.size])
        }
    }
    
    // If more than 3 topics were reported, show only the top three trending.
    const reportedTopics = topicReportArr.length > 2 ? 3: topicReportArr.length
    setNumTrendingTopics (reportedTopics)
    console.log(numTrendingTopics)
    // TODO: Sorts topics from most frequently reported to least frequently reported
    const sortedArray = [...topicReportArr].sort((a,b) => b[1] - a[1]).slice(0, reportedTopics);
    for (let index = 0; index < sortedArray.length; index++) {
      console.log (sortedArray[index])
  
    }
    const trendingTopics = [["Topics", "Number Reports"]];
    setTopicReports(trendingTopics.concat(sortedArray))

  };
  
  // On page load (mount), retrieve the reports collection to determine top three trending topics
  // TODO: figure out how to get Topic Reports before printing
  useEffect(() => {
      getTopicReports()
      // Logs each topic name and the number of times it was reported in the previous day
      /*
      topicReports.forEach(item=> {
        console.log(item.topic + ": " + item.numReports)
      })
      console.log(topicReports.length)
      
      // Logs each topic name and the number of times it was reported in the previous day
      topicReports.forEach(item=> {
        console.log(item.topic + ": " + item.numReports)
      })
      console.log(topicReports.length)
      */
  }, [])

  // Query into the reports collection to only retrieve reports whose dates are within the past 3 days
  return (
    <div>
    <Toggle viewVal={viewVal} setViewVal={setViewVal}/>
    { viewVal == "overview" ? <OverviewGraph topicReports={topicReports} numTopics={numTrendingTopics}/> : <h1>Comparison view</h1>}
    </div>
  )
}
export default TagGraph