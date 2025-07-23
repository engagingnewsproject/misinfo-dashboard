/**
 * @fileoverview Toggle Component - Switch between overview and comparison graph views
 *
 * This component renders a toggle UI for switching between the overview and comparison views
 * of the dashboard's trending tag topics.
 * Features include:
 * - Two-button toggle for selecting the current view
 * - Visual indication of the active view
 * - Stateless, controlled via parent props
 *
 * Integrates with:
 * - Parent dashboard or graph components for view state
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import { roundToNearestMinutes } from 'date-fns/fp'
import React from 'react'

/**
 * Toggle Component
 *
 * Renders a two-button toggle for switching between overview and comparison views.
 * Calls the parent setter to update the current view.
 *
 * @param {Object} props
 * @param {string} props.viewVal - The current view ("overview" or "comparison")
 * @param {Function} props.setViewVal - Setter function to update the view
 * @returns {JSX.Element} The rendered toggle UI
 */
const Toggle = ({ viewVal, setViewVal }) => {   
    
    /**
     * handleViewChanged - Handles button click to change the dashboard view.
     * @param {Object} e - The click event object
     */
    const handleViewChanged = (e) => {
        setViewVal(e.target.id)
    }
    
    // Style settings used for the button that is active and the nonactive button 
    const active = "bg-blue-600 text-white py-2 px-5 drop-shadow-lg text-sm font-light tracking-wide"
    const rounded_right = " rounded-tr-lg rounded-br-lg"
    const rounded_left = " rounded-tl-lg rounded-bl-lg"
    const nonactive = "bg-white py-2 px-5 drop-shadow-lg text-sm font-light tracking-wide"
    return (
    <div className='flex justify-center md:block'>
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