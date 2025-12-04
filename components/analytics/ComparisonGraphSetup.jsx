/**
 * @fileoverview ComparisonGraphSetup Component - Topic comparison analytics setup
 *
 * This component provides an interface for selecting topics and date ranges to compare trends.
 * Features include:
 * - Multi-select dropdown for topics
 * - Date range picker for custom analytics
 * - Validation for topic and date selection
 * - Tabbed interface for setup and graph display
 * - Integration with agency/topic data from Firestore
 * - Responsive and accessible design
 *
 * Integrates with:
 * - ComparisonGraphPlotted (for rendering the comparison graph)
 * - react-date-range and react-select for UI controls
 * - Firebase Firestore for topic data
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React, { useState, useEffect } from 'react'
import { DateRange } from 'react-date-range';

import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { startOfDay, subDays } from 'date-fns'
import { getDoc, doc } from "firebase/firestore";
import { db } from '../../config/firebase'
import {
  IoIosArrowForward,
  IoIosArrowBack,
} from "react-icons/io";
import ComparisonGraphPlotted from './ComparisonGraphPlotted'
import { Tooltip } from "react-tooltip";
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import _ from "lodash";
import globalStyles from '../../styles/globalStyles';
import firebaseHelper from '../../firebase/FirebaseHelper'
/**
 * ComparisonGraphSetup Component
 *
 * Renders the setup interface for comparing topic trends, including topic selection and date range.
 * Handles validation and transitions to the plotted graph view.
 *
 * @param {Object} props
 * @param {string} props.privilege - User privilege level (e.g., 'Agency', 'Admin')
 * @param {string} props.agencyId - Firestore document ID of the selected agency
 * @returns {JSX.Element} The rendered comparison graph setup interface
 */
const ComparisonGraphSetup = ({privilege, agencyId}) => {

  // --- Topic selection state ---
  const [selectedTopics, setSelectedTopics] = useState([]) // Topics selected by the user
  const [listTopicChoices, setTopicChoices] = useState([]) // List of available topics for selection

  // --- Date range state ---
  const defaultStartDay = startOfDay(new Date())
  defaultStartDay.setHours(-24 * 6, 0, 0, 0)
  const [dateRange, setDateRange] = useState([
    {
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
      key: 'selection'
    }
  ]) // Selected date range for comparison

  // --- UI navigation state ---
  const [tab, setTab] = useState(0) // Current tab/view in the setup process

  // --- Validation state ---
  const [topicError, setTopicError] = useState(false) // Error state for topic selection
  const [dateError, setDateError] = useState(false) // Error state for date selection

  // --- Styling for graph setting buttons ---
  const basicStyle = "flex p-2 my-6 mx-2 text-gray-500 hover:bg-blue-100 rounded-lg"

  /**
   * Handles the selection of a new date range.
   * Validates the range and updates state.
   * @param {Object} item - The selected date range object from react-date-range
   */
  const handleDateSelection = (item) => {
    if (item.selection.endDate !== item.selection.startDate) {
      console.log(item)
      setDateRange([item.selection])
      const daysSelected = ((item.selection.endDate  - item.selection.startDate)/(1000*60*60*24)) + 1
      if (daysSelected > 2 && daysSelected < 31) {
        setDateError(false)
      }
    } 
  }

  // Retrieves the list of topics upon the first render.
  useEffect(() => {
    if (agencyId) {
      getTopicChoices()
    } else {
      console.log('unable to get agency id');
    }
  }, []);

  /**
   * Handles the transition to the graph view if the date range is valid.
   * Sets error state if invalid.
   */
  const handleGraphChange = () => {
    console.log("date range before plotting " + dateRange)
    const daysSelected = ((dateRange[0].endDate - dateRange[0].startDate)/(1000*60*60*24)) + 1
    if (daysSelected > 2 && daysSelected < 31) {
      console.log(dateRange[0])
      setTab(4)
      setDateError(false)
    } else {
      setDateError(true)
    }
  }

  /**
   * Handles the transition to the next step if topics are selected.
   * Sets error state if none selected.
   */
  const handleTopicSelection = () => {
    console.log(selectedTopics)
    if (selectedTopics.length < 1) {
      setTopicError(true)
    } else  {
      setTopicError(false)
      setTab(1)
    }
  }

  /**
   * Fetches the list of available topics for the agency from Firestore.
   * Populates the topic choices dropdown.
   */
  async function getTopicChoices() {
    const topicChoices = []
    let tempTopics = []
    let topics
    if (privilege === 'Agency') {
      const topicDoc = doc(db,"tags",agencyId)
      const topicRef = await getDoc(topicDoc)
      topics = topicRef.get("Topic")['active']
      
    } else {
      const tags = await firebaseHelper.fetchAllRecordsOfCollection('tags')
      const allActiveTopics = tags.map((tag) => tag.Topic.active)
      const combinedTopics = allActiveTopics.flat()
      tempTopics = [...new Set(combinedTopics)]
      topics = tempTopics
    }
    topics.forEach(function(element) {
      topicChoices.push({ label: element, value: element})
    });
    setTopicChoices(topicChoices)
  }

  const animatedComponents = makeAnimated();

  return (
    <div className="relative h-full lg:h-1/2">
      <h1 className={`${globalStyles.heading.h1.blue} text-center`}>Compare Topic Reports</h1>
              {/* Initial screen that appears when user selects the comparison view. Allows user to select three topics. */}
            {tab == 0 && 
              <div className="flex items-center justify-center md:ml-12">
              <div className="bg-white rounded-xl mt-6 py-5 pl-3 pr-3 h-auto">
                <h2 className={`${globalStyles.heading.h2.blue} text-center py-4`}>Select topics to compare. </h2>
                <h1 className="pl-3 pb-4 text-center">Choose at least one topic to view the number of reports.</h1>
                {topicError && <h1 className="pl-3 pb-4 text-center text-red-500">You must choose at least one topic to compare.</h1>}
                <Select options={listTopicChoices} components={animatedComponents}
                isMulti 
                onChange={item => setSelectedTopics(item)}
                closeMenuOnSelect={false}
                value={selectedTopics}
                />
              </div>
              <button
                onClick={() => handleTopicSelection()}
                className={`${basicStyle} tooltip-next`}>
                <IoIosArrowForward size={25} />
                <Tooltip anchorSelect=".tooltip-next" place="top" delayShow={500}>Next</Tooltip>
              </button>
            </div>
            }
            {/* Second screen that appears when user selects the comparison view. Allows user to select date range. */}

            {tab == 1 &&
              <div className="flex flex-wrap lg:items-center lg:justify-center">
                <button
                  onClick={() => setTab(0)}
                  className={`${basicStyle} ml-[35%] lg:ml-0 tooltip-previous`}>
                  <IoIosArrowBack size={25} />
                  <Tooltip anchorSelect=".tooltip-previous" place="top" delayShow={500}>Previous</Tooltip>
                </button>
                                <div className="bg-white rounded-xl mt-6 py-5 pl-3 pr-3 w-full lg:w-1/3 overflow-x-auto order-first lg:order-none">
                  <h1 className="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">Select dates</h1>
                  <h1 className="pl-3 text-center">Select a date range to collect the number of reports for the selected topics. </h1>
                  {dateError && <h1 className="pl-3 pb-4 text-center text-red-500">You must select a date range of at least three days and no more than three weeks.</h1>}
                  
                    {/* <DateRangePicker
                    onChange={item => handleDateSelection(item)}
                    showSelectionPreview={true}
                    moveRangeOnFirstSelection={false}
                    maxDate={new Date()}
                    ranges={dateRange}
                    direction="horizontal"/> */}
                  {/* TODO: fix resizing on mobile screen and choose one of these calendar views*/}
                    <div className="flex items-center justify-center pt-3">
                        <DateRange
                        editableDateInputs={true}
                        onChange={item => handleDateSelection(item)}
                        moveRangeOnFirstSelection={false}
                        showSelectionPreview={true}
                        months={1}
                        ranges={dateRange}
                        maxDate={new Date()}
                      />
                    </div>
                   
                </div>
                <button
                  onClick={() => handleGraphChange()}
                  className={`${basicStyle} tooltip-display-graph`}>
                  <IoIosArrowForward size={25} />
                  <Tooltip anchorSelect=".tooltip-display-graph" place="top" delayShow={500}>Display Graph</Tooltip>
                </button>
              </div>
            }
          
        {/* Once user selects the topics and date range, graph of topic reports will be plotted. */}
        {tab == 4 && dateRange && selectedTopics && 
          <div className="bg-white rounded-xl mt-6 py-5">
            <ComparisonGraphPlotted 
              dateRange={dateRange} 
              setDateRange={setDateRange} 
              selectedTopics={selectedTopics} 
              setSelectedTopics={setSelectedTopics}
              topicList={listTopicChoices} 
              tab={tab} 
              setTab={setTab} />
          </div>
        }
    </div>
  )
}
export default ComparisonGraphSetup




