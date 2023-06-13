import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getDoc, getDocs, doc, setDoc, collection, updateDoc } from "firebase/firestore";
import { db } from '../../../config/firebase'
import { RiMessage2Fill } from 'react-icons/ri'
import { BiEditAlt } from 'react-icons/bi'
import { IoReturnUpBackSharp } from 'react-icons/io5'
import { BsShareFill } from 'react-icons/bs'
import { AiOutlineFieldTime } from 'react-icons/ai'
import SwitchRead from "../../../components/SwitchRead"
import Link from "next/link"
import Image from 'next/image';

const ReportDetails = () => {
	const userId = localStorage.getItem("userId")
	const router = useRouter()
	const [info, setInfo] = useState({})
	const [reporterInfo, setReporterInfo] = useState({})
	const [postedDate, setPostedDate] = useState("")
	const [selectedLabel, setSelectedLabel] = useState("")
	const [changeStatus, setChangeStatus] = useState("")
	const [update, setUpdate] = useState("")
	const [activeLabels, setActiveLabels] = useState([])

	const { reportId } = router.query
	const headerStyle = "text-lg font-bold text-black tracking-wider mb-4"
	const linkStyle = "font-light mb-1 text-sm underline underline-offset-1"

  // console.log('current URL 👉️', window.location.href);

	const getData = async () => {
    const infoRef = await getDoc(doc(db, "reports",  reportId))
		setInfo(infoRef.data())
    getDoc(doc(db, "mobileUsers", infoRef.data()['userID'])).then((mobileRef) => setReporterInfo(mobileRef.data()))

		const tagsRef = await getDoc(doc(db, "tags", userId))
    setActiveLabels(tagsRef.data()['Labels']['active'])
	}

	const handleNotesChange = (e) => {
    if (e.target.value != info['note']) {
			setUpdate(e.target.value)
		} else {
			setUpdate("")
		}
	}

	const revertBack = () => {
    if (info['note']) {
      document.getElementById('notes').value = info['note']
		} else {
      document.getElementById('notes').value = ""
		}
		setUpdate("")
	}

	const saveChanges = async () => {
    const docRef = doc(db, 'reports', reportId)
    const res = await updateDoc(docRef, { note: document.getElementById('notes').value})
    info['note'] = document.getElementById('notes').value
		setUpdate("")
	}

	const handleLabelChanged = async (e) => {
		setChangeStatus("Saving changes...")
		e.preventDefault()
    const docRef = doc(db, 'reports', reportId)
		await updateDoc(docRef, { label: e.target.value })
		setChangeStatus("Label changes saved successfully")
	}

	useEffect(() => {
		getData()
    if (info['createdDate']) {
      const options = { day: '2-digit', year: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }
      setPostedDate(info["createdDate"].toDate().toLocaleString('en-US', options).replace(/,/g,"").replace('at', ''))
		}
	}, [])

	useEffect(() => {
    if (info['createdDate']) {
      const options = { day: '2-digit', year: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric' }
      setPostedDate(info["createdDate"].toDate().toLocaleString('en-US', options).replace(/,/g,"").replace('at', ''))
			}
    if (info['label']) {
      setSelectedLabel(info['label'])
		}
	}, [info])

	function SendLinkByMail(href) {
    var subject= "Misinformation Report";
    var body = "Link to report:\r\n";
    body += window.location.href;
    var uri = "mailto:?subject=";
    uri += encodeURIComponent(subject);
    uri += "&body=";
    uri += encodeURIComponent(body);
    window.open(uri);
	}
	
	return (
		<div className="p-16">
			<div className="flex justify-between w-full mb-5">
				<div className="text-2xl font-bold text-blue-600 tracking-wider mb-8">
				{/* Temp link back to Dashboard for testing */}
					More Information
				</div>
				<div>
					<Link href={'/dashboard'} className="flex flex-row mb-3 items-center">
						<IoReturnUpBackSharp size={20} />
						<div className="font-semibold px-2 self-center pr-4">
							Return to Dashboard
						</div>
					</Link>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-24">
				<div className="left-side">
					<div className="mb-2">
						<div className={headerStyle}>Title</div>
            <div className="text-sm bg-white rounded-xl p-4">{info['title'] || <span className="italic text-gray-400">No Title</span>}</div>
						</div>
          { reporterInfo &&
						<div className="text-md mb-4 font-light text-right">
							<div>
              <span className="font-semibold">Reported by:</span> {reporterInfo['name']} (<a target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" href={"mailto:" + reporterInfo['email']}>{reporterInfo['email']}</a>)
							</div>
          </div>}
					<div className="mb-8">
						<div className={headerStyle}>Label</div>
            <select id="labels" onChange={(e) => handleLabelChanged(e)} defaultValue={selectedLabel} className="text-sm inline-block px-8 border-none bg-yellow-400 py-1 rounded-2xl shadow hover:shadow-none">
              <option value={selectedLabel ? selectedLabel : "none"}>{selectedLabel ? selectedLabel : 'Choose a label'}</option>
              {activeLabels.filter(label => label != selectedLabel).map((label) => {
                return (<option value={label}>{label}</option>)
                })
              }
						</select>
            {changeStatus && <span className="ml-5 font-light text-sm italic">{changeStatus}</span>}
					</div>
					<div className="flex flex-col mb-5">
						<div className="flex flex-row mb-3 items-center">
							<RiMessage2Fill size={20} />
							<div className="font-semibold px-2 self-center pr-4">Tag</div>
              <div className="text-md font-light">{info['topic']}</div>
						</div>
						<div className="flex flex-row mb-3 items-center">
							<BiEditAlt size={20} />
              <div className="font-semibold px-2 self-center pr-4">Sources / Media</div>
              <div className="text-md font-light">{info['hearFrom']}</div>
						</div>
						<div className="flex flex-row mb-3 items-center">
							<AiOutlineFieldTime size={20} />
              <div className="font-semibold px-2 self-center pr-4">Date / Time</div>
							<div className="text-md font-light">{postedDate}</div>
						</div>
						<div className="flex flex-row mb-3 items-center">
							<SwitchRead setReportModalId={reportId}/>
						</div>
					</div>
					<div className="mb-8">
						<div className={headerStyle}>Link to the Information</div>
						<div className="flex flex-col">
              {info['link'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + info['link']}>{info['link']}</a>}
              {info['secondLink'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + info['secondLink']}>{info['secondLink']}</a>}
              {info['thirdLink'] && <a className={linkStyle} target="_blank" rel="noreferrer" href={"//" + info['thirdLink']}>{info['thirdLink']}</a>}
						</div>
					</div>
					<div>
						<div className={headerStyle}>Description</div>
            <div className="font-light overflow-auto max-h-32">{info['detail']}</div>
					</div>
				</div>
				<div className="right-side">
					<div>
						<div className={headerStyle}>Newsroom's Notes</div>
						<textarea
							id="notes"
							onChange={handleNotesChange}
							placeholder="No notes yet..."
							className="border transition ease-in-out w-full text-md font-light bg-white rounded-xl p-4 border-none
              focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none resize-none mb-12"
							rows="4"
              defaultValue={info['note']}
              >
            </textarea>
            {update &&
							<div className="-mt-8 flex float-right mb-6">
              <button onClick={revertBack}
                className="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline">Cancel</button>
              <button onClick={saveChanges}
                className="bg-white hover:bg-blue-500 hover:text-white text-sm text-blue-500 font-bold ml-4 py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">Save Changes</button>
            </div>}
					</div>
					<div className="w-full mb-12">
						<div className={headerStyle}>Images</div>
            {info['images'] && info['images'][0] ?
							<div className="flex">
                {info['images'].map((image) => {
									return (
										<div className="mr-2">
                      <Image src={image} alt="image" width={200} height={200} />
										</div>
									)
								})}
              </div> :
							<div className="italic font-light">No images for this report</div>
            }
					</div>
					<div className="mb-8">
						<button
							className="flex flex-row text-sm bg-white px-4 border-none text-black py-1 rounded-md shadow hover:shadow-none" onClick={SendLinkByMail}> 
							<BsShareFill className="my-1" size = {15}/> 
							<div className="px-3 py-1">Share The Report</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ReportDetails