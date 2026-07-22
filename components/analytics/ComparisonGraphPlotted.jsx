/**
 * @fileoverview ComparisonGraphPlotted Component - Topic comparison analytics visualization
 *
 * This component displays a line graph comparing selected topics over a custom date range.
 * Features include:
 * - Fetching and aggregating report data from Firestore
 * - Dynamic date range and topic selection
 * - Responsive line chart using react-chartjs-2
 * - Customizable graph menu and tab navigation
 * - Validation for topic and date selection
 * - Role-based logic for agency/admin users
 *
 * Integrates with:
 * - ComparisonGraphMenu (for graph controls)
 * - react-chartjs-2 and chart.js for visualization
 * - Firebase Firestore for report data
 * - AuthContext for user roles
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from "../../context/AuthContext"
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
import { getDocs, getDoc, doc, Timestamp } from "firebase/firestore";
import { db } from '../../config/firebase'
import {
  buildActiveReportsQuery,
  fetchExperimentConfig,
  getActiveExperimentId,
} from '../../utils/reports-queries'
import ComparisonGraphMenu from './ComparisonGraphMenu'
import { Spinner, Typography } from '@material-tailwind/react'

import _ from "lodash";

/**
 * ComparisonGraphPlotted Component
 *
 * Renders a line graph comparing report counts for selected topics over a chosen date range.
 * Handles data fetching, aggregation, and validation for analytics visualization.
 *
 * @param {Object} props
 * @param {Array} props.dateRange - Selected date range for the graph
 * @param {Function} props.setDateRange - Setter for date range state
 * @param {Array} props.selectedTopics - Topics selected for comparison
 * @param {Function} props.setSelectedTopics - Setter for selected topics state
 * @param {Array} props.topicList - List of available topics for selection
 * @param {number} props.tab - Current tab/view in the parent setup
 * @param {Function} props.setTab - Setter for tab state
 * @returns {JSX.Element} The rendered comparison analytics graph
 */
const ComparisonGraphPlotted = ({dateRange, setDateRange, selectedTopics, setSelectedTopics, topicList, tab, setTab}) => {

  // --- Data for graph rendering ---
  const [reportData, setData] = useState([]) // Raw report data fetched from Firestore
  const [graphData, setGraphData] = useState([]) // Processed data for the line chart
  const [dateLabels, setDateLabels] = useState([]) // Labels for the x-axis (dates)
  const [dates, setDates] = useState([]) // Array of Timestamps for the selected date range
  
  // --- UI and loading state ---
  const [updateGraph, setUpdateGraph] = useState(true) // Triggers graph update when true
  const [loaded, setLoaded] = useState(false) // Indicates if data is loaded

  // --- Validation state ---
  const [topicError, setTopicError] = useState(false) // Error state for topic selection
  const [dateError, setDateError] = useState(false) // Error state for date selection

  // --- User/role state ---
  const [agencyName, setAgencyName] = useState("") // Name of the current agency (if applicable)
  const [agencyId, setAgencyId] = useState("") // Firestore agency doc id
  const [privilege, setPrivilege] = useState(null) // User privilege level
  const [checkRole, setCheckRole] = useState(false) // Triggers role check
  const { verifyRole, refreshCustomClaims, customClaims } = useAuth() // Auth context
  const agencyClaimsRefreshAttempted = useRef(false)

  // Futuristic Robot palette (dark → light for contrast on white chart bg)
  const palette = [
    '#071C2C', // Trapped Darkness
    '#103A54', // Gibraltar Sea
    '#315D77', // Berry Blue
    '#688390', // Blue Prince
    '#A2AAA4', // Ginkgo Green
    '#DBDDD5', // Pacific Fog
  ]

  // Keep topic colors consistent even if the selection order changes.
  const topicColorMap = useRef(new Map())

  const withOpacity = (hex, opacity = 0.16) => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  /**
 * formatDates - Formats the start and end dates for the graph title.
 * @returns {string} Formatted date range string (e.g., "MM-DD - MM-DD")
 */
  const formatDates = () => {
    const startRange = new Date(dates[0] * 1000)
    // console.log(new Date(dates[dates.length - 2] * 1000))
    const endRange = new Date(dates[dates.length - 2]  * 1000)
    var newDateOptions = {
      month: "2-digit",
      day: "2-digit"
    };

    return startRange.toLocaleString('en-us', newDateOptions) + '-' + endRange.toLocaleString('en-us', newDateOptions)
  }
  
  /**
 * getDates - Generates arrays of Timestamps and formatted date labels for the selected range.
 * @param {number} daysAgo - Number of days in the selected range
 * @returns {Array[]} [timestamps, formattedLabels]
 */
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

  /**
   * bucketCountsByDay - Counts reports into per-day buckets using day-boundary Timestamps.
   * Day i is [dayBounds[i], dayBounds[i + 1]).
   * @param {import('firebase/firestore').QueryDocumentSnapshot[]} docs
   * @param {import('firebase/firestore').Timestamp[]} dayBounds
   * @returns {number[]}
   */
  const bucketCountsByDay = (docs, dayBounds) => {
    const numDays = dayBounds.length - 1
    const counts = new Array(numDays).fill(0)
    const boundMs = dayBounds.map((t) => t.toMillis())

    for (const reportDoc of docs) {
      const created = reportDoc.data()?.createdDate
      if (!created) continue
      let ms
      if (typeof created.toMillis === 'function') {
        ms = created.toMillis()
      } else if (typeof created.seconds === 'number') {
        ms =
          created.seconds * 1000 +
          Math.floor((created.nanoseconds || 0) / 1e6)
      } else {
        ms = Number(created)
      }
      if (!Number.isFinite(ms)) continue

      for (let i = 0; i < numDays; i++) {
        if (ms >= boundMs[i] && ms < boundMs[i + 1]) {
          counts[i] += 1
          break
        }
      }
    }
    return counts
  }

  /**
 * getDailyTopicReports - Fetches and aggregates report counts for each topic and date in the range.
 * One range query per topic (parallel), then buckets counts by day client-side.
 */
  const getDailyTopicReports = async() => {
    // Agency-scoped rules reject unscoped list queries — never fetch until agencyId is known.
    if (privilege === 'Agency' && !agencyId) return

    const days = Math.ceil((dateRange[0].endDate.getTime()- dateRange[0].startDate.getTime()) / 86400000)
    const array = getDates(days)
    const dayBounds = array[0]
    const emptyCounts = () => new Array(Math.max(0, dayBounds.length - 1)).fill(0)
    
    // Stores dates in format used to query the reports. 
    setDates(dayBounds)

    // Stores date labels used for the x-axis on the comparison chart
    setDateLabels (array[1])

    const experimentConfig = await fetchExperimentConfig()
    const activeExperimentId = getActiveExperimentId(experimentConfig)
    const agencyIdFilter = privilege === 'Agency' ? agencyId : undefined
    const rangeFrom = dayBounds[0]
    const rangeTo = dayBounds[dayBounds.length - 1]

    // One query per topic over the full range; parallelize topics.
    const topicArray = await Promise.all(
      selectedTopics.map(async (topic) => {
        try {
          const rangeQuery = buildActiveReportsQuery({
            topic: topic.value,
            dateFrom: rangeFrom,
            dateTo: rangeTo,
            agencyId: agencyIdFilter,
            activeExperimentId,
          })
          const snapshot = await getDocs(rangeQuery)
          return bucketCountsByDay(snapshot.docs, dayBounds)
        } catch (error) {
          console.error('Comparison graph range query failed:', error)
          return emptyCounts()
        }
      }),
    )
    setData(topicArray)
  }
  
  /**
 * getGraphData - Processes raw report data into the format required by react-chartjs-2.
 * Updates graphData and dateLabels state.
 */
  const getGraphData = () => {
    const arr = []
    // Populates data used for the comparison graph
    for (let topic = 0; topic < selectedTopics.length; topic++) {
      const topicValue = selectedTopics[topic].value
      if (!topicColorMap.current.has(topicValue)) {
        const paletteIndex = topicColorMap.current.size
        const fallbackIndex = topicColorMap.current.size
        const color =
          palette[paletteIndex] ||
          `hsl(${(fallbackIndex * 53) % 360}, 70%, 54%)`
        topicColorMap.current.set(topicValue, color)
      }

      const color = topicColorMap.current.get(topicValue)
      const topicData = {
        label: selectedTopics[topic].label,
        data: reportData[topic],
        borderColor: color,
        backgroundColor: withOpacity(color, 0.25),
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBorderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: color,
        tension: 0.32,
        fill: true,
      }
      arr.push(topicData)
    }
    setGraphData({labels:dateLabels, datasets:arr})
  }


  useEffect(()=> {
      const resolveRole = async () => {
        try {
          let result = await verifyRole()
          let resolvedAgencyId =
            typeof result?.agencyId === 'string' ? result.agencyId : ''
          let resolvedAgencyName =
            typeof result?.agencyName === 'string' ? result.agencyName : ''

          // Prefer AuthContext claim if verifyRole returned a stale token without agencyId.
          if (result?.agency && !resolvedAgencyId && customClaims?.agencyId) {
            resolvedAgencyId = customClaims.agencyId
            resolvedAgencyName = customClaims.agencyName || resolvedAgencyName
          }

          if (result?.agency) {
            if (!resolvedAgencyId && refreshCustomClaims && !agencyClaimsRefreshAttempted.current) {
              agencyClaimsRefreshAttempted.current = true
              const next = await refreshCustomClaims()
              resolvedAgencyId =
                typeof next?.agencyId === 'string' ? next.agencyId : ''
              resolvedAgencyName =
                typeof next?.agencyName === 'string'
                  ? next.agencyName
                  : resolvedAgencyName
            }

            if (resolvedAgencyId) {
              setPrivilege("Agency")
              setAgencyId(resolvedAgencyId)
              setAgencyName(resolvedAgencyName || resolvedAgencyId)
              if (!resolvedAgencyName) {
                const agencyDoc = await getDoc(doc(db, "agency", resolvedAgencyId))
                if (agencyDoc.exists()) {
                  setAgencyName(agencyDoc.data()?.name || resolvedAgencyId)
                }
              }
              setCheckRole(true)
              return
            }

            // Agency claim without agencyId: do not run scoped queries yet.
            setPrivilege("Agency")
            return
          }

          if (result?.admin) {
            setPrivilege("Admin")
            setAgencyName("")
            setAgencyId("")
            setCheckRole(true)
          }
        } catch (error) {
          console.error('Error resolving comparison graph role:', error)
        }
      }

      resolveRole()
  }, [customClaims?.agencyId, customClaims?.agencyName])
  // Populates graph with new data for the selected date range and topics once the
  // topic reports have been collected. 
  useEffect(()=> {
    if (reportData.length !== 0 && checkRole && updateGraph && !topicError && !dateError) {	
      getGraphData()	
      setUpdateGraph(false)	
    }	
  }, [reportData, checkRole]);

  // Displays graph once data points can be plotted.	
  useEffect(() => {	
    if (graphData.length !== 0) {	
      setLoaded(true)	
      setUpdateGraph(false)	
    }	
  }, [graphData])

  // Fetch only after role resolution so agency queries include agencyId (matches rules).
  useEffect(() => {
    if (loaded !== false) return
    if (!checkRole) return
    if (privilege === 'Agency' && !agencyId) return
    getDailyTopicReports()
  }, [loaded, checkRole, privilege, agencyId]);


  // Configuration for React-ChartJS-2
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
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    layout: {
      padding: 12,
    },
    scales: {
      y: {
        suggestedMin: 0,
        ticks: {
          precision: 0,
          font: function (context) {
            var avgSize = Math.round((context.chart.height + context.chart.width) / 2);
            var size = Math.round(avgSize / 32);
            size = size > 16 ? 16 : size; // setting max limit to 18
            return {
                size: size,
            };
          },
        },
        beginAtZero: true,
        title: {
          text: "Number of Reports",
          display: true,
          font: {
            size: 14,
            weight: 600,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
        },
        grid: {
          color: '#E5E7EB',
        }
      },
      x: {
        title: {
          text: "Date",
          display: true,
          font: {
            size: 14,
            weight: 600,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
        },
        ticks: {
          font: {
            size: 12,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
          color: '#4B5563'
        },
        grid: {
          color: '#F3F4F6'
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          padding: 16,
          font: {
            size: 12,
            family: 'Inter, system-ui, -apple-system, sans-serif'
          },
          color: '#1F2937'
        }
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 13, weight: 700, family: 'Inter, system-ui, -apple-system, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, system-ui, -apple-system, sans-serif' },
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    }
  
  }

  return (
    <div data-component="ComparisonGraphPlotted">
          {/* Once user selects the topics and date range, graph of topic reports will be plotted. */}
          <div className="bg-white rounded-md mt-6 py-5 px-3">
          <ComparisonGraphMenu dateRange={dateRange} setDateRange={setDateRange} 
              selectedTopics={selectedTopics} setSelectedTopics={setSelectedTopics}
              listTopicChoices={topicList} tab={tab} setTab={setTab}
              setTopicError={setTopicError}  topicError={topicError}
              dateError={dateError} setDateError = {setDateError} updateGraph={updateGraph} 
              setUpdateGraph={setUpdateGraph} loaded={loaded} setLoaded={setLoaded}/>

            {/* Displays graph once data is collected for the topics. */}
		
            {loaded ?	
            <div className="m-auto">	
              <Typography
                variant="h5"
                color="blue"
                className="pt-6 tracking-wider text-center"
              >
                Topic Reports - {formatDates()}
              </Typography>
              <div className="relative z-10 lg:pl-20 lg:pr-20 overflow-x-auto max-h-[340px] min-h-[220px]">
                <Line height={280} options={options} data={graphData} />
              </div>	
            </div>	
            : (
            <div className="flex flex-col items-center justify-center gap-3 min-h-[220px] pt-6">
              <Spinner className="h-8 w-8" color="blue" />
              <Typography variant="small" className="text-gray-500">
                Loading report data for selected topics…
              </Typography>
            </div>
            )}	
        </div>
    </div>
  )
}
export default ComparisonGraphPlotted
 
