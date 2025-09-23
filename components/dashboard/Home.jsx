/**
 * @fileoverview Home - Main Dashboard Component
 * 
 * This component serves as the main dashboard view for the Misinfo Dashboard application.
 * It orchestrates the display of the headbar, tag graphs, and reports section,
 * providing a comprehensive overview of the system's data and functionality.
 * 
 * @module components/Home
 * @requires react
 * @requires ../components/Headbar
 * @requires ./ReportsSection
 * @requires ./TagGraph
 * @requires ../context/AuthContext
 * @requires ../config/firebase
 * @requires ../styles/globalStyles
 */

import React, { useState, useMemo } from 'react'
import Headbar from '../layout/Headbar'
import ReportsSection from '../reports/ReportsSection'
import TagGraph from './TagGraph'
import { useAuth } from '../../context/AuthContext'
import { auth } from '../../config/firebase'
import globalStyles from '../../styles/globalStyles'

/**
 * Home - Main dashboard component that displays the application's primary interface.
 * 
 * This component serves as the central hub for the dashboard, combining the headbar
 * for navigation and search, tag graphs for data visualization, and the reports
 * section for content management. It manages the search state and coordinates
 * between different dashboard sections.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.newReportSubmitted - Flag indicating if a new report was recently submitted
 * @param {Function} props.handleNewReportSubmit - Callback function to handle new report submission
 * @param {Function} props.handleNewReportClick - Callback function to handle new report button clicks
 * @returns {JSX.Element} The main dashboard interface
 * @example
 * <Home 
 *   newReportSubmitted={false}
 *   handleNewReportSubmit={handleSubmit}
 *   handleNewReportClick={handleClick}
 * />
 */
const Home = ({ newReportSubmitted, handleNewReportSubmit, handleNewReportClick }) => {
	// Search state for filtering reports
	const [search, setSearch] = useState('')
	
	// Authentication context for user data and permissions
	const {
		user,
		customClaims,
		setCustomClaims,
		logout,
		verifyPrivilege,
		changeRole,
		addAdminRole,
		addAgencyRole,
		viewRole,
	} = useAuth()
	
	/**
	 * Memoized search value to optimize component re-renders.
	 * 
	 * This memoization ensures that child components only re-render when
	 * the search value actually changes, improving performance for large
	 * datasets.
	 */
	const memoizedSearch = useMemo(() => {
		return search
	}, [search])

	return (
		<div className="w-full h-full flex flex-col py-5">
			{/* Header bar with search functionality and user controls */}
			<Headbar
				search={memoizedSearch}
				setSearch={setSearch}
				customClaims={customClaims}
				user={user}
			/>
			
			{/* Main content area with graphs and reports */}
			<div className={globalStyles.page.wrap} id="scrollableDiv">
				{/* Tag visualization graphs */}
				<TagGraph />
				
				{/* Reports list and management section */}
				<ReportsSection
					search={memoizedSearch}
					newReportSubmitted={newReportSubmitted}
					handleNewReportSubmit={handleNewReportSubmit}
					handleNewReportClick={handleNewReportClick}
					customClaims={customClaims}
				/>
			</div>
		</div>
	)
}

export default Home
