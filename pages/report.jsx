import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../context/AuthContext"
// Components 
import Navbar from "../components/Navbar"
import Headbar from "../components/Headbar"
import ReportLanding from "../components/ReportLanding"
import ReportSystem from "../components/ReportSystem"
import Profile from "../components/Profile"
import LocationModal from '../components/modals/LocationModal'
// For location modal
import {
	collection,
	getDocs,
	getDoc,
	query,
	where,
	updateDoc,
	doc,
} from "firebase/firestore"
import { db, auth } from "../config/firebase"

import { serverSideTranslations } from 'next-i18next/serverSideTranslations'



const tabList = ['Report', 'Profile'];

export const reportSystems = ['Report History', 'Reminder', 'Location', 'What', 'Where', 'Detail', 'Thank You'];

const Report = () => {
	const { user, customClaims, setCustomClaims } = useAuth()
	const router = useRouter()
	const [reportSystem, setReportSystem] = useState(0)
	const [reportView, setReportView] = useState(0)
	const [tab, setTab] = useState(0)

	const [disableReminder, setDisableReminder] = useState(false)
	const [reminderShow, setReminderShow] = useState(true)


  const [userData, setUserData] = useState(null)
  const [locationModal, setLocationModal] = useState(false)
  
	const handleChangeCheckbox = (e) => {
			setDisableReminder(e.target.checked)
	}

	const handleReminderStart = (e) => {
			e.preventDefault()
			setReportSystem(reportSystem + 1)
			if (disableReminder == true) {
					setReminderShow(!reminderShow)
			}
	}

	const handleReportSystemPrevStep = () => {
		
			if (reminderShow == false && reportSystem <= 2) {
				setReportSystem(reportSystem == 0)         
			} else{
				setReportSystem(reportSystem - 1)
			}
	}
	
	const handleReportStartClick = () => {
			disableReminder ? setReportSystem(2) : setReportSystem(1)
  }
  
  const handleReportTabClick = () => {
    if (reportSystem > 0) {
      setReportSystem(0)
      setTab(0)
    } else {
      setTab(0)
    }
    // TODO: need to figure out how to save the report progress 
    // if a user clicks a link in the nav.
  }
	useEffect(() => {
    getDoc(doc(db, "mobileUsers", user.accountId)).then((mobileRef) => {
      setUserData(mobileRef.data())
      if (mobileRef.data()?.state == null) {
        setLocationModal(true)
      }
    })
		auth.currentUser.getIdTokenResult()
			.then((idTokenResult) => {

				if (!!idTokenResult.claims.admin) {
					setCustomClaims({admin: true})
				} else if (!!idTokenResult.claims.agency) {
					setCustomClaims({agency: true})
				} 
			})
			.catch((error) => {
				console.log(error);
			})
	}, [])
	

  useEffect(()=> {
    if (!locationModal) {
      getDoc(doc(db, "mobileUsers", user.accountId)).then((mobileRef) => {
        setUserData(mobileRef.data())
        if (mobileRef.data()?.state == null) {
          setLocationModal(true)
        } else {
          setLocationModal(false)
        }
      })
    }
  }, [locationModal])
	// //
	// Styles
	// //
  const style = {
		button: 'w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline',
		pageContainer: 'md:h-full w-full md:pt-4',
		container: 'pl-2 sm:pl-12',
		wrapper: 'w-full h-full flex flex-col py-5',
		content: 'w-full md:h-full flex flex-col px-3 md:px-12 py-5 md:py-0 mb-5 overflow-y-auto'
	}

  return (
		<div className={style.pageContainer}>
			<Navbar tab={tab} setTab={setTab} onReportTabClick={handleReportTabClick} reportSystem={reportSystem} />
			<div className={style.container}>
				<div className={style.wrapper}>
					<Headbar  />
					<div className={style.content}>
						{ tab == 0 && reportSystem == 0 && 
						<ReportLanding 
							onReportStartClick={handleReportStartClick}
							reportSystem={reportSystem} 
							setReportSystem={setReportSystem} 
							setReminderShow={setReminderShow}
							reminderShow={reminderShow} 
							reportView={reportView} 
							setReportView={setReportView} 
							onChangeCheckbox={handleChangeCheckbox}
							onReminderStart={handleReminderStart}
							onReportSystemPrevStep={handleReportSystemPrevStep}
							disableReminder={disableReminder}
							/> }
						{tab == 0 && reportSystem >= 0 && 
						<ReportSystem 
							reportSystem={reportSystem} 
							setReportSystem={setReportSystem}
							setReminderShow={setReminderShow} 
							onChangeCheckbox={handleChangeCheckbox}
							onReminderStart={handleReminderStart}
							onReportSystemPrevStep={handleReportSystemPrevStep}
							disableReminder={disableReminder}
							reminderShow={reminderShow} 
							/> }
						{tab == 1 && <Profile />}
						{locationModal && (<LocationModal setLocationModal = {setLocationModal}/> )}
					</div>
				</div>
			</div>
		</div>
	)
}

export default Report



/* Allows us to retrieve the json files from the pubic folder so that we can translate on the component pages*/
export async function getStaticProps(context) {
  // extract the locale identifier from the URL
  const { locale } = context

  return {
    props: {
      // pass the translation props to the page component
      ...(await serverSideTranslations(locale, ['Home', 'Report', 'NewReport', 'Profile', 'Navbar'])),
    },
  }
}