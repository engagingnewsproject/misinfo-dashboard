import React, { useState } from "react"
import { IoClose } from "react-icons/io5"

const AgencyModal = ({setAgencyId, agencyInfo, setAgencyInfo, onFormSubmit, onFormUpdate, onAdminChange, setAdminUser, setAgencyModal}) => {
	// //
	// States
	// //

	// //
	// Styles
	// //
	const style = {
		modal_background: 'fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto',
		modal_container: 'absolute top-4 md:top-6 md:right-6 md:left-6 flex justify-center items-center z-[1300] sm:overflow-y-scroll',
		modal_wrapper: 'flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible',
		modal_header_container: 'flex justify-between w-full mb-6',
		modal_header_wrapper: 'flex w-full items-baseline',
		modal_header: 'text-2xl font-bold text-blue-600 tracking-wider',
		modal_close: 'text-gray-800',
		modal_form_container: 'grid md:grid-cols-2 md:gap-10 lg:gap-15',
		modal_form_label: 'text-lg font-bold text-black tracking-wider mb-4',
		modal_form_data: 'text-sm bg-white rounded-xl p-4 mb-5',
		modal_form_button: 'flex items-center shadow ml-auto mr-6 bg-white hover:bg-gray-100 text-sm py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline'
	}

	return (
		<div className={style.modal_background} onClick={() => setAgencyModal(false)}>
			<div className={style.modal_container}>
				<div className={style.modal_wrapper} onClick={(e) => { e.stopPropagation() }}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>Agency Info</div>
							<button onClick={() => setAgencyModal(false)} className={style.modal_close}>
								<IoClose size={25}/>
							</button>
						</div>
					</div>
					<div>
						<form onSubmit={onFormSubmit}>
							<div className={style.modal_form_container}>
								<div className={style.modal_form_label}>Agency name</div>
								<div className={style.modal_form_data}>{agencyInfo.name}</div>
								<div className={style.modal_form_label}>Agency location</div>
								<div className={style.modal_form_data}>{agencyInfo.location}</div>
								<div className={style.modal_form_label}>Agency admin user</div>
								<input onChange={onAdminChange} defaultValue={agencyInfo.adminUser} placeholder="Admin user email" className={style.modal_form_data}/>
								<button onClick={onFormUpdate} className={style.modal_form_button}>Update Agency</button> 
								{/* TODO: finish update agency */}
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AgencyModal