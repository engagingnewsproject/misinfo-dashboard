import React, { useState } from 'react'
import { useRouter } from 'next/router'
import {
	IoHomeOutline,
	IoSettingsOutline,
	IoAddCircleOutline,
	IoPricetagsOutline,
	IoLogOutOutline
} from "react-icons/io5";
import ReactTooltip from "react-tooltip";
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './modals/ConfirmModal';
import ReportModal from "./modals/ReportModal";

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
                        data-tip="Home"
                        class={tab == 0 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoHomeOutline size={30}/>
                        <ReactTooltip delayShow={1000} place="bottom" type='light'/>
                    </button>
                    <button
                        onClick={() => setTab(2)}
                        title="Tagging Systems"
                        class={tab == 2 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoPricetagsOutline size={30}/>
                    </button>
                    <button
                        onClick={() => setReportModal(true)}
                        title="New Report"
                        class={basicStyle}>
                        <IoAddCircleOutline size={30}/>
                    </button>
                </div>
                <div>
                    <button
                        onClick={() => setTab(1)}
                        title="Profile"
                        class={tab == 1 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoSettingsOutline size={30}/>
                    </button>
                    <button
                        onClick={() => setLogoutModal(true)}
                        title="Logout"
                        class={basicStyle}>
                        <IoLogOutOutline size={30}/>
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
            { reportModal && <ReportModal
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