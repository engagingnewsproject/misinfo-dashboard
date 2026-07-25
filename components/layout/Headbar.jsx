/**
 * @fileoverview Headbar — mobile-only brand lockup + menu.
 * Fixed white bar with safe-area top so it stays visible while scrolling.
 * Branding (logo + agency / Truth Sleuth Local) lives here on mobile; desktop brand is in Navbar.
 * View titles and actions live in each page via PageTitle / in-content chrome.
 *
 * `sm:` hide must stay aligned with NAV_DESKTOP_MIN_WIDTH in MobileNavContext
 * (Material Tailwind withMT sets sm = 540px).
 */

import React from 'react'
import { IconButton } from '@material-tailwind/react'
import { IoMenu } from 'react-icons/io5'
import { useMobileNav } from '../../context/MobileNavContext'
import { useNavBranding } from '../../hooks/useNavBranding'
import BrandLockup from './BrandLockup'

const Headbar = () => {
	const { openDrawer } = useMobileNav()
	const canOpenDrawer = typeof openDrawer === 'function'
	const { agencyLogo, agencyName, customClaims } = useNavBranding()

	return (
		<>
			<div
				data-component="Headbar"
				className={[
					'flex w-full items-center gap-2',
					'fixed inset-x-0 top-0 z-40 min-h-16 bg-white px-3 pb-4 pt-[max(1rem,env(safe-area-inset-top))]',
					'sm:hidden',
				].join(' ')}>
				{canOpenDrawer && (
					<IconButton
						variant="text"
						onClick={openDrawer}
						className="shrink-0 text-brand hover:bg-brand/10"
						aria-label="Open menu">
						<IoMenu size={36} />
					</IconButton>
				)}
				<BrandLockup
					agencyLogo={agencyLogo}
					agencyName={agencyName}
					customClaims={customClaims}
					titleClassName="text-base"
					titleAs="div"
				/>
			</div>
			{/* Matches mobile fixed bar height so content isn’t covered */}
			<div className="h-16 shrink-0 sm:hidden" aria-hidden />
		</>
	)
}

export default Headbar
