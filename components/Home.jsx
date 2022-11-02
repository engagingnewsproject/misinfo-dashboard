import React, { useState, useEffect } from 'react'
import Headbar from '../components/Headbar'
import ReportsSection from './ReportsSection'
import TagGraph from "./TagGraph"

const Home = () => {
  const [viewVal, setViewVal] = useState("overview")
  const [search, setSearch] = useState("")

  const styles = {
    checked: "bg-blue-600 text-white py-2 px-5 shadow-sm text-sm font-light tracking-wide",
    unchecked: "bg-white py-2 px-5 shadow-sm text-sm font-light tracking-wide"
  }

  return (
    <div class="w-full h-full flex flex-col py-5">
        <Headbar search={search} setSearch={setSearch} />
        {/* Nest the following toggle inside a component for the graph portion of the page*/}
        <div class="w-full h-full flex flex-col px-12 py-5 mb-5 overflow-y-auto">
          <TagGraph/>
          <ReportsSection search={search} />
        </div>
    </div>
  )
}

export default Home