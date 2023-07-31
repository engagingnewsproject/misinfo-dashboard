import React, { useState, useEffect } from 'react'
import ReportSystem from './ReportSystem';
import ReportList from './ReportList';
import { IoChevronForward } from "react-icons/io5";
import Image from 'next/image'

export const reportSystems = ['default', 'Report', 'Reminder', 'Location', 'What', 'Where', 'Detail', 'Thank You', 'View Report'];

const SettingsReport = () => {

  const [reportSystem, setReportSystem] = useState(0)
  const [search, setSearch] = useState("")

  return (
    <div>
      {reportSystem == 0 ?
      <div className="z-0 flex-col p-16">
        <div className='container'>
          <div className="text-xl font-extrabold text-blue-600 tracking-wider mb-5">Hello</div>
            <div className="w-full">
              <button
                  onClick={() => setReportSystem(1)}
                  className="flex items-center justify-center gap-5 bg-blue-600 w-full hover:bg-blue-200 text-white font-normal py-2 px-6 border border-blue-600 rounded-xl">
                  
                  <Image src="/img/report.png" width={200} height={120} alt="report"/>
                  <span className='flex flex-col text-left'>
                    <span className='flex items-center'>Report<IoChevronForward size={25}/></span>
                    <span className='text-xs'>Potential Misinformation</span>
                  </span>
                </button>
            </div>
        </div>
        <div className='mt-5'>
          <div className="text-xl font-extrabold text-blue-600 tracking-wider">Report History</div>
          <ReportList />
          <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <button
              onClick={() => setReportSystem(1)}
              className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
              Start Reporting
            </button>
        </div>
        </div>
      </div> :
      <ReportSystem reportSystem={reportSystem} setReportSystem={setReportSystem} />
      }
    </div>
  )
}

export default SettingsReport