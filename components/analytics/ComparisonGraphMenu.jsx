/**
 * @fileoverview ComparisonGraphMenu Component - Settings bar for comparison chart
 *
 * This component provides the settings bar for the comparison chart, allowing users to:
 * - Select and change topics for comparison
 * - Pick a custom date range using a calendar dropdown
 * - Refresh or clear the graph
 * - See error and status notifications for selection validation
 * - Responsive and accessible UI with tooltips and icons
 *
 * Integrates with:
 * - react-date-range for date selection
 * - react-select for topic selection
 * - @material-tailwind/react for actions, alerts, and loading
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

import {
  IoMdCalendar,
  IoMdRefresh,
  IoMdRemove,
  IoIosTrash
} from "react-icons/io";
import {
  Alert,
  IconButton,
  Spinner,
  Tooltip,
} from '@material-tailwind/react'
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

/**
 * ComparisonGraphMenu Component
 *
 * Renders the settings bar for the comparison chart, including topic and date selection,
 * refresh/clear actions, and error/status notifications.
 *
 * @param {Object} props
 * @param {Array} props.dateRange - The currently selected date range
 * @param {Function} props.setDateRange - Setter for date range state
 * @param {Array} props.selectedTopics - The currently selected topics
 * @param {Function} props.setSelectedTopics - Setter for selected topics state
 * @param {Array} props.listTopicChoices - List of available topics for selection
 * @param {number} props.tab - Current tab/view in the parent setup
 * @param {Function} props.setTab - Setter for tab state
 * @param {Function} props.setTopicError - Setter for topic error state
 * @param {boolean} props.topicError - Whether there is a topic selection error
 * @param {Function} props.setDateError - Setter for date error state
 * @param {boolean} props.dateError - Whether there is a date selection error
 * @param {boolean} props.updateGraph - Whether the graph needs to be updated
 * @param {Function} props.setUpdateGraph - Setter for updateGraph state
 * @param {boolean} props.loaded - Whether the graph data is loaded
 * @param {Function} props.setLoaded - Setter for loaded state
 * @returns {JSX.Element} The rendered comparison graph menu UI
 */
const ComparisonGraphMenu = ({dateRange, setDateRange, 
                            selectedTopics, setSelectedTopics, 
                            listTopicChoices, tab, setTab, setTopicError, topicError, setDateError, dateError,
                            updateGraph, setUpdateGraph, loaded, setLoaded}) => {
  const [showCalendar, setShowCalendar] = useState(0)

  // Border style used for the topic select dropdown for error handling.
  const borderStyle = {
    control: (base) => ({
      ...base,
      border: 0,
      boxShadow: "none"
    })
  };
  const errorOutline = "border-2 border-rose-600 "
  const animatedComponents = makeAnimated();

  /**
   * handleSelect - Handles toggling the calendar dropdown for date selection.
   */
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

  /**
   * handleGraphUpdate - Handles refreshing the graph based on current selections.
   * Validates topic and date selection.
   */
  const handleGraphUpdate = () => {
    setShowCalendar(0)

    const daysSelected = (dateRange[0].endDate - dateRange[0].startDate)/(1000*60*60*24) + 1
    if (selectedTopics.length >= 1 && daysSelected > 2 && daysSelected < 31)
      {
        // Prevents the graph from displaying until data has been collected.
        setLoaded(false)
      }

    // Update error state if there are not three selected topics
    if (selectedTopics.length < 1) {
      setTopicError(true)
    }

    // Update error state if the date range does not fall within 3 days and one month
    if ((daysSelected < 3 || daysSelected > 31)) {
      setDateError(true)
    }
  }

  
  /**
   * handleDateSelection - Handles the selection of a new date range from the calendar.
   * Updates state and triggers validation.
   * @param {Object} item - The selected date range object from react-date-range
   */
  const handleDateSelection = (item) =>  {
    if (item.selection.endDate !== item.selection.startDate) {
        const daysSelected = ((item.selection.endDate - item.selection.startDate)/(1000*60*60*24)) + 1 	
        setDateRange([item.selection])	
        setDateError(!(daysSelected > 2 && daysSelected < 31))	
        if (daysSelected > 2 && daysSelected < 31) {	
          setUpdateGraph(true)   	
        }	
    } 
  }

  /**
   * handleReset - Clears the current topic and date selections and resets the view.
   */
  const handleReset = () => {
    setDateRange ([
      {
        startDate: subDays(new Date(), 7),
        endDate: new Date(),
        key: 'selection'
      }])
    setSelectedTopics([])
    setTab(0)
  }

  // Sets update graph to be true whenever the selected topics are changed.
  useEffect (()=> {
    setTopicError(selectedTopics.length < 1)	
    if (selectedTopics.length > 0) {	
      setUpdateGraph(true)	
    }	
    
  }, [selectedTopics]);

  return (
  <>
    <div className="relative flex justify-stretch lg:justify-between flex-wrap gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {/* Calendar allows user to change date range. */}
        <Tooltip content={showCalendar == 0 ? 'Select Dates' : 'Close Calendar'}>
          <IconButton
            variant="text"
            color={dateError ? 'red' : 'blue-gray'}
            className={dateError ? 'bg-red-50' : showCalendar == 1 ? 'bg-blue-50' : ''}
            onClick={handleSelect}
            aria-label={showCalendar == 0 ? 'Select Dates' : 'Close Calendar'}
          >
            {showCalendar == 0 ? <IoMdCalendar size={22} /> : <IoMdRemove size={22} />}
          </IconButton>
        </Tooltip>

          {/* Allows user to change the selected topics. */}
          <div className={`min-w-[12rem] flex-1 ${topicError ? errorOutline : ''}`}>
            <Select options={listTopicChoices} components={animatedComponents}
                isMulti 
                error={topicError}
                onChange={item => setSelectedTopics(item)}
                closeMenuOnSelect={false}
                value={selectedTopics}
                styles={topicError && borderStyle}
              />
          </div>
        
          {/* Allows user to refresh graph when new topics or date range have been selected. */}
          {loaded &&
            <Tooltip content="Refresh Graph">
              <IconButton
                variant="text"
                color="blue-gray"
                onClick={handleGraphUpdate}
                aria-label="Refresh Graph"
              >
                <IoMdRefresh size={22} />
              </IconButton>
            </Tooltip>
          }

          {/* Displays loading spinner while the graph is being updated. */}
          {!loaded &&
            <div className="mx-2 flex items-center" role="status" aria-label="Loading graph">
              <Spinner className="h-6 w-6" color="blue" />
            </div>
          }
            </div>
            
            <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            {/*Displays notification when user needs to refresh graph once the topic or date selection has been modified. */}
            {updateGraph && loaded && !(topicError || dateError) && !showCalendar &&
              <Alert color="green" className="py-2 px-3 text-sm max-w-xl">
                Refresh the graph to see the report data for the most recent changes.
              </Alert>
            }

            {/* Displays error when topic or date selection is invalid. */}
            {(topicError || dateError) && !showCalendar && 
              <Alert color="red" className="py-2 px-3 text-sm max-w-xl">
                {topicError && <div>You must select at least one topic to compare.</div>}
                {dateError && <div>You must select a date range of at least three days and no more than three weeks.</div>}
              </Alert>
            }
          
          <Tooltip content="Clear Graph">
            <IconButton
              variant="text"
              color="blue-gray"
              onClick={handleReset}
              aria-label="Clear Graph"
            >
              <IoIosTrash size={22} />
            </IconButton>
          </Tooltip>

      </div>
      
      {/*Allows user to clear graph and start from initial screen to select topics. */}

   
    </div>
    {showCalendar == 1 &&  
      <>    
        <div className="absolute z-50 mt-2 right-0 bg-white p-2 rounded-lg shadow-xl border border-gray-200">
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
      </>
    }
  </>
  )
  }
export default ComparisonGraphMenu
