import React, { useState } from 'react'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'next-i18next';
import { auth } from '../../../config/firebase'

const UpdateEmailModal = ({ setEmailModal }) => {
    const {t} = useTranslation("Profile")

    const { user, updateUserEmail } = useAuth()
    const [updateSuccess, setUpdateSuccess] = useState(false)
    const [incorrectPassword, setIncorrectPassword] = useState(false)
    const [data, setData] = useState({
        currentEmail: '',
        newEmail: '',
        currentPassword: ''
    })
    
    const handleChange = (e) => {
        setData({ ...data, [e.target.id]: e.target.value})
    }

    const handleUpdateEmail = async (e) => {
        e.preventDefault()
        try {
            const result = await updateUserEmail(auth, data.currentPassword, data.newEmail)
            setUpdateSuccess(true)
            setIncorrectPassword(false)
        } catch (error) {
            setUpdateSuccess(false)
            setIncorrectPassword(true)
        }
    }

    return (
        <div>
            <div className="flex justify-center items-center z-[9998] fixed top-0 left-0 w-full h-screen bg-black opacity-60">
            </div>
            <div 
            className="flex justify-center items-center z-[9999] fixed top-0 left-0 w-full h-screen"
            onClick={() => setEmailModal(false)}>
                <div className="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10"
                onClick={(e) => {
                    e.stopPropagation()
                }}>
                    <div className="flex justify-between w-full mb-5">
                        <div className="text-md font-bold text-blue-600 tracking-wide">{updateSuccess ? t('emailUpdated'): t('resetEmail')}</div>
                        {/* TODO: Change here */}
                        <button onClick={() => setEmailModal(false)} className="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                    </div>
                    <form onChange={handleChange} onSubmit={handleUpdateEmail}>
                        <div className="mb-4">
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="currentEmail"
                                type="email"
                                placeholder={t('currentEmail')}
                                required
                                value={data.currentEmail}
                                onChange={handleChange}
                                autoComplete="email"
                                />
                        </div>
                        <div className={incorrectPassword ? 'mb-0' : 'mb-4'}>
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="currentPassword"
                                type="password"
                                placeholder="Verify password"
                                required
                                value={data.currentPassword}
                                onChange={handleChange}
                                autoComplete='current-password'
                                />
                        </div>
                        {incorrectPassword && <span className="text-red-500 text-sm font-light">Incorrect password</span>}
                        <div className="mb-0.5">
                            <input
                                className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="newEmail"
                                type="email"
                                placeholder={t('newEmail')}
                                required
                                value={data.newEmail}
                                onChange={handleChange}
                                autoComplete="email"
                                />
                        </div>
                        {data.newEmail.length > 0 && data.newEmail.length < 8 && <span className="text-red-500 text-sm font-light">{t('incorrectEmail')}.</span>}
                        
                        <div className="mt-6">
                            <button
                                disabled={!data.newEmail || data.newEmail.length > 0 && data.newEmail.length < 8}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
                                type="submit">
                                {t('resetEmail')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default UpdateEmailModal