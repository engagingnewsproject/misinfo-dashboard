import React, { useState, useEffect } from 'react'
import UpdatePwModal from './modals/UpdatePwModal'
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './modals/ConfirmModal';
import { useRouter } from 'next/router'

// Profile page that allows user to edit password or logout of their account
const Profile = () => {

  const [openModal, setOpenModal] = useState(false)

  const [logoutModal, setLogoutModal] = useState(false)

  const { logout } = useAuth()

  const router = useRouter()
  
  const handleLogout = () => {
    logout()
    router.push('/login')
}


  const basicStyle = "flex p-2 my-6 mx-2 justify-center text-gray-500 hover:bg-indigo-100 rounded-lg"

  return (
    <div className="w-full h-auto">
      <div className="z-0 flex-col p-16">
        <div className="text-xl font-extrabold text-blue-600 tracking-wider">Account</div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Reset Password</div>
            <button
                onClick={() => setOpenModal(true)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Password
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Logout</div>
            <button
                onClick={() => setLogoutModal(true)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Logout
            </button>
        </div>
      </div>
      {openModal && <UpdatePwModal setOpenModal={setOpenModal} />}
      
      {logoutModal && <ConfirmModal
                func={handleLogout}
                title="Are you sure you want to log out?"
                subtitle=""
                CTA="Log out"
                closeModal={setLogoutModal}
                />}
    </div>

  )
}

export default Profile