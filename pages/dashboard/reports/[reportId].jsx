import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getDoc, getDocs, doc, setDoc, collection, updateDoc } from "firebase/firestore";
import { db } from '../../../config/firebase'
import { RiMessage2Fill } from 'react-icons/ri'
import { BiEditAlt } from 'react-icons/bi'
import { AiOutlineFieldTime } from 'react-icons/ai'
import Image from 'next/image';


const ReportDetails = () => {
  const userId = localStorage.getItem("userId")
  const router = useRouter()
  const [info, setInfo] = useState({})
  const [reporterInfo, setReporterInfo] = useState({})
  const [postedDate, setPostedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [update, setUpdate] = useState("")
  const [activeLabels, setActiveLabels] = useState([])

  const { reportId } = router.query
  const headerStyle = "text-lg font-bold text-black tracking-wider mb-4"
  const linkStyle = "font-light mb-1 text-sm underline underline-offset-1"

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
    e.preventDefault()
    const docRef = doc(db, 'reports', reportId)
    await updateDoc(docRef, { label: e.target.value })
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
  }, [info])

  return (
    <div class="p-16">
      <div class="text-2xl font-bold text-blue-600 tracking-wider mb-8">More Information</div>
      <div class="grid grid-cols-2 gap-24">
        <div class="left-side">
          <div class="mb-2">
            <div class={headerStyle}>Title</div>
            <div class="text-sm bg-white rounded-xl p-4">{info['title'] || <span class="italic text-gray-400">No Title</span>}</div>
          </div>
          { reporterInfo &&
          <div class="text-sm mb-6 font-light text-right">
            <div>
              <span class="font-semibold">Reported by:</span> {reporterInfo['name']} (<a target="_blank" class="text-blue-600 hover:underline" href={"mailto:" + reporterInfo['email']}>{reporterInfo['email']}</a>)
            </div>
          </div>}
          <div class="mb-8">
            <div class={headerStyle}>Label</div>
            <select id="labels" onChange={(e) => handleLabelChanged(e)} defaultValue="default" class="text-sm inline-block px-8 border-none bg-yellow-400 py-1 rounded-2xl">
              <option value="none">Choose a label</option>
              {activeLabels.map((label) => {
                return (<option value={label}>{label}</option>)
                })
              }
            </select>
          </div>
          <div class="flex flex-col mb-5">
            <div class="flex flex-row mb-3 items-center">
              <RiMessage2Fill size={20} />
              <div class="font-semibold px-2 self-center pr-4">Tag</div>
              <div class="text-md font-light">{info['topic']}</div>
            </div>
            <div class="flex flex-row mb-3 items-center">
              <BiEditAlt size={20} />
              <div class="font-semibold px-2 self-center pr-4">Sources / Media</div>
              <div class="text-md font-light">{info['hearFrom']}</div>
            </div>
            <div class="flex flex-row mb-3 items-center">
              <AiOutlineFieldTime size={20} />
              <div class="font-semibold px-2 self-center pr-4">Date / Time</div>
              <div class="text-md font-light">{postedDate}</div>
            </div>
          </div>
          <div class="mb-8">
            <div class={headerStyle}>Link Of The Information</div>
            <div class="flex flex-col">
              {info['link'] && <a class={linkStyle} href={info['link']}>{info['link']}</a>}
              {info['secondLink'] && <a class={linkStyle} href={info['secondLink']}>{info['secondLink']}</a>}
              {info['thirdLink'] && <a class={linkStyle} href={info['thirdLink']}>{info['thirdLink']}</a>}
            </div>
          </div>
          <div>
            <div class={headerStyle}>Description</div>
            <div class="font-light overflow-auto max-h-32">{info['detail']}</div>
          </div>
        </div>
        <div class="right-side">
          <div>
            <div class={headerStyle}>Newsroom's Notes</div>
            <textarea
              id="notes"
              onChange={handleNotesChange}
              placeholder="No notes yet..."
              class="border transition ease-in-out w-full text-md font-light bg-white rounded-xl p-4 border-none
              focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none resize-none mb-12"
              rows="4"
              defaultValue={info['note']}
              >
            </textarea>
            {update &&
            <div class="-mt-8 flex float-right mb-6">
              <button onClick={revertBack}
                class="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline">Cancel</button>
              <button onClick={saveChanges}
                class="bg-white hover:bg-blue-500 hover:text-white text-sm text-blue-500 font-bold ml-4 py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">Save Changes</button>
            </div>}
          </div>
          <div class="w-full">
            <div class={headerStyle}>Images</div>
            {info['images'] && info['images'][0] ?
              <div class="flex w-full overflow-y-auto">
                {info['images'].map((image) => {
                  return (
                    <div class="flex px-1">
                      <img src={image} width={150} height={150} alt="image"/>
                    </div>
                  )
                })}
              </div> :
              <div class="italic font-light">No images for this report</div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportDetails