import React, { useState, useEffect } from 'react'
import Headbar from '../components/Headbar'
import ReportsSection from './ReportsSection'
import TagGraph from "./TagGraph"
import { useAuth } from '../context/AuthContext'
import { auth } from '../config/firebase'

const Home = ({newReportSubmitted, handleNewReportSubmit}) => {
  const [search, setSearch] = useState("")
  const { user,  customClaims, setCustomClaims, logout, verifyPrivilege, changeRole, addAdminRole, addAgencyRole, viewRole } = useAuth()

  // useEffect(()=> {
  //   // TODO: debugging callback function to verify user role before displaying dashboard view
  //   auth.currentUser.getIdTokenResult()
  //   .then((idTokenResult) => {
  //     // Confirm the user is an Admin.
  //     if (!!idTokenResult.claims.admin) {
  //       // Show admin UI.
  //       setCustomClaims({admin: true})
  //     } else if (!!idTokenResult.claims.agency) {
  //       // Show regular user UI.
  //       setCustomClaims({agency: true})
  //     }
  //   })
  //   .catch((error) => {
  //     console.log(error);
  //   });
    
  // }, [])
  
  return (
    <div className="w-full h-full flex flex-col py-5">
        <Headbar search={search} setSearch={setSearch} customClaims={customClaims} user={user} />
        {/* Nest the following toggle inside a component for the graph portion of the page*/}
        <div className="w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto" id="scrollableDiv">
          <TagGraph/>
          <ReportsSection search={search} newReportSubmitted={newReportSubmitted} handleNewReportSubmit={handleNewReportSubmit} />
        </div>
    </div>
  )
}

export default Home