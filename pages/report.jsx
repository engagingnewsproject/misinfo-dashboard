import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../context/AuthContext"
import { auth } from "../config/firebase"
// Components
import Navbar from "../components/Navbar"
import Headbar from "../components/Headbar"
import ReportLanding from "../components/ReportLanding"
import ReportSystem from "../components/ReportSystem"
import Profile from "../components/Profile"

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
		setTab(0) // TODO: need to force this 
		}
  
	useEffect(() => {
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
	
	// //
	// Styles
	// //
  const style = {
		button: 'w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline',
		pageContainer: 'h-full w-full pt-4',
		container: 'md:pl-12 lg:pl-2 h-auto',
		wrapper: 'wrapper w-full h-full flex flex-col py-4 px-5 lg:px-20 mb-5 sm:pl-20 md:pl-12 lg:overflow-visible'
	}

  return (
		<div className={style.pageContainer}>
			<Navbar tab={tab} setTab={setTab} onReportTabClick={handleReportTabClick}/>
			<div className={style.container}>
				<Headbar  />
				<div className={style.wrapper}>
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
					{tab == 0 && reportSystem > 0 && 
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
      ...(await serverSideTranslations(locale, ['Home', 'Report', 'NewReport', "Profile"])),
    },
  }
}