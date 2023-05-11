import React, { useState } from 'react'
import { useRouter } from 'next/router'
import {
	IoHomeOutline,
	IoSettingsOutline,
	IoAddCircleOutline,
	IoPricetagsOutline,
	IoLogOutOutline,
  IoPersonOutline,
  IoHelpCircleOutline
} from "react-icons/io5";
import ReactTooltip from "react-tooltip";
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './modals/ConfirmModal';
import NewReport from "./modals/NewReportModal"
import HelpModal from './modals/HelpModal'

const Navbar = ({tab, setTab, handleNewReportSubmit}) => {

    const { logout } = useAuth()

    // Determines when to open the help modal popup 
    const [helpModal, setHelpModal] = useState(false)

    const router = useRouter()
    const [logoutModal, setLogoutModal] = useState(false)
    const [newReportModal, setNewReportModal] = useState(false)
    const handleLogout = () => {
        logout()
        router.push('/login')
    }

	const handleNewReportModal = (e) => {
		e.preventDefault()
		setNewReportModal(true)
	}

    const basicStyle = "flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"

    return (
      <>
      <div className="fixed top-0 left-0 w-16 h-screen z-10">
        <div className="flex-col bg-white h-full">
            <div className="grid content-between py-8 w-full h-full">
                <div>
                    <button 
                        onClick={() => setTab(0)}
                        data-tip="Home"
                        className={tab == 0 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoHomeOutline size={30}/>
                        <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                    </button>
                    <button
                        onClick={() => setTab(2)}
                        data-tip="Tagging Systems"
                        className={tab == 2 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoPricetagsOutline size={30}/>
                        <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                    </button>
                    <button
                        onClick={handleNewReportModal}
                        data-tip="New Report"
                        className={basicStyle}>
                        <IoAddCircleOutline size={30}/>
                        <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                    </button>
                </div>
                <div>
                    <button
                        onClick={() => setTab(1)}
                        data-tip="Settings"
                        className={tab == 1 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoPersonOutline size={30}/>
                        <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                    </button>
                    <button
                        onClick={()=>setHelpModal(true)}
                        data-tip="Help"
                        className={helpModal ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>

                        <IoHelpCircleOutline size={30}/>
                        <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />

                    </button>
                    <button
                        onClick={() => setLogoutModal(true)}
                        data-tip="Logout"
                        className={basicStyle}>
                        <IoLogOutOutline size={30}/>
                        <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
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
            {newReportModal && (
				<NewReport
					setNewReportModal={setNewReportModal}
                    handleNewReportSubmit={handleNewReportSubmit}
				/>
			)}
      </div>
      </div>
      {helpModal && <HelpModal setHelpModal={setHelpModal}/>}
      </>
    )
}

export default Navbar