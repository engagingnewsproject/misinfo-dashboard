import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../config/firebase';
import { collection, addDoc } from '@firebase/firestore';
import Select from "react-select";
import { Country, State, City }  from 'country-state-city';

const NewAgencyModal = ({ setNewAgencyModal, handleNewAgencySubmit }) => {

	const [signUpError, setSignUpError] = useState("")
	const { user, signup } = useAuth()

	// TESTING add state // // // // // // // // // // // // // //
	const dbInstance = collection(db, 'agency');
	const [name, setName] = useState("")
	const [data, setData] = useState({ country: "US", state: null, city: null })
	// const [agencyState, setAgencyState] = useState(0)
	
	const saveAgency = () => {
		addDoc(dbInstance, {
			name: name,
			state: data.state.name,
			city: data.city == null ? "N/A" : data.city.name,
		}).then(() => {
			handleNewAgencySubmit(); // Send a signal to ReportsSection so that it updates the list 
		})
	}
	// Agency Name
	const handleNameChange = (e) => {
		e.preventDefault()
		setName(e.target.value)
	}
	// Agency State
	const handleStateChange = (e) => {
		setData(data=>({...data, state: e, city: null })) 
		// setAgencyState(1)
	}
	// Agency City
	const handleCityChange = (e) => {
		setData(data=>({...data,city: e !== null ? e : null })) 
		// setAgencyState(2)
	}
	const handleSubmitClick = (e) => {
		e.preventDefault()
		!name ? alert('Agency name is required') :
		saveAgency()
		setNewAgencyModal(false)
	}
	
	const handleNewAgency = async (e) => {
		e.preventDefault()
		handleSubmitClick(e)
	}
	// TESTING add state END // // // // // // // // // // // // // //
	
	const handleChange = (e) => {
		setData({ ...data, [e.target.id]: e.target.value})
	}

	const style = {
		input: 'shadow mb-4 border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
		button: 'w-full bg-blue-500 hover:bg-blue-700 text-white py-2 mb-2 px-6 rounded focus:outline-none focus:shadow-outline',
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
					<form onChange={handleChange} onSubmit={handleNewAgency}>
						<input // Agency Name
							className={style.input}
							id="agencyName"
							type="text"
							placeholder="Agency Name"
							required
							value={data.agencyName}
							onChange={handleNameChange}
							/>
						<label className='text-blue-600'>Agency Location</label>
						<Select // Agency Location
								className={style.input}
								id="agencyState"
								type="text"
								placeholder="Add Agency State"
								value={data.state}
								options={State.getStatesOfCountry(data.country)}
								getOptionLabel={(options) => {
									return options["name"];
								}}
								getOptionValue={(options) => {
									return options["name"];
								}}                                
								label="state"
								onChange={handleStateChange}
								/>
						<Select // Agency Location
								className={style.input}
								id="agencyCity"
								type="text"
								placeholder="Add Agency City"
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
								onChange={handleCityChange}
								/>
						{/* <input
							className={style.input}
							id="email"
							type="text"
							placeholder="Agency Admin Email"
							required
							value={data.email}
							onChange={handleChange}
							/> */}
						{signUpError && <div className="text-red-500 text-sm font-normal pt-3">{signUpError}</div>}
						<button className={style.button} type="submit">
							Add Agency
						</button>
					</form>
				</div>
			</div>
		</div>
	)
}

export default NewAgencyModal