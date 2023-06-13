import React, { useState } from "react"
import SwitchRead from "../SwitchRead"
import Link from "next/link"
import Image from "next/image"
import ReactTooltip from "react-tooltip";
// icons
import { RiMessage2Fill } from "react-icons/ri"
import { BiEditAlt } from "react-icons/bi"
import { BsShareFill } from "react-icons/bs"
import { BiLinkExternal } from "react-icons/bi";
import { AiOutlineFieldTime } from "react-icons/ai"
import { IoClose, IoTrash, IoLocation } from "react-icons/io5"

const ReportModal = ({
	reportTitle,
	note,
	detail,
	info,
	setPostedDate,
	setReportLocation,
	reporterInfo,
	onTitleChange,
	onNoteChange,
	onDetailChange,
	onFormSubmit,
	onFormUpdate,
	onReportDelete,
	selectedLabel,
	activeLabels,
	onLabelChange,
	changeStatus,
	setReportModal,
	setReportModalId,
}) => {
	const style = {
		header: "text-lg font-bold text-black tracking-wider mb-4",
		link: "font-light mb-1 text-sm underline underline-offset-1",
		overlay: "z-10 fixed top-0 left-0 w-full h-full bg-black bg-opacity-50",
		modal:
			"flex overflow-y- justify-center items-center z-20 absolute sm:top-0 md:top-4 left-0 w-full sm:w-full sm:h-full",
		wrap: "flex-col justify-center items-center lg:w-8/12 h-auto rounded-2xl py-10 px-10 bg-sky-100",
		textarea:
			"border transition ease-in-out w-full text-md font-light bg-white rounded-xl p-4 border-none focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none resize-none mb-12",
		icon: "flex p-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"
	}
	const label = {
		default: "overflow-hidden inline-block px-5 bg-gray-200 py-1 rounded-2xl",
		special: "overflow-hidden inline-block px-5 bg-yellow-400 py-1 rounded-2xl",
	}
	const reportURI = "/reports/" + setReportModalId
	
	function SendLinkByMail(href) {
		var subject = "Misinformation Report"
		var body = "Link to report:\r\n"
		body += window.location.href
		var uri = "mailto:?subject="
		uri += encodeURIComponent(subject)
		uri += "&body="
		uri += encodeURIComponent(body)
		uri += reportURI
		window.open(uri)
	}
	return (
		<div className="fixed z-10 top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto" // {style.overlay} 
			onClick={() => setReportModal(false)}>
			 <div className="absolute top-4 md:top-6 md:right-6 md:left-6 flex justify-center items-center z-20 sm:overflow-y-scroll"> {/* {style.modal} */}
				<div
					className="flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible" // {style.wrap}
					onClick={(e) => {
						e.stopPropagation()
					}}>
					<div className="flex justify-between w-full mb-6">
						<div className="flex w-full items-baseline">
							<div className="text-2xl font-bold text-blue-600 tracking-wider">
								More Information
							</div>
							<Link href={`dashboard${reportURI}`} target="_blank">
								<BiLinkExternal size={20} className="ml-2" />
							</Link>
						</div>
						<button
							onClick={() => setReportModal(false)}
							className="text-gray-800">
							<IoClose size={25} />
						</button>
					</div>
					<form onSubmit={onFormSubmit} className="grid md:grid-cols-2 md:gap-10 lg:gap-15">
						<div className="left-side">
							<div>
								<div className={style.header}>Title</div>
								<input
									id="title"
									className="text-sm bg-white rounded-xl p-4 w-full mb-4"
									onChange={onTitleChange}
									placeholder="Report title"
									defaultValue={reportTitle}
								/>

								{reporterInfo && (
									<div className="text-md mb-4 font-light text-right">
										<div>
											<span className="font-semibold">Reported by:</span>{" "}
											{reporterInfo["name"]} (
											<a
												target="_blank"
												rel="noopener noreferrer"
												className="text-blue-600 hover:underline"
												href={"mailto:" + reporterInfo["email"]}>
												{reporterInfo["email"]}
											</a>
											)
										</div>
									</div>
								)}

								{/* LABELS go here */}
								<div className="mb-8">
									<div className={style.header}>Label</div>
									<select
										id="labels"
										onChange={onLabelChange}
										defaultValue={selectedLabel}
										className="text-sm inline-block px-8 border-none bg-yellow-400 py-1 rounded-2xl shadow hover:shadow-none">
										<option value={selectedLabel ? selectedLabel : "none"}>
											{selectedLabel ? selectedLabel : "Choose a label"}
										</option>
										{activeLabels
											.filter((label) => label != selectedLabel)
											.map((label, i) => {
												return <option value={label} key={i}>{label}</option>
											})}
									</select>
									{changeStatus && (
										<span className="ml-5 font-light text-sm italic">
											{changeStatus}
										</span>
									)}
								</div>

								{/* Sources and stuff */}
								<div className="flex flex-col mb-5">
									<div className="flex flex-row mb-3 items-center">
										<RiMessage2Fill size={20} />
										<div className="font-semibold px-2 self-center pr-4">
											Tag
										</div>
										<div className="text-md font-light">{info["topic"]}</div>
									</div>
									<div className="flex flex-row mb-3 items-center">
										<BiEditAlt size={20} />
										<div className="font-semibold px-2 self-center pr-4">
											Sources / Media
										</div>
										<div className="text-md font-light">{info["hearFrom"]}</div>
									</div>
									<div className="flex flex-row mb-3 items-center">
										<AiOutlineFieldTime size={20} />
										<div className="font-semibold px-2 self-center pr-4">
											Date / Time
										</div>
										<div className="text-md font-light">{setPostedDate}</div>
									</div>
									{/* City state */}
									<div className="flex flex-row mb-3 items-center">
										<IoLocation size={20} />
										<div className="font-semibold px-2 self-center pr-4">
											City, State
										</div>
										<div className="text-md font-light">{setReportLocation}</div>
									</div>
									<div className="flex flex-row mb-3 items-center">
										<SwitchRead setReportModalId={setReportModalId} />
									</div>
								</div>

								{/* Links */}
								<div className="mb-8">
									<div className={style.header}>Link to the Information</div>
									<div className="flex flex-col">
										{info["link"] && (
											<a
												className={style.link}
												target="_blank"
												rel="noreferrer"
												href={"//" + info["link"]}>
												{info["link"]}
											</a>
										)}
										{info["secondLink"] && (
											<a
												className={style.link}
												target="_blank"
												rel="noreferrer"
												href={"//" + info["secondLink"]}>
												{info["secondLink"]}
											</a>
										)}
										{info["thirdLink"] && (
											<a
												className={style.link}
												target="_blank"
												rel="noreferrer"
												href={"//" + info["thirdLink"]}>
												{info["thirdLink"]}
											</a>
										)}
									</div>
								</div>

								{/* Detail */}
								<div>
									<div className={style.header}>Description</div>
									<div className="font-light overflow-auto max-h-32">
										<textarea
											id="detail"
											onChange={onDetailChange}
											placeholder="Description..."
											className={style.textarea}
											rows="4"
											defaultValue={detail}></textarea>
									</div>
								</div>
							</div>
						</div>

						<div className="right-side flex flex-col justify-between">
							<div>
								{/* Notes */}
								<div className="notes">
									<div className={style.header}>Newsroom's Notes</div>
									<textarea
										id="note"
										onChange={onNoteChange}
										placeholder="No notes yet..."
										className={style.textarea}
										rows="4"
										defaultValue={note}></textarea>
								</div>
								{/* Images */}
								<div className="images mb-12">
									<div className={style.header}>Images</div>
									{info['images'] && info['images'][0] ?
										<div className="flex w-full overflow-y-auto">
											{info['images'].map((image, i) => {
												return (
													<div className="flex mr-2">
														<Image src={image} width={100} height={100} key={i} alt="image"/>
													</div>
												)
											})}
										</div> :
										<div className="italic font-light">No images for this report</div>
									}
								</div>
								{/* Share */}
								<button
									className="flex flex-row text-sm bg-white px-4 border-none text-black py-1 rounded-md shadow hover:shadow-none"
									onClick={SendLinkByMail}>
									<BsShareFill className="my-1" size={15} />
									<div className="px-3 py-1">Share The Report</div>
								</button>
							</div>
							<div className="flex items-center justify-between justify-items-stretch">
								{/* Save button */}
									<div className="save-button w-full">
										<button
											onClick={onFormUpdate}
											className="w-full bg-blue-500 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
											type="submit">
											Save
										</button>
									</div>
								{/* Delete button */}
								<div className="delete-button self-end">
									<button
										onClick={onReportDelete}
										data-tip="Delete report"
										className={style.icon}>
										<IoTrash size={30} color="red"/>
										<ReactTooltip place="left" type="light" effect="solid" delayShow={500} />
									</button>
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default ReportModal
