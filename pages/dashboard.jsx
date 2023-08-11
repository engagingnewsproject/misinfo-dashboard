import { useRouter } from 'next/router'
import React from 'react'
import { useState, useEffect } from 'react'
import Home from '../components/Home'
import Profile from '../components/Profile'
import Settings from '../components/Settings'
import Users from '../components/Users'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import Agencies from '../components/Agencies'

import { auth } from "../config/firebase"

const tabList = ['Home', 'Profile', 'Settings', 'Users', 'Agencies', 'ReportSettings'];

const Dashboard = () => {
    const { user, logout, verifyPrivilege, changeRole, addAdminRole, addAgencyRole, viewRole } = useAuth()
    const [tab, setTab] = useState(0)
    const router = useRouter()


    // const admin = require('firebase-admin');
    // admin.initializeApp();


    // stores the admin/agency privilege of current user
    const [customClaims, setCustomClaims] = useState({admin: false, agency: false})    



    // JUST ADDED
    const [newReportSubmitted, setNewReportSubmitted] = useState(0);
    const [agencyUpdateSubmitted, setAgencyUpdateSubmitted] = useState(0);

    const handleNewReportSubmit = () => {
        // increment the newReportSubmitted
        setNewReportSubmitted(prevState => prevState + 1);
    };
    
    const handleAgencyUpdateSubmit = () => {
        // increment the agencyUpdateSubmitted
        setAgencyUpdateSubmitted(prevState => prevState + 1);
    };

    useEffect(()=> {
      // TODO: debugging callback function to verify user role before displaying dashboard view
      auth.currentUser.getIdTokenResult()
      .then((idTokenResult) => {
         // Confirm the user is an Admin.
         if (!!idTokenResult.claims.admin) {
           // Show admin UI.
           setCustomClaims({admin: true})
         } else if (!!idTokenResult.claims.agency) {
           // Show regular user UI.
           setCustomClaims({agency: true})
         }
      })
      .catch((error) => {
        console.log(error);
      });
      
    }, [])

    
    return (
        <div className="h-full w-full">
            <Navbar tab={tab} setTab={setTab} handleNewReportSubmit={handleNewReportSubmit} customClaims={customClaims} setCustomClaims={setCustomClaims} />
            <div className="pl-2 sm:pl-12 h-full">
            { tab == 0 && <Home newReportSubmitted={newReportSubmitted} handleNewReportSubmit={handleNewReportSubmit} />}
            { tab == 1 && <Profile />}
            { tab == 2 && <Settings />}

            {/* If the user is an agency or a superadmin, will display tab of list of users for agency or list of users for app */}
            { tab == 3 && customClaims.admin || customClaims.agency && <Users />}

            {/* If the user is a superadmin, will display list of agencies */}
            { tab == 4 && customClaims.admin && <Agencies handleAgencyUpdateSubmit={handleAgencyUpdateSubmit} />}
            </div>
        </div>
    )
}

export default Dashboard