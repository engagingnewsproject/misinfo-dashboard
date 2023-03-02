/* This component is the settings bar for the comparison chart
that allows the user to change the topics and dates selected. */
import React, { useState, useEffect } from 'react'
import { DateRangePicker } from 'react-date-range'
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { subDays } from 'date-fns'

import {
  IoMdCalendar,
  IoMdRefresh,
  IoMdRemove,
  IoIosAlert,
  IoIosTrash
} from "react-icons/io";
import ReactTooltip from "react-tooltip";
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

const ComparisonGraphMenu = ({dateRange, setDateRange, 
                            selectedTopics, setSelectedTopics, 
                            listTopicChoices, tab, setTab, setTopicError, topicError, setDateError, dateError,
                            updateGraph, setUpdateGraph, loaded, setLoaded}) => {
  const [showCalendar, setShowCalendar] = useState(0)

  // Styling for graph setting buttons.
  const basicStyle = "flex p-2 my-6 mx-2 text-gray-500 hover:bg-blue-100 rounded-lg"
  const errorStyle = "flex p-2 my-6 mx-2 text-gray-500 hover:bg-red-100 rounded-lg bg-red-100 border-2 border-rose-600"                           
  
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

  // Determines if graph should be refreshed. 
  const handleGraphUpdate = () => {
    setShowCalendar(0)

    const daysSelected = (dateRange[0].endDate - dateRange[0].startDate)/(1000*60*60*24)
    if (updateGraph == true && selectedTopics.length == 3 && daysSelected > 2 && daysSelected < 31)
      {
        // Prevents the graph from displaying until data has been collected.
        setLoaded(false)
      }

    // Update error state if there are not three selected topics
    if (selectedTopics.length != 3) {
      setTopicError(true)
    }

    // Update error state if the date range does not fall within 3 days and one month
    if ((daysSelected < 3 || daysSelected > 22)) {
      setDateError(true)
    }
  }

  
  // Handles the selection of a new date range.
  const handleDateSelection = (item) =>  {
    if (item.selection.endDate !== item.selection.startDate) {
        console.log(item)
        const daysSelected = (item.selection.endDate - item.selection.startDate)/(1000*60*60*24)
        setDateRange([item.selection])
        setDateError(!(daysSelected > 2 && daysSelected < 21))
        setUpdateGraph(true)
    } 
  }

  // Allows user to clear graph and restart the selection process. 
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
    setTopicError(selectedTopics.length !== 3)
    setUpdateGraph(true)
  }, [selectedTopics]);

  return (
  <div>
    <div class="flex justify-between">
      <div class="flex justify-between items-center">
        {/* Calendar allows user to change date range. */}
        {showCalendar == 0 ? 
          <button
                onClick={() => handleSelect()}
                data-tip="Select Dates"
                class={dateError ? errorStyle : basicStyle}>
                <IoMdCalendar size={25}/>
                <ReactTooltip place="top" type="dark" effect="solid" delayShow={500} />
          </button>
          :
          <button
          onClick={() => handleSelect()}
          data-tip="Close calendar"
          class={(dateError ? errorStyle : basicStyle + " text-stone-400 bg-blue-100")}>
          <IoMdRemove size={25} />
          <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
          </button> 
        }

        <div class={"flex justify-between items-center"}>
          
          {/* Allows user to change the selected topics. */}
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

          {/* Allows user to refresh graph when new topics or date range have been selected. */}
          <button
                onClick={() => handleGraphUpdate()}
                data-tip="Refresh Graph"
                class={basicStyle}>
                <IoMdRefresh size={25} />
                <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
          </button>

          {/*Displays notification when user needs to refresh graph once the topic or date selection has been modified. */}
          {updateGraph  && !(topicError || dateError) && 
            <div class="flex flex-wrap text-black bg-green-200 rounded p-3 ml-2 border-2 border-green-600">
              <IoIosAlert size={25} />
              <h1 class="pl-3">Refresh the graph to see the report data for the most recent changes.</h1>

            </div>
          }

          {/* Displays error when there are not three selected topics, or the date range is not valid. */}
          {(topicError || dateError) && 
            <div class="flex flex-cols flex-wrap text-black bg-red-200 rounded p-3 ml-2 border-2 border-rose-600">
              <IoIosAlert size={25} />
              <div class="inline-block">
                  {topicError && <h1 class="pl-3">You must select three topics to compare.</h1>}
                  {dateError && <h1 class="pl-3">You must select a date range of at least three days and no more than three weeks.</h1>}
              </div>
            </div>
          }
        </div>
      </div>
      
      {/*Allows user to clear graph and start from initial screen to select topics. */}
      <button
      onClick={() => handleReset()}
      data-tip="Clear graph"
      class={basicStyle + "justify-self-end pr-5"}>
      <IoIosTrash size={25}/>
      <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
      </button>
   
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
  </div>
  )
  }
export default ComparisonGraphMenu

          
          