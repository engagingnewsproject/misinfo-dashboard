/**
 * @fileoverview Headbar — page/view title + mobile menu control.
 * Logo/product branding live in the Navbar; this shows the current view name.
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
		<div data-component="Headbar" className="w-full flex flex-row items-center gap-2 pb-5 px-3 sm:px-4 md:px-12">
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
				<h1 className="text-xl md:text-2xl font-semibold tracking-wide text-[#2E3B4E] min-w-0 truncate">
					{title}
				</h1>
			) : null}
			{actions ? (
				<div className="ml-auto shrink-0 hidden md:block">{actions}</div>
			) : null}
		</div>
	)
}

export default Headbar
