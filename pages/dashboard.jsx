import { useRouter } from 'next/router'
import React from 'react'
import { useState } from 'react'
import Home from '../components/Home'
import Profile from '../components/Profile'
import Settings from '../components/Settings'
import Users from '../components/Users'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import Agencies from '../components/Agencies'

const tabList = ['Home', 'Profile', 'Settings', 'Users'];

const Dashboard = () => {
    const { user, logout } = useAuth()
    const [tab, setTab] = useState(0)
    const router = useRouter()
    // JUST ADDED
    const [newReportSubmitted, setNewReportSubmitted] = useState(0);

    const handleNewReportSubmit = () => {
        // increment the newReportSubmitted
        setNewReportSubmitted(prevState => prevState + 1);
    };


    return (
        <div className="h-full w-full">
            <Navbar tab={tab} setTab={setTab} handleNewReportSubmit={handleNewReportSubmit} />
            <div className="pl-2 sm:pl-12">
            { tab == 0 && <Home newReportSubmitted={newReportSubmitted} handleNewReportSubmit={handleNewReportSubmit} />}
            { tab == 1 && <Profile />}
            { tab == 2 && <Settings />}
            { tab == 3 && <Users />}
            { tab == 4 && <Agencies />}
            </div>
        </div>
    )
}

export default Dashboard