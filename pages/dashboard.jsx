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


import SettingsReport from '../components/SettingsReport'

const tabList = ['Home', 'Profile', 'Settings', 'Users', 'Agencies', 'ReportSettings'];

const Dashboard = () => {
    const { user, logout, verifyPrivilege, changeRole, addAdminRole, addAgencyRole, viewRole } = useAuth()
    const [tab, setTab] = useState(0)
    const router = useRouter()


    // const admin = require('firebase-admin');
    // admin.initializeApp();


    // determines if user has admin privileges
    const [isAdmin, setIsAdmin] = useState(null)
    
    // determines if user is an agency
    const [isAgency, setIsAgency] = useState(null)

    // JUST ADDED
    const [newReportSubmitted, setNewReportSubmitted] = useState(0);

    const handleNewReportSubmit = () => {
        // increment the newReportSubmitted
        setNewReportSubmitted(prevState => prevState + 1);
    };

    useEffect(()=> {
      // TODO: debugging callback function to verify user role before displaying dashboard view
      const claims = viewRole()
      console.log(claims)
      console.log(claims['admin'])
      if (claims['admin']) {
        setIsAdmin(true)
      } else if (claims['agency']) {
        setIsAgency(true)
      } 
    }, [])

    
    return (
        <div className="h-full w-full">
            <Navbar tab={tab} setTab={setTab} handleNewReportSubmit={handleNewReportSubmit} />
            <div className="pl-2 sm:pl-12">
            { tab == 0 && <Home newReportSubmitted={newReportSubmitted} handleNewReportSubmit={handleNewReportSubmit} />}
            { tab == 1 && <Profile />}
            { tab == 2 && <Settings />}

            {/* If the user is an agency or a superadmin, will display tab of list of users for agency or list of users for app */}
            { (isAgency || isAdmin) && tab == 3 && <Users />}

            {/* If the user is a superadmin, will display list of agencies */}
            { isAdmin && tab == 4 && <Agencies />}
            { tab == 5 && <SettingsReport />}
            </div>
        </div>
    )
}

export default Dashboard