import React, { useState } from 'react'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'

const UpdatePwModal = ({ setOpenModal }) => {

    const { user, updatePassword } = useAuth()
    const [updateSuccess, setUpdateSuccess] = useState(false)
    const [data, setData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPW: ''
    })
    
    const handleChange = (e) => {
        setData({ ...data, [e.target.id]: e.target.value})
    }

    const handleUpdatePW = async (e) => {
        e.preventDefault()
        const result = await updatePassword(user, data.currentPassword, data.newPassword)
        setUpdateSuccess(true)
    }

    return (
        <div>
            <div className="flex justify-center items-center z-[1200] absolute top-0 left-0 w-full h-full bg-black opacity-60">
            </div>
            <div 
            className="flex justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full"
            onClick={() => setOpenModal(false)}>
                <div className="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10"
                onClick={(e) => {
                    e.stopPropagation()
                }}>
                    <div className="flex justify-between w-full mb-5">
                        <div className="text-md font-bold text-blue-600 tracking-wide">{updateSuccess ? "PW updated" : "Reset Password"}</div>
                        <button onClick={() => setOpenModal(false)} className="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                    </div>
                    <form onChange={handleChange} onSubmit={handleUpdatePW}>
                        <div className="mb-4">
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="currentPassword"
                                type="password"
                                placeholder="Current Password"
                                required
                                value={data.currentPassword}
                                onChange={handleChange}
                                />
                        </div>
                        <div className="mb-0.5">
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="newPassword"
                                type="password"
                                placeholder="New Password"
                                required
                                value={data.newPassword}
                                onChange={handleChange}
                                />
                        </div>
                        {data.newPassword.length > 0 && data.newPassword.length < 8 && <span className="text-red-500 text-sm font-light">New password must be atleast 8 characters</span>}
                        <div className="mt-4 mb-0.5">
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="confirmNewPW"
                                type="password"
                                placeholder="Confirm New Password"
                                required
                                value={data.confirmNewPW}
                                onChange={handleChange}
                                />
                        </div>
                        {data.newPassword !== data.confirmNewPW && <span className="text-red-500 text-sm font-light">Passwords don't match</span>}
                        <div className="mt-6">
                            <button
                                disabled={data.newPassword !== data.confirmNewPW || data.newPassword.length > 0 && data.newPassword.length < 8}
                                className="w-full bg-blue-500 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
                                type="submit">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default UpdatePwModal