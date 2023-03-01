/* Generates the toggle that determines whether the dashboard should display
the comparison view or overview of the graphs for trending tag topics.*/
import { roundToNearestMinutes } from 'date-fns/fp'
import React from 'react'

const Toggle = ({ viewVal, setViewVal }) => {   
    
    // Sets the view to overview or comparison based on which button was clicked
    const handleViewChanged = (e) => {
        setViewVal(e.target.id)
    }
    
    // Style settings used for the button that is active and the nonactive button 
    const active = "bg-blue-600 text-white py-2 px-5 drop-shadow-lg text-sm font-light tracking-wide"
    const rounded_right = " rounded-tr-lg rounded-br-lg"
    const rounded_left = " rounded-tl-lg rounded-bl-lg"
    const nonactive = "bg-white py-2 px-5 drop-shadow-lg text-sm font-light tracking-wide"
    return (
    <div>
        <button id="overview"
            onClick={handleViewChanged} 
            className ={viewVal == "overview" ? active + rounded_left: nonactive + rounded_left}>
            Overview
        </button>
        <button id="comparison"
            onClick={handleViewChanged} 
            className = {viewVal == "comparison" ? active + rounded_right : nonactive + rounded_right}>
            Comparison View 
        </button>
    </div>
    )
}
export default Toggle