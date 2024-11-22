import { Switch } from "@material-tailwind/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { MdMarkAsUnread, MdMarkEmailRead } from "react-icons/md";
import { Tooltip } from "react-tooltip";
import ButtonEmailSend from "../partials/ButtonEmailSend";
import ShareReportModal from "../partials/modals/ShareReportModal";
// icons
import { BiEditAlt } from "react-icons/bi";
import { RiMessage2Fill } from "react-icons/ri";
// import { BsShareFill } from "react-icons/bs"
import { AiOutlineFieldTime, AiOutlineUser } from "react-icons/ai";
import { BiLinkExternal } from "react-icons/bi";
// import { MdOutlineLocalPhone } from "react-icons/md";

import { useTranslation } from 'next-i18next';
import { IoBusinessOutline, IoClose, IoLocation, IoTrash } from "react-icons/io5";
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
	onDetailChange,
	onNoteChange,
	onReportDelete,
	changeStatus,
	// send email
	onButtonEmailSendClick,
	reportModalId,
}) => {
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
	const label = {
		default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
		special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl",
	}
	const {t} = useTranslation("ShareReport")
	const reportURI = "/reports/" + reportModalId
	const [images,setImages] = useState([])
	const [shareReportModal, setShareReportModal] = useState(false)
	const [email,setEmail] = useState()
	
	const handleShareModal = () => {
		setShareReportModal(true)
	}
		// Function to handle email change
	const handleEmailShareReport = (e) => {
		e.preventDefault()
		setEmail(e.target.value)
	}
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
					className='flex-col items-center justify-center px-10 py-10 rounded-2xl bg-sky-100 sm:overflow-visible md:w-10/12 lg:w-10/12' // {style.wrap}
					onClick={(e) => {
						e.stopPropagation()
					}}>
					<div className='flex justify-between w-full mb-6'>
						<div className='flex items-baseline w-full'>
							<div className='text-2xl font-bold tracking-wider text-blue-600'>
								Report Information
							</div>
							<Link href={`dashboard${reportURI}`} target='_blank'>
								<BiLinkExternal size={20} className='ml-2' />
							</Link>
						</div>
						<button
							onClick={() => setReportModalShow(false)}
							className='text-gray-800'>
							<IoClose size={25} />
						</button>
					</div>
					<form onSubmit={onFormSubmit}>
						<div className='grid md:grid-cols-2 md:gap-10 lg:gap-15'>
							<div className='left-side'>
								<>
									{/* Title */}
									<div className={style.header}>Title</div>
									<div className='p-4 mb-5 text-sm bg-white rounded-xl'>
										{report.title || (
											<span className='italic text-gray-400'>No Title</span>
										)}
									</div>

									{/* Detail/Description */}
									<div className='mb-5'>
										<div className={style.header}>Description</div>
										<textarea
											id='detail'
											onChange={onDetailChange}
											placeholder='No detail provided'
											className={
												report.detail
													? style.textarea
													: style.textarea + ` italic`
											}
											readOnly={customClaims.admin ? false : true}
											defaultValue={detail}></textarea>
									</div>

									{/* Links */}
									<>
										<div className={style.header}>Links to the Information</div>
										<div className='flex flex-col'>
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
							<div className='flex flex-col justify-between right-side'>
								<div>
									<div className='flex flex-col mb-5'>
										{/* Sources & tags */}
										<div className='flex flex-row items-center mb-3'>
											<RiMessage2Fill size={20} />
											<div className='self-center px-2 pr-4 font-semibold'>
												Tag
											</div>
											<div className='font-light text-md'>{report.topic}</div>
										</div>
										<div className='flex flex-row items-center mb-3'>
											<BiEditAlt size={20} />
											<div className='self-center px-2 pr-4 font-semibold'>
												Sources / Media
											</div>
											<div className='font-light text-md'>
												{report.hearFrom}
											</div>
										</div>
										{/* Date */}
										<div className='flex flex-row items-center mb-3'>
											<AiOutlineFieldTime size={20} />
											<div className='self-center px-2 pr-4 font-semibold'>
												Date / Time
											</div>
											<div className='font-light text-md'>{postedDate}</div>
										</div>
										{/* City state */}
										<div className='flex flex-row items-center mb-3'>
											<IoLocation size={20} />
											<div className='self-center px-2 pr-4 font-semibold'>
												City, State
											</div>
											<div className='font-light text-md'>{reportLocation}</div>
										</div>
										{/* Agency */}
										{report.agency && (
											<>
												<div className='flex flex-row items-center mb-3'>
													<IoBusinessOutline size={20} />
													<div className='self-center px-2 pr-4 font-semibold'>
														Agency
													</div>
													<div className='font-light text-md'>
														{report.agency}
													</div>
												</div>
											</>
										)}
										{reportSubmitBy.contact && (
										<div className="flex flex-row items-center mb-3">
										<AiOutlineUser size={20} />
											<div className="font-light text-md">
												<span className="self-center px-2 pr-4 font-semibold">Reported by</span>{" "}
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
										<div className="flex flex-row items-center mb-3">
										<MdOutlineLocalPhone size={20} />
											<div className="font-light text-md">
												<span className="self-center px-2 pr-4 font-semibold">Phone number</span>{" "}
												<a href={`tel:${reportSubmitBy.phone}`}>{reportSubmitBy.phone}</a>
											</div>
										</div>
									} */}
									</div>

									{/* Images */}
									<div className='mb-12 images'>
										<div className={style.header}>Images</div>
										<div className='grid w-full grid-cols-4 gap-4 overflow-y-auto'>
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

						{/* Newsroom Edits */}
						<div className='grid grid-flow-row py-8 pt-4 mt-5 bg-slate-100 rounded-xl md:grid-cols-2 md:gap-10 lg:gap-15'>
							{/* Notes */}
							<div>
								<div className={style.header}>Newsroom's Notes</div>
								<textarea
									id='note'
									onChange={onNoteChange}
									placeholder='No notes yet...'
									className={note ? style.textarea : style.textarea + ` italic`}
									rows='6'
									readOnly={customClaims.admin ? false : true}
									defaultValue={note}></textarea>
							</div>
							{/* label read share & save */}
							<div>
								{/* LABELS go here */}
								<div className='mb-4'>
									<div className={style.header}>Label</div>
									<select
										id='labels'
										onChange={onLabelChange}
										value={selectedLabel || ''}
										className='inline-block px-8 py-1 text-sm bg-yellow-400 border-none shadow rounded-2xl hover:shadow-none'>
										
										{/* Default option representing no label */}
										<option value=''>{selectedLabel === '' ? 'No Label' : 'Remove Label'}</option>
										
										{activeLabels.map((label, i) => (
											<option value={label} key={i}>
												{label}
											</option>
										))}
									</select>
									{changeStatus && (
										<span className='ml-5 text-sm italic font-light'>
											{changeStatus}
										</span>
									)}
								</div>
								{/* Read/Unread */}
								<div className='flex flex-row items-center mb-4'>
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
								{/* Share */}
								<ButtonEmailSend onButtonEmailSendClick={() => setShareReportModal(true)} />
								
								<div className='flex items-center justify-between justify-items-stretch'>
									<div className='w-full save-button'>
										<button
											className='w-full px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:shadow-outline'
											type='submit'>
											Save
										</button>
									</div>
									{/* Delete button */}
									<div className='self-end delete-button'>
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
