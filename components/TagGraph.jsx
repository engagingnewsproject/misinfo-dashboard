/* Displays pie charts or line graph for the trending topics based on which view is selected. */
import React, { useState, useEffect } from 'react'
import { useAuth } from "../context/AuthContext"

import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { db } from '../config/firebase'
import Toggle from './Toggle'
import OverviewGraph from './OverviewGraph'
import ComparisonGraphSetup from './ComparisonGraphSetup'
import { setDefaultResultOrder } from 'dns';

const TagGraph = () => {
	const { user, verifyRole } = useAuth()
  const [viewVal, setViewVal] = useState("overview")
  const [yesterdayReports, setYesterdayReports] = useState([])
  const [threeDayReports, setThreeDayReports] = useState([])
  const [sevenDayReports, setSevenDayReports] = useState([])
  const [numTrendingTopics, setNumTrendingTopics] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [agencyName, setAgencyName] = useState("")
  const [privilege, setPrivilege] = useState(null)
  const [checkRole, setCheckRole] = useState(false)

  // Returns the Firebase timestamp for the beginning of yesterday
  const getStartOfDay = (daysAgo) => {
    var starting_date = new Date()

    // Gets the start of yesterday, it will begin topic search
    // at this time
    starting_date.setHours(-24 * daysAgo,0,0,0) // Sets time to midnight of yesterday
    const timestamp = Timestamp.fromDate(starting_date)
    return timestamp
  }

  // Returns the Firebase timestamp for the beginning of today
  const getEndOfDay = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Sets time to midnight of today

    // Convert to Firebase timestamp to easily compare
    // Gets the time: 11:59 yesterday so it will limit the queries to that date
    const timestamp = Timestamp.fromDate(now)
    return timestamp
  }

  const setRole = () => {
    verifyRole().then((result) => {
      
      // console.log("Current user information " + result.admin)
      if (result.agency) {
        let agencyTempName;
        const agencyCollection = collection(db,"agency")
        const q = query(agencyCollection, where('agencyUsers', "array-contains", user['email']));
        getDocs(q).then((querySnapshot) => {
        querySnapshot.forEach((doc) => { // Set initial values
          // console.log(doc.data())
          agencyTempName = doc.data()['name']
          setAgencyName(agencyTempName)
          setPrivilege("Agency")
        
          })
        })
      } else if (result.admin) {
        // console.log("setting name")
        setAgencyName("")
        setPrivilege("Admin")
      }


    })
  
  }

  async function getTopicReports() {
    const reportsList = collection(db, "reports");
    // console.log("in topic reports")

    // console.log(privilege)
    // Retrieve array of all topics
    const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
    const topicRef = await getDoc(topicDoc);
    const topics = topicRef.get("Topic")['active']
    
    // Maintain count of reports for each topic in the previous day, past three days and past seven days
    const topicsYesterday = []
    const topicsThreeDays = []
    const topicsSevenDays = []

    for (let index = 0; index < topics.length; index++) {

      // Filters report collection so it only shows reports  for current agency, if there is one, from yesterday and for the current topic
      let queryYesterday;
      if (privilege === "Agency") {
        queryYesterday = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(1)),
        where("createdDate", "<", getEndOfDay()), where("agency", "==", agencyName))     
      } else {
        queryYesterday = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(1)),
        where("createdDate", "<", getEndOfDay()))     
      }
      const dataYesterday = await getDocs(queryYesterday);
      
      let queryThreeDays;    
      if (privilege === "Agency") {
        queryThreeDays = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(3)),
        where("createdDate", "<", getEndOfDay()), where("agency", "==", agencyName))

      } else {
        queryThreeDays = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(3)),
        where("createdDate", "<", getEndOfDay()))
      }
      const dataThreeDays = await getDocs(queryThreeDays);

      // Filters report collection so it only shows reports from 7 days ago
      let querySevenDays;
      if (privilege === "Agency") {
        querySevenDays = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(7)),
        where("createdDate", "<", getEndOfDay()), where("agency", "==", agencyName))
      } else {
        querySevenDays = query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", getStartOfDay(7)),
        where("createdDate", "<", getEndOfDay()))
      }
      
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
    // console.log(numTrendingTopics)
    
    // Sorts trending topics for the past day, past three days, and past seven days 
    // so that array is ordered from most reported to least reported topics
    const sortedYesterday = [...topicsYesterday].sort((a,b) => b[1] - a[1]).slice(0, numTopics[0]);
    for (let index = 0; index < sortedYesterday.length; index++) {
      // console.log (sortedYesterday[index])
    }

    const sortedThreeDays = [...topicsThreeDays].sort((a,b) => b[1] - a[1]).slice(0, numTopics[1]);
    for (let index = 0; index < sortedThreeDays.length; index++) {
      // console.log (sortedThreeDays[index])
    }

    const sortedSevenDays = [...topicsSevenDays].sort((a,b) => b[1] - a[1]).slice(0, numTopics[2]);
    for (let index = 0; index < sortedSevenDays.length; index++) {
      // console.log (sortedSevenDays[index])
    }
    const trendingTopics = [["Topics", "Number Reports"]];
    setYesterdayReports(trendingTopics.concat(sortedYesterday))
    setThreeDayReports(trendingTopics.concat(sortedThreeDays))
    setSevenDayReports(trendingTopics.concat(sortedSevenDays))
    setLoaded(true)
  };
  
  // On page load (mount), verify if the current user is an agency
  useEffect(() => {
    // console.log("I am here")
      setRole()
  }, [])

  useEffect(()=> {
    if (privilege) {
    setCheckRole(true)
    }
    
  }, [agencyName, privilege])

  // Gets reports collection to determine top three trending topics after we verify if the current user is an agency..
  useEffect(() => {
    if (checkRole) {
      getTopicReports()
    }
  }, [checkRole])
  
  return (
    <div className="w-full">
    <Toggle viewVal={viewVal} setViewVal={setViewVal}/>
    <div className={viewVal=="overview" ? "block" : "hidden"}><OverviewGraph id="overview" loaded={loaded} yesterdayReports={yesterdayReports} threeDayReports={threeDayReports} 
       sevenDayReports={sevenDayReports}
       numTopics={numTrendingTopics}/>
    </div>
       
    <div className={viewVal=="comparison" ? "block": "hidden"}><ComparisonGraphSetup /></div>
    </div>
  )
}
export default TagGraph

