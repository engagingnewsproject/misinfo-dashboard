import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { MdHomeFilled } from 'react-icons/md';
import { CgProfile } from 'react-icons/cg'
import { IoSettingsSharp, IoAddCircleSharp, IoPricetagsSharp } from "react-icons/io5";
import { BiLogOut } from 'react-icons/bi'
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './modals/ConfirmModal';

const Navbar = ({tab, setTab}) => {

    const { logout } = useAuth()
    const router = useRouter()
    const [reportModal, setReportModal] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false)

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const handleReport = () => {
        alert('REPORT');
    };

    const basicStyle = "flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"

    return (
        <div class="flex-col w-16 bg-white h-full">
            <div class="grid content-between py-8 w-full h-full">
                <div>
                    <button 
                        onClick={() => setTab(0)}
                        title="Home"
                        class={tab == 0 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <MdHomeFilled size={30}/>
                    </button>
                    <button
                        onClick={() => setTab(2)}
                        title="Tagging Systems"
                        class={tab == 2 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoPricetagsSharp size={30}/>
                    </button>
                    <button
                        onClick={() => setReportModal(true)}
                        title="New Report"
                        class={basicStyle}>
                        <IoAddCircleSharp size={30}/>
                    </button>
                </div>
                <div>
                    <button
                        onClick={() => setTab(1)}
                        title="Profile"
                        class={tab == 1 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoSettingsSharp size={30}/>
                    </button>
                    <button
                        onClick={() => setLogoutModal(true)}
                        title="Logout"
                        class={basicStyle}>
                        <BiLogOut size={30}/>
                    </button>
                </div>
            </div>
            { logoutModal && <ConfirmModal
                func={handleLogout}
                title="Are you sure you want to log out?"
                subtitle=""
                CTA="Log out"
                closeModal={setLogoutModal}
                />}
            { reportModal && <ConfirmModal
                func={handleReport}
                title="New Report"
                subtitle=""
                CTA="Log report"
                closeModal={setReportModal}
                />}
        </div>
    )
}

export default Navbar