import React, { useState, useEffect } from 'react'
import Headbar from '../components/Headbar'
import ReportsSection from './ReportsSection'
import TagGraph from "./TagGraph"

const Home = ({newReportSubmitted}) => {
  const [search, setSearch] = useState("")
  
  return (
    <div className="w-full h-full flex flex-col py-5">
        <Headbar search={search} setSearch={setSearch} />
        {/* Nest the following toggle inside a component for the graph portion of the page*/}
        <div className="w-full h-full flex flex-col px-12 py-5 mb-5 overflow-y-auto" id="scrollableDiv">
          <TagGraph/>
          <ReportsSection search={search} newReportSubmitted={newReportSubmitted}/>
        </div>
    </div>
  )
}

export default Home