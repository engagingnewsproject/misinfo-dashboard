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
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Home from '../components/dashboard/Home'
import Profile from '../components/profile/Profile'
import Settings from '../components/admin/Settings'
import Users from '../components/admin/Users'
import Navbar from '../components/layout/Navbar'
import Headbar from '../components/layout/Headbar'
import { useAuth } from '../context/AuthContext'
import { MobileNavProvider } from '../context/MobileNavContext'
import Agencies from '../components/admin/Agencies'
import AgencyReportModal from '../components/modals/reports/AgencyReportModal'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import HelpRequests from '../components/admin/HelpRequests'
import Appearance from '../components/admin/Appearance'

/** Stable view names synced to `?view=` so refresh restores the active tab. */
const VIEW_BY_TAB = [
	'home',
	'profile',
	'settings',
	'users',
	'agencies',
	'help',
	'appearance',
]

/**
 * Whether a tab index is allowed for the given claims.
 *
 * @param {number} tabIndex
 * @param {{admin: boolean, agency: boolean}} claims
 * @returns {boolean}
 */
function isTabAllowed(tabIndex, claims) {
	if (tabIndex === 1) return true
	if (tabIndex === 0 || tabIndex === 2) {
		return !!(claims.admin || claims.agency)
	}
	// Users (3) and admin-only tools
	if (tabIndex === 3 || tabIndex === 4 || tabIndex === 5 || tabIndex === 6) {
		return !!claims.admin
	}
	return false
}

/**
 * Dashboard Page
 *
 * Renders the main dashboard with tab navigation, role-based access, and modals.
 *
 * @returns {JSX.Element} The rendered dashboard page
 */
const Dashboard = () => {
	const { customClaims, claimsReady } = useAuth()
	const router = useRouter()

	const [agencyUpdateSubmitted, setAgencyUpdateSubmitted] = useState(0)

	const [newReportModal, setNewReportModal] = useState(false)
	const [newReportSubmitted, setNewReportSubmitted] = useState(0)

	const handleNewReportSubmit = () => {
		setNewReportSubmitted((prevState) => prevState + 1)
		setNewReportModal(false)
	}

	const handleNewReportClick = () => {
		setNewReportModal(true)
	}

	const handleAgencyUpdateSubmit = () => {
		setAgencyUpdateSubmitted((prevState) => prevState + 1)
	}

	const viewFromQuery = useMemo(() => {
		const raw = router.query.view
		return typeof raw === 'string' ? raw : null
	}, [router.query.view])

	const tab = useMemo(() => {
		const idx = viewFromQuery ? VIEW_BY_TAB.indexOf(viewFromQuery) : -1
		return idx >= 0 ? idx : 0
	}, [viewFromQuery])

	const setTab = useCallback(
		(nextTab) => {
			const view = VIEW_BY_TAB[nextTab] ?? 'home'
			if (viewFromQuery === view) return
			router.replace(
				{
					pathname: router.pathname,
					query: { ...router.query, view },
				},
				undefined,
				{ shallow: true },
			)
		},
		[router, viewFromQuery],
	)

	// Persist / restore view via URL; only clamp roles after claims are known.
	// (Previously an effect treated the default {admin:false,agency:false} as
	// "regular user" and forced Profile on every refresh before claims loaded.)
	useEffect(() => {
		if (!router.isReady || !claimsReady) return

		const isPrivileged = !!(customClaims.admin || customClaims.agency)
		const requestedIdx = viewFromQuery
			? VIEW_BY_TAB.indexOf(viewFromQuery)
			: -1

		let nextIdx = requestedIdx
		if (nextIdx < 0 || !isTabAllowed(nextIdx, customClaims)) {
			nextIdx = isPrivileged ? 0 : 1
		}

		const nextView = VIEW_BY_TAB[nextIdx]
		if (viewFromQuery !== nextView) {
			router.replace(
				{
					pathname: router.pathname,
					query: { ...router.query, view: nextView },
				},
				undefined,
				{ shallow: true },
			)
		}
	}, [
		router,
		router.isReady,
		claimsReady,
		customClaims,
		customClaims.admin,
		customClaims.agency,
		viewFromQuery,
	])

	return (
		<>
			<Head>
				<title>Dashboard | Truth Sleuth Local</title>
			</Head>
			<MobileNavProvider>
				<div data-component="dashboard" className="w-full">
					<Navbar
						tab={tab}
						setTab={setTab}
						handleNewReportSubmit={handleNewReportSubmit}
						handleNewReportClick={handleNewReportClick}
						customClaims={customClaims}
					/>
					<div className="sm:pl-16 flex flex-col py-5">
						<Headbar />
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
						{tab == 3 && customClaims.admin && (
							<Users customClaims={customClaims} />
						)}
						{tab == 4 && customClaims.admin && (
							<Agencies handleAgencyUpdateSubmit={handleAgencyUpdateSubmit} />
						)}
						{tab == 5 && customClaims.admin && <HelpRequests />}
						{tab == 6 && customClaims.admin && <Appearance />}
					</div>
					{newReportModal && (
						<AgencyReportModal
							open={newReportModal}
							setNewReportModal={setNewReportModal}
							handleNewReportSubmit={handleNewReportSubmit}
						/>
					)}
				</div>
			</MobileNavProvider>
		</>
	)
}

export default Dashboard

/* Allows us to retrieve the json files from the pubic folder so that we can translate on the component pages*/
export async function getStaticProps(context) {
	const { locale } = context

	return {
		props: {
			...(await serverSideTranslations(locale, [
				'Home',
				'Report',
				'NewReport',
				'Profile',
				'Navbar',
				'ShareReport',
			])),
		},
	}
}
