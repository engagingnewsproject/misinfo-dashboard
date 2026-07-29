/**
 * @fileoverview Shared page/view title for in-content wayfinding.
 * On mobile the Headbar shows brand; PageTitle names the current view on all breakpoints.
 */

import React from 'react'

/**
 * Consistent view title across dashboard/report tabs.
 *
 * Prefer placing this inside the page’s white content card (see Users) so
 * spacing from the viewport matches the card padding — not flush under Headbar.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Title text (e.g. Dashboard, Users)
 * @param {boolean} [props.mobileOnly=false] - When true, hide from sm+ (rare; prefer in-content titles)
 * @param {boolean} [props.gutter=true] - Default mb-3; set false inside flex/card headers that supply spacing
 * @param {boolean} [props.srOnly=false] - Visually hide but keep for screen readers
 * @param {string} [props.className] - Extra classes
 * @param {'h1'|'h2'|'h3'} [props.as='h1'] - Document heading for the view (brand lockup is not an h1)
 */
const PageTitle = ({
	children,
	mobileOnly = false,
	gutter = true,
	srOnly = false,
	className = '',
	as: Tag = 'h1',
}) => (
	<Tag
		data-component="PageTitle"
		className={[
			srOnly
				? 'sr-only'
				: 'min-w-0 truncate text-xl font-extrabold tracking-wide text-[#2E3B4E] md:text-2xl',
			!srOnly && gutter ? 'mb-3' : '',
			!srOnly && mobileOnly ? 'sm:hidden' : '',
			className,
		]
			.filter(Boolean)
			.join(' ')}>
		{children}
	</Tag>
)

export default PageTitle
