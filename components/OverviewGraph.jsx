import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { Chart } from "react-google-charts";

const OverviewGraph = ({topicReports, numTopics}) => {
  
  
  console.log(topicReports)
  
  const getYesterdayDate = () => {
    // const today = new Date();
    // // it gives yesterday date
    // today.setDate(today.getDate()-1);
    // // console.log(today.toDateString()); // Thu Apr 02 2020
    // return today.toDateString()

    // Trying to format the date 
    const yesterday = new Date()
    return yesterday.toLocaleString('en-us', { month: "long" }) + ' ' + yesterday.getDate()
  }

  const date = getYesterdayDate()
  console.log(date)
  const options = {
    slices: {
      0: { color: '#F6413A' },
      1: { color: '#FFCA29' },
      2: { color: '#2196F3'}
    },
    legend: {backgroundColor: 'white'},
    backgroundColor: 'none',
  };
  return (
  <div>
  <div class="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">{getYesterdayDate()} Trending Topic Reports</div>
    <div class="bg-white rounded-xl mt-3">
    {{numTopics} == 0 ? <h1 class="pl-2 pb-3">No topics were reported yesterday.</h1>: <Chart
    chartType="PieChart"
    data={topicReports}
    options={options}
    width={"100%"}
    height={"400px"}
    />}
  </div>
  </div>);
}
export default OverviewGraph
