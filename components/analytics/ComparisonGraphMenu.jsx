/**
 * @fileoverview ComparisonGraphMenu Component - Settings bar for comparison chart
 *
 * This component provides the settings bar for the comparison chart, allowing users to:
 * - Select and change topics for comparison
 * - Pick a custom date range using a calendar dropdown
 * - Refresh or clear the graph
 * - Floating dismissible alerts (portaled to the graph card, bottom-right)
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
import { createPortal } from 'react-dom'
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
  IconButton,
  Spinner,
  Tooltip,
} from '@material-tailwind/react'
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { ComparisonGraphAlert } from './ComparisonGraphAlert'

// Above chart layers (z-10) and MT Dialog overlay so portaled menus stay clickable.
const MENU_Z_INDEX = 10050

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
 * @param {HTMLElement|null} props.alertMount - Card element to anchor floating alerts (bottom-right)
 * @returns {JSX.Element} The rendered comparison graph menu UI
 */
const ComparisonGraphMenu = ({dateRange, setDateRange, 
                            selectedTopics, setSelectedTopics, 
                            listTopicChoices, tab, setTab, setTopicError, topicError, setDateError, dateError,
                            updateGraph, setUpdateGraph, loaded, setLoaded, alertMount}) => {
  const [showCalendar, setShowCalendar] = useState(0)
  const [dismissedRefreshKey, setDismissedRefreshKey] = useState(null)
  const [dismissedErrorKey, setDismissedErrorKey] = useState(null)

  // Dismiss keys let users close alerts without hiding them forever — re-show when selection changes.
  const refreshAlertKey = selectedTopics.map((topic) => topic.value).join(',')
    + `|${dateRange[0].startDate.getTime()}|${dateRange[0].endDate.getTime()}`
  const errorAlertKey = `${topicError}|${dateError}`

  const refreshEligible = updateGraph && loaded && !(topicError || dateError)
  const errorEligible = topicError || dateError

  const showRefreshAlert = refreshEligible && dismissedRefreshKey !== refreshAlertKey
  const showErrorAlert = errorEligible && dismissedErrorKey !== errorAlertKey

  // Portal alerts into the graph card so they float bottom-right without shifting toolbar layout.
  const alertPortal = alertMount && !showCalendar && (refreshEligible || errorEligible)
    ? createPortal(
        <div
          className="absolute bottom-3 right-3 z-30 flex flex-col items-end max-w-xl"
          aria-live="polite"
        >
          {refreshEligible && (
            <ComparisonGraphAlert
              open={showRefreshAlert}
              color="green"
              onDismiss={() => setDismissedRefreshKey(refreshAlertKey)}
            >
              Refresh the graph to see the report data for the most recent changes.
            </ComparisonGraphAlert>
          )}

          {errorEligible && (
            <ComparisonGraphAlert
              open={showErrorAlert}
              color="red"
              onDismiss={() => setDismissedErrorKey(errorAlertKey)}
            >
              {topicError && <div>You must select at least one topic to compare.</div>}
              {dateError && <div>You must select a date range of at least three days and no more than three weeks.</div>}
            </ComparisonGraphAlert>
          )}
        </div>,
        alertMount,
      )
    : null

  // Border style used for the topic select dropdown for error handling.
  const borderStyle = {
    control: (base) => ({
      ...base,
      border: 0,
      boxShadow: "none"
    })
  };

  const selectStyles = {
    ...(topicError ? borderStyle : {}),
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
    valueContainer: (base) => ({
      ...base,
      flexWrap: 'wrap',
    }),
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
        setUpdateGraph(true)
      }

    // Update error state if no topics are selected.
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
    setDismissedRefreshKey(null)
    setDismissedErrorKey(null)
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
    <div data-component="ComparisonGraphMenu" className="flex items-center gap-2">
        {/* Calendar allows user to change date range. */}
        <div className="relative flex-shrink-0">
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

          {showCalendar == 1 && (
            <div
              className="absolute left-0 top-full mt-2 bg-white p-2 rounded-md shadow-xl border border-gray-200"
              style={{ zIndex: MENU_Z_INDEX }}
            >
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
          )}
        </div>

          {/* Topic select grows between calendar and actions; min-w-0 lets chips wrap instead of pushing buttons down. */}
          <div className={`min-w-0 flex-1 ${topicError ? errorOutline : ''}`}>
            <Select options={listTopicChoices} components={animatedComponents}
                isMulti 
                error={topicError}
                onChange={item => setSelectedTopics(item)}
                closeMenuOnSelect={false}
                value={selectedTopics}
                menuPortalTarget={
                  typeof document !== 'undefined' ? document.body : null
                }
                menuPosition="fixed"
                styles={selectStyles}
              />
          </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {loaded ? (
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
              ) : (
                <div className="flex items-center justify-center w-10 h-10" role="status" aria-label="Loading graph">
                  <Spinner className="h-6 w-6" color="blue" />
                </div>
              )}

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

    </div>
    {alertPortal}
  </>
  )
  }
export default ComparisonGraphMenu
