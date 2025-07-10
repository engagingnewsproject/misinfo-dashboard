/**
 * @fileoverview ReportModal Component
 * 
 * A comprehensive modal component for viewing and editing misinformation reports.
 * Provides detailed report information display, editing capabilities, and sharing
 * functionality with role-based access control for admin and agency users.
 * 
 * Key Features:
 * - Detailed report information display (title, description, links, metadata)
 * - Image gallery with external link support
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
import { Switch } from "@material-tailwind/react";
import ButtonEmailSend from "../partials/ButtonEmailSend"
import ShareReportModal from "../partials/modals/ShareReportModal"
import { MdMarkAsUnread, MdMarkEmailRead } from "react-icons/md"
import Link from "next/link"
import Image from "next/image"
import {Tooltip} from "react-tooltip";
// icons
import { RiMessage2Fill } from "react-icons/ri"
import { BiEditAlt } from "react-icons/bi"
// import { BsShareFill } from "react-icons/bs"
import { BiLinkExternal } from "react-icons/bi";
import { AiOutlineFieldTime, AiOutlineUser } from "react-icons/ai"
// import { MdOutlineLocalPhone } from "react-icons/md";

import { IoClose, IoTrash, IoLocation, IoBusinessOutline } from "react-icons/io5"
import { useTranslation } from 'next-i18next';

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
 * @param {Array<string>} props.activeLabels - Available labels for assignment
 * @param {string} props.selectedLabel - Currently selected label
 * @param {Function} props.onLabelChange - Label change handler
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
 * @param {string} props.reportLocation - Formatted location string
 * @param {Function} props.onNoteChange - Note change handler
 * @param {Function} props.onReportDelete - Report deletion handler
 * @param {string} props.changeStatus - Status change message
 * @param {Function} props.onButtonEmailSendClick - Email send handler
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
	activeLabels,
	selectedLabel,
	onLabelChange,
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
	reportLocation,
	onNoteChange,
	onReportDelete,
	changeStatus,
	// send email
	onButtonEmailSendClick,
	reportModalId,
}) => {
	// CSS styles object for consistent styling across the modal
	const style = {
		header: "text-lg font-bold text-black tracking-wider mb-4",
		link: "font-light mb-1 text-sm underline underline-offset-1",
		overlay: "z-[1200] fixed top-0 left-0 w-full h-full bg-black bg-opacity-50",
		modal:
			"flex overflow-y- justify-center items-center z-[1300] absolute sm:top-0 md:top-4 left-0 w-full sm:w-full sm:h-full",
		wrap: "flex-col justify-center items-center lg:w-8/12 h-auto rounded-2xl py-10 px-10 bg-sky-100",
		textarea:
			"border transition ease-in-out w-full text-md font-light bg-white rounded-xl p-4 border-none focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none resize-none",
		icon: "flex p-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"
	}
	
	// Label styling classes
	const label = {
		default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
		special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl",
	}
	
	// Internationalization hook
	const {t} = useTranslation("ShareReport")
	
	// Generate report URI for external links
	const reportURI = "/reports/" + reportModalId
	
	// Local state management
	const [images,setImages] = useState([]) // Image gallery state
	const [shareReportModal, setShareReportModal] = useState(false) // Share modal visibility
	const [email,setEmail] = useState() // Email for sharing
	
	/**
	 * Opens the share report modal
	 * 
	 * @function handleShareModal
	 */
	const handleShareModal = () => {
		setShareReportModal(true)
	}
	
	/**
	 * Handles email input change for report sharing
	 * 
	 * @function handleEmailShareReport
	 * @param {Event} e - Input change event
	 */
	const handleEmailShareReport = (e) => {
		e.preventDefault()
		setEmail(e.target.value)
	}
	
	/**
	 * Opens default email client with pre-filled report information
	 * 
	 * @function handleShareReport
	 * @param {Event} e - Form submission event
	 */
	const handleShareReport = (e) => {
		e.preventDefault()
    const uri = `mailto:${email}`;
    window.open(uri);
	}
	
	// useEffect(() => {
	// 	console.log(customClaims);
	// }, [reportModalId])
	
	
	return (
		<div
			className='fixed z-[9998] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto' // {style.overlay}
			onClick={() => setReportModalShow(false)}>
			<div className='absolute flex justify-center items-center z-[9999] top-4 left-0 right-0 sm:overflow-y-scroll'>
				<div
					className='flex-col justify-center items-center rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible md:w-10/12 lg:w-10/12' // {style.wrap}
					onClick={(e) => {
						e.stopPropagation() // Prevent modal close when clicking inside
					}}>
					{/* Modal Header */}
					<div className='flex justify-between w-full mb-6'>
						<div className='flex w-full items-baseline'>
							<div className='text-2xl font-bold text-blue-600 tracking-wider'>
								Report Information
							</div>
							{/* External link to full report view */}
							<Link href={`dashboard${reportURI}`} target='_blank'>
								<BiLinkExternal size={20} className='ml-2' />
							</Link>
						</div>
						{/* Close button */}
						<button
							onClick={() => setReportModalShow(false)}
							className='text-gray-800'>
							<IoClose size={25} />
						</button>
					</div>
					
					{/* Main Form Content */}
					<form onSubmit={onFormSubmit}>
						<div className='grid md:grid-cols-2 md:gap-10 lg:gap-15'>
							{/* Left Column - Report Content */}
							<div className='left-side'>
								<>
									{/* Report Title */}
									<div className={style.header}>Title</div>
									<div className='text-sm bg-white rounded-xl p-4 mb-5'>
										{report.title || (
											<span className='italic text-gray-400'>No Title</span>
										)}
									</div>

									{/* Report Description/Detail */}
									<div className='mb-5'>
										<div className={style.header}>Description</div>
										<textarea
											placeholder='No detail provided'
											id='detail'
											className={
												report.detail
													? style.textarea
													: style.textarea + ` italic`
											}
											disabled
											value={report.detail}
											rows='6'
										/>
									</div>

									{/* External Links Section */}
									<>
										<div className={style.header}>Links to the Information</div>
										<div className='flex flex-col'>
											{/* Primary link */}
											{(report.link && (
												<a
													className={style.link}
													target='_blank'
													rel='noreferrer'
													href={report.link}>
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
													href={"//" + report.secondLink}>
													{report.secondLink}
												</a>
											)}
										</div>
									</>
								</>
							</div>{" "}
							{/* END left side */}
							
							{/* Right Column - Metadata and Actions */}
							<div className='right-side flex flex-col justify-between'>
								<div>
									<div className='flex flex-col mb-5'>
										{/* Report Metadata */}
										{/* Topic/Tag */}
										<div className='flex flex-row mb-3 items-center'>
											<RiMessage2Fill size={20} />
											<div className='font-semibold px-2 self-center pr-4'>
												Tag
											</div>
											<div className='text-md font-light'>{report.topic}</div>
										</div>
										
										{/* Sources/Media */}
										<div className='flex flex-row mb-3 items-center'>
											<BiEditAlt size={20} />
											<div className='font-semibold px-2 self-center pr-4'>
												Sources / Media
											</div>
											<div className='text-md font-light'>
												{report.hearFrom}
											</div>
										</div>
										
										{/* Date/Time */}
										<div className='flex flex-row mb-3 items-center'>
											<AiOutlineFieldTime size={20} />
											<div className='font-semibold px-2 self-center pr-4'>
												Date / Time
											</div>
											<div className='text-md font-light'>{postedDate}</div>
										</div>
										
										{/* Location */}
										<div className='flex flex-row mb-3 items-center'>
											<IoLocation size={20} />
											<div className='font-semibold px-2 self-center pr-4'>
												City, State
											</div>
											<div className='text-md font-light'>{reportLocation}</div>
										</div>
										
										{/* Agency (conditional display) */}
										{report.agency && (
											<>
												<div className='flex flex-row mb-3 items-center'>
													<IoBusinessOutline size={20} />
													<div className='font-semibold px-2 self-center pr-4'>
														Agency
													</div>
													<div className='text-md font-light'>
														{report.agency}
													</div>
												</div>
											</>
										)}
										
										{/* Report Submitter Information */}
										{reportSubmitBy.contact && (
										<div className="flex flex-row mb-3 items-center">
										<AiOutlineUser size={20} />
											<div className="text-md font-light">
												<span className="font-semibold px-2 self-center pr-4">Reported by</span>{" "}
												{reportSubmitBy.name} (
												<a
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:underline"
													href={"mailto:" + reportSubmitBy.email}>
													{reportSubmitBy.email}
												</a>
												)
											</div>
										</div>
									)}
                  {/* {reportSubmitBy.contact && reportSubmitBy.phone && 
										<div className="flex flex-row mb-3 items-center">
										<MdOutlineLocalPhone size={20} />
											<div className="text-md font-light">
												<span className="font-semibold px-2 self-center pr-4">Phone number</span>{" "}
												<a href={`tel:${reportSubmitBy.phone}`}>{reportSubmitBy.phone}</a>
											</div>
										</div>
									} */}
									</div>

									{/* Image Gallery */}
									<div className='images mb-12'>
										<div className={style.header}>Images</div>
										<div className='grid grid-cols-4 gap-4 w-full overflow-y-auto'>
											{report.images ?
												report.images.map((image, i) => {
													return (
														<div className='grid-cols-subgrid' key={i}>
															{image ? (
																<Link href={image} target='_blank'>
																	<Image
																		src={image}
																		width={400}
																		height={400}
																		alt='image'
																		className="w-auto"
																	/>
																</Link>
															) : (
																<span className='italic font-light'>
																	Image not found
																</span>
															)}
														</div>
													)
												}) :
												`No images uploaded`
											}
										</div>
									</div>
								</div>
							</div>
							{/* END right side */}
						</div>

						{/* Newsroom Edits Section */}
						<div className='grid grid-flow-row pt-4 mt-5 bg-slate-100 rounded-xl py-8 md:grid-cols-2 md:gap-10 lg:gap-15'>
							{/* Notes Section */}
							<div>
								<div className={style.header}>Newsroom's Notes</div>
								<textarea
									id='note'
									onChange={onNoteChange}
									placeholder='No notes yet...'
									className={note ? style.textarea : style.textarea + ` italic`}
									rows='6'
									readOnly={customClaims.admin ? true : false} // Admin users cannot edit notes
									defaultValue={note}></textarea>
							</div>
							
							{/* Actions Section */}
							<div>
								{/* Label Assignment */}
								<div className='mb-4'>
									<div className={style.header}>Label</div>
									<select
										id='labels'
										onChange={onLabelChange}
										value={selectedLabel || ''}
										className='text-sm inline-block px-8 border-none bg-yellow-400 py-1 rounded-2xl shadow hover:shadow-none'>
										
										{/* Default option representing no label */}
										<option value=''>{selectedLabel === '' ? 'No Label' : 'Remove Label'}</option>
										
										{/* Available labels from props */}
										{activeLabels.map((label, i) => (
											<option value={label} key={i}>
												{label}
											</option>
										))}
									</select>
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
									{/* Save Button */}
									<div className='save-button w-full'>
										<button
											className='w-full bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline'
											type='submit'>
											Save
										</button>
									</div>
									
									{/* Delete Button */}
									<div className='delete-button self-end'>
										<button
											onClick={onReportDelete}
											className={`${style.icon} tooltip-delete-report`}
											type='button'>
											<IoTrash size={30} color='red' />
											<Tooltip
												anchorSelect='.tooltip-delete-report'
												place='top'
												delayShow={500}>
												Delete Report
											</Tooltip>
										</button>
									</div>
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
			
			{/* Share Report Modal */}
			{shareReportModal && (
				<ShareReportModal
					func={handleShareModal}
					title={t("shareReport")}
					subtitle='Subtitle example text'
					CTA={t("share")}
					closeModal={setShareReportModal}
					onEmailChange={handleEmailShareReport}
					onSubmit={handleShareReport}
				/>
			)}
		</div>
	)
}

export default ReportModal
