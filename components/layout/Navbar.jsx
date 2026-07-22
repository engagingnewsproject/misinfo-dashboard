/**
 * @fileoverview Navbar - Side Navigation Component
 * 
 * This component provides the main navigation sidebar for the application,
 * displaying different navigation options based on user roles (admin, agency, or regular user).
 * It includes a responsive drawer that adapts to mobile and desktop views,
 * with tooltips for better user experience and role-based access control.
 * 
 * @module components/Navbar
 * @requires react
 * @requires @material-tailwind/react
 * @requires next/router
 * @requires react-icons/io5
 * @requires react-icons/hi2
 * @requires react-tooltip
 * @requires ../modals/reports/AgencyReportModal
 * @requires ../modals/HelpModal
 * @requires ../modals/ContactHelpModal
 * @requires ../context/AuthContext
 * @requires next-i18next
 */

import React, { useState, useEffect } from 'react'
import { Drawer, IconButton } from '@material-tailwind/react'
import { useRouter } from 'next/router'
import {
	IoHomeOutline,
	IoSettingsOutline,
	IoAddCircleOutline,
	IoPricetagsOutline,
	IoLogOutOutline,
	IoPeopleOutline,
	IoPersonOutline,
	IoHelpCircleOutline,
	IoBusinessOutline,
	IoClose,
	IoMenu,
	IoChatboxEllipsesOutline,
	IoDocumentTextOutline,
} from 'react-icons/io5'
import { HiOutlineDocumentPlus } from 'react-icons/hi2'
import { Tooltip } from 'react-tooltip'
import HelpModal from '../modals/common/HelpModal'
import ContactHelpModal from '../modals/ContactHelpModal'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'next-i18next'

/**
 * Navbar - Main navigation sidebar component.
 * 
 * This component renders a responsive navigation drawer with role-based
 * navigation options. It automatically adapts to screen size, showing
 * a hamburger menu on mobile and a persistent sidebar on desktop.
 * Navigation items are filtered based on user permissions and include
 * tooltips for better accessibility.
 * 
 * @param {Object} props - Component props
 * @param {number} props.tab - Currently active tab index
 * @param {Function} props.setTab - Function to change the active tab
 * @param {Function} props.handleNewReportSubmit - Handler for new report submission
 * @param {Function} props.handleNewReportClick - Handler for new report button click
 * @param {Function} props.onReportTabClick - Handler for report tab click
 * @param {boolean} props.isOpen - Whether the navbar is open (legacy prop)
 * @returns {JSX.Element} Navigation sidebar with role-based menu items
 * @example
 * <Navbar
 *   tab={0}
 *   setTab={setActiveTab}
 *   handleNewReportSubmit={handleSubmit}
 *   handleNewReportClick={handleNewReport}
 *   onReportTabClick={handleReportTab}
 *   isOpen={false}
 * />
 */
const Navbar = ({
	tab,
	setTab,
	handleNewReportSubmit,
	handleNewReportClick,
	onReportTabClick,
	isOpen,
}) => {
	const { t } = useTranslation('Navbar')
	
	// Window size state for responsive behavior
	const [windowSize, setWindowSize] = useState([
		window.innerWidth,
		window.innerHeight,
	])
	
	// Controls overlay display on mobile vs desktop
	const [disableOverlay, setDisableOverlay] = useState(true)
	
	// Modal states
	const [helpModal, setHelpModal] = useState(false)
	const [contactHelpModal, setContactHelpModal] = useState(false)
	
	// Authentication context
	const { customClaims, setCustomClaims } = useAuth()
	
	// Drawer open/close state
	const [open, setOpen] = useState(false)
	const openDrawer = () => setOpen(true)
	const closeDrawer = () => setOpen(false)

	/**
	 * Effect hook to handle window resize events.
	 * 
	 * This effect sets up a listener for window resize events to update
	 * the windowSize state, which is used for responsive behavior.
	 */
	useEffect(() => {
		const handleWindowResize = () => {
			setWindowSize([window.innerWidth, window.innerHeight])
		}

		window.addEventListener('resize', handleWindowResize)

		return () => {
			window.removeEventListener('resize', handleWindowResize)
		}
	}, [])

	/**
	 * Effect hook to control overlay behavior based on screen size.
	 * 
	 * This effect ensures that the drawer overlay is only displayed
	 * on mobile screens (width < 640px), since the navbar is always
	 * visible on desktop screens.
	 */
	useEffect(() => {
		if (windowSize && windowSize[0] < 640) {
			setDisableOverlay(true)
		} else {
			setDisableOverlay(false)
		}
	}, [windowSize])

	/**
	 * Handles navigation to a specific tab.
	 * 
	 * @param {number} tabIndex - The tab index to navigate to
	 */
	const handleTabNavigation = (tabIndex) => {
		setTab(tabIndex)
		closeDrawer()
	}

	/**
	 * Shared nav IconButton: MT text + brand channel; selected tabs keep bg-brand/10.
	 */
	const navIconClass = (tooltipClass, isActive = false) =>
		`my-4 mx-2 ${tooltipClass}${isActive ? ' bg-brand/10' : ''}`

	/**
	 * Handles new report creation for agency users.
	 * 
	 * @param {Event} e - Click event
	 */
	const handleAgencyNewReport = (e) => {
		handleNewReportClick(e)
		closeDrawer()
	}

	/**
	 * Handles report creation for general users.
	 * 
	 * @param {Event} e - Click event
	 */
	const handleGeneralUserReport = (e) => {
		onReportTabClick(e)
		closeDrawer()
	}

	/**
	 * Handles opening the help modal.
	 */
	const handleHelpModal = () => {
		setHelpModal(true)
		closeDrawer()
	}

	/**
	 * Handles opening the contact help modal.
	 */
	const handleContactHelpModal = () => {
		setContactHelpModal(true)
		closeDrawer()
	}

	return (
		<>
			{/* Mobile menu button */}
			<div className="absolute">
				<IconButton
					variant="text"
					onClick={openDrawer}
					className="top-8 left-4 z-10 sm:hidden tooltip-menu">
					<IoMenu size={40} />
				</IconButton>
			</div>
			
			{/* Navigation drawer */}
			<Drawer
				open={windowSize[0] > 640 ? true : open}
				onClose={closeDrawer}
				size={65}
				overlay={disableOverlay}
				className="z-[9997] !h-full">
				<div className="flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
						{/* Top section - Main navigation items */}
						<div className="shrink-0">
							{/* Close button (mobile only) */}
							<IconButton
								variant="text"
								onClick={closeDrawer}
								className={`${navIconClass('tooltip-close')} sm:hidden`}
								aria-label="Close menu">
								<IoClose size={30} />
							</IconButton>
							
							{/* Home/Reports view - Admin and Agency users */}
							{(customClaims.admin || customClaims.agency) && (
								<>
									<IconButton
										variant="text"
										onClick={() => handleTabNavigation(0)}
										className={navIconClass('tooltip-home', tab === 0)}
										aria-label="Home">
										<IoHomeOutline size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-home"
										place="bottom"
										delayShow={500}>
										Home
									</Tooltip>
								</>
							)}
							
							{/* Agencies - Admin only */}
							{customClaims.admin && (
								<>
									<IconButton
										variant="text"
										onClick={() => handleTabNavigation(4)}
										className={navIconClass('tooltip-agencies', tab === 4)}
										aria-label="Agencies">
										<IoBusinessOutline size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-agencies"
										place="bottom"
										delayShow={500}>
										Agencies
									</Tooltip>
								</>
							)}
							
							{/* Tagging Systems - Agency and Admin users */}
							{(customClaims.agency || customClaims.admin) && (
								<>
									<IconButton
										variant="text"
										onClick={() => handleTabNavigation(2)}
										className={navIconClass('tooltip-tags', tab === 2)}
										aria-label="Tagging Systems">
										<IoPricetagsOutline size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-tags"
										place="bottom"
										delayShow={500}>
										Tagging Systems
									</Tooltip>
								</>
							)}
							
							{/* New Report - Agency users only */}
							{customClaims.agency && (
								<>
									<IconButton
										variant="text"
										onClick={handleAgencyNewReport}
										className={navIconClass('tooltip-new-report')}
										aria-label="New Report">
										<IoAddCircleOutline size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-new-report"
										place="bottom"
										delayShow={500}>
										New Report
									</Tooltip>
								</>
							)}
							
							{/* Users - Admin only */}
							{customClaims.admin && (
								<>
									<IconButton
										variant="text"
										onClick={() => handleTabNavigation(3)}
										className={navIconClass('tooltip-users', tab === 3)}
										aria-label="Users">
										<IoPeopleOutline size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-users"
										place="bottom"
										delayShow={500}>
										Users
									</Tooltip>
								</>
							)}
							
							{/* Create Report - General users only */}
							{!customClaims.admin && !customClaims.agency && (
								<>
									<IconButton
										variant="text"
										onClick={handleGeneralUserReport}
										className={navIconClass('tooltip-create-report')}
										aria-label="Create Report">
										<HiOutlineDocumentPlus size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-create-report"
										place="bottom"
										delayShow={500}>
										Create Report
									</Tooltip>
								</>
							)}
							
							{/* Help Requests - Admin only */}
							{customClaims.admin && (
								<>
									<IconButton
										variant="text"
										onClick={() => handleTabNavigation(5)}
										className={navIconClass('tooltip-help-requests', tab === 5)}
										aria-label="Help Requests">
										<IoDocumentTextOutline size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-help-requests"
										place="bottom"
										delayShow={500}>
										Help Requests
									</Tooltip>
								</>
							)}
						</div>
						
						{/* Bottom section - Appearance, Help and Profile */}
						<div className="mt-auto shrink-0">
							{/* Appearance - Admin only */}
							{customClaims.admin && (
								<>
									<IconButton
										variant="text"
										onClick={() => handleTabNavigation(6)}
										className={navIconClass('tooltip-appearance', tab === 6)}
										aria-label="Appearance">
										<IoSettingsOutline size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-appearance"
										place="bottom"
										delayShow={500}>
										Appearance
									</Tooltip>
								</>
							)}

							{/* Help - Admin and Agency users */}
							{(customClaims.admin || customClaims.agency) && (
								<>
									<IconButton
										variant="text"
										onClick={handleHelpModal}
										className={navIconClass('tooltip-help')}
										aria-label="Help">
										<IoHelpCircleOutline size={30} />
									</IconButton>
									<Tooltip
										anchorSelect=".tooltip-help"
										place="bottom"
										delayShow={500}>
										Help
									</Tooltip>
								</>
							)}
							
							{/* Contact for Help - All users */}
							<IconButton
								variant="text"
								onClick={handleContactHelpModal}
								className={navIconClass('tooltip-contact-us-for-help')}
								aria-label="Contact for Help">
								<IoChatboxEllipsesOutline size={30} />
							</IconButton>
							<Tooltip
								anchorSelect=".tooltip-contact-us-for-help"
								place="bottom"
								delayShow={500}>
								Contact for Help
							</Tooltip>
							
							{/* Profile - All users */}
							<IconButton
								variant="text"
								onClick={() => handleTabNavigation(1)}
								className={navIconClass('tooltip-profile', tab === 1)}
								aria-label="Profile">
								<IoPersonOutline size={30} />
							</IconButton>
							<Tooltip
								anchorSelect=".tooltip-profile"
								place="bottom"
								delayShow={500}>
								Profile
							</Tooltip>
						</div>
				</div>
			</Drawer>
			
			{/* Modal components */}
			<HelpModal open={helpModal} setHelpModal={setHelpModal} />
			<ContactHelpModal
				open={contactHelpModal}
				setContactHelpModal={setContactHelpModal}
			/>
		</>
	)
}

export default Navbar
