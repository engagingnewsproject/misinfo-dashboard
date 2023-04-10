import React, { useState, useEffect } from 'react'
import UpdatePwModal from './modals/UpdatePwModal'

const Profile = () => {

  const [openModal, setOpenModal] = useState(false)

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
      </div>
      {openModal && <UpdatePwModal setOpenModal={setOpenModal} />}
    </div>

  )
}

export default Profile