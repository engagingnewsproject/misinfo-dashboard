/**
 * @fileoverview Navbar - Side Navigation Component
 *
 * Responsive drawer: desktop brand + expand at top; icon rail / labels; logout at bottom.
 * Mobile overlay is menu-only (brand lives in Headbar); expand/collapse is desktop-only.
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/router'
import {
	Button,
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
	IoLogOutOutline,
} from 'react-icons/io5'
import { HiOutlineDocumentPlus } from 'react-icons/hi2'
import { Tooltip } from 'react-tooltip'
import HelpModal from '../modals/common/HelpModal'
import ContactHelpModal from '../modals/ContactHelpModal'
import ConfirmModal from '../modals/common/ConfirmModal'
import { useAuth } from '../../context/AuthContext'
import { useNavBranding } from '../../hooks/useNavBranding'
import BrandLockup, { BrandMark } from './BrandLockup'
import {
	NAV_COLLAPSED_WIDTH,
	NAV_EXPANDED_MAX_WIDTH,
	getMobileDrawerSize,
	useMobileNav,
} from '../../context/MobileNavContext'

/** Must match `VIEW_BY_TAB` in pages/dashboard.jsx */
const DASHBOARD_VIEW_BY_TAB = [
	'home',
	'profile',
	'settings',
	'users',
	'agencies',
	'help',
	'appearance',
]

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
	const navIconClass = `my-1.5 mx-2 h-12 w-12 flex items-center justify-center ${tooltipClass}${
		active ? ' bg-brand/10' : ''
	}`

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
			className={`w-full min-h-12 rounded-md px-3 py-2.5 ${
				active ? 'bg-brand/10' : ''
			}`}
			aria-label={ariaLabel || label}>
			<ListItemPrefix className="mr-3 shrink-0">{icon}</ListItemPrefix>
			<Typography
				variant="small"
				className={`min-w-0 truncate font-medium text-brand ${
					active ? 'font-semibold' : ''
				}`}>
				{label}
			</Typography>
		</ListItem>
	)
}

/** Brand-filled report action shown when the drawer shows labels. */
function ReportCta({ customClaims, onAgencyNewReport, onCreateReport }) {
	if (customClaims?.agency) {
		return (
			<Button
				fullWidth
				size="md"
				className="flex items-center justify-center gap-2 bg-brand text-white shadow-none hover:bg-brand-hover hover:shadow-none normal-case"
				onClick={onAgencyNewReport}>
				<IoAddCircleOutline size={20} />
				New Report
			</Button>
		)
	}
	if (!customClaims?.admin && !customClaims?.agency) {
		return (
			<Button
				fullWidth
				size="md"
				className="flex items-center justify-center gap-2 bg-brand text-white shadow-none hover:bg-brand-hover hover:shadow-none normal-case"
				onClick={onCreateReport}>
				<HiOutlineDocumentPlus size={20} />
				Create Report
			</Button>
		)
	}
	return null
}

const Navbar = ({
	tab,
	setTab,
	handleNewReportClick,
	onReportTabClick,
}) => {
	const router = useRouter()
	const [windowSize, setWindowSize] = useState([
		typeof window !== 'undefined' ? window.innerWidth : 1024,
		typeof window !== 'undefined' ? window.innerHeight : 768,
	])

	const [disableOverlay, setDisableOverlay] = useState(true)
	const [helpModal, setHelpModal] = useState(false)
	const [contactHelpModal, setContactHelpModal] = useState(false)
	const [logoutModal, setLogoutModal] = useState(false)

	const { logout } = useAuth()
	const { agencyLogo, agencyName, customClaims: claims } = useNavBranding()
	const customClaims = claims || {}
	const {
		open,
		closeDrawer,
		desktopExpanded,
		toggleDesktopExpanded,
		setMeasuredDrawerWidth,
	} = useMobileNav()

	const drawerRef = useRef(null)
	const isDesktop = windowSize[0] > 640
	// Mobile drawer is always labeled; never flip to icon-rail while closing (avoids CTA flash).
	const showLabels = isDesktop ? desktopExpanded : true
	// Mobile closed must be 0 — collapsed width + labels lets "Log out" peek past the off-screen transform.
	const drawerSize = isDesktop
		? showLabels
			? NAV_EXPANDED_MAX_WIDTH
			: NAV_COLLAPSED_WIDTH
		: open
			? getMobileDrawerSize(windowSize[0])
			: 0

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

	/** On /report, only Profile is local; other tabs live on the dashboard. */
	const handleTabNavigation = (tabIndex) => {
		const onDashboard = router.pathname === '/dashboard'

		if (!onDashboard && tabIndex !== 1) {
			const view = DASHBOARD_VIEW_BY_TAB[tabIndex] ?? 'home'
			router.push({ pathname: '/dashboard', query: { view } })
			closeDrawer()
			return
		}

		setTab(tabIndex)
		closeDrawer()
	}

	const handleAgencyNewReport = (e) => {
		handleNewReportClick?.(e)
		closeDrawer()
	}

	const handleGeneralUserReport = (e) => {
		onReportTabClick?.(e)
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

	const handleLogout = () => {
		logout().then(() => {
			router.push('/login')
		})
	}

	const icon = (Node) => <Node size={showLabels ? 22 : 25} />
	const isAgencyUser = Boolean(customClaims?.agency)
	const showReportCta =
		Boolean(customClaims?.agency) ||
		(!customClaims?.admin && !customClaims?.agency)

	const primaryNavExpanded = (
		<List className="w-full p-0 !min-w-0">
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
	)

	const primaryNavCollapsed = (
		<>
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
	)

	const secondaryNavExpanded = (
		<List className="w-full p-0 !min-w-0">
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
				label="Help"
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
	)

	const secondaryNavCollapsed = (
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
	)

	return (
		<>
			<Drawer
				ref={drawerRef}
				open={isDesktop ? true : open}
				onClose={closeDrawer}
				size={drawerSize}
				overlay={disableOverlay}
				className={`z-[9997] !h-full overflow-hidden transition-[max-width] duration-200 ease-in-out${
					isDesktop && showLabels ? ' !w-max' : ''
				}`}>
				<div
					data-component="Navbar"
					className={`flex h-full w-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
						isDesktop && showLabels ? 'w-max max-w-full' : ''
					}`}>
					{/* Top: close only (mobile) / brand + expand (desktop) */}
					{!isDesktop ? (
						<div className="shrink-0 border-b border-blue-gray-50 px-3 pt-2 pb-2">
							<IconButton
								variant="text"
								onClick={closeDrawer}
								className="tooltip-close -ml-1 text-brand hover:bg-brand/10"
								aria-label="Close menu">
								<IoClose size={28} />
							</IconButton>
						</div>
					) : (
						<div
							className={`shrink-0 flex items-center gap-1 border-b border-blue-gray-50 ${
								showLabels ? 'px-2 py-3' : 'px-1 py-2 flex-col'
							}`}>
							{showLabels ? (
								<BrandLockup
									agencyLogo={agencyLogo}
									agencyName={agencyName}
									customClaims={customClaims}
									className="min-w-0 flex-1"
									titleClassName="text-sm"
								/>
							) : (
								<div className="flex w-full justify-center">
									<BrandMark
										agencyLogo={agencyLogo}
										isAgency={isAgencyUser}
										compact
									/>
								</div>
							)}

							<IconButton
								variant="text"
								onClick={toggleDesktopExpanded}
								className={`shrink-0 text-brand hover:bg-brand/10 ${
									showLabels ? '' : 'my-1 mx-2 tooltip-expand-nav'
								}`}
								aria-label={
									showLabels ? 'Collapse sidebar' : 'Expand sidebar'
								}>
								{showLabels ? (
									<IoChevronBackOutline size={22} />
								) : (
									<IoChevronForwardOutline size={26} />
								)}
							</IconButton>
							{!showLabels && (
								<NavTooltip tooltipClass="tooltip-expand-nav">Expand</NavTooltip>
							)}
						</div>
					)}

					{/* Primary nav (scrollable) */}
					<div
						className={`min-h-0 flex-1 overflow-y-auto ${
							showLabels ? 'px-3 pt-3' : ''
						}`}>
						{showLabels ? primaryNavExpanded : primaryNavCollapsed}
					</div>

					{/* Report CTA between primary and utility when labels are on */}
					{showLabels && showReportCta && (
						<div className="shrink-0 px-3 py-3">
							<ReportCta
								customClaims={customClaims}
								onAgencyNewReport={handleAgencyNewReport}
								onCreateReport={handleGeneralUserReport}
							/>
						</div>
					)}

					{/* Utility + logout pinned to bottom */}
					<div className={`mt-auto shrink-0 ${showLabels ? 'px-3 pb-2' : ''}`}>
						{showLabels ? secondaryNavExpanded : secondaryNavCollapsed}

						<div className="mt-1 border-t border-blue-gray-50 pt-1">
							{showLabels ? (
								<ListItem
									onClick={() => setLogoutModal(true)}
									className="w-full min-h-12 rounded-md px-3 py-2.5"
									aria-label="Log out">
									<ListItemPrefix className="mr-3 shrink-0">
										<IoLogOutOutline size={22} />
									</ListItemPrefix>
									<Typography
										variant="small"
										className="font-medium text-brand whitespace-nowrap">
										Log out
									</Typography>
								</ListItem>
							) : (
								<>
									<IconButton
										variant="text"
										onClick={() => {
											setLogoutModal(true)
											closeDrawer()
										}}
										className="my-4 mx-2 h-12 w-12 tooltip-logout"
										aria-label="Log out">
										<IoLogOutOutline size={30} />
									</IconButton>
									<NavTooltip tooltipClass="tooltip-logout">Log out</NavTooltip>
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
			{logoutModal && (
				<ConfirmModal
					func={handleLogout}
					title="Are you sure?"
					subtitle=""
					CTA="Log out"
					closeModal={setLogoutModal}
				/>
			)}
		</>
	)
}

export default Navbar
