import React from "react"
import { IoClose } from "react-icons/io5"
import { Switch } from "@headlessui/react"

const EditUserModal = ({customClaims, selectedOption, onOptionChange, onNameChange, name, onEmailChange, email, onBannedChange, banned, setBanned, onFormSubmit, onFormUpdate, setEditUser }) => {

	// //
	// Styles
	// //
	const style = {
		modal_background: 'fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto',
		modal_container: 'absolute top-4 md:top-6 md:right-6 md:left-6 flex justify-center items-center z-[1300] sm:overflow-y-scroll',
		modal_wrapper: 'flex-col justify-center items-center lg:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible',
		modal_header_container: 'flex justify-between w-full mb-6',
		modal_header_wrapper: 'flex w-full items-baseline justify-between',
		modal_header: 'text-2xl font-bold text-blue-600 tracking-wider',
		modal_close: 'text-gray-800',
		modal_form_container: 'grid md:grid-cols-2 md:gap-10 lg:gap-15',
		modal_form_label: 'text-lg font-bold text-black tracking-wider mb-4',
		modal_form_upload_image: 'block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
		modal_form_radio: 'mr-1',
		modal_form_button: 'bg-blue-500 self-end hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline'
	}

	return (
		<div className={style.modal_background} onClick={() => setEditUser(false)}>
			<div className={style.modal_container}>
				<div className={style.modal_wrapper} onClick={(e) => { e.stopPropagation() }}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>User Info</div>
							<button onClick={() => setEditUser(false)} className={style.modal_close}>
								<IoClose size={25}/>
							</button>
						</div>
					</div>
					<div>
						<form onSubmit={onFormSubmit}>
							<div className={style.modal_form_container}>
								<div className={style.modal_form_label}>Name</div>
								<input
								className="shadow border-none rounded-xl w-full p-3 pr-11 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="name"
								type="text"
								onChange={onNameChange}
								value={name}/>
								<div className={style.modal_form_label}>Email</div>
								<input
								className="shadow border-none rounded-xl w-full p-3 pr-11 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="search"
								type="text"
								onChange={onEmailChange}
								value={email}/>
								<div className={style.modal_form_label}>Banned</div>
								{/* BANNED */}
								<div className="flex gap-2">
								<Switch
									// Set checked to the initial banned value (false)
									checked={banned}
									// When switch toggled setBanned
									onChange={onBannedChange}
									// On click handler
									onClick={() => setBanned(!banned)}
									className={`${
										banned ? "bg-blue-600" : "bg-gray-200"
									} relative inline-flex h-6 w-11 items-center rounded-full`}>
									<span className="sr-only">Banned</span>
									<span
										aria-hidden="true"
										className={`${
											banned ? "translate-x-6" : "translate-x-1"
										} inline-block h-4 w-4 transform rounded-full bg-white transition`}
									/>
								</Switch>
								{banned == true ? `Banned` : `Not banned`}
								</div>
								{customClaims.admin &&
									<>
										<div className={style.modal_form_label}>Permissions</div>
										<div className="flex gap-2">    
											<label>
												<input
													type="radio"
													value="Admin"
													checked={selectedOption === "Admin"}
													onChange={onOptionChange}
													className={style.modal_form_radio}
												/>
												Admin
											</label>
											<label>
												<input
													type="radio"
													value="Agency"
													checked={selectedOption === "Agency"}
													onChange={onOptionChange}
													className={style.modal_form_radio}
												/>
												Agency
											</label>
											<label>
												<input
													type="radio"
													value="User"
													checked={selectedOption === "User"}
													onChange={onOptionChange}
													className={style.modal_form_radio}
												/>
												User
											</label>
										</div>
									</>
								}
								<div className="grid col-span-2 justify-center">
								<button onClick={onFormUpdate} className={style.modal_form_button} type="submit">Update User</button> 
								{/* TODO: finish update agency */}
								</div>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default EditUserModal