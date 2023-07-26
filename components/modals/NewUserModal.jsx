import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'

const NewUserModal = ({ setNewUserModal /*, addNewUser */ }) => {
	const [user, setUser] = useState('')
	// TODO: add new user finish
	const handleChange = (e) => {
		setUser(e.target.value)
	}
	
	const handleAddNewUser = (e) => {
		e.preventDefault()
			addNewUser(user)
			setNewUserModal(false)
	}
	
	return (
		<div>
			<div className='flex justify-center items-center z-10 absolute top-0 left-0 w-full h-full bg-black opacity-60'></div>
			<div onClick={() => setNewUserModal(false)} className='flex justify-center items-center z-20 absolute top-0 left-0 w-full h-full'>
				<div onClick={(e) => {e.stopPropagation()}} className='flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10'>
					<div className='flex justify-between w-full mb-5'>
						<div className='text-md font-bold text-blue-600 tracking-wide'>{'Add new User'}</div>
						<button onClick={() => setNewUserModal(false)} className='text-gray-800'><IoClose size={25} /></button>
					</div>
					<form onChange={handleChange} onSubmit={handleAddNewUser}>
						<div className='mb-2'>
							<input
								className='shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
								id='newUser'
								type='text'
								placeholder='New User'
								value={user}
								required
								onChange={handleChange}
							/>
						</div>
							<div className="mt-6 flex justify-between">
								<button
										onClick={() => setNewUserModal(false)}
										className="bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline">
										Cancel
								</button>
								<button
										className="bg-white hover:bg-blue-500 hover:text-white text-sm text-blue-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">
										Add user
								</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default NewUserModal