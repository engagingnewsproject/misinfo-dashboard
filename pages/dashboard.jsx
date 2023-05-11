import { useRouter } from 'next/router'
import React from 'react'
import { useState } from 'react'
import Home from '../components/Home'
import Profile from '../components/Profile'
import Settings from '../components/Settings'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

const tabList = ['Home', 'Profile', 'Settings'];

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
            <div className="pl-12">
            { tab == 0 && <Home newReportSubmitted={newReportSubmitted} handleNewReportSubmit={handleNewReportSubmit} />}
            { tab == 1 && <Profile />}
            { tab == 2 && <Settings />}
            </div>
        </div>
    )
}

export default Dashboard