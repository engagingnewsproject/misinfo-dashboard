import React, { useState } from 'react'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'

const UpdateEmailModal = ({ setEmailModal }) => {

    const { user, updateUserEmail } = useAuth()
    const [updateSuccess, setUpdateSuccess] = useState(false)
    const [data, setData] = useState({
        currentEmail: '',
        newEmail: ''
    })
    
    const handleChange = (e) => {
        setData({ ...data, [e.target.id]: e.target.value})
    }

    const handleUpdatePW = async (e) => {
        e.preventDefault()
        const result = await updateUserEmail(user, data.currentEmail, data.newEmail)
        setUpdateSuccess(true)
    }

    return (
        <div>
            <div className="flex justify-center items-center z-[1200] absolute top-0 left-0 w-full h-full bg-black opacity-60">
            </div>
            <div 
            className="flex justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full"
            onClick={() => setEmailModal(false)}>
                <div className="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10"
                onClick={(e) => {
                    e.stopPropagation()
                }}>
                    <div className="flex justify-between w-full mb-5">
                        <div className="text-md font-bold text-blue-600 tracking-wide">{updateSuccess ? "Email updated" : "Reset Email"}</div>
                        <button onClick={() => setEmailModal(false)} className="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                    </div>
                    <form onChange={handleChange} onSubmit={handleUpdatePW}>
                        <div className="mb-4">
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="currentEmail"
                                type="email"
                                placeholder="Current Email"
                                required
                                value={data.currentEmail}
                                onChange={handleChange}
                                />
                        </div>
                        <div className="mb-0.5">
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="newEmail"
                                type="email"
                                placeholder="New Email"
                                required
                                value={data.newEmail}
                                onChange={handleChange}
                                />
                        </div>
                        {data.newEmail.length > 0 && data.newEmail.length < 8 && <span className="text-red-500 text-sm font-light">New email must be @email.</span>}
                        
                        <div className="mt-6">
                            <button
                                disabled={!data.newEmail || data.newEmail.length > 0 && data.newEmail.length < 8}
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

export default UpdateEmailModal