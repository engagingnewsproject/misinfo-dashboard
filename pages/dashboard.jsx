/**
 * @fileoverview Dashboard Page - Main authenticated dashboard with tab navigation
 *
 * This page provides the main dashboard for authenticated users, including:
 * - Tab navigation for Home, Profile, Settings, Users, Agencies, and Help Requests
 * - Role-based access and tab visibility
 * - Modal for creating new reports
 * - Integration with AuthContext for user/role management
 * - Responsive and accessible UI
 *
 * Integrates with:
 * - All major dashboard components (Home, Profile, Settings, Users, Agencies, HelpRequests)
 * - AuthContext for authentication and role management
 * - Firebase Auth for user/role verification
 * - next/head for meta tags
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import { useRouter } from 'next/router'
import React from 'react'
import { useState, useEffect } from 'react'
import Home from '../components/Home'
import Profile from '../components/Profile'
import Settings from '../components/Settings'
import Users from '../components/Users'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import Agencies from '../components/Agencies'
import NewReportModal from '../components/modals/NewReportModal'
import { db, auth } from '../config/firebase'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import HelpRequests from '../components/HelpRequests'
const tabList = [
	'Home',
	'Profile',
	'Settings',
	'Users',
	'Agencies',
	'ReportSettings',
]

/**
 * Dashboard Page
 *
 * Renders the main dashboard with tab navigation, role-based access, and modals.
 *
 * @returns {JSX.Element} The rendered dashboard page
 */
const Dashboard = () => {
	const {
		user,
		logout,
		customClaims,
		setCustomClaims,
		verifyPrivilege,
		changeRole,
		addAdminRole,
		addAgencyRole,
		viewRole,
	} = useAuth()
	const [tab, setTab] = useState(0)
	const router = useRouter()

	const [agencyUpdateSubmitted, setAgencyUpdateSubmitted] = useState(0)

	const [newReportModal,setNewReportModal] = useState(false)
	const [newReportSubmitted,setNewReportSubmitted] = useState(0)

	const handleNewReportSubmit = () => {
		// increment the newReportSubmitted
		setNewReportSubmitted((prevState) => prevState + 1)
		setNewReportModal(false)
	}

	const handleNewReportClick = () => {
		setNewReportModal(true) // Open the modal when the button is clicked
	}

	const handleAgencyUpdateSubmit = () => {
		// increment the agencyUpdateSubmitted
		setAgencyUpdateSubmitted((prevState) => prevState + 1)
	}

	useEffect(() => {
		// TODO: debugging callback function to verify user role before displaying dashboard view
		auth.currentUser
			.getIdTokenResult()
			.then((idTokenResult) => {
				if (idTokenResult.claims.admin) {
					setCustomClaims({ admin: true })
				} else if (idTokenResult.claims.agency) {
					setCustomClaims({ agency: true })
				} else {
					setTab(1)
				}
			})
			.catch((error) => {
				console.log(error)
			})
		// console.log(customClaims)
	}, [])

	return (
		<>
			<Head>
				<title>Dashboard | Truth Sleuth Local</title>
			</Head>
			<div className="w-full">
				<Navbar
					tab={tab}
					setTab={setTab}
					handleNewReportSubmit={handleNewReportSubmit}
					handleNewReportClick={handleNewReportClick}
					customClaims={customClaims}
				/>
				<div className="sm:pl-16">
					{tab == 0 && (customClaims.admin || customClaims.agency) && (
						<Home
							newReportSubmitted={newReportSubmitted}
							handleNewReportSubmit={handleNewReportSubmit}
							handleNewReportClick={handleNewReportClick}
							customClaims={customClaims}
						/>
					)}
					{tab == 1 && <Profile customClaims={customClaims} />}
					{tab == 2 && (customClaims.admin || customClaims.agency) && (
						<Settings customClaims={customClaims} />
					)}
					{tab == 3 && (customClaims.admin || customClaims.agency) && (
						<Users customClaims={customClaims} />
					)}
					{tab == 4 && customClaims.admin && (
						<Agencies handleAgencyUpdateSubmit={handleAgencyUpdateSubmit} />
					)}
					{tab == 5 && customClaims.admin && <HelpRequests />}
				</div>
				{/* Render the NewReportModal */}
				{newReportModal && (
					<NewReportModal
						setNewReportModal={setNewReportModal}
						handleNewReportSubmit={handleNewReportSubmit}
						customClaims={customClaims}
					/>
				)}
			</div>
		</>
	)
}

export default Dashboard

/* Allows us to retrieve the json files from the pubic folder so that we can translate on the component pages*/
export async function getStaticProps(context) {
	// extract the locale identifier from the URL
	const { locale } = context

	return {
		props: {
			// pass the translation props to the page component
			...(await serverSideTranslations(locale, [
				'Home',
				'Report',
				'NewReport',
				'Profile',
				'Navbar',
			])),
		},
	}
}
