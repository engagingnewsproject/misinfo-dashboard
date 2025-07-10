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

import React, { useState, useEffect } from 'react'
import { useAuth } from "../context/AuthContext"
import FirebaseHelper from "../firebase/FirebaseHelper"
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { db } from '../config/firebase'
import Toggle from './Toggle'
import OverviewGraph from './OverviewGraph'
import ComparisonGraphSetup from './ComparisonGraphSetup'
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
	const { user, verifyRole } = useAuth()
	
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
			const result = await verifyRole()
			
			if (result.agency) {
				// Fetch agency information for agency users
				const agencyCollection = collection(db, "agency")
				const q = query(agencyCollection, where('agencyUsers', "array-contains", user['email']))
				const querySnapshot = await getDocs(q)
				
				querySnapshot.forEach((doc) => {
					const agencyTempName = doc.data()['name']
					const agencyTempId = doc.id
					setAgencyName(agencyTempName)
					setAgencyId(agencyTempId)
					setPrivilege("Agency")
				})
			} else if (result.admin) {
				// Set admin privileges
				setAgencyName("AdminName")
				setAgencyId('AdminId')
				setPrivilege("AdminPrivilege")
			}
		} catch (error) {
			console.error('Error setting role:', error)
		}
	}

	/**
	 * Fetches and processes topic report data for visualization.
	 * 
	 * This function retrieves report data from Firestore, filters by user role
	 * and time periods, and processes the data to identify trending topics.
	 * It handles both agency-specific and system-wide data aggregation.
	 * 
	 * @returns {Promise<void>} Resolves when all data is processed
	 * @throws {Error} When data fetching or processing fails
	 */
	async function getTopicReports() {
		setLoading(true)
		const reportsList = collection(db, "reports")
		
		// Fetch topics based on user privilege
		let tempTopics = []
		if (privilege === 'Agency') {
			// Retrieve agency-specific topics
			const topicDoc = doc(db, 'tags', agencyId)
			const topicRef = await getDoc(topicDoc)
			tempTopics = topicRef.get('Topic')['active']
			setTopics(tempTopics)
		} else {
			try {
				// Retrieve all system-wide topics
				const tags = await FirebaseHelper.fetchAllRecordsOfCollection('tags')
				const allActiveTopics = tags.map((tag) => tag.Topic.active)
				const combinedTopics = allActiveTopics.flat()
				// Remove duplicates
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
		
		// Initialize arrays for different time periods
		const topicsYesterday = []
		const topicsThreeDays = []
		const topicsSevenDays = []

		// Process each topic for different time periods
		for (let index = 0; index < tempTopics.length; index++) {
			// Query for yesterday's reports
			let queryYesterday
			if (privilege === "Agency") {
				queryYesterday = query(
					reportsList, 
					where("topic", "==", tempTopics[index]), 
					where("createdDate", ">=", getStartOfDay(1)),
					where("createdDate", "<", getEndOfDay()), 
					where("agency", "==", agencyName)
				)
			} else {
				queryYesterday = query(
					reportsList, 
					where("topic", "==", tempTopics[index]), 
					where("createdDate", ">=", getStartOfDay(1)),
					where("createdDate", "<", getEndOfDay())
				)
			}
			const dataYesterday = await getDocs(queryYesterday)
			
			// Query for past 3 days reports
			let queryThreeDays
			if (privilege === "Agency") {
				queryThreeDays = query(
					reportsList, 
					where("topic", "==", tempTopics[index]), 
					where("createdDate", ">=", getStartOfDay(3)),
					where("createdDate", "<", getEndOfDay()), 
					where("agency", "==", agencyName)
				)
			} else {
				queryThreeDays = query(
					reportsList, 
					where("topic", "==", tempTopics[index]), 
					where("createdDate", ">=", getStartOfDay(3)),
					where("createdDate", "<", getEndOfDay())
				)
			}
			const dataThreeDays = await getDocs(queryThreeDays)

			// Query for past 7 days reports
			let querySevenDays
			if (privilege === "Agency") {
				querySevenDays = query(
					reportsList, 
					where("topic", "==", tempTopics[index]), 
					where("createdDate", ">=", getStartOfDay(7)),
					where("createdDate", "<", getEndOfDay()), 
					where("agency", "==", agencyName)
				)
			} else {
				querySevenDays = query(
					reportsList, 
					where("topic", "==", tempTopics[index]), 
					where("createdDate", ">=", getStartOfDay(7)),
					where("createdDate", "<", getEndOfDay())
				)
			}
			const dataSevenDays = await getDocs(querySevenDays)

			// Add topics with reports to respective arrays
			if (dataYesterday.size !== 0) {
				topicsYesterday.push([tempTopics[index], dataYesterday.size])
			}
			if (dataThreeDays.size !== 0) {
				topicsThreeDays.push([tempTopics[index], dataThreeDays.size])
			}
			if (dataSevenDays.size !== 0) {
				topicsSevenDays.push([tempTopics[index], dataSevenDays.size])
			}
		}
		
		// Determine number of trending topics to display (max 3)
		const numTopics = []
		const numTopicsYesterday = topicsYesterday.length > 2 ? 3 : topicsYesterday.length
		numTopics.push(numTopicsYesterday)
		const numTopicsThreeDays = topicsThreeDays.length > 2 ? 3 : topicsThreeDays.length
		numTopics.push(numTopicsThreeDays)
		const numTopicsSevenDays = topicsSevenDays.length > 2 ? 3 : topicsSevenDays.length
		numTopics.push(numTopicsSevenDays)
		
		setNumTrendingTopics(numTopics)
		
		// Sort topics by report count (descending) and limit to top 3
		const sortedYesterday = [...topicsYesterday].sort((a, b) => b[1] - a[1]).slice(0, numTopics[0])
		const sortedThreeDays = [...topicsThreeDays].sort((a, b) => b[1] - a[1]).slice(0, numTopics[1])
		const sortedSevenDays = [...topicsSevenDays].sort((a, b) => b[1] - a[1]).slice(0, numTopics[2])
		
		// Prepare data for visualization with header row
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
	}, [])

	/**
	 * Effect hook to trigger data fetching after role verification.
	 */
	useEffect(() => {
		if (privilege) {
			setCheckRole(true)
		}
	}, [agencyName, privilege])

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
		<div className="w-full">
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

