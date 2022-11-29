import React, { useState, useEffect } from 'react'
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

const ComparisonGraph = ({sevenDayReports, numTopics, dateRange}) => {
  const [dates, setDates] = useState([])
  const [reportData, setData] = useState([])
  const [dateLabels, setDateLabels] = useState([])
  
  // Returns array that holds array of Firebase timestamp for dates within the rage beginning at DateRange until today,
  // and an array of formatted dates for each of the timestamps, which will be used as the labels for the graph. 
  const getDates = (daysAgo) => {
    var starting_date = new Date()
    const arr = []
    const dates = []
    const formattedDates = []

    // Adds today's date to the array
    starting_date.setHours(0, 0, 0, 0) 
    const today = Timestamp.fromDate(starting_date)
    dates.push(today)

    // Gets the start of each day within timeline and adds it to the dates array. 
    for (let index = 1; index <= daysAgo; index++) {
      starting_date.setHours(-24,0,0,0) // Sets time to midnight of the corresponding day 

      // Only adds labels for the days that are within the requested date range
      formattedDates.unshift(starting_date.toLocaleString('en-us', { month: "short"}) + ' ' + starting_date.getDate())
      const timestamp = Timestamp.fromDate(starting_date)
      dates.unshift(timestamp)
    }
    
    // arr stores two arrays: one for the timestamps used to filter reports for the specified date, 
    // and one with the formatted date for the graph labels
    arr.push (dates)
    arr.push (formattedDates)
    return arr
  }

  async function getDailyTopicReports() {
    const array = getDates(dateRange)
    setDates(array[0])
    setDateLabels (array[1])

    const reportsList = collection(db, "reports");
  
    // Stores the number of times that the topic was reported for each day within timeline
    const topicArray = []

    // Maintain daily count of reports for top three topics within given timeline
    for (let topic = 1; topic < sevenDayReports.length; topic++) {
      const numReports = []
      console.log(array[0].length)
      for (let index = 0; index < array[0].length - 1; index++) {

        // Filters report collection so it only shows reports for the current topic on the day at current index in array
        const queryDaily = query(reportsList, where("topic", "==", sevenDayReports[topic][0]), where("createdDate", ">=", array[0][index]),
        where("createdDate", "<", array[0][index + 1]))
        const dailyReports = await getDocs(queryDaily);
        console.log("num reports" + dailyReports.size)
        numReports.push(dailyReports.size)
      }

      // Keeps track of each topic and the amount of times it was reported each day for the specified timeline
      topicArray.push(numReports)
    }
    setData(topicArray)
    console.log(topicArray)
  }

  // On page load (mount), retrieve the reports collection to determine top three trending topics
  useEffect(() => {
    getDailyTopicReports()

  }, [])

  
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  )

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

  const labels = dateLabels // stores date range which is used as the labels for the X axis
  const arr = []
  const colors = ['#F6413A', '#FFCA29', '#2196F3']

  // Populates data used for the comparison graph
  for (let topic = 1; topic < sevenDayReports.length; topic++) {
    const topicData = {
      label: sevenDayReports[topic][0],
      data: reportData[topic - 1],
      borderColor: colors[topic - 1],
      backgroundColor: colors[topic - 1],
    }
    arr.push(topicData)
  }

  const data = {
  labels,
  datasets: arr,

  }

  return (
    <div>
      <div class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Daily Topic Reports</div>
        <div class="bg-white rounded-xl mt-6 py-5">
        <Line class="pl-20 pr-20" options={options} data={data} />
      </div>
    </div>
  )
}
export default ComparisonGraph
