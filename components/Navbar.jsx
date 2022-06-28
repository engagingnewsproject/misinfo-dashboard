import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { MdHomeFilled } from 'react-icons/md';
import { CgProfile } from 'react-icons/cg'
import { IoSettingsSharp } from 'react-icons/io5'
import { BiLogOut } from 'react-icons/bi'
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './modals/ConfirmModal';

const Navbar = ({tab, setTab}) => {

    const { logout } = useAuth()
    const router = useRouter()
    const [logoutModal, setLogoutModal] = useState(false)

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const basicStyle = "flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"

    return (
        <div class="flex-col w-16 bg-white h-full">
            <div class="grid content-between py-8 w-full h-full">
                <div>
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
                <div>
                    <button
                        onClick={() => setLogoutModal(true)}
                        class={basicStyle}>
                        <BiLogOut size={30}/>
                    </button>
                </div>
            </div>
            { logoutModal && <ConfirmModal
                func={handleLogout}
                title="Are you sure you want to log out?"
                subtitle=""
                CTA="Log out"
                closeModal={setLogoutModal}
                />}
        </div>
    )
}

export default Navbar