import React from "react"
import { IoClose } from "react-icons/io5"
import { Switch } from "@headlessui/react"
import { httpsCallable } from "firebase/functions"

const EditUserModal = ({
	customClaims,
	onOptionChange,
	onNameChange,
	name,
	onEmailChange,
	email,
	agencyUserAgency,
	onBannedChange,
	banned,
	setBanned,
	onFormSubmit,
	setUserEditClick,
	userRole, // New prop to receive the user's role
	userEditing
}) => {
	console.log(userEditing.agencyName)
	// Styles
	const style = {
		modal_background:
			"fixed z-[1200] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto",
		modal_container:
			"absolute inset-0 flex justify-center items-center z-[1300] sm:overflow-y-scroll",
		modal_wrapper:
			"flex-col justify-center items-center w-10/12 md:w-8/12 lg:w-5/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible",
		modal_header_container: "grid md:gap-5 lg:gap-5 auto-cols-auto mb-6",
		modal_header_wrapper: "flex w-full items-baseline justify-between",
		modal_header: "text-lg font-bold text-blue-600 tracking-wider",
		modal_close: "text-gray-800",
		modal_form_container:
			"grid justify-center md:gap-5 lg:gap-5 grid-cols-3 auto-cols-auto",
		modal_form_label: "text-lg font-bold text-black tracking-wider mb-4",
		modal_form_switch: "flex mb-4 col-span-2",
		modal_form_upload_image:
			"block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer",
		modal_form_radio_container: "flex gap-2 col-span-2",
		modal_form_radio: "mr-1",
		modal_form_input:
			"shadow border-none rounded-xl min-w-full col-span-2 p-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline",
		modal_form_button:
			"bg-blue-500 self-end hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline",
	}

	return (
		<div
			className={style.modal_background}
			onClick={() => setUserEditClick(false)}>
			<div className={style.modal_container}>
				<div
					className={style.modal_wrapper}
					onClick={(e) => e.stopPropagation()}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>User Info</div>
							<button
								onClick={() => setUserEditClick(false)}
								className={style.modal_close}>
								<IoClose size={25} />
							</button>
						</div>
					</div>
					<div>
						<form onSubmit={onFormSubmit}>
							<div className={style.modal_form_container}>
								{/* Name */}
								<label htmlFor='name' className={style.modal_form_label}>
									Name
								</label>
								<input
									className={style.modal_form_input}
									id='name'
									type='text'
									onChange={onNameChange}
									value={userEditing.name}
								/>
								{/* Email */}
								<div className={style.modal_form_label}>Email</div>
								<input
									className={style.modal_form_input}
									id='email'
									type='text'
									onChange={onEmailChange}
									value={userEditing.email}
								/>
								{/* Agency */}
								<div className={style.modal_form_label}>Agency</div>
								<input
									className={style.modal_form_input}
									id='agency'
									type='text'
									disabled
									// onChange={onAgencyChange}
									value={userEditing.agencyName}
								/>
								<div className={style.modal_form_label}>Banned</div>
								{/* BANNED */}
								<div className={style.modal_form_switch}>
									<Switch
										// Set checked to the initial banned value (false)
										checked={banned}
										// When switch toggled setBanned
										onChange={onBannedChange}
										// On click handler
										onClick={() => setBanned(!banned)}
										className={`${
											banned ? "bg-red-600" : "bg-gray-200"
										} relative inline-flex h-6 w-11 items-center rounded-full mr-2`}>
										<span className='sr-only'>Banned</span>
										<span
											aria-hidden='true'
											className={`${
												banned ? "translate-x-6" : "translate-x-1"
											} inline-block h-4 w-4 transform rounded-full bg-white transition`}
										/>
									</Switch>
									{banned == true ? (
										<div className='text-sm'>Banned</div>
									) : (
										<div className='text-sm'>Not banned</div>
									)}
								</div>
								{/* Permissions (claims) */}
								{customClaims.admin && (
									<>
										<div className={style.modal_form_label}>Permissions</div>
										<div className={style.modal_form_radio_container}>
											<label htmlFor='admin'>
												<input
													type='radio'
													value='Admin'
													id='admin'
													checked={userRole === "Admin"}
													onChange={onOptionChange}
													className={style.modal_form_radio}
												/>
												Admin
											</label>
											<label htmlFor='agency'>
												<input
													type='radio'
													value='Agency'
													id='agency'
													checked={userRole === "Agency"}
													onChange={onOptionChange}
													className={style.modal_form_radio}
												/>
												Agency
											</label>
											<label htmlFor='user'>
												<input
													type='radio'
													value='User'
													id='user'
													checked={userRole === "User"}
													onChange={onOptionChange}
													className={style.modal_form_radio}
												/>
												User
											</label>
										</div>
									</>
								)}
								<div className='grid col-span-3 justify-center'>
									<div className={style.modal_form_label}>
										Current Role: {userRole}
									</div>
									<input
										className={style.modal_form_button}
										type='submit'
										value={`Update User`}
									/>
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
