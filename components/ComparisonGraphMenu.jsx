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

  
  // Handles the selection of a new date range.
  const handleDateSelection = (item) =>  {
    if (item.selection.endDate !== item.selection.startDate) {
        console.log(item)
        const daysSelected = ((item.selection.endDate - item.selection.startDate)/(1000*60*60*24)) + 1 	
        setDateRange([item.selection])	
        setDateError(!(daysSelected > 2 && daysSelected < 31))	
        console.log(dateError)	
        if (daysSelected > 2 && daysSelected < 31) {	
          setUpdateGraph(true)   	
        }	
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
    setTopicError(selectedTopics.length < 1)	
    if (selectedTopics.length > 0) {	
      setUpdateGraph(true)	
    }	
    
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
          {loaded && <button
                onClick={() => handleGraphUpdate()}
                data-tip="Refresh Graph"
                class={basicStyle}>	
                <IoMdRefresh size={25} />
                <ReactTooltip place="top" type="light" effect="solid" delayShow={500} />
          </button>}


          {/* Displays loading svg if the graph is being updated. */}	
          {!loaded &&         	
             <svg aria-hidden="true" class="ml-2 w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">	
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />	
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />	
            </svg>}

          {/*Displays notification when user needs to refresh graph once the topic or date selection has been modified. */}
          {updateGraph && loaded && !(topicError || dateError) && 	
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
                  {topicError && <h1 class="pl-3">You must select at least one topic to compare.</h1>}
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
          moveRangeOnFirstSelection={false}
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

          
          