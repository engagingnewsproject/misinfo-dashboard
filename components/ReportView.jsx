import React,{ useState,useEffect,useRef } from 'react'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { doc, onSnapshot } from "firebase/firestore"
import { db } from '../config/firebase'
import Image from 'next/image'

const ReportView = ({ reportView,setReportView,reportSystem,setReportSystem,reportId,setReportId }) => {
	const [data, setData ] = useState([])

	// //
	// Data
	// //
	const getData = async () => {
		const unsub = onSnapshot(doc(db, "reports", reportId), (doc) => {
				// console.log("Current data: ", doc.data());
				setData(doc.data())
		});
	}
	// On page load (mount), update the tags from firebase
	useEffect(() => {
		getData()
	},[])
	
	// //
	// Text content
	// //
	const t = {
		reportHeaderTitle: 'Title',
		reportHeaderLinks: 'Links',
		reportHeaderImages: 'Images',
		reportHeaderDetails: 'Detail Description',
		reportHeaderLocation: 'Location',
		reportHeaderDate: 'Date',
		buttonBack: 'Back to All Reports',
	}

	// //
	// Styles
	// //
	const style = {
		sectionWrapper: 'flex items-center',
		sectionH2: 'text-blue-600 mb-2',
		viewWrapper: 'flex flex-col gap-2 mt-8',
		inputSingle: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline',
	}
	
	// const myArray = Object.values(data);
	// const imageArr = data['images']
	// console.log(imageArr);
	// const hasValues = imageArr.length > 0 ? true : false;

	// console.log(hasValues); // Output: true

	return (
		<>
			<div className={style.viewWrapper}>
				<div className={style.sectionWrapper}>
					<button onClick={() => setReportView(0)}>
						<IoMdArrowRoundBack size={25} />
					</button>
				</div>
				{/* Title */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t.reportHeaderTitle}
					</div>
					{/* TODO finish adding all data + a back to reports list button */}
					{data['title']}
				</div>
				{/* Links */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t.reportHeaderLinks}
					</div>
					{ data['link'] !== '' && <div>{data['link']}</div> }
					{ data['secondLink'] !== '' && <div>{data['secondLink']}</div> }
				</div>
				{data['images'] && data['images'][0] ?
					<div className={style.inputSingle}>
						<div className={style.sectionH2}>
							{t.reportHeaderImages}
						</div>
						{data['images'].map((image, i) => {
						
							return (
								<div className="mr-2" key={i}>
									<Image src={image} alt="image" width={200} height={200} priority={true} />
								</div>
							)
						})}
					</div> :
					<div className={style.inputSingle}>No images for this report</div>
				}
				{/* Details */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t.reportHeaderDetails}
					</div>
					{data['detail'] ? data['detail'] : `No description provided.`}
				</div>
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t.reportHeaderLocation}
					</div>
					{data['city']+`, `+data['state']}
				</div>
			</div>
		</>
	)
}

export default ReportView