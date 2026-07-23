/**
 * @fileoverview ReportDetails Page - Detailed view for a single report
 *
 * This page displays all details for a specific report, including:
 * - Title, reporter info, label, tag, sources, date/time, links, description, newsroom notes, and images
 * - Editable newsroom notes and label (with save/cancel)
 * - Read/unread toggle and sharing functionality
 * - Fetches report, reporter, and label data from Firestore
 * - Responsive, accessible, and role-aware UI
 *
 * Integrates with:
 * - SwitchRead for read/unread toggle
 * - Firebase Firestore for report/user/tag data
 * - next/router for navigation
 * - next/image for image display
 * - react-icons for UI icons
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { getDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import {
	buildLabelOptions,
	CUSTOM_LABEL_MAX_LENGTH,
	DEFAULT_REPORT_LABEL,
	OTHER_LABEL,
	validateCustomLabel,
} from '../../../config/labels'
import {
	addAgencyCustomLabel,
	fetchAgencyActiveLabels,
	fetchAgencyLabelColors,
	resolveAgencyIdForReport,
} from '../../../utils/label-tags'
import { RiMessage2Fill } from 'react-icons/ri'
import { BiEditAlt } from 'react-icons/bi'
import { IoReturnUpBackSharp } from 'react-icons/io5'
import { BsShareFill } from 'react-icons/bs'
import { AiOutlineFieldTime } from 'react-icons/ai'
import SwitchRead from "../../../components/reports/SwitchRead"
import Link from "next/link"
import Image from 'next/image';
import globalStyles from '../../../styles/globalStyles';
import FormInput from '../../../components/ui/FormInput'
import FormTextarea from '../../../components/ui/FormTextarea'
import LabelSelectMenu from '../../../components/reports/LabelSelectMenu'
import ShareReportModal from '../../../components/partials/modals/ShareReportModal'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useAuth } from '../../../context/AuthContext'
import {
	fetchMergedTagLabelMapForAgencyId,
	getTagLabel,
} from '../../../utils/tag-defaults'

/**
 * ReportDetails Page
 *
 * Renders a detailed view for a single report, including all metadata, images, and newsroom notes.
 * Allows editing of notes and label, toggling read status, and sharing the report.
 *
 * @returns {JSX.Element} The rendered report details page
 */
const ReportDetails = () => {
	const router = useRouter()
	const { t, i18n } = useTranslation('NewReport')
	const { customClaims } = useAuth()
	const [info, setInfo] = useState({})
	const [reporterInfo, setReporterInfo] = useState({})
	const [postedDate, setPostedDate] = useState("")
	const [selectedLabel, setSelectedLabel] = useState(DEFAULT_REPORT_LABEL)
	const [changeStatus, setChangeStatus] = useState('')
	const [update, setUpdate] = useState('')
	const [modalAgencyLabels, setModalAgencyLabels] = useState([])
	const [modalAgencyId, setModalAgencyId] = useState('')
	const [agencyLabelColors, setAgencyLabelColors] = useState({})
	const [otherLabelDraft, setOtherLabelDraft] = useState('')
	const [otherLabelError, setOtherLabelError] = useState('')
	const [shareReportModal, setShareReportModal] = useState(false)
	const [tagLabelMap, setTagLabelMap] = useState({})

	const { reportId } = router.query
	const linkStyle = 'font-light mb-1 text-sm underline underline-offset-1'

	const labelOptions = useMemo(() => {
		const currentLabel = info?.label || DEFAULT_REPORT_LABEL
		return buildLabelOptions(modalAgencyLabels, currentLabel)
	}, [modalAgencyLabels, info?.label])

	const getData = async () => {
		const infoRef = await getDoc(doc(db, 'reports', reportId))
		const reportData = infoRef.data() || {}
		setInfo(reportData)
		const reportLabel = reportData.label || DEFAULT_REPORT_LABEL
		setSelectedLabel(reportLabel)
		setOtherLabelDraft('')
		setOtherLabelError('')

		const submitterUid = reportData.userID
		if (submitterUid) {
			getDoc(doc(db, 'mobileUsers', submitterUid)).then((mobileRef) => {
				setReporterInfo(mobileRef.exists() ? mobileRef.data() : {})
			})
		} else {
			setReporterInfo({})
		}

		const resolvedAgencyId = await resolveAgencyIdForReport(
			reportData,
			customClaims?.agencyId,
		)
		setModalAgencyId(resolvedAgencyId || '')
		try {
			const map = await fetchMergedTagLabelMapForAgencyId(resolvedAgencyId)
			setTagLabelMap(map)
		} catch (err) {
			console.error('Error loading tag labels for report details:', err)
			setTagLabelMap({})
		}
		if (resolvedAgencyId) {
			const labels = await fetchAgencyActiveLabels(resolvedAgencyId)
			setModalAgencyLabels(labels)
			const colors = await fetchAgencyLabelColors(resolvedAgencyId)
			setAgencyLabelColors(colors)
		} else {
			setModalAgencyLabels([])
			setAgencyLabelColors({})
		}
	}

	const handleNotesChange = (e) => {
    if (e.target.value != info['note']) {
			setUpdate(e.target.value)
		} else {
			setUpdate("")
		}
	}

	const revertBack = () => {
    if (info['note']) {
      document.getElementById('notes').value = info['note']
		} else {
      document.getElementById('notes').value = ""
		}
		setUpdate("")
	}

	const saveChanges = async () => {
    const docRef = doc(db, 'reports', reportId)
    const res = await updateDoc(docRef, { note: document.getElementById('notes').value})
    info['note'] = document.getElementById('notes').value
		setUpdate("")
	}

	const handleLabelChange = async (e) => {
		e.preventDefault()
		const newLabel = e.target.value

		if (newLabel === OTHER_LABEL) {
			setSelectedLabel(OTHER_LABEL)
			setOtherLabelDraft('')
			setOtherLabelError('')
			return
		}

		const currentLabel = info.label || DEFAULT_REPORT_LABEL
		if (newLabel === currentLabel) {
			setOtherLabelDraft('')
			setOtherLabelError('')
			return
		}

		setChangeStatus('Saving changes...')
		try {
			const docRef = doc(db, 'reports', reportId)
			await updateDoc(docRef, { label: newLabel })
			setSelectedLabel(newLabel)
			setInfo((prev) => ({ ...prev, label: newLabel }))
			setOtherLabelDraft('')
			setOtherLabelError('')
			setChangeStatus('Label changes saved successfully')
		} catch (error) {
			console.error('Error updating label:', error)
			setChangeStatus('')
		}
	}

	const handleOtherLabelChange = (e) => {
		setOtherLabelDraft(e.target.value)
		if (otherLabelError) {
			setOtherLabelError('')
		}
	}

	const handleOtherLabelCommit = async () => {
		const error = validateCustomLabel(otherLabelDraft)
		if (error) {
			setOtherLabelError(error)
			return
		}

		const customText = otherLabelDraft.trim()
		setChangeStatus('Saving changes...')

		try {
			const docRef = doc(db, 'reports', reportId)
			await updateDoc(docRef, { label: customText })

			if (modalAgencyId) {
				await addAgencyCustomLabel(modalAgencyId, customText)
				const refreshed = await fetchAgencyActiveLabels(modalAgencyId)
				setModalAgencyLabels(refreshed)
			}

			setSelectedLabel(customText)
			setInfo((prev) => ({ ...prev, label: customText }))
			setOtherLabelDraft('')
			setOtherLabelError('')
			setChangeStatus('Label changes saved successfully')
		} catch (err) {
			console.error('Error saving custom label:', err)
			setOtherLabelError('Could not save label. Please try again.')
			setChangeStatus('')
		}
	}

	useEffect(() => {
		if (reportId) {
			getData()
		}
	}, [reportId])

	useEffect(() => {
		if (info?.createdDate) {
			const options = {
				day: '2-digit',
				year: 'numeric',
				month: 'short',
				hour: 'numeric',
				minute: 'numeric',
			}
			setPostedDate(
				info.createdDate
					.toDate()
					.toLocaleString('en-US', options)
					.replace(/,/g, '')
					.replace('at', ''),
			)
		}
		if (info && Object.keys(info).length > 0) {
			setSelectedLabel(info.label || DEFAULT_REPORT_LABEL)
		}
	}, [info])

	return (
		<div data-component="reportId" className="p-16">
			<div className="flex justify-between w-full mb-5">
				<div className="text-2xl font-bold text-[#2E3B4E] tracking-wider mb-8">
				{/* Temp link back to Dashboard for testing */}
					More Information
				</div>
				<div>
					<Link href={'/dashboard'} className="flex flex-row mb-3 items-center">
						<IoReturnUpBackSharp size={20} />
						<div className="font-semibold px-2 self-center pr-4">
							Return to Dashboard
						</div>
					</Link>
				</div>
			</div>
			{info?.archived === true && (
				<div className="mb-4 px-4 py-2 rounded-md bg-amber-100 text-amber-900 text-sm">
					This report is archived and hidden from default dashboard views.
				</div>
			)}
			<div className="grid grid-cols-2 gap-24">
				<div className="left-side">
					<div className="mb-2">
						<h6 className={`${globalStyles.heading.h2.black} mb-2`}>Title</h6>
            <div className="text-sm bg-white rounded-md p-4">{info['title'] || <span className="italic text-gray-400">No Title</span>}</div>
						</div>
          {reporterInfo?.name && reporterInfo?.email && (
						<div className="text-md mb-4 font-light text-right">
							<div>
              <span className="font-semibold">Reported by:</span> {reporterInfo['name']} (<a target="_blank" rel="noopener noreferrer" className="text-[#2E3B4E] hover:underline" href={"mailto:" + reporterInfo['email']}>{reporterInfo['email']}</a>)
							</div>
          </div>)}
					{info?.origin === 'scrape' && !(reporterInfo?.name && reporterInfo?.email) && (
						<div className="text-md mb-4 font-light text-right">
							<span className="font-semibold">Reported by:</span> Scraped (automated)
						</div>
					)}
					<div className="mb-8">
						<div className={globalStyles.heading.h2.black}>Label</div>
						<LabelSelectMenu
							id="labels"
							labelOptions={labelOptions}
							selectedLabel={selectedLabel || DEFAULT_REPORT_LABEL}
							agencyLabelColors={agencyLabelColors}
							onLabelChange={handleLabelChange}
						/>
						{selectedLabel === OTHER_LABEL && (
							<div className="mt-3">
								<FormInput
									type="text"
									id="other-label"
									label={`Specify label (max ${CUSTOM_LABEL_MAX_LENGTH} characters)`}
									value={otherLabelDraft}
									onChange={handleOtherLabelChange}
									onBlur={handleOtherLabelCommit}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											handleOtherLabelCommit()
										}
									}}
									maxLength={CUSTOM_LABEL_MAX_LENGTH}
									className="bg-white"
								/>
								{otherLabelError && (
									<p className="mt-1 text-sm text-red-600">{otherLabelError}</p>
								)}
							</div>
						)}
						{changeStatus && (
							<span className="ml-5 font-light text-sm italic">{changeStatus}</span>
						)}
					</div>
					<div className="flex flex-col mb-5">
						<div className="flex flex-row mb-3 items-center">
							<RiMessage2Fill size={20} />
							<div className="font-semibold px-2 self-center pr-4">Tag</div>
              <div className="text-md font-light">
								{getTagLabel({
									id: info['topic'],
									locale: i18n.language,
									labelMap: tagLabelMap,
									t,
									system: 'topics',
								})}
							</div>
						</div>
						<div className="flex flex-row mb-3 items-center">
							<BiEditAlt size={20} />
              <div className="font-semibold px-2 self-center pr-4">Sources / Media</div>
              <div className="text-md font-light">
								{getTagLabel({
									id: info['hearFrom'],
									locale: i18n.language,
									labelMap: tagLabelMap,
									t,
									system: 'sources',
								})}
							</div>
						</div>
						<div className="flex flex-row mb-3 items-center">
							<AiOutlineFieldTime size={20} />
              <div className="font-semibold px-2 self-center pr-4">Date / Time</div>
							<div className="text-md font-light">{postedDate}</div>
						</div>
						<div className="flex flex-row mb-3 items-center">
							<SwitchRead setReportModalId={reportId}/>
						</div>
					</div>
					<div className="mb-8">
						<div className={`${globalStyles.heading.h2.black} mb-2`}>Link to the Information</div>
						<div className="flex flex-col">
              {info['link'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + info['link']}>{info['link']}</a>}
              {info['secondLink'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + info['secondLink']}>{info['secondLink']}</a>}
              {info['thirdLink'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + info['thirdLink']}>{info['thirdLink']}</a>}
						</div>
					</div>
					<div>
						<div className={`${globalStyles.heading.h2.black} mb-2`}>Description</div>
            <div className="font-light overflow-auto max-h-32">{info['detail']}</div>
					</div>
				</div>
				<div className="right-side">
					<div>
						<div className={`${globalStyles.heading.h2.black} mb-2`}>Newsroom's Notes</div>
						<FormTextarea
							id="notes"
							label="Newsroom's Notes"
							onChange={handleNotesChange}
							className="bg-white mb-12"
							rows={4}
							defaultValue={info['note']}
						/>
            {update &&
							<div className="-mt-8 flex float-right mb-6">
              <button onClick={revertBack}
                className="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline">Cancel</button>
              <button onClick={saveChanges}
                className="bg-white hover:bg-blue-500 hover:text-white text-sm text-[#2E3B4E] font-bold ml-4 py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">Save Changes</button>
            </div>}
					</div>
					<div className="w-full mb-12">
						<div className={`${globalStyles.heading.h2.black} mb-2`}>Images</div>
						{console.log(info['images'])}
            {info['images'] && info['images'][0] ?
							<div className="flex">
                {info['images'].map((image, i) => {
								
									return (
										<div className="mr-2" key={i}>
                      <Image src={image} alt="image" width={200} height={200} />
										</div>
									)
								})}
              </div> :
							<div className="italic font-light">No images for this report</div>
            }
					</div>
					<div className="mb-8">
						<button
							type="button"
							className="flex flex-row text-sm bg-white px-4 border-none text-black py-1 rounded-md shadow hover:shadow-none"
							onClick={() => setShareReportModal(true)}>
							<BsShareFill className="my-1" size={15} />
							<div className="px-3 py-1">Share The Report</div>
						</button>
					</div>
				</div>
			</div>
			{shareReportModal && (
				<ShareReportModal
					reportId={reportId}
					reportTitle={info?.title || ''}
					closeModal={setShareReportModal}
				/>
			)}
		</div>
	)
}

export default ReportDetails

export async function getServerSideProps({ locale }) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
				'Home',
				'Report',
				'NewReport',
				'Profile',
				'Navbar',
				'ShareReport',
			])),
		},
	}
}