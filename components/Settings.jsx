import React, { useState, useEffect } from 'react'
import TagSystem from './TagSystem';

export const tagSystems = ['default', 'Topic', 'Source', 'Labels'];

const Settings = () => {

  const [openModal, setOpenModal] = useState(false)
  const [tagSystem, setTagSystem] = useState(0)

  return (
    <div class="w-full h-auto">
      {tagSystem == 0 ?
      <div class="z-0 flex-col p-16">
        <div class="text-xl font-extrabold text-blue-600 tracking-wider">Settings</div>
        <div class="mx-6 my-6 text-lg font-semibold tracking-normal">Tagging Systems</div>
        <div class="flex justify-between mx-12 my-6 tracking-normal items-center">
            <div class="font-light">Topic Tags</div>
            <button
                onClick={() => setTagSystem(1)}
                class="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Topics
            </button>
        </div>
        <div class="flex justify-between mx-12 my-6 tracking-normal items-center">
            <div class="font-light">Source Tags</div>
            <button
                onClick={() => setTagSystem(2)}
                class="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Sources
            </button>
        </div>
        <div class="flex justify-between mx-12 my-6 tracking-normal items-center">
            <div class="font-light">Customized Labels</div>
            <button
                onClick={() => setTagSystem(3)}
                class="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Labels
            </button>
        </div>
      </div> :
      <TagSystem tagSystem={tagSystem} setTagSystem={setTagSystem} />}
    </div>

  )
}

export default Settings