import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import { reportSystems } from '../pages/report';
import ReportSystem from './ReportSystem';
import ReportList from './ReportList';
import { IoChevronForward } from "react-icons/io5";

const ReportLanding = ({ 
	onReportStartClick,
	reportSystem, 
	setReportSystem, 
	reportView, 
	setReportView, 
	reminderShow, 
	setReminderShow, 
	disableReminder, 
	setDisableReminder }) => {
	const style = {
		container: "z-0 flex-col",
		headerWrap: 'flex pb-4 justify-between',
		header: "text-center md:text-left text-xl font-bold text-blue-600 tracking-wider mt-2",
		buttonLg: 'flex items-center justify-center gap-5 bg-blue-600 w-full hover:bg-blue-200 text-white font-normal py-2 px-6 border border-blue-600 rounded-xl',
		button: 'bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 mt-4 border border-blue-600 rounded-xl',
		systemWrap: 'text-xl font-extrabold text-blue-600 tracking-wider mt-5'
	}
	// console.log(reportSystem);
    // console.log('step: '+reportSystem+' disableReminder: '+disableReminder+' ||| reminderShow: '+reminderShow);
	
	return (
		<div className={style.container}>
			{/* Headbar */}
			<div className={style.headerWrap}>
				<h2 className={style.header}>Hello</h2>
			</div>
			<button onClick={onReportStartClick} className={style.buttonLg}>
				<Image src="/img/report.png" width={200} height={120} alt="report" className='h-auto'/>
				<span className='flex flex-col text-left'>
					<span className='flex items-center'>Report<IoChevronForward size={25}/></span>
					<span className='text-xs'>Potential Misinformation</span>
				</span>
			</button>
			<h2 className={style.header}>Report History</h2>
			<ReportList reportView={reportView} setReportView={setReportView} />
			<button
				onClick={onReportStartClick}
				className={style.button}>
				Start Reporting
			</button>
		</div>
		)
}

export default ReportLanding