import React, { useState, useEffect } from 'react'
import ReportSystem from './ReportSystem';
import ReportList from './ReportList';
import ReportView from './ReportView';
import { IoChevronForward } from "react-icons/io5";
import Image from 'next/image'
// default/Report History: [0] report landing with report list
// Report View: [1] View report details (from click on list)
// Reminder: [2] (optional reminder) only show if user has not checked "do not show"
// Location: [3] select state and city
// Topic Tag: [4]
// Source tags: [5]
// Details: [6]
// Thank you [7]
// View report [8]
export const reportSystems = ['Report History', 'Reminder', 'Location', 'What', 'Where', 'Detail', 'Thank You'];

const SettingsReport = () => {
  
  const [reportSystem, setReportSystem] = useState(0)
  const [reportView, setReportView] = useState(0)

    // //
    // Styles
    // //
  const style = {
      button: 'w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
  }

  return (
    <div>
      {reportSystem == 0 ?
      <div className="z-0 flex-col p-16">
        <div className='container'>
        {reportView == 0 && 
          <>
            <div className="text-xl font-extrabold text-blue-600 tracking-wider mb-5">
              Hello
            </div>
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
          </>
        }
        </div>
        <div className='mt-5'>
          <div className="text-xl font-extrabold text-blue-600 tracking-wider">
            {reportSystem == 2 ? "Customized " + reportSystems[reportSystem] : reportSystems[reportSystem]}
          </div>
          {reportSystem == 0 && 
            <>
              <ReportList reportView={reportView} setReportView={setReportView} />
              {reportView == 0 && 
                <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
                  <button
                    onClick={() => setReportSystem(2)}
                    className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                    Start Reporting
                  </button>
                </div>
              }
            </>
        }
        </div>
      </div> :
      <ReportSystem reportSystem={reportSystem} setReportSystem={setReportSystem} />
      }
    </div>
  )
}

export default SettingsReport