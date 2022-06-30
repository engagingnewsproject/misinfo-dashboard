import React, { useState } from 'react'
import Headbar from '../components/Headbar'
import ChartsSection from './ChartsSection'
import ReportsSection from './ReportsSection'

const views = ["Overview", "Comparison View"]

const Home = () => {
  const [viewVal, setViewVal] = useState(0)

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
        <Headbar />
        <div class="w-full flex flex-col px-12 py-5">
          <div class="flex justify-between mb-2">
            <form onChange={handleChange}>
              <input type="radio" id="overview" defaultChecked value="0" name="view" class="hidden" />
              <label for="overview"
                class={viewVal == 0 ? styles.checked : styles.unchecked}>
                Overview
              </label>
              <input type="radio" id="comparison view" value="1" name="view" class="hidden"/>
              <label for="comparison view"
                class={viewVal == 1 ? styles.checked : styles.unchecked}>
                Comparison View
              </label>
            </form>
            <div>Dates select</div>
          </div>
          <ChartsSection />
          <ReportsSection />
        </div>
    </div>
  )
}

export default Home