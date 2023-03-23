import React, { useState } from 'react'
import { RiDeleteBin2Fill } from 'react-icons/ri'
import { BiLogOut } from 'react-icons/bi'

const ConfirmModal = ({ func, title, subtitle, CTA, closeModal }) => {
    return (
        <div>
            <div class="flex justify-center items-center z-10 absolute top-0 left-0 w-full h-full bg-black opacity-60">
            </div>
            <div 
            class="flex justify-center items-center z-20 absolute top-0 left-0 w-full h-full"
            onClick={() => closeModal(false)}>
                <div 
                class="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10"
                onClick={(e) => {
                    e.stopPropagation()
                }}>
                    <div class="grid justify-items-center mb-4">
                        {CTA == "Delete" && <RiDeleteBin2Fill class="text-blue-500" size={30}/>}
                        {CTA == "Log out" && <BiLogOut class="text-blue-500" size={30}/>}
                        <div class="flex-col mt-3 mb-2 text-center tracking-wide">
                            <div class="text-lg text-blue-500 font-bold my-2">{title}</div>
                            <div class="text-xs font-light">{subtitle}</div>
                        </div>
                    </div>
                    <form onSubmit={(e) => func(e)}>
                        <div class="mt-6 flex justify-between">
                            <button
                                onClick={() => closeModal(false)}
                                class="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline">
                                Cancel
                            </button>
                            <button
                                class="bg-white hover:bg-blue-500 hover:text-white text-sm text-blue-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">
                                {CTA}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal