import React, { useState, useEffect } from 'react'
import ReportSystem from './ReportSystem';
import ReportList from './ReportList';
import ReportView from './ReportView';
import { IoChevronForward } from "react-icons/io5";
import Image from 'next/image'
// default: [0] report landing with report list
// Report View: [1] View report details (from click on list)
// 
// Reminder: [3] (optional reminder) only show if user has not checked "do not show"
// Location: [4] select state and city
// Topic Tag: [5]
// Source tags: [6]
// Details: [7]
// Thank you [8]
// View report [9]
export const reportSystems = ['default', 'Report View', 'Reminder', 'Location', 'What', 'Where', 'Detail', 'Thank You'];

const SettingsReport = () => {

  const [reportSystem, setReportSystem] = useState(0)
  const [reportView, setReportView] = useState(0)
  const [search, setSearch] = useState("")  
    // //
    // Styles
    // //
  const style = {
      button: 'w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
  }
  
    // //
    // Text content
    // //
    const t = {
        viewReportButton: 'View All Reports'
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
                  onClick={() => setReportSystem(3)}
                  className="flex items-center justify-center gap-5 bg-blue-600 w-full hover:bg-blue-200 text-white font-normal py-2 px-6 border border-blue-600 rounded-xl">
                  
                  <Image src="/img/report.png" width={200} height={120} alt="report"/>
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
          {reportSystem == 0 && 
            <>
              <div className="text-xl font-extrabold text-blue-600 tracking-wider">Report History</div>
              <ReportList reportView={reportView} setReportView={setReportView} />
              <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
                <button
                  onClick={() => setReportSystem(3)}
                  className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                  Start Reporting
                </button>
                {/* {reportSystem == }
                <button onClick={() => setReportSystem(0)} className={style.button}>
                    {t.viewReportButton}
                </button> */}
              </div>
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