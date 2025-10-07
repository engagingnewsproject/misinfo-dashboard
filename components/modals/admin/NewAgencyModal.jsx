import React, { useState, useEffect } from 'react'
import { IoClose } from 'react-icons/io5'
import { useAuth } from '../../../context/AuthContext'
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
		modal_background: 'fixed z-[9998] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto',
		modal_container: 'absolute inset-0 flex justify-center items-center z-[9999] sm:overflow-y-scroll',
		modal_wrapper: 'flex-col justify-center items-center w-10/12 md:w-8/12 lg:w-5/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible',
		modal_header_container: 'flex justify-between w-full mb-6',
		modal_header_wrapper: 'flex w-full justify-between items-center',
		modal_header: 'text-lg font-bold text-blue-600 tracking-wider',
		modal_close: 'text-gray-800',
		modal_form_container: 'grid md:grid-cols-3 md:gap-10 lg:gap-15',
		modal_form: 'flex flex-col gap-4',
		modal_form_label: 'text-black tracking-wider mb-4',
		modal_form_data: 'col-span-2 text-sm bg-white rounded-xl p-4 mb-5',
		modal_form_upload_image: 'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
		modal_form_input: 'shadow border-none rounded-md min-w-full col-span-2 p-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
		modal_form_select: 'border-none rounded-xl min-w-full col-span-2 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
		modal_form_button: 'bg-blue-600 self-center hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline'
	}
	return (
		<div className={style.modal_background} onClick={() => setNewAgencyModal(false)}>
			<div className={style.modal_container}>
				<div className={style.modal_wrapper} onClick={(e) => {e.stopPropagation()}}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>{'Add new Agency'}</div>
							<button onClick={() => setNewAgencyModal(false)} className='text-gray-800'><IoClose size={25} /></button>
						</div>
					</div>
					<form onSubmit={onFormSubmit} id="newAgencyModal" className={style.modal_form}>
						<input // Agency Name
							className={style.modal_form_input}
							id="agencyName"
							type="text"
							placeholder="Agency Name"
							value={newAgencyName}
							onChange={onNewAgencyName}
							autoComplete="nope"
							/>
							{errors.newAgencyName ? (
								<p className="error">
								Enter an agency name
								</p>
								) : null}
						<input // New agency emails
							className={style.modal_form_input}
							id="agencyUser"
							type="email"
							placeholder="Agency User Email"
							value={newAgencyEmails}
							onChange={onNewAgencyEmails}
							autoComplete='email'
							/>
							{errors.email ? (
								<p className="error">
								Email should be at least 15 characters long
								</p>
								) : null}
						<label className='text-blue-600'>Location</label>
						<Select // Agency State
							className={style.modal_form_select}
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
							className={style.modal_form_select}
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
						<button className={style.modal_form_button} type="submit" id="agencyNew">
							Add Agency
						</button>
					</form>
				</div>
			</div>
		</div>
	)
}

export default NewAgencyModal