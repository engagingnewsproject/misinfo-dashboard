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
 * - @material-tailwind/react for typography, buttons, and alerts
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
import { subDays } from 'date-fns'
import { getDoc, doc } from "firebase/firestore";
import { db } from '../../config/firebase'
import {
  IoIosArrowForward,
  IoIosArrowBack,
} from "react-icons/io";
import ComparisonGraphPlotted from './ComparisonGraphPlotted'
import { ComparisonGraphAlert } from './ComparisonGraphAlert'
import {
  Button,
  Typography,
} from '@material-tailwind/react'
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

// Above chart layers (z-10) and MT Dialog overlay so portaled topic menus stay clickable.
const MENU_Z_INDEX = 10050
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
  const [dismissedTopicAlert, setDismissedTopicAlert] = useState(false)
  const [dismissedDateErrorKey, setDismissedDateErrorKey] = useState(null)

  const dateErrorKey = `${dateRange[0].startDate.getTime()}|${dateRange[0].endDate.getTime()}`
  const showTopicAlert = topicError && !dismissedTopicAlert
  const showDateAlert = dateError && dismissedDateErrorKey !== dateErrorKey

  const getDaysSelected = (range = dateRange[0]) =>
    ((range.endDate - range.startDate) / (1000 * 60 * 60 * 24)) + 1

  // Valid comparison window: 3–30 days inclusive (matches graph refresh rules).
  const isValidDateRange = (range = dateRange[0]) => {
    const daysSelected = getDaysSelected(range)
    return daysSelected > 2 && daysSelected < 31
  }

  /**
   * Handles the selection of a new date range.
   * Validates the range and updates state.
   * @param {Object} item - The selected date range object from react-date-range
   */
  const handleDateSelection = (item) => {
    if (item.selection.endDate !== item.selection.startDate) {
      setDateRange([item.selection])
      setDateError(!isValidDateRange(item.selection))
      if (isValidDateRange(item.selection)) {
        setDismissedDateErrorKey(null)
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
    if (isValidDateRange()) {
      setTab(4)
      setDateError(false)
      setDismissedDateErrorKey(null)
    } else {
      setDateError(true)
      setDismissedDateErrorKey(null)
    }
  }

  /**
   * Handles the transition to the next step if topics are selected.
   * Sets error state if none selected.
   */
  const handleTopicSelection = () => {
    if (selectedTopics.length < 1) {
      setTopicError(true)
      setDismissedTopicAlert(false)
    } else  {
      setTopicError(false)
      setDismissedTopicAlert(false)
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

  const selectStyles = {
    // Portaled menu must sit above chart layers and MT dialog overlay.
    menu: (base) => ({
      ...base,
      backgroundColor: '#ffffff',
      zIndex: MENU_Z_INDEX,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: MENU_Z_INDEX,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#f3f4f6' : '#ffffff',
    }),
  };

  // Next buttons stay visible; disabled until the step's validation passes (avoids layout jump).
  const canProceedToDates = selectedTopics.length > 0
  const canProceedToGraph = isValidDateRange()

  return (
    <div data-component="ComparisonGraphSetup" className="relative h-full lg:h-1/2">
      <Typography variant="h4" color="blue" className="text-center tracking-wider">
        Compare Topic Reports
      </Typography>
              {/* Initial screen that appears when user selects the comparison view. Allows user to select three topics. */}
            {tab == 0 && 
              <div className="flex items-center justify-center gap-3 md:ml-12 flex-wrap">
              <div className="relative bg-white rounded-md mt-6 py-5 px-4 h-auto w-full max-w-xl">
                <Typography variant="h5" color="blue" className="text-center py-2">
                  Select topics to compare.
                </Typography>
                <Typography variant="paragraph" className="pb-4 text-center text-gray-700">
                  Choose at least one topic to view the number of reports.
                </Typography>
                <Select options={listTopicChoices} components={animatedComponents}
                isMulti 
                onChange={item => {
                  setSelectedTopics(item)
                  if (item?.length > 0) {
                    setTopicError(false)
                    setDismissedTopicAlert(false)
                  }
                }}
                closeMenuOnSelect={false}
                value={selectedTopics}
                menuPortalTarget={
                  typeof document !== 'undefined' ? document.body : null
                }
                menuPosition="fixed"
                styles={selectStyles}
                />
                {topicError && (
                  <div
                    className="absolute bottom-3 right-3 z-30 max-w-[calc(100%-1.5rem)]"
                    aria-live="polite"
                  >
                    <ComparisonGraphAlert
                      open={showTopicAlert}
                      color="red"
                      onDismiss={() => setDismissedTopicAlert(true)}
                    >
                      You must choose at least one topic to compare.
                    </ComparisonGraphAlert>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outlined"
                color="blue"
                className="flex items-center gap-2 mt-6"
                onClick={handleTopicSelection}
                disabled={!canProceedToDates}
              >
                Next
                <IoIosArrowForward size={18} />
              </Button>
            </div>
            }
            {/* Second screen that appears when user selects the comparison view. Allows user to select date range. */}

            {tab == 1 &&
              <div className="flex flex-wrap lg:items-center lg:justify-center gap-3">
                <Button
                  size="sm"
                  variant="outlined"
                  color="blue"
                  className="flex items-center gap-1 ml-[35%] lg:ml-0 mt-6"
                  onClick={() => setTab(0)}
                >
                  <IoIosArrowBack size={18} />
                  Back
                </Button>
                                <div className="relative bg-white rounded-md mt-6 py-5 px-4 w-full lg:w-1/3 overflow-x-auto order-first lg:order-none">
                  <Typography variant="h5" color="blue" className="pt-2 tracking-wider text-center">
                    Select dates
                  </Typography>
                  <Typography variant="paragraph" className="text-center text-gray-700">
                    Select a date range to collect the number of reports for the selected topics.
                  </Typography>
                  
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

                  {/* Top-right so the alert does not cover the calendar below. */}
                  {dateError && (
                    <div
                      className="absolute top-3 right-3 z-30 max-w-[calc(100%-1.5rem)]"
                      aria-live="polite"
                    >
                      <ComparisonGraphAlert
                        open={showDateAlert}
                        color="red"
                        onDismiss={() => setDismissedDateErrorKey(dateErrorKey)}
                      >
                        You must select a date range of at least three days and no more than three weeks.
                      </ComparisonGraphAlert>
                    </div>
                  )}
                   
                </div>
                <Button
                  size="sm"
                  variant="outlined"
                  color="blue"
                  className="flex items-center gap-2 mt-6"
                  onClick={handleGraphChange}
                  disabled={!canProceedToGraph}
                >
                  Next
                  <IoIosArrowForward size={18} />
                </Button>
              </div>
            }
          
        {/* Once user selects the topics and date range, graph of topic reports will be plotted. */}
        {tab == 4 && dateRange && selectedTopics && 
          <ComparisonGraphPlotted 
            dateRange={dateRange} 
            setDateRange={setDateRange} 
            selectedTopics={selectedTopics} 
            setSelectedTopics={setSelectedTopics}
            topicList={listTopicChoices} 
            tab={tab} 
            setTab={setTab} />
        }
    </div>
  )
}
export default ComparisonGraphSetup
