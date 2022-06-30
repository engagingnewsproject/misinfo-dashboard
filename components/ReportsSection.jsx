import React, { useState } from 'react'

const ReportsSection = () => {

  const tableHeadings = "text-center text-sm font-semibold tracking-wide z-50"

  return (
    <div class="flex flex-col">
      <div class="text-lg font-bold text-blue-600 tracking-wider py-5">List of Reports</div>
      <div class="bg-white w-full grid grid-cols-7 p-2 rounded-tl-xl rounded-tr-xl">
        <div class={"col-span-2 font " + tableHeadings}>Title</div>
        <div class={"col-span-2 " + tableHeadings}>Date/Time</div>
        <div class={tableHeadings}>Topic Tags</div>
        <div class={tableHeadings}>Sources</div>
        <div class={tableHeadings}>Labels</div>
      </div>
      <div class="bg-white w-full grid grid-cols-7 rounded-bl-xl rounded-br-xl p-1 overflow-auto h-64">
        {/* Reports go here */}
      </div>
    </div>
  )
}

export default ReportsSection