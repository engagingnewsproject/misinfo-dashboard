import React, { useState, useEffect } from 'react'
import TagSystem from './TagSystem';
import { useAuth } from '../context/AuthContext'
import globalStyles from '../styles/globalStyles';
export const tagSystems = ['default', 'Topic', 'Source', 'Labels'];

const Settings = () => {
  const [openModal, setOpenModal] = useState(false)
  const [tagSystem, setTagSystem] = useState(0)
  const {customClaims} = useAuth()

  return (
    <div>
      {tagSystem == 0 ?
      <div className="z-0 flex-col p-16">
        <div className={globalStyles.heading.h1}>Tagging Systems</div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Topic Tags</div>
            <button
                onClick={() => setTagSystem(1)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {customClaims.admin ? `View ` : `Edit `}Topics
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Source Tags</div>
            <button
                onClick={() => setTagSystem(2)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {customClaims.admin ? `View ` : `Edit `}Sources
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Customized Labels</div>
            <button
                onClick={() => setTagSystem(3)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {customClaims.admin ? `View ` : `Edit `}Labels
            </button>
        </div>
      </div> :
        <TagSystem tagSystem={tagSystem} setTagSystem={setTagSystem} />}
      {/* TODO: add "custom tags section for approval" */}
    </div>

  )
}

export default Settings