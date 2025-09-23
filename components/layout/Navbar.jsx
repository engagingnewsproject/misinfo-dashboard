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
 * @requires ./modals/NewReportModal
 * @requires ./modals/HelpModal
 * @requires ./modals/ContactHelpModal
 * @requires ../context/AuthContext
 * @requires next-i18next
 */

import React, { useState, useEffect } from 'react'
import { Drawer, Button, IconButton } from '@material-tailwind/react'
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
import NewReportModal from '../modals/reports/NewReportModal'
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
 * @param {Function} props.handleContactHelpSubmit - Handler for contact help submission
 * @param {Function} props.handleNewReportClick - Handler for new report button click
 * @param {Function} props.onReportTabClick - Handler for report tab click
 * @param {boolean} props.isOpen - Whether the navbar is open (legacy prop)
 * @returns {JSX.Element} Navigation sidebar with role-based menu items
 * @example
 * <Navbar
 *   tab={0}
 *   setTab={setActiveTab}
 *   handleNewReportSubmit={handleSubmit}
 *   handleContactHelpSubmit={handleContact}
 *   handleNewReportClick={handleNewReport}
 *   onReportTabClick={handleReportTab}
 *   isOpen={false}
 * />
 */
const Navbar = ({
	tab,
	setTab,
	handleNewReportSubmit,
	handleContactHelpSubmit,
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
	 * Base styling for navigation buttons.
	 * 
	 * @type {string}
	 */
	const basicStyle =
		'flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg'

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
				className="z-[9997]">
				<div className="flex-col h-full max-h-[81vh] md:h-screen md:max-h-screen">
					<div className="grid grid-rows-2 justify-between w-full h-full">
						{/* Top section - Main navigation items */}
						<div className="row-span-1">
							{/* Close button (mobile only) */}
							<Button
								variant="text"
								onClick={closeDrawer}
								className={basicStyle + ' sm:hidden tooltip-close'}>
								<IoClose size={30} />
							</Button>
							
							{/* Home/Reports view - Admin and Agency users */}
							{(customClaims.admin || customClaims.agency) && (
								<button
									onClick={() => handleTabNavigation(0)}
									className={`${basicStyle} ${
										tab === 0 ? 'text-indigo-500 bg-indigo-100' : ''
									} tooltip-home`}>
									<IoHomeOutline size={30} />
									<Tooltip
										anchorSelect=".tooltip-home"
										place="bottom"
										delayShow={500}>
										Home
									</Tooltip>
								</button>
							)}
							
							{/* Agencies - Admin only */}
							{customClaims.admin && (
								<button
									onClick={() => handleTabNavigation(4)}
									className={`${basicStyle} ${
										tab === 4 ? 'text-indigo-500 bg-indigo-100' : ''
									} tooltip-agencies`}>
									<IoBusinessOutline size={30} />
									<Tooltip
										anchorSelect=".tooltip-agencies"
										place="bottom"
										delayShow={500}>
										Agencies
									</Tooltip>
								</button>
							)}
							
							{/* Tagging Systems - Agency and Admin users */}
							{(customClaims.agency || customClaims.admin) && (
								<button
									onClick={() => handleTabNavigation(2)}
									className={`${basicStyle} ${
										tab === 2 ? ' text-indigo-500 bg-indigo-100' : ''
									} tooltip-tags`}>
									<IoPricetagsOutline size={30} />
									<Tooltip
										anchorSelect=".tooltip-tags"
										place="bottom"
										delayShow={500}>
										Tagging Systems
									</Tooltip>
								</button>
							)}
							
							{/* New Report - Agency users only */}
							{customClaims.agency && (
								<button
									onClick={handleAgencyNewReport}
									className={`${basicStyle} tooltip-new-report`}>
									<IoAddCircleOutline size={30} />
									<Tooltip
										anchorSelect=".tooltip-new-report"
										place="bottom"
										delayShow={500}>
										New Report
									</Tooltip>
								</button>
							)}
							
							{/* Users - Admin only */}
							{customClaims.admin && (
								<button
									onClick={() => handleTabNavigation(3)}
									className={`${basicStyle} ${
										tab === 3 ? ' text-indigo-500 bg-indigo-100' : ''
									} tooltip-users`}>
									<IoPeopleOutline size={30} />
									<Tooltip
										anchorSelect=".tooltip-users"
										place="bottom"
										delayShow={500}>
										Users
									</Tooltip>
								</button>
							)}
							
							{/* Create Report - General users only */}
							{!customClaims.admin && !customClaims.agency && (
								<button
									onClick={handleGeneralUserReport}
									className={`${basicStyle} tooltip-create-report`}>
									<HiOutlineDocumentPlus size={30} />
									<Tooltip
										anchorSelect=".tooltip-create-report"
										place="bottom"
										delayShow={500}>
										Create Report
									</Tooltip>
								</button>
							)}
							
							{/* Help Requests - Admin only */}
							{customClaims.admin && (
								<button
									onClick={() => handleTabNavigation(5)}
									className={`${basicStyle} ${
										tab === 5 ? ' text-indigo-500 bg-indigo-100' : ''
									} tooltip-help-requests`}>
									<IoDocumentTextOutline size={30} />
									<Tooltip
										anchorSelect=".tooltip-help-requests"
										place="bottom"
										delayShow={500}>
										Help Requests
									</Tooltip>
								</button>
							)}
						</div>
						
						{/* Bottom section - Help and Profile */}
						<div className="self-end">
							{/* Help - Admin and Agency users */}
							{(customClaims.admin || customClaims.agency) && (
								<button
									onClick={handleHelpModal}
									className={`${basicStyle} tooltip-help`}>
									<IoHelpCircleOutline size={30} />
									<Tooltip
										anchorSelect=".tooltip-help"
										place="bottom"
										delayShow={500}>
										Help
									</Tooltip>
								</button>
							)}
							
							{/* Contact for Help - All users */}
							<button
								onClick={handleContactHelpModal}
								className={`${basicStyle} tooltip-contact-us-for-help`}>
								<IoChatboxEllipsesOutline size={30} />
								<Tooltip
									anchorSelect=".tooltip-contact-us-for-help"
									place="bottom"
									delayShow={500}>
									Contact for Help
								</Tooltip>
							</button>
							
							{/* Profile - All users */}
							<button
								onClick={() => handleTabNavigation(1)}
								className={`${basicStyle} ${
									tab === 1 ? ' text-indigo-500 bg-indigo-100' : ''
								} tooltip-profile`}>
								<IoPersonOutline size={30} />
								<Tooltip
									anchorSelect=".tooltip-profile"
									place="bottom"
									delayShow={500}>
									Profile
								</Tooltip>
							</button>
						</div>
					</div>
				</div>
			</Drawer>
			
			{/* Modal components */}
			{helpModal && <HelpModal setHelpModal={setHelpModal} />}
			{contactHelpModal && (
				<ContactHelpModal
					setContactHelpModal={setContactHelpModal}
					handleContactHelpSubmit={handleContactHelpSubmit}
				/>
			)}
		</>
	)
}

export default Navbar
