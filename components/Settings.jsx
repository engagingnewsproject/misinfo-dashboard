import React, { useState, useEffect } from 'react'
import TagSystem from './TagSystem';

export const tagSystems = ['default', 'Topic', 'Source', 'Labels'];

const Settings = ({customClaims}) => {

  const [openModal, setOpenModal] = useState(false)
  const [tagSystem, setTagSystem] = useState(0)

  return (
    <div>
      {tagSystem == 0 ?
      <div className="z-0 flex-col p-16">
        <div className="text-xl font-extrabold text-blue-600 tracking-wider">Tagging Systems</div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Topic Tags</div>
            <button
                onClick={() => setTagSystem(1)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {!customClaims == 'admin' ? `Edit ` : `View `}Topics
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Source Tags</div>
            <button
                onClick={() => setTagSystem(2)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {!customClaims == 'admin' ? `Edit ` : `View `}Sources
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Customized Labels</div>
            <button
                onClick={() => setTagSystem(3)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {!customClaims == 'admin' ? `Edit ` : `View `}Labels
            </button>
        </div>
      </div> :
      <TagSystem tagSystem={tagSystem} setTagSystem={setTagSystem} customClaims={customClaims} />}
    </div>

  )
}

export default Settings