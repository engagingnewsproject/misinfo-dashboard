import React, { useState } from 'react'
import { IoClose } from "react-icons/io5"

const HelpModal = ({ setHelpModal}) => {


    const header = "text-lg font-bold text-blue-600 tracking-wider pt-2"
    const section = "rounded-lg py-2 my-1"
    return (
        <div>
            <div class="z-10 fixed top-0 left-0 w-full h-full bg-black opacity-60">
            </div>
            <div onClick={() => setHelpModal(false)} class="flex overflow-y-auto justify-center items-center z-20 absolute top-0 left-0 w-full h-auto">
                <div class="flex-col justify-center items-center bg-white w-6/12 h-auto rounded-2xl py-10 px-10"
                    onClick={(e) => {
                        e.stopPropagation()
                    }}>
                    <div class="flex justify-between w-full mb-5">
                        <button onClick={() => setHelpModal(false)} class="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                        <h3 className={header}>Help and Documentation</h3>

                    </div>
                    
                      <h3 className={header}>General</h3>

                      <div className={section}>The following includes a general overview and additional explanations per each main feature of the dashboard.
                      </div>

                    <h3 className={header}>Overview</h3>
                    <div className={section}>By default, the overview feature is displayed when viewing the home page for 
                      the dashboard. There are three main components of the overview screen, which are three pie charts
                      that show the top three trending topics within the given time spans: 
                        <ol className="list-disc pl-4">
                          <li>One pie chart displays the number of reports for the top three trending topics within the past day</li>
                          <li>One pie chart displays the number of reports for the top three trending topics within the past three days, showing the top three trending topics. </li>
                          <li>One pie chart displays the number of reports for the top three trending topics within the past seven days.</li>
                        </ol>
                    </div>

                                        
                    <h3 className={header}>Comparison View</h3>
                    <div className={section}>
                      The comparison view allows you to select topics and a date range to compare the number of reports for each topic.
                      However, you must select at least one topic, and the date range must be at least 3 days and no more than a month long. 
                      This feature is intended to show trends in topic reports over time. 
                    </div>


                    <h3 className={header}>Tag System</h3>
                    <div className={section}>
                      Tags are used to associate additional information with each report. We have three general tag systems, which may be edited and viewed
                      via the "Tag System" feature of our site and is accessible via the navigation bar. 
                      <ol className="list-disc pl-4">
                        <li>The topic tags are used to associate a specified topic with a report. This is intended to indicate topic trends in misinformation based on 
                        which topics users report most. You are able to add topics within the "Tag Systems" feature of the dashboard, which is accessible via the tag icon
                        on the navigation bar. You are able to view trends in topic reports via the comparison/overview feature of the dashboard (as described above).</li>
                        
                        <li>Source tags allow users to indicate from what platform/media source they heard the misinformation from. You may view and edit these source tags as well
                        in the "Tag Systems" feature of the dashboard.</li>
                      
                        <li>Customized labels allow you to organize and categorize reports based on your needs. These labels may serve as additional notes to you to
                          indicate the urgency of reports, but you may edit the names of the labels via the "Tag Systems" dashboard as well.</li>
                      </ol>
                    </div>

                    <h3 className={header}>Reports Section</h3>

                    <div className={section}>
                      The reports section can be accessed via the home screen of the dashboard, which is displayed beneath the comparison/overview graphs.
                      This section allows you to filter the reports based on given date ranges. In addition, you may also mark a report as read/unread and
                      filter based off this feature. The refresh icon displayed above the reports section allows you to refresh the reports section and retrieve any
                      reports that may have been recently changed or created. You may view additional information about each report by clicking on the given report name in the column.
                      Each report may be deleted, but please note this cannot be undone. 
                    </div>

                    <h3 className={header}>Adding a New Report</h3>

                    <div className={section}>
                      To add a new report, you may either select the "Add" icon in the navigation bar, or the "Add new report" icon featured above the reports section.
                      Once you complete the required information and add the report, it will be displayed in the reports section.
                    </div>

                </div>
            </div>
        </div>
    )
}

export default HelpModal