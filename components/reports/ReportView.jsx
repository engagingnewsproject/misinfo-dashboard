/**
 * @fileoverview ReportView - Individual report detail view component.
 * 
 * This component handles displaying detailed information about a specific report,
 * including title, links, images, details, and location. It fetches data from
 * Firestore using real-time listeners and supports internationalization.
 * 
 * @module components/ReportView
 * @requires react
 * @requires firebase/firestore
 * @requires next/image
 * @requires next-i18next
 */

import React,{ useState,useEffect } from 'react'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { doc, onSnapshot } from "firebase/firestore"
import { db } from '../../config/firebase'
import {  useTranslation } from 'next-i18next'
import { formatCityState } from '../../utils/format-location'
import ImageLightboxGallery from '../ui/ImageLightboxGallery'

/**
 * ReportView Component
 * 
 * A React component that displays detailed information about a specific report.
 * This component fetches report data from Firestore and renders it in a formatted view
 * with support for images, links, location details, and internationalization.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.reportView - Current view state for the report system
 * @param {Function} props.setReportView - Function to update the report view state
 * @param {Object} props.reportSystem - Report system configuration object
 * @param {Function} props.setReportSystem - Function to update the report system state
 * @param {string} props.reportId - Unique identifier for the report to display
 * @param {Function} props.setReportId - Function to update the report ID
 * 
 * @example
 * ```jsx
 * <ReportView
 *   reportView={0}
 *   setReportView={setReportView}
 *   reportSystem={reportSystem}
 *   setReportSystem={setReportSystem}
 *   reportId="report123"
 *   setReportId={setReportId}
 * />
 * ```
 */
const ReportView = ({ reportView,setReportView,reportSystem,setReportSystem,reportId,setReportId }) => {
	/**
	 * @type {Array} data - Report data fetched from Firestore
	 */
	const [data,setData] = useState([])
	
	/**
	 * Translation hook for internationalization
	 * @type {Object} t - Translation function
	 */
  const {t} = useTranslation("NewReport")

	// //
	// Data
	// //
	
	/**
	 * Fetches report data from Firestore using the provided reportId
	 * Sets up a real-time listener to automatically update when the document changes
	 * 
	 * @async
	 * @function getData
	 * @returns {Promise<void>}
	 * 
	 * @example
	 * // Called automatically on component mount
	 * getData()
	 */
	const getData = async () => {
  if (!reportId) {
    console.log("Report ID is undefined.");
    return; // Exit if no reportId is provided
  }
  const docRef = doc(db, "reports", reportId);
  const unsub = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      // console.log("Current data:", doc.data());
      setData(doc.data());
    } else {
      console.log("Document does not exist");
    }
  });
};
	
	/**
	 * Effect hook that runs on component mount to fetch initial report data
	 * Dependencies: [] (runs only once on mount)
	 */
	useEffect(() => {
		getData()
	},[])

	// //
	// Styles
	// //
	
	/**
	 * CSS classes and styling configuration for the component
	 * @type {Object}
	 */
	const style = {
		sectionWrapper: 'flex items-center',
		sectionH2: 'text-[#2E3B4E] mb-2',
		viewWrapper: 'flex flex-col gap-2 mt-2',
		inputSingle: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline',
		buttonBack: 'hover:-translate-x-1 transition-transform'
	}
	
	// const myArray = Object.values(data);
	// const imageArr = data['images']
	// console.log(imageArr);
	// const hasValues = imageArr.length > 0 ? true : false;

	// console.log(hasValues); // Output: true

	return (
		<>
			<div data-component="ReportView" className={style.viewWrapper}>
				{/* Back Button Section */}
				<div className={style.sectionWrapper}>
					<button onClick={() => setReportView(0)} className={style.buttonBack}>
						<IoMdArrowRoundBack size={25} />
					</button>
				</div>
				
				{/* Report Title Section */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t('title_text')}
					</div>
					{/* TODO finish adding all data + a back to reports list button */}
					{data['title']}
				</div>
				
				{/* Report Links Section */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t('links')}
					</div>
					{ data['link'] !== '' && <div>{data['link']}</div> }
					{ data['secondLink'] !== '' && <div>{data['secondLink']}</div> }
				</div>
				
				{/* Report Images Section */}
				{data['images'] && data['images'][0] ? (
					<div className={style.inputSingle}>
						<div className={style.sectionH2}>{t('image_text')}</div>
						<ImageLightboxGallery
							images={data.images}
							altPrefix="Report image"
							listClassName="grid grid-cols-4 gap-4 w-full"
							thumbnailClassName="h-auto w-full object-cover"
						/>
					</div>
				) : (
					<div className={style.inputSingle}>{t('noImages')}</div>
				)}
				
				{/* Report Details Section */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t('details')}
					</div>
					{data['detail'] ? data['detail'] : t('noDescription')}
				</div>
				
				{/* Report Location Section */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t('location_text')}
					</div>
					{formatCityState(data['city'], data['state']) || (
						<span className="italic text-gray-400">—</span>
					)}
				</div>
			</div>
		</>
	)
}

export default ReportView