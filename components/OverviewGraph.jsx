/* Displays pie chart for the trending topics from the past day, three days, and seven days. */
import React from 'react'
import { Chart } from "react-google-charts";

const OverviewGraph = ({loaded, yesterdayReports, threeDayReports, sevenDayReports, numTopics}) => {
  
  // console.log(numTopics)
  // console.log(yesterdayReports)
  
  // Formats and returns today's date
  const getTodayDate = () => {
    const today = new Date()
    return today.toLocaleString('en-us', { month: "long"}) + ' ' + today.getDate()
  }

  const date = getTodayDate()
  // console.log(date)
  const options = {
    slices: {
      0: { color: '#F6413A' },
      1: { color: '#FFCA29' },
      2: { color: '#2196F3'}
    },
    legend: {backgroundColor: 'white'},
    backgroundColor: 'none',
    chartArea: {
      right: 60, // Adjusts the legend width
      left: 20,  // Adjusts the left margin
    },
  };
  return (
  <div>
  <div className="text-2xl font-bold text-blue-600 pt-6 tracking-wider text-center ">{getTodayDate()} Trending Topics</div>
    <div className="grid grid-cols-1 grid-rows-3 mt-3 gap-y-4 md:grid md:grid-cols-3 md:grid-rows-1 md:mt-3 md:gap-x-4">
      <div className="col-span-1 bg-white rounded-xl mt-3 pr-2">
        <h1 className="text-m font-bold text-blue-600 pt-6 tracking-wider text-center">Yesterday's Reports</h1>
        {/* Pie chart for topics reported yesterday. */}
        {!loaded && <h1 className="py-24 text-center">Retrieving data...</h1>}
        {loaded && numTopics[0] == 0 && <h1 className="py-24 text-center">No topics reported.</h1>}
        {loaded && numTopics[0] != 0 &&
          <Chart
          chartType="PieChart"
          data={yesterdayReports}
          options={options}
          width={"100%"}
          height={"300px"}
          />
        }
      </div>
      <div className="col-span-1 bg-white rounded-xl mt-3 pr-2">
        <h1 className="text-m font-bold text-blue-600 pt-6 tracking-wider text-center">Three Days Ago</h1>
        
        {/* Pie chart for topics reported within the past three days. */}
        {!loaded && <h1 className="py-24 text-center">Retrieving data...</h1>}
        {loaded && numTopics[1] == 0 && <h1 className="py-24 text-center">No topics reported.</h1>}
        {loaded && numTopics[1] != 0 && 
        <Chart
          chartType="PieChart"
          data={threeDayReports}
          options={options}
          width={"100%"}
          height={"300px"}
        />}
      </div>
      <div className="col-span-1 bg-white rounded-xl mt-3 pr-2">
        <h1 className="text-m font-bold text-blue-600 pt-6 tracking-wider text-center">Seven Days Ago</h1>
        
        {/* Pie chart for topics reported within the past seven days. */}
        {!loaded && <h1 className="py-24 text-center">Retrieving data...</h1>}
        {loaded && numTopics[2] == 0 && <h1 className="py-24 text-center">No topics reported.</h1>}
        {loaded && numTopics[2] != 0 &&
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
