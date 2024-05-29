import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Button,
  IconButton,
} from '@material-tailwind/react';
import { useRouter } from 'next/router';
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
  IoMenu,
  IoChatboxEllipsesOutline,
} from 'react-icons/io5';
import { HiOutlineDocumentPlus } from 'react-icons/hi2';
import { Tooltip } from 'react-tooltip';
import NewReport from './modals/NewReportModal';
import HelpModal from './modals/HelpModal';
import ContactHelpModal from './modals/ContactHelpModal';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'next-i18next';

const Navbar = ({
  tab,
  setTab,
  handleNewReportSubmit,
  handleContactHelpSubmit,
  onReportTabClick,
  isOpen,
}) => {
  const { t } = useTranslation('Navbar');
  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);
  const [disableOverlay, setDisableOverlay] = useState(true);
  // Determines when to open the help modal popup
  const [helpModal, setHelpModal] = useState(false);
  const [newReportModal, setNewReportModal] = useState(false);
  //for determining when to open ContactHelpModal
  const [contactHelpModal, setContactHelpModal] = useState(false);
  const { customClaims, setCustomClaims } = useAuth();
  // Stores privilege role of the current user, and displays dashboard
  // Drawer states
  const [open, setOpen] = useState(false);
  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

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
  useEffect(() => {
    if (windowSize && windowSize[0] < 640) {
      setDisableOverlay(true);
    } else {
      setDisableOverlay(false);
    }
  }, [windowSize]);

  const handleNewReportModal = (e) => {
    e.preventDefault();
    setNewReportModal(true);
  };

  const basicStyle =
    'flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg';

  return (
    <>
      {/* Menu icon that appears when being viewed on mobile screen */}
        <IconButton
          variant="text"
          onClick={openDrawer}
          className="absolute top-8 left-4 z-10 sm:hidden tooltip-menu"
        >
          <IoMenu size={40} />
        </IconButton>

      <Drawer
        open={windowSize[0] > 640 ? true : open}
        onClose={closeDrawer}
        size={60}
        overlay={disableOverlay}
      >
        <div className="fixed top-0 left-0 w-16">
          <div className="flex-col bg-white h-screen max-h-screen">
            <div className="grid grid-rows-2 justify-between w-full h-full">
              <div className="row-span-1">

                <Button
                  variant='text'
                  onClick={closeDrawer}
                  className={basicStyle + ' sm:hidden tooltip-close'}>
                  <IoClose size={30} />
                </Button>
                {(customClaims.admin || customClaims.agency) && (
                  <button // Home/Reports view
                    onClick={() => setTab(0)}
                    className={`${basicStyle} ${
                      tab === 0 ? 'text-indigo-500 bg-indigo-100' : ''
                    } tooltip-home`}>
                    <IoHomeOutline size={30} />
                    <Tooltip
                      anchorSelect=".tooltip-home"
                      place="bottom"
                      delayShow={500}>
                      Home
                    </Tooltip>
                  </button>
                )}
                {customClaims.admin && (
                  <button // Agencies
                    onClick={() => setTab(4)}
                    className={`${basicStyle} ${
                      tab === 4 ? 'text-indigo-500 bg-indigo-100' : ''
                    } tooltip-agencies`}>
                    <IoBusinessOutline size={30} />
                    <Tooltip
                      anchorSelect=".tooltip-agencies"
                      place="bottom"
                      delayShow={500}>
                      Agencies
                    </Tooltip>
                  </button>
                )}
                {(customClaims.agency || customClaims.admin) && (
                  <button // Tags
                    onClick={() => setTab(2)}
                    className={`${basicStyle} ${
                      tab === 2 ? ' text-indigo-500 bg-indigo-100' : ''
                    } tooltip-tags`}>
                    <IoPricetagsOutline size={30} />
                    <Tooltip
                      anchorSelect=".tooltip-tags"
                      place="bottom"
                      delayShow={500}>
                      Tagging Systems
                    </Tooltip>
                  </button>
                )}
                {customClaims.agency && ( // if admin user or agency user show the add report & users icons
                  <button //  Agency user create report
                    onClick={handleNewReportModal}
                    className={`${basicStyle} tooltip-new-report`}>
                    <IoAddCircleOutline size={30} />
                    <Tooltip
                      anchorSelect=".tooltip-new-report"
                      place="bottom"
                      delayShow={500}>
                      New Report
                    </Tooltip>
                  </button>
                )}
                {(customClaims.admin || customClaims.agency) && (
                  <button // Users
                    onClick={() => setTab(3)}
                    className={`${basicStyle} ${
                      tab === 3 ? ' text-indigo-500 bg-indigo-100' : ''
                    } tooltip-users`}>
                    <IoPeopleOutline size={30} />
                    <Tooltip
                      anchorSelect=".tooltip-users"
                      place="bottom"
                      delayShow={500}>
                      Users
                    </Tooltip>
                  </button>
                )}
                {!customClaims.admin && !customClaims.agency && (
                  <button // General User create report
                    onClick={onReportTabClick}
                    className={`${basicStyle} tooltip-create-report`}>
                    <HiOutlineDocumentPlus size={30} />
                    <Tooltip
                      anchorSelect=".tooltip-create-report"
                      place="bottom"
                      delayShow={500}>
                      Create Report
                    </Tooltip>
                  </button>
                )}
              </div>
              <div className="self-end">
                {(customClaims.admin || customClaims.agency) && (
                  <button
                    onClick={() => setHelpModal(true)}
                    className={`${basicStyle} tooltip-help`}>
                    <IoHelpCircleOutline size={30} />
                    <Tooltip
                      anchorSelect=".tooltip-help"
                      place="bottom"
                      delayShow={500}>
                      Help
                    </Tooltip>
                  </button>
                )}
                <button
                  onClick={() => setContactHelpModal(true)}
                  className={`${basicStyle} tooltip-contact-us-for-help`}>
                  <IoChatboxEllipsesOutline size={30} />
                  <Tooltip
                    anchorSelect=".tooltip-contact-us-for-help"
                    place="bottom"
                    delayShow={500}>
                    Contact for Help
                  </Tooltip>
                </button>
                <button
                  onClick={() => setTab(1)}
                  className={`${basicStyle} ${
                    tab === 1 ? ' text-indigo-500 bg-indigo-100' : ''
                  } tooltip-profile`}>
                  <IoPersonOutline size={30} />
                  <Tooltip
                    anchorSelect=".tooltip-profile"
                    place="bottom"
                    delayShow={500}>
                    Profile
                  </Tooltip>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
      {helpModal && <HelpModal setHelpModal={setHelpModal} />}
      {contactHelpModal && (
        <ContactHelpModal
          setContactHelpModal={setContactHelpModal}
          handleContactHelpSubmit={handleContactHelpSubmit}
        />
      )}

      {newReportModal && (
        <NewReport
          setNewReportModal={setNewReportModal}
          handleNewReportSubmit={handleNewReportSubmit}
        />
      )}
    </>
  );
};

export default Navbar;
