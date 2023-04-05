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
    const [newReportSubmitted, setNewReportSubmitted] = useState(false);

    const handleNewReportSubmit = () => {
        setNewReportSubmitted(true);
    };


    return (
        <div className="flex h-full w-full">
            <Navbar tab={tab} setTab={setTab} handleNewReportSubmit={handleNewReportSubmit} />
            { tab == 0 && <Home newReportSubmitted={newReportSubmitted}/>}
            { tab == 1 && <Profile />}
            { tab == 2 && <Settings />}
        </div>
    )
}

export default Dashboard