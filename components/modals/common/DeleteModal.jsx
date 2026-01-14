import React, { useState } from "react"
import { RiDeleteBin2Fill } from "react-icons/ri"
import { useTranslation } from 'next-i18next';


const DeleteModal = ({ func, title, subtitle, CTA, closeModal }) => {
	const handleSubmit = (e) => {
		e.preventDefault()
		func()
	}
  const {t} = useTranslation("Profile")

	return (
		<div>
			<div className='flex justify-center items-center z-[9998] fixed top-0 left-0 w-full h-screen bg-black opacity-60'></div>
			<div
				className='flex justify-center items-center z-[9999] fixed top-0 left-0 w-full h-screen'
				onClick={() => closeModal(false)}>
				<div
					className='flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10'
					onClick={(e) => {
						e.stopPropagation()
					}}>
					<div className='grid justify-items-center mb-4'>
						{CTA == "Delete" && (
							<RiDeleteBin2Fill className='text-blue-500' size={30} />
						)}
						<div className='flex-col mt-3 mb-2 text-center tracking-wide'>
							<div className='text-lg text-blue-500 font-bold my-2'>
								{title}
							</div>
							<div className='text-xs font-light'>{subtitle}</div>
						</div>
					</div>
					<form onSubmit={handleSubmit}>
						<div className='mt-6 flex justify-between'>
							<button
								onClick={() => closeModal(false)}
								className='bg-white hover:bg-red-500 hover:text-white text-sm text-red-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline'>
								{t('cancel')}
							</button>
							<button
								className='bg-blue-600 hover:bg-white text-white text-sm hover:text-blue-500 font-bold py-1.5 px-6 rounded-md focus:outline-none focus:shadow-outline'
								type='submit'
								autoFocus>
								{CTA}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default DeleteModal
