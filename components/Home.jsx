import React, { useState, useEffect } from 'react'
import Headbar from '../components/Headbar'
import ReportsSection from './ReportsSection'

const views = ["Overview", "Comparison View"]

const Home = () => {
  const [viewVal, setViewVal] = useState(0)
  const [search, setSearch] = useState("")

  const handleChange = (e) => {
    const {value} = e.target
    setViewVal(value)
  }

  const styles = {
    checked: "bg-blue-600 text-white py-2 px-5 shadow-sm text-sm font-light tracking-wide",
    unchecked: "bg-white py-2 px-5 shadow-sm text-sm font-light tracking-wide"
  }

  return (
    <div class="w-full h-full flex flex-col py-5">
        <Headbar search={search} setSearch={setSearch} />
        <div class="w-full h-full flex flex-col px-12 py-5 mb-5 overflow-y-hidden">
          <ReportsSection search={search} />
        </div>
    </div>
  )
}

export default Home