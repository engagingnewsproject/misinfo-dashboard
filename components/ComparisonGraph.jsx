import React, { useState, useEffect } from 'react'
import { DateRangePicker } from 'react-date-range'
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { startOfDay, endOfDay, addDays, subDays } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { db } from '../config/firebase'

const ComparisonGraph = ({sevenDayReports, numTopics}) => {
  const [trendingTopics, setTrendingTopics] = useState(sevenDayReports)
  const [dates, setDates] = useState([])
  const [reportData, setData] = useState([])
  const [graphData, setGraphData] = useState([])
  const [dateLabels, setDateLabels] = useState([])
  const [updateGraph, setUpdateGraph] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const defaultStartDay = startOfDay(new Date())
  defaultStartDay.setHours (-24 * 6, 0, 0, 0)
  const [dateRange, setDateRange] = useState([
    {
      startDate: startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      endDate: startOfDay(new Date(Date.now()-1 * 24 * 60 * 60 *1000)),
      key: 'selection'
    }]
  )
  const [showCalendar, setShowCalendar] = useState(0)

  // Retrieves the top three trending topics for the requested date range
  async function getTopics(startDate, endDate) {
    const reportsList = collection(db, "reports");
  
    // Retrieve array of all topics
    const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
    const topicRef = await getDoc(topicDoc);
    const topics = topicRef.get("Topic")['active']
    
    // Maintain count of reports for each topic in the previous day, past three days and past seven days
    const topicsTrending = []

    for (let index = 0; index < topics.length; index++) {
      // Filters report collection so it only shows reports within date range
      const queryTopics= query(reportsList, where("topic", "==", topics[index]), where("createdDate", ">=", startDate),
      where("createdDate", "<", endDate))      
      const dataReports = await getDocs(queryTopics);
      
      // Excludes topics who had no reports within date range
      if (dataReports.size != 0)
        {
          // Maps current topic to the topic's reports and pushes to array
          topicsTrending.push([topics[index], dataReports.size])
        }
    }
    
    // Sorts trending topics for the date range 
    // so that array is ordered from most reported to least reported topics

    const numTopics = topicsTrending.length > 3 ? 3: topicsTrending.length
    const sortedDateRange = [...topicsTrending].sort((a,b) => b[1] - a[1]).slice(0, numTopics);
    setTrendingTopics(sortedDateRange)

  }
  
  // Returns array that holds array of Firebase timestamp for dates within the rage beginning yesterday up until daysAgo.
  // and an array of formatted dates for each of the timestamps, which will be used as the labels for the graph. 
  const getDates = (daysAgo, startDate) => {
    var starting_date = startDate
    const arr = []
    const dates = []
    const formattedDates = []

    // Adds last date in range to the array
    starting_date.setHours(0, 0, 0, 0) 

    // Gets the start of each day within timeline and adds it to the dates array. 
    for (let index = 0; index <= daysAgo; index++) {

      // Only adds labels for the days that are within the requested date range
      formattedDates.push(starting_date.toLocaleString('en-us', { month: "short"}) + ' ' + starting_date.getDate())
      const timestamp = Timestamp.fromDate(starting_date)
      dates.push(timestamp)
      starting_date.setHours(24,0,0,0) // Sets time to midnight of the corresponding day 
    }
    // Adds date after date range to the array
    const timestamp = Timestamp.fromDate(starting_date)
    dates.push(timestamp)

    // arr stores two arrays: one for the timestamps used to filter reports for the specified date, 
    // and one with the formatted date for the graph labels
    arr.push (dates)
    arr.push (formattedDates)
    return arr
  }


  function handleSelect () {
    if (showCalendar == 1)
      {  
        setShowCalendar(0)
      }
    else
      {
        setShowCalendar(1)
      }
  }

  async function getDailyTopicReports() {
    console.log(dateRange[0].startDate)
    console.log(dateRange[0].endDate)
    console.log(dateRange[0])
    const days = Math.ceil((dateRange[0].endDate.getTime()- dateRange[0].startDate.getTime()) / 86400000)
    console.log("days" + days)
    const array = getDates(days, dateRange[0].startDate)

    // Stores dates in format used to query the reports. 
    setDates(array[0])
    
    // Stores date labels used for the x-axis on the comparison chart
    
    console.log("labels: " + array[1])
    setDateLabels (array[1])

    const reportsList = collection(db, "reports");
  
    // Stores the number of times that the topic was reported for each day within timeline
    const topicArray = []
    console.log(trendingTopics.length)
    // Maintain daily count of reports for top three topics within given timeline
    for (let topic = 0; topic < trendingTopics.length; topic++) {
      const numReports = []
      for (let index = 0; index < array[0].length - 1; index++) {

        // Filters report collection so it only shows reports for the current topic on the day at current index in array
        const queryDaily = query(reportsList, where("topic", "==", trendingTopics[topic][0]), where("createdDate", ">=", array[0][index]),
        where("createdDate", "<", array[0][index + 1]))
        const dailyReports = await getDocs(queryDaily);
        numReports.push(dailyReports.size)
        console.log(trendingTopics[topic][0])
        console.log("day:" + array[0][index])
        console.log(dailyReports.size)
      }

      // Keeps track of each topic and the amount of times it was reported each day for the specified timeline
      topicArray.push(numReports)
    }
    setData(topicArray)
  }

  async function getGraphData () {
    const arr = []
    
    // Populates data used for the comparison graph
    for (let topic = 0; topic < trendingTopics.length; topic++) {
      console.log("report data" + reportData[topic])
      const topicData = {
        label: trendingTopics[topic][0],
        data: reportData[topic],
        borderColor: colors[topic],
        backgroundColor: colors[topic],
      }
      arr.push(topicData)
    }
    setGraphData({labels:dateLabels, datasets:arr})
  }

  // On page load (mount), retrieve the reports collection to determine top three trending topics
  useEffect(() => {
    console.log(updateGraph)
    if (updateGraph == true)
      {
        setLoaded(false)
        getTopics(Timestamp.fromDate(dateRange[0].startDate), Timestamp.fromDate(dateRange[0].endDate))
      }
 
  }, [updateGraph]);

  useEffect (()=> {
    getDailyTopicReports()
  }, [trendingTopics]);
  useEffect(()=> {
    getGraphData()
    setLoaded(true)
    setUpdateGraph(false)
  }, [reportData]);
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  )

  // const labels = dateLabels // stores date range which is used as the labels for the X axis
  const colors = ['#F6413A', '#FFCA29', '#2196F3']
  const options = {
    responsive: true,
    scales: {
      y: {
        suggestedMin: 0,
        ticks: {
          precision: 0
        },
        title: {
          text: "Number of Reports",
          display: true
        }
      },
      x: {
        title: {
          text: "Date",
          display: true
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  
  }

  return (
    <div>
      <div class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Daily Topic Reports</div>
        <div class="bg-white rounded-xl mt-6 py-5">
          {showCalendar == 0 ?         
          <button className = "justify-self-end bg-blue-600 text-white py-2 px-5 ml-3 drop-shadow-lg text-sm font-light tracking-wide"
          onClick={() => handleSelect()}>Select dates</button> : 
          <div><button className = "justify-self-end bg-blue-600 text-white py-2 px-5 ml-3 drop-shadow-lg text-sm font-light tracking-wide"
          onClick={() => handleSelect()}>Close calendar</button> 
          
          <DateRangePicker
          onChange={item => setDateRange([item.selection])}
          showSelectionPreview={true}
          moveRangeOnFirstSelection={false}
          months={1}
          maxDate={new Date()}
          ranges={dateRange}
          direction="horizontal"/></div>}
          <button className = "justify-self-end bg-blue-600 text-white py-2 px-5 ml-3 drop-shadow-lg text-sm font-light tracking-wide"
          onClick={() => setUpdateGraph(true)}>Refresh graph</button>
        {loaded ? 
        <Line class="pl-20 pr-20" options={options} data={graphData} /> : <h1>Loading data.</h1>}
      </div>
    </div>
  )
}
export default ComparisonGraph
