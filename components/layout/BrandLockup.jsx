/**
 * @fileoverview Shared logo + product/agency title for Headbar and Navbar.
 */

import React from 'react'
import Image from 'next/image'
import { GiMagnifyingGlass } from 'react-icons/gi'

/**
 * Circular brand mark: agency logo when available, otherwise magnifying glass.
 * Always 40×40 so collapsed/expanded (and Headbar) stay consistent.
 *
 * @param {Object} props
 * @param {string} [props.agencyLogo]
 * @param {boolean} [props.isAgency]
 */
export function BrandMark({ agencyLogo, isAgency }) {
	if (isAgency && agencyLogo) {
		return (
			<Image
				src={agencyLogo}
				width={40}
				height={40}
				alt="agency logo"
				className="h-10 w-10 max-h-[40px] max-w-[40px] object-contain shrink-0"
			/>
		)
	}
	return (
		<div className="bg-brand rounded-full shrink-0 p-2.5 max-h-[40px] max-w-[40px]">
			<GiMagnifyingGlass className="fill-white" size={18} />
		</div>
	)
}

/**
 * Product or agency name next to the mark.
 *
 * @param {Object} props
 * @param {Object} [props.customClaims]
 * @param {string} [props.agencyName]
 * @param {string} [props.className]
 * @param {'div'|'h1'|'span'} [props.as]
 */
export function BrandTitle({
	customClaims,
	agencyName,
	className = '',
	as: Tag = 'div',
}) {
	const label =
		customClaims?.agency && !customClaims?.admin
			? agencyName || 'Agency'
			: 'Truth Sleuth Local'

	return (
		<Tag
			className={`min-w-0 truncate font-semibold tracking-wide text-brand ${className}`.trim()}>
			{label}
		</Tag>
	)
}

/**
 * Mark + title row. Agency users get agency branding; admin/public get Truth Sleuth.
 *
 * @param {Object} props
 * @param {string} [props.agencyLogo]
 * @param {string} [props.agencyName]
 * @param {Object} [props.customClaims]
 * @param {string} [props.className] - Wrapper classes
 * @param {string} [props.titleClassName] - Title text classes
 * @param {'div'|'h1'|'span'} [props.titleAs]
 */
export default function BrandLockup({
	agencyLogo,
	agencyName,
	customClaims,
	className = '',
	titleClassName = 'text-sm',
	titleAs = 'div',
}) {
	const isAgency = Boolean(customClaims?.agency)

	return (
		<div
			data-component="BrandLockup"
			className={`flex min-w-0 items-center gap-3 pr-2 ${className}`.trim()}>
			<BrandMark agencyLogo={agencyLogo} isAgency={isAgency} />
			<BrandTitle
				customClaims={customClaims}
				agencyName={agencyName}
				className={titleClassName}
				as={titleAs}
			/>
		</div>
	)
}
