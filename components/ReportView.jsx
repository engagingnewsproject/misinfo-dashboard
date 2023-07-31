import React, { useState, useEffect, useRef } from 'react'
import { reportSystems } from './SettingsReport';
import { getDoc, doc } from "firebase/firestore"; 
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import Link from "next/link"
import Image from 'next/image'

const ReportView = ({ reportView, setReportView, reportSystem, setReportSystem, reportId, setReportId }) => {
	const { user } = useAuth()
	const [data, setData] = useState([])
	const imgPicker = useRef(null)
	const [images, setImages] = useState([])
	const [link, setLink] = useState("")
	const [secondLink, setSecondLink] = useState("")
	const [imageURLs, setImageURLs] = useState([]);
	const [detail, setDetail] = useState("")
	
    // //
    // Text content
    // //
    const t = {
        reminderTitle: "Reminder",
        reminderDescription:
            "This system is only for reports of possible fake information at the local or state level.",
        reminderExample: "Example:",
        reminderCorrect: "Flight prices sky-high in Austin.",
        reminderIncorrect: "US officially marks 1 million American deaths from Covid.",
        reminderStart: "Start",
        reminderNoShow: "Do not show this again.",
        locationTitle: "Where are you located?",
        sourceTitle: 'Where did you see the potential misinformation?',
        share: "Share more information",
        title: "Title *",
        titleDescription: "Please provide a title for the potential misinformation",
        max: "(Max: 160 characters.)",
        detail: "Details *",
        detailDescription:
            "Please share as much as you can. We need at least one of the following: a link, a photo, or a detailed description.",
        link: "Links",
        image: "Image Upload",
        imageDescription:
            "You can upload screenshots or photos of the potential misinformation",
        uploadImage: "Upload Images",
        detailed: "Detailed Description",
        detailedDescription:
            "Please provide more details about the potential misinformation, such as where you saw it and what it said.",
        describe: "Describe in detail",
        submit: "Submit",
        titleRequired:"Title is required",
        alertTitle:"Alert",
        atLeast:"We need at least one of the following: a link, a photo, or a detailed description.",
        thanksTitle: 'Thank you',
        thanksText: "We investigate as many reports as possible, although we aren't always able to get to everything. When we're able, we'd love to share the results of our investigation.",
        thanksView:"View my Report",
        viewReportTitle: 'Title',
        viewReportLinks: 'Links',
        viewReportImage: 'Image Upload',
        viewReportDetails: 'Detail Description',
        viewReportButton: 'Back to All Reports'
    }
    
    // //
    // Styles
    // //
    const style = {
        sectionContainer: 'w-full h-full flex flex-col px-3 md:px-12 py-5 mb-5 overflow-visible',
        sectionWrapper: 'flex items-center',
        sectionH1: 'text-2xl font-bold',
        sectionH2: 'text-blue-600',
        sectionSub: 'text-sm',
        form: 'flex w-96 h-full justify-center',
        viewWrapper: 'flex flex-col gap-2 mt-8',
        inputSelect: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
        inputSingle: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline',
        inputCheckboxWrap: 'flex',
        inputRadio: 'bg-blue-600 flex rounded-lg p-2 text-white justify-center checked:bg-blue-500',
        inputRadioChecked: 'bg-blue-800 flex rounded-lg p-2 text-white justify-center checked:bg-blue-500',
        inputImage: 'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
        inputTextarea: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
        button: 'w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
    }
		
		// //
    // Data
    // //
    const getData = async() => {
			const docRef = doc(db, 'reports', reportId)
			const docSnap = await getDoc(docRef);
			if (docSnap.exists()) {
				console.log("Document data:", docSnap.data());
				setData(docSnap.data())
			} else {
				// docSnap.data() will be undefined in this case
				console.log("No such document!");
			}
    }

    // On page load (mount), update the tags from firebase
    useEffect(() => {
        getData()
        // getAllTopics() TODO get all topics & sources
        // getAllSources()
    }, [])
	return (
		<>
		<div className={style.viewWrapper}>
			{/* Title */}
			<div className={style.inputSingle}>
					<div className={style.sectionH2}>
							{t.viewReportTitle}
					</div>
					{/* TODO finish adding all data + a back to reports list button */}
					{data.title} 
			</div>
			{/* Links */}
			<div className={style.inputSingle}>
					<div className={style.sectionH2}>
							{t.viewReportLinks}
					</div>
					{link !== '' && 
							<div>
							{link}
							</div>
					}
					{secondLink !== '' && 
							<div>
							{secondLink}
							</div>
					}
			</div>
			{/* Image upload */}
			<div className={style.inputSingle}>
					<div className={style.sectionH2}>
							{t.viewReportImage}
					</div>
							<div className="flex w-full overflow-y-auto">
									{imageURLs.map((image, i) => {
											console.log(image)
											return (
													<div className="flex mr-2" key={i}>
															<Link href={image} target="_blank">
																	<Image src={image} width={100} height={100} alt="image"/>
															</Link>
													</div>
											)
									})}
							</div>
			</div>
				{/* Details */}
				<div className={style.inputSingle}>
						<div className={style.sectionH2}>
								{t.viewReportDetails}
						</div>
						{detail}
				</div>
			</div>
			<button onClick={() => setReportView(0)}>Back to Report List</button>
		</>
	)
}

export default ReportView