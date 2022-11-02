import React, { useState, useEffect } from 'react'
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import Toggle from './Toggle'

import OverviewGraph from './OverviewGraph'

const TagGraph = () => {
  const [viewVal, setViewVal] = useState("overview")


  // Query into the reports collection to only retrieve reports whose dates are within the past 3 days
  return (
    <div>
    <Toggle viewVal={viewVal} setViewVal={setViewVal}/>
    { viewVal == "overview" ? <OverviewGraph/> : <h1>Comparison view</h1>}
    </div>
    // {/* Following code will be used to determing which display to show. 
    //     Components need to be made for each display.*/}
  )
}
export default TagGraph