/**
 * @fileoverview TagGraph - Data Visualization Component for Trending Topics
 * 
 * This component displays pie charts or line graphs for trending topics based on
 * the selected view. It fetches report data from Firestore and analyzes trending
 * topics across different time periods (yesterday, past 3 days, past 7 days).
 * The component supports both overview and comparison views, with role-based
 * data filtering for agency users.
 * 
 * @module components/TagGraph
 * @requires react
 * @requires ../context/AuthContext
 * @requires ../firebase/FirebaseHelper
 * @requires firebase/firestore
 * @requires ../config/firebase
 * @requires ./Toggle
 * @requires ./OverviewGraph
 * @requires ./ComparisonGraphSetup
 * @requires @material-tailwind/react
 */

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from "../../context/AuthContext"
import FirebaseHelper from "../../firebase/FirebaseHelper"
import { getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { db } from '../../config/firebase'
import {
	buildActiveReportsQuery,
	fetchExperimentConfig,
	getActiveExperimentId,
} from '../../utils/reports-queries'
import Toggle from '../common/Toggle'
import OverviewGraph from './OverviewGraph'
import ComparisonGraphSetup from '../analytics/ComparisonGraphSetup'
import { Typography } from '@material-tailwind/react'

/**
 * TagGraph - Main data visualization component for trending topics.
 * 
 * This component manages the display of trending topic data through
 * different visualization types (overview pie charts and comparison line graphs).
 * It handles data fetching, role-based filtering, and time period analysis
 * for report topics across the system.
 * 
 * @returns {JSX.Element} Component with toggle controls and data visualizations
 * @example
 * <TagGraph />
 */
const TagGraph = () => {
	const { verifyRole, refreshCustomClaims, customClaims } = useAuth()
	const agencyClaimsRefreshAttempted = useRef(false)
	
	// View state management
	const [viewVal, setViewVal] = useState("overview")
	
	// Report data for different time periods
	const [yesterdayReports, setYesterdayReports] = useState([])
	const [threeDayReports, setThreeDayReports] = useState([])
	const [sevenDayReports, setSevenDayReports] = useState([])
	
	// Trending topics configuration
	const [numTrendingTopics, setNumTrendingTopics] = useState([])
	const [topics, setTopics] = useState([])
	
	// Loading and state management
	const [loaded, setLoaded] = useState(false)
	const [loading, setLoading] = useState(true)
	const [loadingMessage, setLoadingMessage] = useState("Loading data")
	
	// User role and agency information
	const [agencyName, setAgencyName] = useState("")
	const [agencyId, setAgencyId] = useState("")
	const [privilege, setPrivilege] = useState(null)
	const [checkRole, setCheckRole] = useState(false)

	/**
	 * Returns a Firebase timestamp for the beginning of a specified number of days ago.
	 * 
	 * @param {number} daysAgo - Number of days to go back from today
	 * @returns {Timestamp} Firebase timestamp for the start of that day
	 * @example
	 * const yesterdayStart = getStartOfDay(1);
	 */
	const getStartOfDay = (daysAgo) => {
		const starting_date = new Date()
		// Sets time to midnight of the specified day
		starting_date.setHours(-24 * daysAgo, 0, 0, 0)
		const timestamp = Timestamp.fromDate(starting_date)
		return timestamp
	}

	/**
	 * Returns a Firebase timestamp for the beginning of today.
	 * 
	 * @returns {Timestamp} Firebase timestamp for the start of today
	 * @example
	 * const todayStart = getEndOfDay();
	 */
	const getEndOfDay = () => {
		const now = new Date()
		now.setHours(0, 0, 0, 0) // Sets time to midnight of today
		const timestamp = Timestamp.fromDate(now)
		return timestamp
	}

	/**
	 * Sets the user's role and agency information based on their permissions.
	 * 
	 * This function verifies the user's role and fetches agency information
	 * if they are an agency user. It sets the privilege level and agency
	 * details for data filtering.
	 * 
	 * @returns {Promise<void>} Resolves when role and agency info are set
	 */
	const setRole = async () => {
		try {
			let result = await verifyRole()
			let resolvedAgencyId =
				typeof result?.agencyId === 'string' ? result.agencyId : ''
			let resolvedAgencyName =
				typeof result?.agencyName === 'string' ? result.agencyName : ''

			if (result?.agency && !resolvedAgencyId && customClaims?.agencyId) {
				resolvedAgencyId = customClaims.agencyId
				resolvedAgencyName = customClaims.agencyName || resolvedAgencyName
			}

			if (result?.agency) {
				if (!resolvedAgencyId && refreshCustomClaims && !agencyClaimsRefreshAttempted.current) {
					agencyClaimsRefreshAttempted.current = true
					const next = await refreshCustomClaims()
					resolvedAgencyId =
						typeof next?.agencyId === 'string' ? next.agencyId : ''
					resolvedAgencyName =
						typeof next?.agencyName === 'string'
							? next.agencyName
							: resolvedAgencyName
				}

				if (resolvedAgencyId) {
					setAgencyId(resolvedAgencyId)
					setAgencyName(resolvedAgencyName || resolvedAgencyId)
					setPrivilege("Agency")
					if (!resolvedAgencyName) {
						const agencyDoc = await getDoc(doc(db, "agency", resolvedAgencyId))
						if (agencyDoc.exists()) {
							setAgencyName(agencyDoc.data()?.name || resolvedAgencyId)
						}
					}
					return
				}

				// Agency claim without agencyId: wait for AuthContext; do not query agencyUsers.
				setPrivilege("Agency")
				return
			}

			if (result?.admin) {
				setAgencyName("AdminName")
				setAgencyId('AdminId')
				setPrivilege("AdminPrivilege")
			}
		} catch (error) {
			console.error('Error setting role:', error)
		}
	}

	/**
	 * Reads createdDate from a report doc as epoch ms.
	 * @param {unknown} created
	 * @returns {number|null}
	 */
	const createdDateToMs = (created) => {
		if (!created) return null
		if (typeof created.toMillis === 'function') return created.toMillis()
		if (typeof created.seconds === 'number') {
			return (
				created.seconds * 1000 +
				Math.floor((created.nanoseconds || 0) / 1e6)
			)
		}
		const ms = Number(created)
		return Number.isFinite(ms) ? ms : null
	}

	/**
	 * Fetches and processes topic report data for visualization.
	 *
	 * One range query for the past 7 days, then buckets counts client-side into
	 * yesterday / 3-day / 7-day windows (avoids topics × 3 sequential reads).
	 *
	 * @returns {Promise<void>} Resolves when all data is processed
	 */
	async function getTopicReports() {
		setLoading(true)
		const experimentConfig = await fetchExperimentConfig()
		const activeExperimentId = getActiveExperimentId(experimentConfig)

		// Fetch topics based on user privilege
		let tempTopics = []
		if (privilege === 'Agency') {
			const topicDoc = doc(db, 'tags', agencyId)
			const topicRef = await getDoc(topicDoc)
			tempTopics = topicRef.get('Topic')['active']
			setTopics(tempTopics)
		} else {
			try {
				const tags = await FirebaseHelper.fetchAllRecordsOfCollection('tags')
				const allActiveTopics = tags.map((tag) => tag.Topic.active)
				const combinedTopics = allActiveTopics.flat()
				tempTopics = [...new Set(combinedTopics)]
				setTopics(tempTopics)
			} catch (error) {
				console.error('Error fetching tags: ', error)
			}
		}

		if (tempTopics.length === 0) {
			setLoading(false)
			return
		}

		const activeTopicSet = new Set(tempTopics)
		const agencyIdFilter = privilege === 'Agency' ? agencyId : undefined
		const rangeFrom = getStartOfDay(7)
		const rangeTo = getEndOfDay()
		const yesterdayFromMs = getStartOfDay(1).toMillis()
		const threeDaysFromMs = getStartOfDay(3).toMillis()
		const sevenDaysFromMs = rangeFrom.toMillis()
		const rangeToMs = rangeTo.toMillis()

		const countsYesterday = new Map()
		const countsThreeDays = new Map()
		const countsSevenDays = new Map()

		const bump = (map, topic) => {
			map.set(topic, (map.get(topic) || 0) + 1)
		}

		try {
			const rangeQuery = buildActiveReportsQuery({
				dateFrom: rangeFrom,
				dateTo: rangeTo,
				agencyId: agencyIdFilter,
				activeExperimentId,
			})
			const snapshot = await getDocs(rangeQuery)

			for (const reportDoc of snapshot.docs) {
				const data = reportDoc.data()
				const topic = data?.topic
				if (!topic || !activeTopicSet.has(topic)) continue

				const ms = createdDateToMs(data?.createdDate)
				if (ms === null || ms < sevenDaysFromMs || ms >= rangeToMs) continue

				bump(countsSevenDays, topic)
				if (ms >= threeDaysFromMs) bump(countsThreeDays, topic)
				if (ms >= yesterdayFromMs) bump(countsYesterday, topic)
			}
		} catch (error) {
			console.error('Overview graph range query failed:', error)
		}

		const toPairs = (map) =>
			[...map.entries()].filter(([, count]) => count > 0)

		const topicsYesterday = toPairs(countsYesterday)
		const topicsThreeDays = toPairs(countsThreeDays)
		const topicsSevenDays = toPairs(countsSevenDays)

		// Determine number of trending topics to display (max 3)
		const numTopics = [
			topicsYesterday.length > 2 ? 3 : topicsYesterday.length,
			topicsThreeDays.length > 2 ? 3 : topicsThreeDays.length,
			topicsSevenDays.length > 2 ? 3 : topicsSevenDays.length,
		]

		setNumTrendingTopics(numTopics)

		const sortedYesterday = [...topicsYesterday].sort((a, b) => b[1] - a[1]).slice(0, numTopics[0])
		const sortedThreeDays = [...topicsThreeDays].sort((a, b) => b[1] - a[1]).slice(0, numTopics[1])
		const sortedSevenDays = [...topicsSevenDays].sort((a, b) => b[1] - a[1]).slice(0, numTopics[2])

		const trendingTopics = [["Topics", "Number Reports"]]
		setYesterdayReports(trendingTopics.concat(sortedYesterday))
		setThreeDayReports(trendingTopics.concat(sortedThreeDays))
		setSevenDayReports(trendingTopics.concat(sortedSevenDays))

		setLoaded(true)
		setLoading(false)
	}
	
	/**
	 * Effect hook to set user role on component mount.
	 */
	useEffect(() => {
		setRole()
	}, [customClaims?.agencyId, customClaims?.agencyName])

	/**
	 * Effect hook to trigger data fetching after role verification.
	 */
	useEffect(() => {
		if (!privilege) return
		// Agency users need agencyId before scoped tags/reports queries
		if (privilege === 'Agency' && !agencyId) return
		setCheckRole(true)
	}, [agencyId, privilege])

	/**
	 * Effect hook to fetch topic reports after role verification.
	 */
	useEffect(() => {
		if (checkRole) {
			getTopicReports()
		}
	}, [checkRole])
	
	/**
	 * Effect hook to update loading message with animated dots.
	 */
	useEffect(() => {
		if (loading) {
			const interval = setInterval(() => {
				setLoadingMessage(prev => prev.endsWith("...") ? "Loading data" : prev + ".")
			}, 500)
			
			return () => clearInterval(interval)
		}
	}, [loading])
	
	return (
		<div data-component="TagGraph" className="w-full">
			{/* View toggle controls */}
			<Toggle viewVal={viewVal} setViewVal={setViewVal} />
			
			{/* Loading state */}
			{loading ? (
				<div className='flex items-center justify-center p-5'>
					<div className='flex justify-center'>
						<Typography variant='h5' color='blue'>{loadingMessage}</Typography>
					</div>
				</div>
			) : (
				<>
					{/* Overview graph view */}
					<div className={viewVal === 'overview' ? 'block' : 'hidden'}>
						<OverviewGraph
							id="overview"
							loaded={loaded}
							yesterdayReports={yesterdayReports}
							threeDayReports={threeDayReports}
							sevenDayReports={sevenDayReports}
							numTopics={numTrendingTopics}
						/>
					</div> 

					{/* Comparison graph view */}
					<div className={viewVal === 'comparison' ? 'block' : 'hidden'}>
						<ComparisonGraphSetup
							privilege={privilege}
							agencyId={agencyId}
							topics={topics}
						/>
					</div>
				</>
			)}
		</div>
	)
}

export default TagGraph

