import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import Toggle from './Toggle'

import OverviewGraph from './OverviewGraph'

const TagGraph = () => {
  const [viewVal, setViewVal] = useState("overview")
  const [yesterdayReports, setYesterdayReports] = useState([])
  const [threeDayReports, setThreeDayReports] = useState([])
  const [sevenDayReports, setSevenDayReports] = useState([])
  const [numTrendingTopics, setNumTrendingTopics] = useState([])
  const styles = {
    checked: "bg-blue-600 text-white py-2 px-5 shadow-sm text-sm font-light tracking-wide",
    unchecked: "bg-white py-2 px-5 shadow-sm text-sm font-light tracking-wide"
  }

  const getStartOfDay = (daysAgo) => {
    var starting_date = new Date()
    // Gets the start of yesterday, it will begin topic search
    // at this time
    starting_date.setHours(-24 * daysAgo,0,0,0) // Sets time to midnight of yesterday
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
    const sortedArray = [...yesterdayReports].sort((a,b) => b.numReports - a.numReports);
    // Sets topic reports to the top three trending topics
    setTopicReports(sortedArray)
  };


  async function getTopicReports() {
    const reportsList = collection(db, "reports");
  
    // Retrieve array of all topics
    const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
    const topicRef = await getDoc(topicDoc);
    const topics = topicRef.get("Topic")['active']
    
    // Maintain count of reports for each topic in the previous day, past three days and past seven days
    const topicsYesterday = []
    const topicsThreeDays = []
    const topicsSevenDays = []

    for (let index = 0; index < topics.length; index++) {

      // Filters report collection so it only shows reports from yesterday and for the current topic
      const queryYesterday = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(1)),
      where("createdDate", "<", getEndOfDay()))      
      const dataYesterday = await getDocs(queryYesterday);
      
      const queryThreeDays= query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(3)),
      where("createdDate", "<", getEndOfDay()))      
      const dataThreeDays = await getDocs(queryThreeDays);

      // Filters report collection so it only shows reports from 7 days ago
      const querySevenDays = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(7)),
      where("createdDate", "<", getEndOfDay()))      
      const dataSevenDays = await getDocs(querySevenDays);
      
      // Excludes topics who had no reports yesterday 
      if (dataYesterday.size != 0)
        {
          // Maps current topic to the topic's reports and pushes to array
          topicsYesterday.push([topics[index], dataYesterday.size])
        }
      if (dataThreeDays.size != 0)
        {
          topicsThreeDays.push([topics[index], dataThreeDays.size])
        }
      if (dataSevenDays.size != 0)
        {
          // Maps current topic to the topic's reports and pushes to array
          topicsSevenDays.push([topics[index], dataSevenDays.size])
        }
    }
    
    // If more than 3 topics were reported, show only the top three trending.
    const numTopics = []
    const numTopicsYesterday = topicsYesterday.length > 2 ? 3: topicsYesterday.length
    numTopics.push(numTopicsYesterday)
    const numTopicsThreeDays = topicsThreeDays.length > 2 ? 3: topicsThreeDays.length
    numTopics.push(numTopicsThreeDays)
    const numTopicsSevenDays = topicsSevenDays.length > 2 ? 3: topicsSevenDays.length
    numTopics.push(numTopicsSevenDays)
    
    
    setNumTrendingTopics (numTopics)
    console.log(numTrendingTopics)
    
    // TODO: Sorts topics from most frequently reported to least frequently reported
    const sortedYesterday = [...topicsYesterday].sort((a,b) => b[1] - a[1]).slice(0, numTopics[0]);
    for (let index = 0; index < sortedYesterday.length; index++) {
      console.log (sortedYesterday[index])
    }

    const sortedThreeDays = [...topicsThreeDays].sort((a,b) => b[1] - a[1]).slice(0, numTopics[1]);
    for (let index = 0; index < sortedThreeDays.length; index++) {
      console.log (sortedThreeDays[index])
    }

    const sortedSevenDays = [...topicsSevenDays].sort((a,b) => b[1] - a[1]).slice(0, numTopics[2]);
    for (let index = 0; index < sortedSevenDays.length; index++) {
      console.log (sortedSevenDays[index])
    }
    const trendingTopics = [["Topics", "Number Reports"]];
    setYesterdayReports(trendingTopics.concat(sortedYesterday))
    setThreeDayReports(trendingTopics.concat(sortedThreeDays))
    setSevenDayReports(trendingTopics.concat(sortedSevenDays))

  };
  
  // On page load (mount), retrieve the reports collection to determine top three trending topics
  useEffect(() => {
      getTopicReports()
  }, [])

  // Query into the reports collection to only retrieve reports whose dates are within the past 3 days
  return (
    <div>
    <Toggle viewVal={viewVal} setViewVal={setViewVal}/>
    { viewVal == "overview" ? <OverviewGraph yesterdayReports={yesterdayReports} threeDayReports={threeDayReports} 
       sevenDayReports={sevenDayReports}
       numTopics={numTrendingTopics}/> : <h1>Comparison view</h1>}
    </div>
  )
}
export default TagGraph