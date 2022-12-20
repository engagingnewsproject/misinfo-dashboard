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
import {
  IoMdCalendar,
  IoMdRefresh,
  IoMdRemove
} from "react-icons/io";
import ReactTooltip from "react-tooltip";
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

const ComparisonGraph = ({sevenDayReports, numTopics}) => {
  const [trendingTopics, setTrendingTopics] = useState([])
  const [dates, setDates] = useState([])
  const [reportData, setData] = useState([])
  const [graphData, setGraphData] = useState([])
  const [dateLabels, setDateLabels] = useState([])
  const [updateGraph, setUpdateGraph] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [plotGraph, setPlotGraph] = useState(false)
  const [listTopicChoices, setTopicChoices] = useState([])

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

  // Styling for graph setting buttons.
  const basicStyle = "flex p-2 my-6 mx-2 text-gray-500 hover:bg-blue-100 rounded-lg"

  // Retrieves the top three trending topics for the requested date range
  async function getTopics(startDate, endDate) {
    const reportsList = collection(db, "reports")
  
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

  // Handles selection for the calendar dropdown. 
  const handleSelect = () =>  {
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
    const days = Math.ceil((dateRange[0].endDate.getTime()- dateRange[0].startDate.getTime()) / 86400000)
    const array = getDates(days, dateRange[0].startDate)

    // Stores dates in format used to query the reports. 
    setDates(array[0])
    
    // Stores date labels used for the x-axis on the comparison chart
    console.log("labels: " + array[1])
    setDateLabels (array[1])

    const reportsList = collection(db, "reports");
  
    // Stores the number of times that the topic was reported for each day within timeline
    const topicArray = []
    
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
  
  // Determines if graph should be refreshed. 
  const handleGraphUpdate = () => {
    if (updateGraph == true)
      {
        setLoaded(false)
        setShowCalendar(0)
        console.log(dateRange)
        getTopics(Timestamp.fromDate(dateRange[0].startDate), Timestamp.fromDate(dateRange[0].endDate))
      }
  }

  const handleDateSelection = (date) =>  {
    console.log(date)
    setDateRange(date)
    setUpdateGraph(true)
  }

  async function getGraphData() {
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

  // Retrieves topic report information when list of topics changes. 
  useEffect (()=> {
    getDailyTopicReports()
  }, [trendingTopics]);

  // Populates graph with new data for the selected date range and topics. 
  useEffect(()=> {
    if (updateGraph) {
      getGraphData()
      setLoaded(true)
      setUpdateGraph(false)
    }
  }, [reportData]);
    // Get all the topic choices
  useEffect (()=> {
    getTopicChoices()
  }, []);

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

  // const listChoices = []
  async function getTopicChoices() {
    const topicDoc = doc(db, "tags", "FKSpyOwuX6JoYF1fyv6b")
    const topicRef = await getDoc(topicDoc);
    const topics = topicRef.get("Topic")['active']
    const topicChoices = []
    for (let index = 0; index < topics.length; index++) {
      console.log(topics[index] + " testing")
    }
    topics.forEach(function(element) {
      topicChoices.push({ label: element, value: element})
    });
    setTopicChoices(topicChoices)
    // return listChoices
  }

  const animatedComponents = makeAnimated();
  const Countries = [
    'this','test'
  ];


  return (
    <div>
      <div class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Compare Topic Reports</div>
        <div class="bg-white rounded-xl mt-6 py-5">
          {!loaded && !updateGraph && <h1 class="pl-3">Select a date range and choose three topics to display graph.</h1>}

          <div class="grid grid-flow-col auto-cols-max">
            {showCalendar == 0 ? 
              <button
                    onClick={() => handleSelect()}
                    data-tip="Select Dates"
                    class={showCalendar == 1 ? basicStyle + " text-stone-400 bg-blue-100" : basicStyle}>
                    <IoMdCalendar size={25} />
                    <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
              </button>
              :
              <button
              onClick={() => handleSelect()}
              data-tip="Close calendar"
              class={showCalendar == 1 ? basicStyle + " text-stone-400 bg-blue-100" : basicStyle}>
              <IoMdRemove size={25} />
              <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
              </button> 
            }
            <button
                  onClick={() => handleGraphUpdate()}
                  data-tip="Refresh Graph"
                  class={basicStyle}>
                  <IoMdRefresh size={25} />
                  <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
            </button>
            <Select options={listTopicChoices} components={animatedComponents} class="flex p-2 my-6 mx-2 text-gray-500"
                isMulti />
            {loaded ? <div class="justify-self-end"><h1 class="text-m font-bold text-blue-600 pt-6 tracking-wider text-center">Topic Reports</h1></div> : null}

          </div>
          {showCalendar == 1 ?     
            <div>    
              <div><DateRangePicker
              onChange={item => handleDateSelection([item.selection])}
              showSelectionPreview={true}
              moveRangeOnFirstSelection={true}
              months={1}
              maxDate={new Date()}
              ranges={dateRange}
              direction="horizontal"/></div>
              {updateGraph && <button
              onClick={() => handleGraphUpdate()}
              data-tip="Refresh Graph"
              class="bg-blue-600 text-white py-2 px-5 pr-20 drop-shadow-lg text-sm font-light align-right justify-end">
                Select dates
              </button>}

            </div>
           : null}
      
          {loaded && <Line class="pl-20 pr-20" options={options} data={graphData} />}
          {!loaded && updateGraph && <h1>Loading data.</h1>}
        </div>
    </div>
  )
}
export default ComparisonGraph



