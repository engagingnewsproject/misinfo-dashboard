import React from 'react';
import { IoClose } from "react-icons/io5";

const HelpModal = ({ setHelpModal }) => {
  return (
    <>
      <div onClick={() => setHelpModal(false)} className="fixed z-[9999] insert-0 bg-black bg-opacity-60 overflow-y-auto h-full w-full">
        <div className="relative top-20 mx-auto p-5 border w-10/12 lg:w-6/12 shadow-lg rounded-md bg-white">
          <div className="flex flex-col overflow-y-auto bg-white h-auto rounded-2xl mt-4 lg:mt-autopy-10 px-10" onClick={(e) => { e.stopPropagation() }}>
            <div className="flex justify-between w-full mb-5">
              <button onClick={() => setHelpModal(false)} className="text-gray-800">
                <IoClose size={25} />
              </button>
              <h3 className="text-lg font-bold text-blue-600 tracking-wider pt-2">Help and Documentation</h3>
            </div>

            <h3 className="text-lg font-bold text-blue-600 tracking-wider pt-2">General</h3>
            <div className="rounded-lg py-2 my-1">The following includes a general overview and additional explanations per each main feature of the dashboard.</div>

            <h3 className="text-lg font-bold text-blue-600 tracking-wider pt-2">Overview</h3>
            <div className="rounded-lg py-2 my-1">By default, the overview feature is displayed when viewing the home page for the dashboard. There are three main components of the overview screen, which are three pie charts that show the top three trending topics within the given time spans:</div>

            <ol className="list-disc pl-4">
              <li>One pie chart displays the number of reports for the top three trending topics within the past day</li>
              <li>One pie chart displays the number of reports for the top three trending topics within the past three days, showing the top three trending topics.</li>
              <li>One pie chart displays the number of reports for the top three trending topics within the past seven days.</li>
            </ol>

            <h3 className="text-lg font-bold text-blue-600 tracking-wider pt-2">Comparison View</h3>
            <div className="rounded-lg py-2 my-1">The comparison view allows you to select topics and a date range to compare the number of reports for each topic.</div>

            <h3 className="text-lg font-bold text-blue-600 tracking-wider pt-2">Tag System</h3>
            <div className="rounded-lg py-2 my-1">Tags are used to associate additional information with each report. We have three general tag systems, which may be edited and viewed via the "Tag System" feature of our site and is accessible via the navigation bar.</div>

            <h3 className="text-lg font-bold text-blue-600 tracking-wider pt-2">Reports Section</h3>
            <div className="rounded-lg py-2 my-1">The reports section can be accessed via the home screen of the dashboard, which is displayed beneath the comparison/overview graphs.</div>

            <h3 className="text-lg font-bold text-blue-600 tracking-wider pt-2">Adding a New Report</h3>
            <div className="rounded-lg py-2 my-1">To add a new report, you may either select the "Add" icon in the navigation bar, or the "Add new report" icon featured above the reports section.</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HelpModal;
