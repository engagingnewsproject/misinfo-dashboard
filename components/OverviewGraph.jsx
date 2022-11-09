import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { Chart } from "react-google-charts";

const OverviewGraph = ({yesterdayReports, threeDayReports, sevenDayReports, numTopics}) => {
  
  console.log(numTopics)
  console.log(yesterdayReports)
  
  const getTodayDate = () => {
    // Fprmats and returns today's date
    const today = new Date()
    return today.toLocaleString('en-us', { month: "long" }) + ' ' + today.getDate()
  }

  const date = getTodayDate()
  console.log(date)
  const options = {
    slices: {
      0: { color: '#F6413A' },
      1: { color: '#FFCA29' },
      2: { color: '#2196F3'}
    },
    legend: {backgroundColor: 'white'},
    backgroundColor: 'none',
    chartArea: {
      right: 60,   // set this to adjust the legend width
      left: 20,     // set this eventually, to adjust the left margin
    },
  };
  return (
  <div>
  <div class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">{getTodayDate()} Trending Topic Reports</div>
    <div class="grid grid-cols-3 grid-rows-1 mt-3 gap-x-4">
      <div class="col-span-1 bg-white rounded-xl mt-3 pr-2">
        <h1 class="text-m font-bold text-blue-600 pt-6 tracking-wider text-center">Yesterday's Reports</h1>
        {numTopics[0] == 0 ? <h1>No topics reported</h1> :
        
        <Chart
        chartType="PieChart"
        data={yesterdayReports}
        options={options}
        width={"100%"}
        height={"300px"}
        />
      }
      </div>
      <div class="col-span-1 bg-white rounded-xl mt-3 pr-2">
        <h1 class="text-m font-bold text-blue-600 pt-6 tracking-wider text-center">Three Days Ago</h1>
        {numTopics[1] == 0 ? <h1>No topics reported.</h1> :
        <Chart
          chartType="PieChart"
          data={threeDayReports}
          options={options}
          width={"100%"}
          height={"300px"}
        />}
      </div>
      <div class="col-span-1 bg-white rounded-xl mt-3 pr-2">
        <h1 class="text-m font-bold text-blue-600 pt-6 tracking-wider text-center">Seven Days Ago</h1>
        {numTopics[2] == 0 ? <h1>No topics reported.</h1> :

        <Chart
            chartType="PieChart"
            data={sevenDayReports}
            options={options}
            width={"100%"}
            height={"300px"}
        />}
      </div>
    </div>
  </div>);
}
export default OverviewGraph
