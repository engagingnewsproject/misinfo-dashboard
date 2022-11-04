import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { Chart } from "react-google-charts";

const OverviewGraph = ({topicReports}) => {
  console.log(topicReports)
  const options = {
    title: "Trending Topic Reports",
    backgroundColor: 'none',
  };
  return (
  <Chart
  chartType="PieChart"
  data={topicReports}
  options={options}
  width={"100%"}
  height={"500px"}
/>);
}
export default OverviewGraph
