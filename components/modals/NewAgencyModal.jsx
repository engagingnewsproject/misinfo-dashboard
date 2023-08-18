import React, { useState, useEffect } from 'react'
import { IoClose } from 'react-icons/io5'
import { useAuth } from '../../context/AuthContext'
import Select from "react-select";
import { Country, State, City }  from 'country-state-city';

const NewAgencyModal = ({ 
	setNewAgencyModal,
	newAgencyName,
	onNewAgencyName,
	newAgencyEmails,
	onNewAgencyEmails,
	data,
	onNewAgencyState,
	onNewAgencyCity,
	onFormSubmit,
	errors }) => {
	useEffect(() => {

	}, [])
	
	const style = {
		input: 'shadow mb-4 border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
		inputSelect: 'shadow my-4 border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
		button: 'w-full bg-blue-500 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline',
	}
	return (
		<div>
			<div className='flex justify-center items-center z-10 absolute top-0 left-0 w-full h-full bg-black opacity-60'></div>
			<div onClick={() => setNewAgencyModal(false)} className='flex justify-center items-center z-20 absolute top-0 left-0 w-full h-full'>
				<div onClick={(e) => {e.stopPropagation()}} className='flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10'>
					<div className='flex justify-between w-full mb-5'>
						<div className='text-md font-bold text-blue-600 tracking-wide'>{'Add new Agency'}</div>
						<button onClick={() => setNewAgencyModal(false)} className='text-gray-800'><IoClose size={25} /></button>
					</div>
					<form onSubmit={onFormSubmit} id="newAgency">
						<input // Agency Name
							className={style.input}
							id="agencyName"
							type="text"
							placeholder="Agency Name"
							value={newAgencyName}
							onChange={onNewAgencyName}
							/>
						<input // Agency Admin User
							className={style.input}
							id="agencyUser"
							type="text"
							placeholder="Agency User Email"
							value={newAgencyEmails}
							onChange={onNewAgencyEmails}
							/>
						<label className='text-blue-600'>Location</label>
						<Select // Agency State
							className={style.inputSelect}
							id="agencyState"
							type="text"
							placeholder="Select State"
							value={data.state}
							options={State.getStatesOfCountry(data.country)}
							getOptionLabel={(options) => {
								return options["name"];
							}}
							getOptionValue={(options) => {
								return options["name"];
							}}                                
							label="state"
							onChange={onNewAgencyState}
							required
						/>
						<Select // Agency City
							className={style.inputSelect}
							id="agencyCity"
							type="text"
							placeholder="Select City"
							value={data.city}
							options={City.getCitiesOfState(
								data.state?.countryCode,
								data.state?.isoCode
								)}
								getOptionLabel={(options) => {
									return options["name"];
								}}
								getOptionValue={(options) => {
									return options["name"];
								}}                                
								label="state"
								onChange={onNewAgencyCity}
								required
							/>
						{/* {errors.city && ('errors.city')} */}
						{/* selectedSource === '' &&  (<span className="text-red-500">{errors.source}</span>)} */}
						{/* {errors && <div className="text-red-500 text-sm font-normal pt-3">{errors}</div>} */}
						<button className={style.button} type="submit" id="agencyNew">
							Add Agency
						</button>
					</form>
					{errors && (
						<div className="bg-red-800 p-4 font-bold text-white">
						{errors}
						</div>
						)}
				</div>
			</div>
		</div>
	)
}

export default NewAgencyModal