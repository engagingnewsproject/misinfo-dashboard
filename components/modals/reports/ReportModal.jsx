/**
 * @fileoverview ReportModal Component
 * 
 * A comprehensive modal component for viewing and editing misinformation reports.
 * Provides detailed report information display, editing capabilities, and sharing
 * functionality with role-based access control for admin and agency users.
 * 
 * Key Features:
 * - Detailed report information display (title, description, links, metadata)
 * - Image gallery with lightbox preview
 * - Role-based editing (admin vs agency restrictions)
 * - Read/unread status management
 * - Label assignment and management
 * - Note taking functionality
 * - Report sharing via email
 * - Report deletion with confirmation
 * - Responsive design with mobile support
 * 
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useEffect, useState } from "react"
import { resolveAgencyIdForReport } from '../../../utils/label-tags'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	IconButton,
	List,
	ListItem,
	ListItemPrefix,
	Switch,
	Typography,
} from "@material-tailwind/react";
import FormInput from '../../ui/FormInput'
import FormTextarea from '../../ui/FormTextarea'
import ButtonEmailSend from "../../partials/ButtonEmailSend"
import ShareReportModal from "../../partials/modals/ShareReportModal"
import { MdMarkAsUnread, MdMarkEmailRead } from "react-icons/md"
import Link from "next/link"
import {Tooltip} from "react-tooltip";
// icons
import { RiMessage2Fill } from "react-icons/ri"
import { BiEditAlt } from "react-icons/bi"
import { BiLinkExternal } from "react-icons/bi";
import { AiOutlineFieldTime, AiOutlineUser } from "react-icons/ai"
import {
	IoTrash,
	IoLocation,
	IoBusinessOutline,
} from "react-icons/io5"
import ModalCloseButton from "../../ui/ModalCloseButton"
import ImageLightboxGallery from "../../ui/ImageLightboxGallery"
import {
	CUSTOM_LABEL_MAX_LENGTH,
	DEFAULT_REPORT_LABEL,
	OTHER_LABEL,
} from '../../../config/labels'
import LabelSelectMenu from '../../reports/LabelSelectMenu'
import { formatReportLocation } from '../../../utils/format-location'
import { useTranslation } from 'next-i18next'
import {
	fetchMergedTagLabelMapForAgencyId,
	getTagLabel,
} from '../../../utils/tag-defaults'

/** Href for report links that may omit http(s): — avoids relative localhost paths. */
function toExternalHref(url) {
	const trimmed = String(url || '').trim()
	if (!trimmed) return trimmed
	if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) return trimmed
	return `//${trimmed}`
}

const META_ITEM_CLASS =
	'cursor-default rounded-none py-2 px-0 hover:bg-transparent focus:bg-transparent active:bg-transparent'

/**
 * Non-interactive metadata row: icon + label + value.
 */
function ReportMetaItem({ icon, label, children }) {
	return (
		<ListItem className={META_ITEM_CLASS}>
			<ListItemPrefix className="mr-3">{icon}</ListItemPrefix>
			<div className="min-w-0">
				<Typography variant="small" className="font-semibold mb-0">
					{label}
				</Typography>
				<Typography variant="small" className="font-normal mb-0 break-words">
					{children}
				</Typography>
			</div>
		</ListItem>
	)
}

/**
 * ReportModal Component
 * 
 * Modal component for displaying and editing detailed report information.
 * Supports role-based access control with different editing permissions
 * for admin and agency users.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.customClaims - User role claims (admin, agency)
 * @param {Function} props.setReportModalShow - Function to close modal
 * @param {Object} props.report - Report data object containing all report fields
 * @param {Array<string>} props.labelOptions - Merged label options for the dropdown
 * @param {Record<string, string>} [props.agencyLabelColors] - Custom label colors for the report's agency
 * @param {string} props.selectedLabel - Currently selected label
 * @param {Function} props.onLabelChange - Label change handler
 * @param {string} props.otherLabelDraft - Draft text when Other is selected
 * @param {Function} props.onOtherLabelChange - Other label draft change handler
 * @param {Function} props.onOtherLabelCommit - Other label commit handler (blur/Enter)
 * @param {string} props.otherLabelError - Validation error for Other label text
 * @param {Object} props.reportSubmitBy - Report submitter information
 * @param {Function} props.onFormSubmit - Form submission handler
 * @param {boolean} props.enabled - Read/unread toggle state (legacy)
 * @param {Function} props.setEnabled - Read/unread toggle setter (legacy)
 * @param {string} props.note - Current note content
 * @param {string} props.detail - Report detail content
 * @param {boolean} props.checked - Read status (true = read, false = unread)
 * @param {Function} props.onReadChange - Read status change handler
 * @param {any} props.update - Update trigger (legacy)
 * @param {string} props.postedDate - Formatted posted date
 * @param {Function} props.onNoteChange - Note change handler
 * @param {Function} props.onReportDelete - Report deletion handler
 * @param {string} props.changeStatus - Status change message
 * @param {string} props.reportModalId - Report ID for operations
 * @returns {JSX.Element} The rendered report modal component
 * 
 * @example
 * <ReportModal
 *   customClaims={{ admin: true }}
 *   setReportModalShow={setModalShow}
 *   report={reportData}
 *   activeLabels={['Urgent', 'Review', 'Verified']}
 *   selectedLabel="Urgent"
 *   onLabelChange={handleLabelChange}
 *   reportSubmitBy={submitterInfo}
 *   onFormSubmit={handleFormSubmit}
 *   checked={true}
 *   onReadChange={handleReadChange}
 *   reportModalId="report123"
 * />
 */
const ReportModal = ({
	customClaims,
	setReportModalShow,
	report, // should hold all report fields
	labelOptions,
	agencyLabelColors = {},
	selectedLabel,
	onLabelChange,
	otherLabelDraft,
	onOtherLabelChange,
	onOtherLabelCommit,
	otherLabelError,
	reportSubmitBy,
	onFormSubmit,
	// read/unread
	enabled,
	setEnabled,
	// nothing below hopefully
	note,
	detail,
	// read status
  checked,
  onReadChange,
	update,
	// read status END
	postedDate,
	onNoteChange,
	onReportDelete,
	changeStatus,
	reportModalId,
}) => {
	const { t, i18n } = useTranslation('NewReport')
	const style = {
		link: 'font-light mb-1 text-sm underline underline-offset-1',
	}

	const handleClose = () => setReportModalShow(false)
	
	// Prefer report city/state; fall back to submitter profile location
	const reportLocation = formatReportLocation(report, reportSubmitBy)
	
	// Generate report URI for external links (matches dashboard route)
	const reportURI = "/reports/" + reportModalId
	
	// Local state management
	const [images,setImages] = useState([]) // Image gallery state
	const [shareReportModal, setShareReportModal] = useState(false) // Share modal visibility
	const [tagLabelMap, setTagLabelMap] = useState({})
	const [lightboxOpen, setLightboxOpen] = useState(false)
	// Delay Dialog open one tick: MT Dialog + Floating UI 0.19 logs aria-hidden
	// "not contained inside body" when mounting with open={true} immediately.
	const [dialogOpen, setDialogOpen] = useState(false)

	const reportImages = Array.isArray(report.images)
		? report.images.filter(Boolean)
		: []

	useEffect(() => {
		const id = window.setTimeout(() => setDialogOpen(true), 0)
		return () => window.clearTimeout(id)
	}, [])

	useEffect(() => {
		let cancelled = false
		const loadLabels = async () => {
			try {
				const agencyId = await resolveAgencyIdForReport(
					report,
					customClaims?.agencyId,
				)
				const map = await fetchMergedTagLabelMapForAgencyId(agencyId)
				if (!cancelled) setTagLabelMap(map)
			} catch (err) {
				console.error('Error loading tag labels for report modal:', err)
				if (!cancelled) setTagLabelMap({})
			}
		}
		loadLabels()
		return () => {
			cancelled = true
		}
	}, [report?.agency, report?.agencyId, reportModalId, customClaims?.agencyId])

	return (
		<>
			<Dialog data-component="ReportModal"
				open={dialogOpen}
				handler={handleClose}
				size="xl"
				className="report-modal rounded-md"
				dismiss={{
					escapeKey: !shareReportModal && !lightboxOpen,
					outsidePress: (event) => {
						if (shareReportModal || lightboxOpen) return false
						const target = event.target
						if (!(target instanceof Element)) return true
						// Nested share overlay / MT Menu portals sit outside Dialog
						if (
							target.closest(
								'.share-report-modal, [role="menu"]',
							)
						) {
							return false
						}
						return true
					},
				}}>
				<DialogHeader className="justify-between gap-4">
					<div className="flex items-baseline gap-2">
						<Typography variant="h3" color="blue" className="mt-0 mb-0">
							Report Information
						</Typography>
						<Link href={`dashboard${reportURI}`} target="_blank">
							<BiLinkExternal size={15} />
						</Link>
					</div>
					<ModalCloseButton onClick={handleClose} />
				</DialogHeader>
				<DialogBody className="dialog-body overflow-y-auto max-h-[calc(100dvh-8rem)] pt-2">
					<form onSubmit={onFormSubmit}>
						<div className='grid md:grid-cols-2 md:gap-10 lg:gap-15 md:items-start'>
							{/* Left Column - Report Content */}
							<div className='left-side'>
								<>
									{/* Report Title */}
									<div className="mb-5">
										<FormInput
											id="title"
											label="Title"
											disabled
											value={report.title || ''}
											placeholder="No Title"
										/>
									</div>

									{/* Report Description/Detail */}
									<div className='mb-5'>
										<FormTextarea
											label="Description"
											id="detail"
											disabled
											value={report.detail || ''}
											placeholder="No description"
											rows={6}
										/>
									</div>

									{/* External Links Section */}
									<>
										<Typography variant="h5" color="blue" className="mt-0 mb-4">
											Links to the Information
										</Typography>
										<div className='flex flex-col'>
											{/* Primary link */}
											{(report.link && (
												<a
													className={style.link}
													target='_blank'
													rel='noreferrer'
													href={toExternalHref(report.link)}>
													{report.link}
												</a>
											)) || (
												<span className='italic text-gray-400'>
													No link provided
												</span>
											)}
											{/* Secondary link */}
											{report.secondLink && (
												<a
													className={style.link}
													target='_blank'
													rel='noreferrer'
													href={toExternalHref(report.secondLink)}>
													{report.secondLink}
												</a>
											)}
										</div>
									</>
								</>
							</div>{" "}
							{/* END left side */}
							
							{/* Right Column - Metadata and Actions */}
							<div className='right-side flex flex-col'>
								<div>
									<List className="p-0 mb-5">
										<ReportMetaItem
											icon={<RiMessage2Fill size={20} />}
											label="Tag">
											{getTagLabel({
												id: report.topic,
												locale: i18n.language,
												labelMap: tagLabelMap,
												t,
												system: 'topics',
											})}
										</ReportMetaItem>

										<ReportMetaItem
											icon={<BiEditAlt size={20} />}
											label="Sources / Media">
											{getTagLabel({
												id: report.hearFrom,
												locale: i18n.language,
												labelMap: tagLabelMap,
												t,
												system: 'sources',
											})}
										</ReportMetaItem>

										<ReportMetaItem
											icon={<AiOutlineFieldTime size={20} />}
											label="Date / Time">
											{postedDate}
										</ReportMetaItem>

										<ReportMetaItem
											icon={<IoLocation size={20} />}
											label="City, State">
											{reportLocation || (
												<span className="italic text-gray-400">Not provided</span>
											)}
										</ReportMetaItem>

										{report.agency && (
											<ReportMetaItem
												icon={<IoBusinessOutline size={20} />}
												label="Agency">
												{report.agency}
											</ReportMetaItem>
										)}

										{reportSubmitBy?.contact && (
											<ReportMetaItem
												icon={<AiOutlineUser size={20} />}
												label="Reported by">
												{reportSubmitBy.name} (
												<a
													target="_blank"
													rel="noopener noreferrer"
													className="text-[#2E3B4E] hover:underline"
													href={'mailto:' + reportSubmitBy.email}>
													{reportSubmitBy.email}
												</a>
												)
											</ReportMetaItem>
										)}

										{report?.origin === 'scrape' && !reportSubmitBy?.contact && (
											<ReportMetaItem
												icon={<AiOutlineUser size={20} />}
												label="Reported by">
												Scraped (automated)
											</ReportMetaItem>
										)}
									</List>

									{/* Image Gallery */}
									<div className={`images ${reportImages.length > 0 ? 'mb-12' : 'mb-4'}`}>
										<Typography variant="h5" color="blue" className="mt-0 mb-4">
											Images
										</Typography>
										{reportImages.length > 0 ? (
											<ImageLightboxGallery
												images={reportImages}
												altPrefix="Report image"
												onLightboxChange={setLightboxOpen}
											/>
										) : (
											<Typography variant="small" className="italic" color="gray">
												No images for this report
											</Typography>
										)}
									</div>
								</div>
							</div>
							{/* END right side */}
						</div>

						{/* Newsroom Edits Section */}
						<div className='grid grid-flow-row pt-4 mt-5 bg-slate-100 rounded-md py-8 md:grid-cols-2 md:gap-10 lg:gap-15'>
							{/* Notes Section */}
							<div>
								<FormTextarea
									id="note"
									label="Newsroom's Notes"
									onChange={onNoteChange}
									rows={6}
									value={note || ''}
								/>
							</div>
							
							{/* Actions Section */}
							<div>
								{/* Label Assignment */}
								<div className='mb-4'>
									<Typography variant="h5" color="blue" className="mt-0 mb-4">
										Label
									</Typography>
									<LabelSelectMenu
										id="labels"
										labelOptions={labelOptions}
										selectedLabel={selectedLabel || DEFAULT_REPORT_LABEL}
										agencyLabelColors={agencyLabelColors}
										onLabelChange={onLabelChange}
									/>
									{selectedLabel === OTHER_LABEL && (
										<div className='mt-3'>
											<FormInput
												type='text'
												id='other-label'
												label={`Specify label (max ${CUSTOM_LABEL_MAX_LENGTH} characters)`}
												value={otherLabelDraft}
												onChange={onOtherLabelChange}
												onBlur={onOtherLabelCommit}
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault()
														onOtherLabelCommit()
													}
												}}
												maxLength={CUSTOM_LABEL_MAX_LENGTH}
												className='bg-white'
											/>
											{otherLabelError && (
												<p className='mt-1 text-sm text-red-600'>{otherLabelError}</p>
											)}
										</div>
									)}
									{/* Status change feedback */}
									{changeStatus && (
										<span className='ml-5 font-light text-sm italic'>
											{changeStatus}
										</span>
									)}
								</div>
								
								{/* Read/Unread Toggle */}
								<div className='flex flex-row mb-4 items-center'>
									<div className='self-center pr-2'>
										{checked ? (
											<MdMarkEmailRead size={20} />
										) : (
											<MdMarkAsUnread size={20} />
										)}
									</div>
									
									<Switch
										checked={checked}
										onChange={(e) => onReadChange(reportModalId, e.target.checked)}
										color="blue"
									/>
									{checked ? (
										<span className="ml-2">Read</span>
									) : (
										<span className="ml-2">Unread</span>
									)}
								</div>
								
								{/* Share Button */}
								<ButtonEmailSend onButtonEmailSendClick={() => setShareReportModal(true)} />
								
								{/* Action Buttons */}
								<div className='flex items-center justify-between justify-items-stretch'>
									<div className="save-button w-full">
										<Button type="submit" fullWidth>
											Save
										</Button>
									</div>
									<div className='delete-button self-end'>
										<IconButton
											onClick={onReportDelete}
											variant="text"
											color="red"
											type='button'
											className="tooltip-delete-report"
											aria-label="Delete Report">
											<IoTrash size={24} />
										</IconButton>
										<Tooltip
											anchorSelect='.tooltip-delete-report'
											place='top'
											delayShow={500}>
											Delete Report
										</Tooltip>
									</div>
								</div>
							</div>
						</div>
					</form>
				</DialogBody>
			</Dialog>

			{shareReportModal && (
				<ShareReportModal
					reportId={reportModalId}
					reportTitle={report?.title || ''}
					closeModal={setShareReportModal}
				/>
			)}
		</>
	)
}

export default ReportModal
