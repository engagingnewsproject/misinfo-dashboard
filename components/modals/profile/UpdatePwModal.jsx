import React, { useState } from 'react'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from 'next-i18next';
import { auth } from '../../../config/firebase'
import { MdOutlineRemoveRedEye } from "react-icons/md";
import FormInput from '../../ui/FormInput'

const UpdatePwModal = ({ setOpenModal }) => {
    const {t} = useTranslation("Profile")

    const { user, updateUserPassword } = useAuth()
    const [updateSuccess, setUpdateSuccess] = useState(false)
    const [incorrectPassword, setIncorrectPassword] = useState(false)
    // password show/hide
    const [password, setPassword] = useState("")
    const [type, setType] = useState('password')
    const [icon, setIcon] = useState(false)
    const [data, setData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPW: ''
    })
      // handle the toggle between the hide password (eyeOff icon) and the show password (eye icon)
    const handleTogglePass = () => {
        if (type==='password'){
            setIcon(true);
            setType('text')
        } else {
            setIcon(false)
            setType('password')
        }
    }
    const handleChange = (e) => {
        setPassword(e.target.value)
        setData({ ...data, [e.target.id]: e.target.value})
    }

    const handleUpdatePW = async (e) => {
        e.preventDefault()
        try {
            const result = await updateUserPassword(auth, data.currentPassword, data.newPassword)
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
            onClick={() => setOpenModal(false)}>
                <div className="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10"
                onClick={(e) => {
                    e.stopPropagation()
                }}>
                    <div className="flex justify-between w-full mb-5">
                        <div className="text-md font-bold text-blue-600 tracking-wide">{updateSuccess ? t('passwordUpdated') : t('resetPassword')}</div>
                        <button onClick={() => setOpenModal(false)} className="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                    </div>
                    <form onChange={handleChange} onSubmit={handleUpdatePW}>
                        <div className="flex flex-col mb-4">
                            <FormInput
                                label={t('email')}
                                value={user.email}
                                disabled
                                id="username"
                                autoComplete='username'/>
                        </div>
                        <div className={incorrectPassword ? 'mb-0' : 'mb-4'}>
                            <FormInput
                                id="currentPassword"
                                type={type}
                                name='current password'
                                label={t('currentPassword')}
                                required
                                value={data.currentPassword}
                                onChange={handleChange}
                                autoComplete='current-password'
                                icon={
                                    <button
                                        type="button"
                                        className="cursor-pointer"
                                        onClick={handleTogglePass}
                                        aria-label="Toggle password visibility">
                                        <MdOutlineRemoveRedEye />
                                    </button>
                                }
                                />
                        </div>
                        {incorrectPassword && <span className="text-red-500 text-sm font-light">Incorrect password</span>}
                        <div className="mb-0.5">
                            <FormInput
                                id="newPassword"
                                type={type}
                                name='new password'
                                label={t('newPassword')}
                                required
                                value={data.newPassword}
                                onChange={handleChange}
                                autoComplete='new-password'
                                />
                        </div>
                        {data.newPassword.length > 0 && data.newPassword.length < 8 && <span className="text-red-500 text-sm font-light">New password must be atleast 8 characters</span>}
                        <div className="mt-4 mb-0.5">
                            <FormInput
                                id="confirmNewPW"
                                type={type}
                                name="confirm password"
                                label={t('confirmPassword')}
                                required
                                value={data.confirmNewPW}
                                onChange={handleChange}
                                autoComplete='new-password'
                                />
                        </div>
                        {data.newPassword !== data.confirmNewPW && <span className="text-red-500 text-sm font-light">Passwords don't match</span>}
                        <div className="mt-6">
                            <button
                                disabled={data.newPassword !== data.confirmNewPW || data.newPassword.length > 0 && data.newPassword.length < 8}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
                                type="submit">
                                {t('resetPassword')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default UpdatePwModal