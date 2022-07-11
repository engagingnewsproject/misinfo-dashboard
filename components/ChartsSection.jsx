import React, { useState } from 'react'

const chartContainer = "bg-white flex justify-center items-center rounded-xl"

const ChartsSection = ({ view }) => {
  return (
    <div class="flex flex-col">
        <div class="text-lg font-bold text-blue-600 tracking-wider py-5">Top 3 Trendy Tag</div>
        <div class="grid grid-cols-3 gap-10 item-center pb-5 h-52 text-sm">
            <div class={chartContainer}>
                <div>No Data</div>
            </div>
            <div class={chartContainer}>
                <div>No Data</div>
            </div>
            <div class={chartContainer}>
                <div>No Data</div>
            </div>
        </div>
    </div>
  )
}

export default ChartsSection