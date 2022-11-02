/* Generates the toggle that determines whether the dashboard should display
the comparison view or overview of the graphs for trending tag topics.*/
import React, { useState, useEffect } from 'react'

const Toggle = ({ viewVal, setViewVal }) => {   
    
    {/*Sets the view to overview or comparison based on which button was clicked*/}
    const handleViewChanged = (e) => {
        setViewVal(e.target.id)
    }
    
    {/*Style settings used for the button that is active and the nonactive button*/}
    const active = "bg-blue-600 text-white py-2 px-5 drop-shadow-lg text-sm font-light tracking-wide"
    const nonactive = "bg-white py-2 px-5 drop-shadow-lg text-sm font-light tracking-wide"
    return (
    <div>
        <button id="overview"
            onClick={handleViewChanged} 
            className ={viewVal == "overview" ? active: nonactive}>
            Overview
        </button>
        <button id="comparison"
            onClick={handleViewChanged} 
            className = {viewVal == "comparison" ? active : nonactive}>
            Comparison View 
        </button>
    </div>
    )
}
export default Toggle