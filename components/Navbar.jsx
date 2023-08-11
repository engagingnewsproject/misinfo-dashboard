import React, { useState, useEffect } from 'react'
import { slide as Menu } from 'react-burger-menu'
import { useRouter } from 'next/router'
import {
	IoHomeOutline,
	IoSettingsOutline,
	IoAddCircleOutline,
	IoPricetagsOutline,
	IoLogOutOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoHelpCircleOutline,
  IoBusinessOutline,
  IoClose,
  IoMenu
} from "react-icons/io5";
import { HiOutlineDocumentPlus } from "react-icons/hi2";
import ReactTooltip from "react-tooltip";
import Link from "next/link"
import NewReport from "./modals/NewReportModal"
import HelpModal from './modals/HelpModal'
import { auth } from "../config/firebase"

const Navbar = ({tab, setTab, handleNewReportSubmit, customClaims, setCustomClaims, onReportTabClick}) => {

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);
  const [disableOverlay, setDisableOverlay] = useState(true)
  const [showNav, setShowNav] = useState(true)
  // Determines when to open the help modal popup 
  const [helpModal, setHelpModal] = useState(false)
  const router = useRouter()
  const [newReportModal, setNewReportModal] = useState(false)
  const [update, setUpdate] = useState(false)

  // Stores privilege role of the current user, and displays dashboard
  
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
    // console.log(window.innerWidth)
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

	const handleNewReportModal = (e) => {
		e.preventDefault()
		setNewReportModal(true)
	}

  const basicStyle = "flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"

    return (
      <>
      {/* Menu icon that appears when being viewed on mobile screen */}
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
      <div className="fixed top-0 left-0 w-16 h-screen">
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
                    {(customClaims.admin || customClaims.agency) &&
                      <button // Home/Reports view
                        onClick={() => setTab(0)}
                        data-tip="Home"
                        className={tab == 0 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                        <IoHomeOutline size={30}/>
                        <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                      </button>
                    }
                    {customClaims.admin &&
                      <button // Agencies
                          onClick={() => setTab(4)}
                          data-tip="Agencies"
                          className={tab == 4 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                          <IoBusinessOutline size={30}/>
                          <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                      </button>
                    }
                    {(customClaims.agency ||customClaims.admin) &&
                      <button // Tags
                          onClick={() => setTab(2)}
                          data-tip="Tagging Systems"
                          className={tab == 2 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                          <IoPricetagsOutline size={30}/>
                          <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                      </button>
                    }
                    {customClaims.agency && // if admin user or agency user show the add report & users icons
                      <button //  Agency user create report
                          onClick={handleNewReportModal}
                          data-tip="New Report"
                          className={basicStyle}>
                          <IoAddCircleOutline size={30}/>
                          <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                      </button>
                    } 
                    { (customClaims.admin || customClaims.agency) &&
                      <button // Users
                          onClick={() => setTab(3)}
                          data-tip="Users"
                          className={basicStyle}>
                          <IoPeopleOutline size={30}/>
                          <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                      </button>
                    }
                    { (!customClaims.admin && !customClaims.agency) &&
                      <button // General User create report
                          onClick={onReportTabClick}
                          data-tip="Create Report"
                          className={basicStyle}>
                          <HiOutlineDocumentPlus size={30}/>
                          <ReactTooltip place="bottom" type="light" effect="solid" delayShow={500} />
                      </button>
                    }
                </div>
                <div>
                    <button
                        onClick={() => setTab(1)}
                        data-tip="Profile"
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
                </div>
            </div>
 
      </div>
      </div>
      </Menu>
      {helpModal && <HelpModal setHelpModal={setHelpModal}/>}

   
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