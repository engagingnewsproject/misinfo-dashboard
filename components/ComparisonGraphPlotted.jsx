/*
This component displays the comparison view of the topics selected for the request date range.
The customization features, including the topics list and calendar dropdown, allow the user
to select which topics will be displayed
*/
import React, { useState, useEffect } from 'react'
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
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
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from '../config/firebase'
import ComparisonGraphMenu from './ComparisonGraphMenu'

import _ from "lodash";

const ComparisonGraphPlotted = ({dateRange, setDateRange, selectedTopics, setSelectedTopics, topicList, tab, setTab}) => {

  // Indicates which topics and dates have been selected in the dropdowns. 
  //const [dateRange, setDateRange] = useState([selectedDates])
  //const [selectedTopics, setSelectedTopics] = useState(topicsSelected)
  const [listTopicChoices, setTopicChoices] = useState(topicList)

  // Data that is displayed via the graph.   
  const [reportData, setData] = useState([])
  const [graphData, setGraphData] = useState([])
  const [dateLabels, setDateLabels] = useState([])
  const [dates, setDates] = useState([])
  
  // Indicates when data is ready to be displayed via the graph. 
  const [updateGraph, setUpdateGraph] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Indicates if the number of topics and date range are valid. 
  const [topicError, setTopicError] = useState(false)
  const [dateError, setDateError] = useState(false)

  // Formats and returns date range for the title of the graph.
  const formatDates = () => {
    const startRange = new Date(dates[0] * 1000)
    console.log(dates.length)
    console.log(new Date(dates[dates.length - 2] * 1000))
    const endRange = new Date(dates[dates.length - 2]  * 1000)
    console.log(dates)
    var newDateOptions = {
      month: "2-digit",
      day: "2-digit"
    };

    return startRange.toLocaleString('en-us', newDateOptions) + '-' + endRange.toLocaleString('en-us', newDateOptions)
  }
  
  // Returns array that holds array of Firebase timestamp for dates within the rage beginning yesterday up until daysAgo.
  // and an array of formatted dates for each of the timestamps, which will be used as the labels for the graph. 
  const getDates = (daysAgo) => {

    // Create deep copy of the starting date to prevent the mutation of the original date range state
    const starting_date = _.cloneDeep(dateRange[0].startDate);
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

    // arr stores two arrays: one for the timestamps used to filter reports for the specified dates, 
    // and one with the formatted dates for the graph labels
    arr.push (dates)
    arr.push (formattedDates)
    return arr
  }

  // Retrieves the number of reports for the selected topics and date range.
  const getDailyTopicReports = async() => {
    console.log("before date: " + dateRange[0].endDate.getTime())
    const days = Math.ceil((dateRange[0].endDate.getTime()- dateRange[0].startDate.getTime()) / 86400000)
    const array = getDates(days)
    
    // Stores dates in format used to query the reports. 
    setDates(array[0])

    // Stores date labels used for the x-axis on the comparison chart
    setDateLabels (array[1])

    const reportsList = collection(db, "reports");
  
    // Stores the number of times that the topic was reported for each day within timeline
    const topicArray = []
    
    // Maintain daily count of reports for top three topics within given timeline
    for (let topic = 0; topic < selectedTopics.length; topic++) {
      const numReports = []
      for (let index = 0; index < array[0].length - 1; index++) {

        // Filters report collection so it only shows reports for the current topic on the day at current index in array
        const queryDaily = query(reportsList, where("topic", "==", selectedTopics[topic].value), where("createdDate", ">=", array[0][index]),
        where("createdDate", "<", array[0][index + 1]))
        const dailyReports = await getDocs(queryDaily);
        try {
          numReports.push(dailyReports.size)
          console.log(selectedTopics[topic].value)
          console.log("day:" + array[0][index])
          console.log(dailyReports.size)
        }
        catch (error) {
          console.log(error)
        }
      }

      // Keeps track of each topic and the amount of times it was reported each day for the specified timeline
      topicArray.push(numReports)
    }
    setData(topicArray)
  }
  
  // Formats data using date range and selected topics to display graph.
  const getGraphData = () => {
    const arr = []
    console.log("in graph data")
    // Populates data used for the comparison graph
    for (let topic = 0; topic < selectedTopics.length; topic++) {
      const topicData = {
        label: selectedTopics[topic].label,
        data: reportData[topic],
        borderColor: colors[topic],
        backgroundColor: colors[topic],
      }
      arr.push(topicData)
    }
    setGraphData({labels:dateLabels, datasets:arr})
  }

  // Populates graph with new data for the selected date range and topics once the
  // topic reports have been collected. 
  useEffect(()=> {
    console.log("in use effect")
    console.log(reportData)
    if (updateGraph && !topicError && !dateError) {
      getGraphData()
      setLoaded(true)
      setUpdateGraph(false)
    }
  }, [reportData]);

  // On page load, populates graph with the given topics and date range.
  useEffect (()=> {
    if (loaded == false) {
      getDailyTopicReports()
    }
  }, [loaded]);

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  )

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
          {/* Once user selects the topics and date range, graph of topic reports will be plotted. */}
          <div class="bg-white rounded-xl mt-6 py-5">
          <ComparisonGraphMenu dateRange={dateRange} setDateRange={setDateRange} 
              selectedTopics={selectedTopics} setSelectedTopics={setSelectedTopics}
              listTopicChoices={listTopicChoices} tab={tab} setTab={setTab}
              setTopicError={setTopicError}  topicError={topicError}
              dateError={dateError} setDateError = {setDateError} updateGraph={updateGraph} 
              setUpdateGraph={setUpdateGraph} loaded={loaded} setLoaded={setLoaded}/>

            {/* Displays graph once data is collected for the topics. */}
            {loaded && 
              <div>
                <div class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Topic Reports - {formatDates()}</div>
                <Line class="pl-20 pr-20" options={options} data={graphData} />
              </div>
            } 
            {!loaded && <h1 class="text-center">Collecting data...</h1>}
          </div>
    </div>
  )
}
export default ComparisonGraphPlotted




