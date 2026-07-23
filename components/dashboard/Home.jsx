/**
 * @fileoverview Home - Main Dashboard Component
 *
 * This component serves as the main dashboard view for the Misinfo Dashboard application.
 * It orchestrates tag graphs and the reports section. The shared Headbar lives on the
 * parent dashboard page so it appears on every tab.
 *
 * @module components/Home
 */

import React, { useState, useMemo } from 'react'
import ReportsSection from '../reports/ReportsSection'
import TagGraph from './TagGraph'
import Toggle from '../common/Toggle'
import PageTitle from '../layout/PageTitle'
import { useAuth } from '../../context/AuthContext'
import globalStyles from '../../styles/globalStyles'

/**
 * Home - Main dashboard content (graphs + reports).
 *
 * @param {Object} props
 * @param {boolean} props.newReportSubmitted
 * @param {Function} props.handleNewReportSubmit
 * @param {Function} props.handleNewReportClick
 * @param {string} props.viewVal - Graph view ("overview" | "comparison")
 * @param {Function} props.setViewVal
 * @returns {JSX.Element}
 */
const Home = ({
	newReportSubmitted,
	handleNewReportSubmit,
	handleNewReportClick,
	viewVal,
	setViewVal,
}) => {
	const [search, setSearch] = useState('')
	const { customClaims } = useAuth()

	const memoizedSearch = useMemo(() => {
		return search
	}, [search])

	return (
		<div data-component="Home" className="w-full h-full flex flex-col">
			<div className={globalStyles.page.wrap} id="scrollableDiv">
				<PageTitle srOnly>Dashboard</PageTitle>
				{/* Mobile: toggle above graphs; desktop toggle lives in Headbar */}
				<div className="md:hidden mb-3">
					<Toggle viewVal={viewVal} setViewVal={setViewVal} />
				</div>
				<TagGraph viewVal={viewVal} />
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
