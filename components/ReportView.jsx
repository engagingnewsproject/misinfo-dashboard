import React,{ useState,useEffect,useRef } from 'react'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { doc, onSnapshot } from "firebase/firestore"
import { db } from '../config/firebase'
import Image from 'next/image'
import {  useTranslation } from 'next-i18next'

const ReportView = ({ reportView,setReportView,reportSystem,setReportSystem,reportId,setReportId }) => {
	const [data, setData ] = useState([])
  const {t} = useTranslation("NewReport")

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

	// //
	// Styles
	// //
	const style = {
		sectionWrapper: 'flex items-center',
		sectionH2: 'text-blue-600 mb-2',
		viewWrapper: 'flex flex-col gap-2 mt-2',
		inputSingle: 'border-gray-300 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline',
		buttonBack: 'hover:-translate-x-1 transition-transform'
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
					<button onClick={() => setReportView(0)} className={style.buttonBack}>
						<IoMdArrowRoundBack size={25} />
					</button>
				</div>
				{/* Title */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t('title_text')}
					</div>
					{/* TODO finish adding all data + a back to reports list button */}
					{data['title']}
				</div>
				{/* Links */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t('links')}
					</div>
					{ data['link'] !== '' && <div>{data['link']}</div> }
					{ data['secondLink'] !== '' && <div>{data['secondLink']}</div> }
				</div>
				{data['images'] && data['images'][0] ?
					<div className={style.inputSingle}>
						<div className='grid grid-cols-4 gap-4'>
							<div className='col-span-full'>
								<div className={style.sectionH2}>
									{t('image_text')}
								</div>
							</div>
							{data['images'].map((image, i) => {
								return (
									<div className="grid-cols-subgrid" key={i}>
										<Image src={image} alt="image" width={200} height={200} className='object-cover w-auto'/>
									</div>
								)
							})}
						</div>
					</div> :
					<div className={style.inputSingle}>{t('noImages')}</div>
				}
				{/* Details */}
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t('details')}
					</div>
					{data['detail'] ? data['detail'] : t('noDescription')}
				</div>
				<div className={style.inputSingle}>
					<div className={style.sectionH2}>
						{t('location_text')}
					</div>
					{data['city']+`, `+data['state']}
				</div>
			</div>
		</>
	)
}

export default ReportView