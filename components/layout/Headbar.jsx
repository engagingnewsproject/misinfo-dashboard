/**
 * @fileoverview Headbar — page/view title + mobile menu control.
 * Logo/product branding live in the Navbar; this shows the current view name.
 * On mobile the bar is fixed with a white background so it stays visible while scrolling.
 */

import React from 'react'
import { IconButton } from '@material-tailwind/react'
import { IoMenu } from 'react-icons/io5'
import { useMobileNav } from '../../context/MobileNavContext'

/**
 * @param {Object} props
 * @param {string} props.title - Current page/view name (e.g. Dashboard, Profile)
 * @param {React.ReactNode} [props.actions] - Optional right-side controls (desktop far right)
 */
const Headbar = ({ title, actions }) => {
	const { openDrawer } = useMobileNav()
	const canOpenDrawer = typeof openDrawer === 'function'

	return (
		<>
			<div
				data-component="Headbar"
				className={[
					// layout
					'flex w-full items-center gap-2',
					// mobile: fixed white bar (safe-area top handled here — fixed ignores parent pad)
					'fixed inset-x-0 top-0 z-40 min-h-16 bg-white px-3 pb-4 pt-[max(1rem,env(safe-area-inset-top))]',
					// desktop: in-flow, no fill, match content gutter
					'sm:static sm:z-auto sm:min-h-0 sm:bg-transparent sm:px-4 sm:pb-5 sm:pt-0',
					'md:px-12',
				].join(' ')}>
				{canOpenDrawer && (
					<IconButton
						variant="text"
						onClick={openDrawer}
						className="sm:hidden shrink-0 text-brand hover:bg-brand/10"
						aria-label="Open menu">
						<IoMenu size={36} />
					</IconButton>
				)}
				{title ? (
					<h1 className="min-w-0 truncate text-xl font-semibold tracking-wide text-[#2E3B4E] md:text-2xl">
						{title}
					</h1>
				) : null}
				{actions ? (
					<div className="ml-auto hidden shrink-0 md:block">{actions}</div>
				) : null}
			</div>
			{/* Matches mobile fixed bar height so content isn’t covered */}
			<div className="h-16 shrink-0 sm:hidden" aria-hidden />
		</>
	)
}

export default Headbar
