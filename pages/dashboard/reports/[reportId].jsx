import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getDoc, getDocs, doc } from "firebase/firestore";
import { db } from '../../../config/firebase'

const ReportDetails = () => {
  const router = useRouter()
  const [info, setInfo] = useState({})
  const { reportId } = router.query
  const headerStyle = "text-lg font-bold text-black tracking-wider mb-4"

  const getData = async () => {
    const userId = localStorage.getItem("userId")
    const docRef = await getDoc(doc(db, userId, "data/reports/" + reportId))
    setInfo(docRef.data())
  }

  useEffect(() => {
    getData()
  }, [])


  return (
    <div class="p-16">
      <div class="text-2xl font-bold text-blue-600 tracking-wider mb-8">More Information</div>
      <div class="grid grid-cols-2 gap-24">
        <div class="left-side">
          <div class={headerStyle}>Title</div>
          <div class="text-sm bg-white rounded-xl p-4 mb-6">{info['title']}</div>
          <div class={headerStyle}>Label</div>
          <div class="text-sm inline-block px-5 bg-yellow-400 py-1 rounded-2xl mb-8">{info['Labels']}</div>
        </div>
        <div class="right-side">
          <div class="text-lg font-bold text-black tracking-wider">Newsroom's Notes</div>
        </div>

      </div>
    </div>
  )
}

export default ReportDetails