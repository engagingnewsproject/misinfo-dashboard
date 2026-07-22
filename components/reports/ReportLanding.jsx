/**
 * @fileoverview ReportLanding Component - Entry point for reporting and report history
 *
 * This component serves as the landing page for users to start a new report or view their report history.
 * Features include:
 * - Button to start a new report (with image and translation support)
 * - Displays a list of previous reports
 * - Handles user authentication and role-based logic
 * - Responsive and accessible UI
 *
 * Integrates with:
 * - ReportList for displaying report history
 * - ReportSystem for starting a new report (via callback)
 * - AuthContext and Firebase Auth for user/role management
 * - next-i18next for translations
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image';
import { reportSystems } from '../../pages/report';
import ReportSystem from './ReportSystem';
import ReportList from './ReportList';
import { IoChevronForward } from "react-icons/io5";
import { auth } from '../../config/firebase'

import { useTranslation } from 'next-i18next';

/** Report card image (bundled so it works on Firebase App Hosting where public/ may not be served). */
import reportImg from '../../public/img/report.png';

/**
 * ReportLanding Component
 *
 * Renders the landing page for reporting, including a start report button and report history.
 * Handles user authentication, role-based logic, and translation.
 *
 * @param {Object} props
 * @param {Function} props.onReportStartClick - Callback to start a new report
 * @param {string} props.reportSystem - Current report system
 * @param {Function} props.setReportSystem - Setter for report system
 * @param {string} props.reportView - Current report view
 * @param {Function} props.setReportView - Setter for report view
 * @param {boolean} props.reminderShow - Whether to show a reminder
 * @param {Function} props.setReminderShow - Setter for reminder visibility
 * @param {boolean} props.disableReminder - Whether reminders are disabled
 * @param {Function} props.setDisableReminder - Setter for disabling reminders
 * @param {Object} props.translations - Translation strings or object
 * @returns {JSX.Element} The rendered report landing UI
 */
const ReportLanding = ({ 
	onReportStartClick,
	reportSystem, 
	setReportSystem, 
	reportView, 
	setReportView, 
	reminderShow, 
	setReminderShow, 
	disableReminder, 
	setDisableReminder,
  translations }) => {


  const { t } = useTranslation('Home');


  // i18n.use(initReactI18next).init({
  //   resources,
  //   lng: "en",
  //   fallbackLng: "en",
  //   interpolation: {
  //     escapeValue: false,
  //   },
  // });

	const style = {
		container: "z-0 flex-col lg:max-w-4xl mb-12",
		headerWrap: 'flex pb-4 justify-between',
		header: "text-center md:text-left text-xl font-bold text-[#2E3B4E] tracking-wider",
		buttonLg: 'flex items-center justify-center gap-5 bg-blue-600 w-full hover:bg-blue-600 text-white font-normal py-2 px-6 border border-[#868686] rounded-md',
		button: 'bg-[#D3D3D3] hover:bg-[#ebebeb] text-[#2E3B4E] font-normal py-2 px-6 mt-4 border border-[#868686] rounded-md',
		systemWrap: 'text-xl font-extrabold text-[#2E3B4E] tracking-wider mt-5'
	}

	const router = useRouter()

	/**
	 * get current user's email
	 */
	const userEmail = auth.currentUser.email
	return (
		<div data-component="ReportLanding" className={style.container}>
			{/* Headbar */}
			<div className={style.headerWrap}>
				<h2 className={style.header}>{t("hello")}</h2>
			</div>
			<button onClick={onReportStartClick} className={style.buttonLg}>
				<Image src={reportImg} width={200} height={120} priority alt="report" className='h-auto max-w-36 sm:h-auto' />
				<span className='flex flex-col text-left'>
					<span className='flex items-center'>{t("report")}<IoChevronForward size={25}/></span>
					<span className='text-xs'>{t("potential")}</span>
				</span>
			</button>
			<h2 className={`${style.header} my-4`}>{t("history")}</h2>
			<ReportList reportView={reportView} setReportView={setReportView} />
			{/* <button
				onClick={onReportStartClick}
				className={style.button}>
				{t("startReporting")}
			</button> */}
		</div>
		)
}

export default ReportLanding
