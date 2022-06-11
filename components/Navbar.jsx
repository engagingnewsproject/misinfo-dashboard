import React from 'react'
import { MdHomeFilled } from 'react-icons/md';
import { CgProfile } from 'react-icons/cg'
import { IoSettingsSharp } from 'react-icons/io5'

const Navbar = ({tab, setTab}) => {

    const basicStyle = "flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"

    return (
        <div class="flex-col justify-center items-center w-16 bg-white h-full">
            <div class="flex-col justify-center py-8 w-full">
                <button 
                    onClick={() => setTab(0)}
                    class={tab == 0 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                    <MdHomeFilled size={30}/>
                </button>
                <button
                    onClick={() => setTab(1)}
                    class={tab == 1 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                    <CgProfile size={30}/>
                </button>
                <button
                    onClick={() => setTab(2)}
                    class={tab == 2 ? basicStyle + " text-indigo-500 bg-indigo-100" : basicStyle}>
                    <IoSettingsSharp size={30}/>
                </button>
            </div>
        </div>
    )
}

export default Navbar