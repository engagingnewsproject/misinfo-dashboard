/**
 * @fileoverview Navbar - Side Navigation Component
 *
 * Responsive drawer: icon rail on mobile / collapsed desktop; icon + label when
 * desktop-expanded. Expand toggle lives at the bottom (desktop only).
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemPrefix,
	Typography,
} from '@material-tailwind/react'
import {
	IoHomeOutline,
	IoSettingsOutline,
	IoAddCircleOutline,
	IoPricetagsOutline,
	IoPeopleOutline,
	IoPersonOutline,
	IoHelpCircleOutline,
	IoBusinessOutline,
	IoClose,
	IoChatboxEllipsesOutline,
	IoDocumentTextOutline,
	IoChevronBackOutline,
	IoChevronForwardOutline,
} from 'react-icons/io5'
import { HiOutlineDocumentPlus } from 'react-icons/hi2'
import { Tooltip } from 'react-tooltip'
import HelpModal from '../modals/common/HelpModal'
import ContactHelpModal from '../modals/ContactHelpModal'
import { useAuth } from '../../context/AuthContext'
import {
	NAV_COLLAPSED_WIDTH,
	NAV_EXPANDED_MAX_WIDTH,
	useMobileNav,
} from '../../context/MobileNavContext'

/** Tooltip outside the drawer so overflow / motion transforms can't clip it. */
function NavTooltip({ tooltipClass, children }) {
	if (typeof document === 'undefined') return null
	return createPortal(
		<Tooltip
			anchorSelect={`.${tooltipClass}`}
			place="right"
			delayShow={500}
			positionStrategy="fixed"
			style={{ zIndex: 10050 }}>
			{children}
		</Tooltip>,
		document.body,
	)
}

/**
 * Single nav control: icon-only (with tooltip) or MT ListItem with label.
 */
function NavItem({
	icon,
	label,
	active = false,
	onClick,
	expanded,
	tooltipClass,
	ariaLabel,
}) {
	const navIconClass = `my-4 mx-2 ${tooltipClass}${active ? ' bg-brand/10' : ''}`

	if (!expanded) {
		return (
			<>
				<IconButton
					variant="text"
					onClick={onClick}
					className={navIconClass}
					aria-label={ariaLabel || label}>
					{icon}
				</IconButton>
				<NavTooltip tooltipClass={tooltipClass}>{label}</NavTooltip>
			</>
		)
	}

	return (
		<ListItem
			selected={active}
			onClick={onClick}
			className={`mx-1 rounded-md py-2 ${active ? 'bg-brand/10' : ''}`}
			aria-label={ariaLabel || label}>
			<ListItemPrefix className="mr-3 shrink-0">{icon}</ListItemPrefix>
			<Typography
				variant="small"
				className="font-medium text-[#2E3B4E] whitespace-nowrap">
				{label}
			</Typography>
		</ListItem>
	)
}

const Navbar = ({
	tab,
	setTab,
	handleNewReportClick,
	onReportTabClick,
}) => {
	const [windowSize, setWindowSize] = useState([
		typeof window !== 'undefined' ? window.innerWidth : 1024,
		typeof window !== 'undefined' ? window.innerHeight : 768,
	])

	const [disableOverlay, setDisableOverlay] = useState(true)
	const [helpModal, setHelpModal] = useState(false)
	const [contactHelpModal, setContactHelpModal] = useState(false)

	const { customClaims } = useAuth()
	const {
		open,
		closeDrawer,
		desktopExpanded,
		toggleDesktopExpanded,
		setMeasuredDrawerWidth,
	} = useMobileNav()

	const drawerRef = useRef(null)
	const isDesktop = windowSize[0] > 640
	const showLabels = isDesktop && desktopExpanded
	const drawerSize = isDesktop
		? showLabels
			? NAV_EXPANDED_MAX_WIDTH
			: NAV_COLLAPSED_WIDTH
		: NAV_COLLAPSED_WIDTH

	useEffect(() => {
		const handleWindowResize = () => {
			setWindowSize([window.innerWidth, window.innerHeight])
		}
		window.addEventListener('resize', handleWindowResize)
		return () => window.removeEventListener('resize', handleWindowResize)
	}, [])

	useEffect(() => {
		if (windowSize && windowSize[0] < 640) {
			setDisableOverlay(true)
		} else {
			setDisableOverlay(false)
		}
	}, [windowSize])

	// Keep page offset in sync with the content-sized expanded drawer.
	useLayoutEffect(() => {
		if (!isDesktop || !desktopExpanded) return
		const el = drawerRef.current
		if (!el) return

		const report = () => {
			const width = el.getBoundingClientRect().width
			setMeasuredDrawerWidth(width)
		}
		report()
		const ro = new ResizeObserver(report)
		ro.observe(el)
		return () => ro.disconnect()
	}, [isDesktop, desktopExpanded, showLabels, setMeasuredDrawerWidth])

	const handleTabNavigation = (tabIndex) => {
		setTab(tabIndex)
		closeDrawer()
	}

	const handleAgencyNewReport = (e) => {
		handleNewReportClick(e)
		closeDrawer()
	}

	const handleGeneralUserReport = (e) => {
		onReportTabClick(e)
		closeDrawer()
	}

	const handleHelpModal = () => {
		setHelpModal(true)
		closeDrawer()
	}

	const handleContactHelpModal = () => {
		setContactHelpModal(true)
		closeDrawer()
	}

	const icon = (Node) => <Node size={showLabels ? 22 : 30} />

	return (
		<>
			<Drawer
				ref={drawerRef}
				open={isDesktop ? true : open}
				onClose={closeDrawer}
				size={drawerSize}
				overlay={disableOverlay}
				className={`z-[9997] !h-full transition-[max-width] duration-200 ease-in-out${
					showLabels ? ' !w-max overflow-x-hidden' : ''
				}`}>
				<div
					className={`flex h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
						showLabels ? 'w-max max-w-full' : 'w-full'
					}`}>
					<div className={`shrink-0 ${showLabels ? 'px-1 pt-2' : ''}`}>
						{showLabels ? (
							<List className="p-0 !min-w-0 w-max max-w-full">
								{(customClaims.admin || customClaims.agency) && (
									<NavItem
										expanded
										icon={icon(IoHomeOutline)}
										label="Home"
										active={tab === 0}
										onClick={() => handleTabNavigation(0)}
										tooltipClass="tooltip-home"
									/>
								)}
								{customClaims.admin && (
									<NavItem
										expanded
										icon={icon(IoBusinessOutline)}
										label="Agencies"
										active={tab === 4}
										onClick={() => handleTabNavigation(4)}
										tooltipClass="tooltip-agencies"
									/>
								)}
								{(customClaims.agency || customClaims.admin) && (
									<NavItem
										expanded
										icon={icon(IoPricetagsOutline)}
										label="Tagging Systems"
										active={tab === 2}
										onClick={() => handleTabNavigation(2)}
										tooltipClass="tooltip-tags"
									/>
								)}
								{customClaims.agency && (
									<NavItem
										expanded
										icon={icon(IoAddCircleOutline)}
										label="New Report"
										onClick={handleAgencyNewReport}
										tooltipClass="tooltip-new-report"
									/>
								)}
								{customClaims.admin && (
									<NavItem
										expanded
										icon={icon(IoPeopleOutline)}
										label="Users"
										active={tab === 3}
										onClick={() => handleTabNavigation(3)}
										tooltipClass="tooltip-users"
									/>
								)}
								{!customClaims.admin && !customClaims.agency && (
									<NavItem
										expanded
										icon={icon(HiOutlineDocumentPlus)}
										label="Create Report"
										onClick={handleGeneralUserReport}
										tooltipClass="tooltip-create-report"
									/>
								)}
								{customClaims.admin && (
									<NavItem
										expanded
										icon={icon(IoDocumentTextOutline)}
										label="Help Requests"
										active={tab === 5}
										onClick={() => handleTabNavigation(5)}
										tooltipClass="tooltip-help-requests"
									/>
								)}
							</List>
						) : (
							<>
								<IconButton
									variant="text"
									onClick={closeDrawer}
									className="my-4 mx-2 tooltip-close sm:hidden"
									aria-label="Close menu">
									<IoClose size={30} />
								</IconButton>

								{(customClaims.admin || customClaims.agency) && (
									<NavItem
										expanded={false}
										icon={icon(IoHomeOutline)}
										label="Home"
										active={tab === 0}
										onClick={() => handleTabNavigation(0)}
										tooltipClass="tooltip-home"
									/>
								)}
								{customClaims.admin && (
									<NavItem
										expanded={false}
										icon={icon(IoBusinessOutline)}
										label="Agencies"
										active={tab === 4}
										onClick={() => handleTabNavigation(4)}
										tooltipClass="tooltip-agencies"
									/>
								)}
								{(customClaims.agency || customClaims.admin) && (
									<NavItem
										expanded={false}
										icon={icon(IoPricetagsOutline)}
										label="Tagging Systems"
										active={tab === 2}
										onClick={() => handleTabNavigation(2)}
										tooltipClass="tooltip-tags"
									/>
								)}
								{customClaims.agency && (
									<NavItem
										expanded={false}
										icon={icon(IoAddCircleOutline)}
										label="New Report"
										onClick={handleAgencyNewReport}
										tooltipClass="tooltip-new-report"
									/>
								)}
								{customClaims.admin && (
									<NavItem
										expanded={false}
										icon={icon(IoPeopleOutline)}
										label="Users"
										active={tab === 3}
										onClick={() => handleTabNavigation(3)}
										tooltipClass="tooltip-users"
									/>
								)}
								{!customClaims.admin && !customClaims.agency && (
									<NavItem
										expanded={false}
										icon={icon(HiOutlineDocumentPlus)}
										label="Create Report"
										onClick={handleGeneralUserReport}
										tooltipClass="tooltip-create-report"
									/>
								)}
								{customClaims.admin && (
									<NavItem
										expanded={false}
										icon={icon(IoDocumentTextOutline)}
										label="Help Requests"
										active={tab === 5}
										onClick={() => handleTabNavigation(5)}
										tooltipClass="tooltip-help-requests"
									/>
								)}
							</>
						)}
					</div>

					<div className={`mt-auto shrink-0 ${showLabels ? 'px-1' : ''}`}>
						{showLabels ? (
							<List className="p-0 !min-w-0 w-max max-w-full">
								{customClaims.admin && (
									<NavItem
										expanded
										icon={icon(IoSettingsOutline)}
										label="Appearance"
										active={tab === 6}
										onClick={() => handleTabNavigation(6)}
										tooltipClass="tooltip-appearance"
									/>
								)}
								{(customClaims.admin || customClaims.agency) && (
									<NavItem
										expanded
										icon={icon(IoHelpCircleOutline)}
										label="Help"
										onClick={handleHelpModal}
										tooltipClass="tooltip-help"
									/>
								)}
								<NavItem
									expanded
									icon={icon(IoChatboxEllipsesOutline)}
									label="Contact for Help"
									onClick={handleContactHelpModal}
									tooltipClass="tooltip-contact-us-for-help"
								/>
								<NavItem
									expanded
									icon={icon(IoPersonOutline)}
									label="Profile"
									active={tab === 1}
									onClick={() => handleTabNavigation(1)}
									tooltipClass="tooltip-profile"
								/>
							</List>
						) : (
							<>
								{customClaims.admin && (
									<NavItem
										expanded={false}
										icon={icon(IoSettingsOutline)}
										label="Appearance"
										active={tab === 6}
										onClick={() => handleTabNavigation(6)}
										tooltipClass="tooltip-appearance"
									/>
								)}
								{(customClaims.admin || customClaims.agency) && (
									<NavItem
										expanded={false}
										icon={icon(IoHelpCircleOutline)}
										label="Help"
										onClick={handleHelpModal}
										tooltipClass="tooltip-help"
									/>
								)}
								<NavItem
									expanded={false}
									icon={icon(IoChatboxEllipsesOutline)}
									label="Contact for Help"
									onClick={handleContactHelpModal}
									tooltipClass="tooltip-contact-us-for-help"
								/>
								<NavItem
									expanded={false}
									icon={icon(IoPersonOutline)}
									label="Profile"
									active={tab === 1}
									onClick={() => handleTabNavigation(1)}
									tooltipClass="tooltip-profile"
								/>
							</>
						)}

						{/* Desktop expand / collapse */}
						<div className="hidden sm:block border-t border-blue-gray-50 mt-1">
							{showLabels ? (
								<ListItem
									onClick={toggleDesktopExpanded}
									className="mx-1 rounded-md py-2"
									aria-label="Collapse sidebar">
									<ListItemPrefix className="mr-3">
										<IoChevronBackOutline size={22} />
									</ListItemPrefix>
									<Typography
										variant="small"
										className="font-medium text-[#2E3B4E] whitespace-nowrap">
										Collapse
									</Typography>
								</ListItem>
							) : (
								<>
									<IconButton
										variant="text"
										onClick={toggleDesktopExpanded}
										className="my-4 mx-2 tooltip-expand-nav"
										aria-label="Expand sidebar">
										<IoChevronForwardOutline size={30} />
									</IconButton>
									<NavTooltip tooltipClass="tooltip-expand-nav">
										Expand
									</NavTooltip>
								</>
							)}
						</div>
					</div>
				</div>
			</Drawer>

			<HelpModal open={helpModal} setHelpModal={setHelpModal} />
			<ContactHelpModal
				open={contactHelpModal}
				setContactHelpModal={setContactHelpModal}
			/>
		</>
	)
}

export default Navbar
