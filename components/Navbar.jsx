import React, { useState, useEffect } from 'react'
import { slide as Menu } from 'react-burger-menu'
import { useRouter } from 'next/router'
import {
	IoHomeOutline,
	IoSettingsOutline,
	IoAddCircleOutline,
	IoPricetagsOutline,
	IoLogOutOutline,
  IoPersonOutline,
  IoHelpCircleOutline,
  IoClose,
  IoMenu
} from "react-icons/io5";
import ReactTooltip from "react-tooltip";
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './modals/ConfirmModal';
import NewReport from "./modals/NewReportModal"
import HelpModal from './modals/HelpModal'

const Navbar = ({tab, setTab, handleNewReportSubmit}) => {

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);

  const [disableOverlay, setDisableOverlay] = useState(true)
  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight]);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Ensures that overlay is only displayed on mobile view, since nav bar will always be shown on laptop view
  useEffect(()=> {  
    if (windowSize && windowSize[0] < 640) {
      setDisableOverlay(false)
    } else {
      setDisableOverlay(true)
    }
  }, [windowSize])

  // Will only reopen menu if on mobile view since nav bar is always displayed on laptop view
  function handleOpenMenu() {
    if (windowSize[0]< 640) {
      setShowNav(true)
    } 
  }

  // Only closes menu on mobile view
  function shouldCloseMenu() {
    console.log(window.innerWidth)
    if (window.innerWidth < 640) {
      setShowNav(false)
    } else {
      setShowNav(true)
    }
  }

  // nav bar styles
  var styles = {
    bmBurgerButton: {
      
    },
    bmBurgerBars: {
      background: '#373a47'
    },
    bmBurgerBarsHover: {
      background: '#a90000'
    },
    bmCrossButton: {
      display: 'none'
    },
    bmCross: {
      background: '#bdc3c7'
    },
    bmMenuWrap: {
      width: '64px',

    },
    bmMenu: {
      width: '64px'
    },
    bmMorphShape: {
      fill: '#373a47'
    },
    bmItemList: {
      color: '#b8b7ad',
      padding: '0.8em'
    },
    bmItem: {
      display: 'inline-block'
    },
    bmOverlay: {
      background: 'rgba(0, 0, 0, 0.3)',
      top: '0 px',
      right: '0 px'
    }
  }

  const { logout } = useAuth()
  const [showNav, setShowNav] = useState(true)

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
      {!showNav && 
        <button 
        onClick={() => setShowNav(!showNav)}
        data-tip="Menu"
        className="absolute top-8 left-4 z-10 sm:hidden"
        >
        <IoMenu size={40}/>
        <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
    </button>}
      
      <Menu noOverlay={disableOverlay}
        styles={styles}
        customBurgerIcon={ false }
        isOpen={(windowSize[0] > 640 ? true : showNav)} onOpen={ ()=>handleOpenMenu()} onClose={() => shouldCloseMenu()}>
      <div className="fixed top-0 left-0 w-16 h-screen z-10">
        <div className="flex-col bg-white h-full">
            <div className="grid content-between w-full h-full">
                <div>
                  <button 
                      onClick={() => setShowNav(!showNav)}
                      data-tip="Collapse menu"
                      className={basicStyle + " sm:hidden"}>
                      <IoClose size={30}/>
                      <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                  </button> 
                
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
 
      </div>
      </div>
      </Menu>
      {helpModal && <HelpModal setHelpModal={setHelpModal}/>}

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
      </>
    )
}

export default Navbar