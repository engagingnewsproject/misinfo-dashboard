/**
 * @fileoverview Home - Main Dashboard Component
 *
 * Dashboard home: tag graphs + reports. Mobile brand chrome is the shared
 * Headbar on the parent dashboard page (not here).
 *
 * @module components/Home
 */

import React, { useState, useMemo } from 'react'
import ReportsSection from '../reports/ReportsSection'
import TagGraph from './TagGraph'
import { useAuth } from '../../context/AuthContext'
import globalStyles from '../../styles/globalStyles'

/**
 * Home - Main dashboard content (graphs + reports).
 *
 * @param {Object} props
 * @param {boolean} props.newReportSubmitted
 * @param {Function} props.handleNewReportSubmit
 * @param {Function} props.handleNewReportClick
 * @returns {JSX.Element}
 */
const Home = ({ newReportSubmitted, handleNewReportSubmit, handleNewReportClick }) => {
	const [search, setSearch] = useState('')
	const { customClaims } = useAuth()

	const memoizedSearch = useMemo(() => {
		return search
	}, [search])

	return (
		<div data-component="Home" className="w-full h-full flex flex-col">
			<div className={globalStyles.page.wrap} id="scrollableDiv">
				<TagGraph />
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
