import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { useAuth } from '../../context/AuthContext'

const NewUserModal = ({ setNewUserModal /*, addNewUser */ }) => {
	
	// TESTING
	const [signUpError, setSignUpError] = useState("")
	const { user, signup } = useAuth()
    const [data, setData] = useState({
       displayName: '',
       email: '',
    })
	
    const handleSignUp = async (e) => {
        e.preventDefault()

        try {
            await signup(data.displayName, data.email)
            setSignUpError("")
        } catch (err) {
            if (err.message == "Firebase: Error (auth/email-already-in-use).") {
                setSignUpError("Email already in use. Please log in.")
            } else {
                setSignUpError(err.message)
            }
        }
    }
	
	const handleChange = (e) => {
        setData({ ...data, [e.target.id]: e.target.value})
    }
	// testing end
	return (
		<div>
			<div className='flex justify-center items-center z-10 absolute top-0 left-0 w-full h-full bg-black opacity-60'></div>
			<div onClick={() => setNewUserModal(false)} className='flex justify-center items-center z-20 absolute top-0 left-0 w-full h-full'>
				<div onClick={(e) => {e.stopPropagation()}} className='flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10'>
					<div className='flex justify-between w-full mb-5'>
						<div className='text-md font-bold text-blue-600 tracking-wide'>{'Add new User'}</div>
						<button onClick={() => setNewUserModal(false)} className='text-gray-800'><IoClose size={25} /></button>
					</div>
					<form onChange={handleChange} onSubmit={handleSignUp}>
						<div className="mb-4">
							<input
								className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="displayName"
								type="text"
								placeholder="Name"
								required
								value={data.displayName}
								onChange={handleChange}
								/>
						</div>
						<div className="mb-4">
							<input
								className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="email"
								type="text"
								placeholder="Email"
								required
								value={data.email}
								onChange={handleChange}
								/>
						</div>
						{signUpError && <div className="text-red-500 text-sm font-normal pt-3">{signUpError}</div>}
						<div className="flex-col items-center content-center mt-7">
							<button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline" type="submit">
								Sign Up
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default NewUserModal