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
  IoMdRemove,
  IoIosAlert,
  IoIosArrowForward,
  IoIosArrowBack,
  IoIosWarning
} from "react-icons/io";
import ReactTooltip from "react-tooltip";
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import _ from "lodash";

const ComparisonGraph = () => {
  const [trendingTopics, setTrendingTopics] = useState([])
  const [selectedTopics, setSelectedTopics] = useState([])
  const [dates, setDates] = useState([])
  const [reportData, setData] = useState([])
  const [graphData, setGraphData] = useState([])
  const [dateLabels, setDateLabels] = useState([])
  const [updateGraph, setUpdateGraph] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [plotGraph, setPlotGraph] = useState(false)
  const [listTopicChoices, setTopicChoices] = useState([])
  const [tab, setTab] = useState(0)
  const [topicError, setTopicError] = useState(false)
  const [dateError, setDateError] = useState(false)

  const defaultStartDay = startOfDay(new Date())
  defaultStartDay.setHours (-24 * 6, 0, 0, 0)
  const [dateRange, setDateRange] = useState([
    {
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
      key: 'selection'
    }]
  )
  const [showCalendar, setShowCalendar] = useState(0)

  // Styling for graph setting buttons.
  const basicStyle = "flex p-2 my-6 mx-2 text-gray-500 hover:bg-blue-100 rounded-lg"

  // Border style used for the topic select dropdown for error handling.
  const borderStyle = {
    control: (base) => ({
      ...base,
      border: 0,
      boxShadow: "none"
    })
  };

  const errorOutline = "border-2 border-rose-600"

  // Formats and returns date range
  const formatDates = () => {
    // const startRange = dateRange[0].startDate
    // const endRange = dateRange[0].endDate
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

      // Maps current topic to the topic's reports and pushes to array
      topicsTrending.push([topics[index], dataReports.size])

    }
    
    // Sorts trending topics for the date range 
    // so that array is ordered from most reported to least reported topics
    const numTopics = topicsTrending.length > 3 ? 3: topicsTrending.length
    const sortedTopics= [...topicsTrending].sort((a,b) => b[1] - a[1]).slice(0, numTopics);
    setTrendingTopics(sortedTopics)

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
    console.log("end of function: " + dateRange[0].startDate)
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
  
  // Retrieves the number of reports for the selected topics and date range.
  const getDailyTopicReports = async() => {
    const days = Math.ceil((dateRange[0].endDate.getTime()- dateRange[0].startDate.getTime()) / 86400000)
    const array = getDates(days)
    
    // Stores dates in format used to query the reports. 
    setDates(array[0])


    // Stores date labels used for the x-axis on the comparison chart
    console.log("labels: " + array[1])
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
        numReports.push(dailyReports.size)
        console.log(selectedTopics[topic].value)
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
    const daysSelected = (dateRange[0].endDate - dateRange[0].startDate)/(1000*60*60*24)
    if (updateGraph == true && selectedTopics.length == 3 && daysSelected > 2 && daysSelected < 22)
      {
        setTopicError(false)
        setDateError(false)
        setLoaded(false)
        setShowCalendar(0)
        console.log(dateRange)
        console.log("selected topics" + selectedTopics)
        getDailyTopicReports()
       // getTopics(Timestamp.fromDate(dateRange[0].startDate), Timestamp.fromDate(dateRange[0].endDate))
      }
    if (updateGraph == true && selectedTopics.length != 3) {
      setTopicError(true)
    }
    if (updateGraph && (daysSelected < 3 || daysSelected > 22)) {
      setDateError(true)
    }
  }

  const handleDateSelection = (item) =>  {
    if (item.selection.endDate !== item.selection.startDate) {
        console.log(item)
        setDateRange([item.selection])
        setUpdateGraph(true)
    } 
  }

  // Formats data using date range and selected topics to display graph.
  async function getGraphData() {
    const arr = []
    
    // Populates data used for the comparison graph
    for (let topic = 0; topic < selectedTopics.length; topic++) {
      console.log("report data" + reportData[topic])
      const topicData = {
        label: selectedTopics[topic].label,
        data: reportData[topic],
        borderColor: colors[topic],
        backgroundColor: colors[topic],
      }
      arr.push(topicData)
    }
    console.log("date range" + dateRange[0].startDate)    
    console.log("end date range" + dateRange[0].endDate)

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

  // Sets update graph to be true whenever the selected topics are changed.
  useEffect (()=> {
    setUpdateGraph(true)
  }, [selectedTopics]);


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

  const handleGraphChange = () => {
    const daysSelected = (dateRange[0].endDate - dateRange[0].startDate)/(1000*60*60*24)
    if (daysSelected > 2 && daysSelected < 22) {
      setPlotGraph(true)
    } else {
      setPlotGraph(false)
      setDateError(true)
    }
    handleGraphUpdate()
  }

  // Ensures that only three topics are selected and displays error otherwise.
  const handleTopicSelection = () => {
    console.log(selectedTopics)
    if (selectedTopics.length != 3) {
      setTopicError(true)
    } else  {
      setTopicError(false)
      setTab(1)
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
      <h1 class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Compare Topic Reports</h1>
          {!plotGraph &&
            <div>
              {tab == 0 && 
                <div class="flex items-center justify-center">
                <div class="bg-white rounded-xl mt-6 py-5 pl-3 pr-3 w-1/2">
                  <h1 class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Select three topics.</h1>
                  <h1 class="pl-3 pb-4 text-center">Choose which topics you would like to compare.</h1>
                  {topicError && <h1 class="pl-3 pb-4 text-center text-red-500">You must choose three topics to compare.</h1>}
                  <Select options={listTopicChoices} components={animatedComponents}
                  isMulti 
                  onChange={item => setSelectedTopics(item)}
                  closeMenuOnSelect={false}
                  value={selectedTopics}
                  />
                </div>
                <button
                  onClick={() => handleTopicSelection()}
                  data-tip="Next"
                  class={showCalendar == 1 ? basicStyle + " text-stone-400 bg-blue-100" : basicStyle}>
                  <IoIosArrowForward size={25} />
                  <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
                </button>
                </div>
              }
              {tab == 1 &&
                <div class="flex items-center justify-center">
                 <button
                    onClick={() => setTab(0)}
                    data-tip="Previous"
                    class={showCalendar == 1 ? basicStyle + " text-stone-400 bg-blue-100" : basicStyle}>
                    <IoIosArrowBack size={25} />
                    <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
                  </button>
                  <div class="bg-white rounded-xl mt-6 py-5 pl-3 pr-3">
                    <h1 class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Select dates</h1>
                    <h1 class="pl-3 text-center">Select a date range to collect the number of reports for the selected topics. </h1>
                    {dateError && <h1 class="pl-3 pb-4 text-center text-red-500">You must select a date range of at least three days and no more than three weeks.</h1>}
                    <DateRangePicker
                    onChange={item => handleDateSelection(item)}
                    showSelectionPreview={true}
                    moveRangeOnFirstSelection={false}
                    months={1}
                    maxDate={new Date()}
                    ranges={dateRange}
                    direction="horizontal"/>
                  </div>
                  <button
                    onClick={() => handleGraphChange()}
                    data-tip="Display graph"
                    class={showCalendar == 1 ? basicStyle + " text-stone-400 bg-blue-100" : basicStyle}>
                    <IoIosArrowForward size={25} />
                    <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
                  </button>
                </div>
              }
            </div>}
          {plotGraph && 
            <div class="bg-white rounded-xl mt-6 py-5">
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
              <div class={"flex justify-between items-center"}>
                
                <div class={topicError ? errorOutline : null}>
                  <Select options={listTopicChoices} components={animatedComponents}
                      isMulti 
                      error={topicError}
                      onChange={item => setSelectedTopics(item)}
                      closeMenuOnSelect={false}
                      value={selectedTopics}
                      styles={topicError && borderStyle}
                    />
                </div>
                {(topicError || dateError) && 
                  <div class="flex flex-cols text-black	bg-red-200 rounded p-3 ml-2 border-2 border-rose-600">
                    <IoIosAlert size={25} />
                    <div class="inline-block">
                        {topicError && <h1 class="pl-3">You must choose three topics to compare.</h1>}
                        {dateError && <h1 class="pl-3">You must select a date range of at least three days and no more than three weeks.</h1>}
                    </div>
                  </div>
                }
              </div>

            </div>
            {showCalendar == 1 &&  
              <div>    
                <div>
                  <DateRangePicker
                  onChange={item => handleDateSelection(item)}
                  showSelectionPreview={true}
                  moveRangeOnFirstSelection={true}
                  months={1}
                  maxDate={new Date()}
                  ranges={dateRange}
                  shownDate={subDays(new Date(), 3)}
                  focusedRange={[0,1]}
                  editableDateInputs={true}
                  inputRanges={[]}
                  direction="horizontal"/>
                </div>
              </div>
            }

            {loaded && <div>
              <div class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Topic Reports - {formatDates()}</div>

              <Line class="pl-20 pr-20" options={options} data={graphData} />
              </div>} 
            {!loaded && <h1 class="text-center">Collecting data...</h1>}
          </div>   
        }
    </div>
  )
}
export default ComparisonGraph



