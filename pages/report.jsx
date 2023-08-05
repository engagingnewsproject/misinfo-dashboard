import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../context/AuthContext"
import { auth } from "../config/firebase"
import Image from 'next/image'
// Components
import Navbar from "../components/Navbar"
import ReportLanding from "../components/ReportLanding"
import ReportSystem from "../components/ReportSystem"
import ReportList from "../components/ReportList"
import ReportView from "../components/ReportView"
import Profile from "../components/Profile"
// Icons
export const reportSystems = ['Report History', 'Reminder', 'Location', 'What', 'Where', 'Detail', 'Thank You'];
const Report = () => {
	const { user } = useAuth()
	const router = useRouter()
	const [customClaims, setCustomClaims] = useState({admin: false, agency: false})
	const [reportSystem, setReportSystem] = useState(0)
	const [reportView, setReportView] = useState(0)
	const [tab, setTab] = useState(0)
	
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
		button: 'w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
  }
	console.log(reportView);
  return (
		<div className="h-full w-full">
			<Navbar tab={tab} setTab={setTab} customClaims={customClaims} setCustomClaims={setCustomClaims} />
			<div className="pl-2 sm:pl-12">
				<div className="w-full h-full flex flex-col py-5">
					<div className="w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-y-auto">
						{reportSystem == 0 && <ReportLanding reportSystem={reportSystem} setReportSystem={setReportSystem} reportView={reportView} setReportView={setReportView} />}
						<ReportSystem reportSystem={reportSystem} setReportSystem={setReportSystem} />
					</div>
				</div>
				{ tab == 1 && <Profile />}
			</div>
			
		</div>
	)
}

export default Report