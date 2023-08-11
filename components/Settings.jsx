import React, { useState, useEffect } from 'react'
import TagSystem from './TagSystem';

export const tagSystems = ['default', 'Topic', 'Source', 'Labels'];

const Settings = ({customClaims}) => {

  const [openModal, setOpenModal] = useState(false)
  const [tagSystem, setTagSystem] = useState(0)
  console.log(customClaims);
  return (
    <div>
    {!customClaims.admin ?
      <div>
        {tagSystem == 0 ?
          <div className="z-0 flex-col p-16">
            <div className="text-xl font-extrabold text-blue-600 tracking-wider">Tagging Systems</div>
            <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
                <div className="font-light">Topic Tags</div>
                <button
                    onClick={() => setTagSystem(1)}
                    className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                    Edit Topics
                </button>
            </div>
            <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
                <div className="font-light">Source Tags</div>
                <button
                    onClick={() => setTagSystem(2)}
                    className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                    Edit Sources
                </button>
            </div>
            <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
                <div className="font-light">Customized Labels</div>
                <button
                    onClick={() => setTagSystem(3)}
                    className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                    Edit Labels
                </button>
            </div>
          </div> :
          <TagSystem tagSystem={tagSystem} setTagSystem={setTagSystem} />
        }
      </div>
    :
    <div className='p-16'>Admin list of tags & sources</div> // TODO: add list of tags and sources
    }
    </div>
  )
}

export default Settings