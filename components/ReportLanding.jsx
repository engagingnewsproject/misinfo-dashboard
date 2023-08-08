import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import { reportSystems } from '../pages/report';
import ReportList from './ReportList';
import { IoChevronForward } from "react-icons/io5";
const ReportLanding = ({ reportSystem, setReportSystem, reportView, setReportView }) => {

	return (
		<div className="z-0 flex-col">
			{/* Headbar */}
			<div className="flex pb-4 justify-between">
				<div className="text-center md:text-left text-lg font-bold text-blue-600 tracking-wider pb-2 md:pb-0">Hello</div>
			</div>
			<div className='container'>
				<div className="w-full">
					<button
						onClick={() => setReportSystem(2)}
						className="flex items-center justify-center gap-5 bg-blue-600 w-full hover:bg-blue-200 text-white font-normal py-2 px-6 border border-blue-600 rounded-xl">
						<Image src="/img/report.png" width={200} height={120} alt="report" className='h-auto'/>
						<span className='flex flex-col text-left'>
							<span className='flex items-center'>Report<IoChevronForward size={25}/></span>
							<span className='text-xs'>Potential Misinformation</span>
						</span>
					</button>
				</div>
			</div>
			<div className='mt-5'>
				<div className="text-xl font-extrabold text-blue-600 tracking-wider">
					{reportSystem == 2 ? "Customized " + reportSystems[reportSystem] : reportSystems[reportSystem]}
				</div>
			</div>
			<ReportList reportView={reportView} setReportView={setReportView} />
			<div className="flex justify-between mx-6 my-6 tracking-normal items-center">
				<button
					onClick={() => setReportSystem(2)}
					className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
					Start Reporting
				</button>
			</div>
		</div>
		)
}

export default ReportLanding