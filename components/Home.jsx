import React, { useState, useMemo } from 'react'
import Headbar from '../components/Headbar'
import ReportsSection from './ReportsSection'
import TagGraph from './TagGraph'
import { useAuth } from '../context/AuthContext'
import { auth } from '../config/firebase'
import globalStyles from '../styles/globalStyles'

const Home = ({ newReportSubmitted, handleNewReportSubmit }) => {
	const [search, setSearch] = useState('')
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
	// Memoize the search value: Ensures that components only re-render when their props or state actually change
	const memoizedSearch = useMemo(() => {
		return search
	}, [search])

	return (
		<div className="w-full h-full flex flex-col py-5">
			<Headbar
				search={memoizedSearch}
				setSearch={setSearch}
				customClaims={customClaims}
				user={user}
			/>
			{/* Nest the following toggle inside a component for the graph portion of the page*/}
			<div className={globalStyles.page.wrap} id="scrollableDiv">
				<TagGraph />
				<ReportsSection
					search={memoizedSearch}
					newReportSubmitted={newReportSubmitted}
					handleNewReportSubmit={handleNewReportSubmit}
					customClaims={customClaims}
				/>
			</div>
		</div>
	)
}

export default Home
