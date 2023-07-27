import React, { useState, useEffect } from 'react'
import { reportSystems } from './SettingsReport'
import NewTagModal from './modals/NewTagModal'
import RenameTagModal from './modals/RenameTagModal'
import ConfirmModal from './modals/ConfirmModal'
import { IoMdArrowRoundBack } from 'react-icons/io'
import { BiCheckCircle, BiXCircle } from "react-icons/bi";
import { MdModeEditOutline } from 'react-icons/md'
import { TiDelete } from 'react-icons/ti'
import { IoIosRadioButtonOn } from 'react-icons/io'
import { setDoc, getDoc, doc } from "firebase/firestore"; 
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import Image from 'next/image'

const maxTags = [0, 7, 10, 7] // default, Topic, Source, Labels (respectively)

const setData = async(reportSystem, list, user) => {
    const docRef = await getDoc(doc(db, "reports", user.uid))
    const updatedDocRef = await setDoc(doc(db, "reports", user.uid), {
        ...docRef.data(),
        [reportSystems[reportSystem]]: {
            list: list,
        }
    });
    return updatedDocRef
}

const ReportSystem = ({ reportSystem, setReportSystem }) => {
    const [list, setList] = useState([])
    const { user } = useAuth()
    const [selected, setSelected] = useState("")
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // //
    // Text content
    // //
    const text = {
        reminder: "Reminder",
        description:
            "This system is only for reports of possible fake information at the local or state level.",
        example: "Example:",
        correct: "Flight prices sky-high in Austin.",
        incorrect: "US officially marks 1 million American deaths from Covid.",
        start: "Start",
        noShow: "Do not show this again.",
    }
    
    // //
    // Dont show again
    // //
    const handleDontShowAgain = () => {
        setDontShowAgain(!dontShowAgain)
    }
    // On page load (mount), update the tags from firebase
    useEffect(() => {
        getData()
    }, [])

    const getData = async() => {
    console.log(user.uid);
        const docRef = await getDoc(doc(db, "reports", user.uid))
        console.log(docRef)
        try {
            const { [reportSystems[reportSystem]]: reportsData } = docRef.data()
            setList(reportsData.list)
        } catch (error) {
            setData(reportSystem, list, user)
            console.log(error)
        }
    }

    return (
        <div className="z-0 flex-col p-4 sm:p-16 h-full" onClick={(e) => {
            if (e.target == e.currentTarget) {
                setSearchResult([])
                setSelected("")
            }
            }}>
            <div className="flex items-center">
                <button onClick={() => setReportSystem(0)}>
                    <IoMdArrowRoundBack size={25} />
                </button>
            </div>
            <div className='flex flex-col gap-2 items-center'>
                <Image src="/img/reminder.png" width={156} height={120} alt="reminder"/>
                <div className="text-xl px-5 font-extrabold text-blue-600 tracking-wider">
                    {reportSystem == 1 ? text.reminder : reportSystems[reportSystem] + " Tags"}
                    {/* {reportSystem == 1 ? "Reminder " + reportSystems[reportSystem] : reportSystems[reportSystem] + " Tags"} */}
                </div>
                <div>{text.description}</div>
                <div>{text.example}</div>
                <div className='flex flex-col gap-2'>
                    <div className='flex gap-3'>
                        <BiCheckCircle size={25} color='green' />
                        {text.correct}
                    </div>
                    <div className='flex gap-3'>
                        <BiXCircle size={25} color='red' />
                        {text.incorrect}
                    </div>
                    <button className="w-80 self-center mt-4 shadow bg-blue-600 hover:bg-gray-100 text-sm text-white py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline" type="submit">
                        <div className="px-2 font-normal tracking-wide">{text.start}</div>
                    </button>
                    <div className='flex items-center justify-center gap-2'>
                        <input 
                        onChange={handleDontShowAgain} 
                        checked={dontShowAgain}
                        type="checkbox" id="noShow" name="noShow" />
                        <label for="noShow">{text.noShow}</label>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReportSystem