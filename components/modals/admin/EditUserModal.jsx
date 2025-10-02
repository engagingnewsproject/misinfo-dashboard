import React, { Fragment, useEffect, useState } from "react"
import { IoClose } from "react-icons/io5"
import { Switch } from "@headlessui/react"

const EditUserModal = ({
	userEditingUID,
	userId,
	customClaims,
	user,
	onRoleChange,
	// agency
	agenciesArray,
	selectedAgency,
	agencyName,
	onAgencyChange,
	onNameChange,
	name,
	onEmailChange,
	email,
	agencyUserAgency,
	onBannedChange,
	banned,
	setBanned,
	onFormSubmit,
	setUserEditModal,
	userRole, // New prop to receive the user's role
	userEditing,
	mobileUserDetails,
	onMobileFieldChange,
	mobileUserFieldTypes,
	mobileFieldFormError,
}) => {
	// Styles
	const style = {
		modal_background:
			"fixed z-[9998] top-0 left-0 w-full h-full bg-black bg-opacity-50 overflow-auto",
		modal_container:
			"absolute inset-0 flex justify-center items-center z-[9999] sm:overflow-y-scroll",
		modal_wrapper:
			"flex-col justify-center items-center w-10/12 md:w-8/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible",
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
			"bg-blue-600 self-end hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline",
	}

	const isAdmin = Boolean(customClaims?.admin)
	const [structuredFieldDrafts, setStructuredFieldDrafts] = useState({})
	const [structuredFieldErrors, setStructuredFieldErrors] = useState({})
	const [timestampDrafts, setTimestampDrafts] = useState({})
	const [timestampErrors, setTimestampErrors] = useState({})
	const [geoPointDrafts, setGeoPointDrafts] = useState({})
	const [geoPointErrors, setGeoPointErrors] = useState({})

	const formatTimestampDraftValue = (fieldKey, rawValue) => {
		if (typeof rawValue === 'string') {
			return rawValue
		}
		if (rawValue && typeof rawValue === 'object') {
			const seconds = Number(rawValue.seconds)
			const nanoseconds = Number(rawValue.nanoseconds ?? 0)
			if (!Number.isNaN(seconds) && !Number.isNaN(nanoseconds)) {
				const milliseconds = seconds * 1000 + nanoseconds / 1e6
				if (!Number.isNaN(milliseconds)) {
					return new Date(milliseconds).toISOString()
				}
			}
		}
		const original = mobileUserFieldTypes?.[fieldKey]?.originalValue
		if (original && typeof original.toDate === 'function') {
			return original.toDate().toISOString()
		}
		return ''
	}

	const formatGeoPointDraftValue = (rawValue) => {
		const latitude = rawValue?.latitude ?? rawValue?.lat
		const longitude = rawValue?.longitude ?? rawValue?.lng
		return {
			latitude:
				latitude === undefined || latitude === null || Number.isNaN(Number(latitude))
					? ''
					: String(latitude),
			longitude:
				longitude === undefined || longitude === null || Number.isNaN(Number(longitude))
					? ''
					: String(longitude),
		}
	}

	useEffect(() => {
		const nextStructuredDrafts = {}
		const nextTimestampDrafts = {}
		const nextGeoPointDrafts = {}

		Object.entries(mobileUserDetails || {}).forEach(([key, value]) => {
			const fieldType = mobileUserFieldTypes?.[key]?.type || typeof value
			if (fieldType === 'object' || fieldType === 'array') {
				nextStructuredDrafts[key] = JSON.stringify(
					value ?? (fieldType === 'array' ? [] : {}),
					null,
					2,
				)
			}
			if (fieldType === 'timestamp') {
				nextTimestampDrafts[key] = formatTimestampDraftValue(key, value)
			}
			if (fieldType === 'geopoint') {
				nextGeoPointDrafts[key] = formatGeoPointDraftValue(value)
			}
		})

		setStructuredFieldDrafts(nextStructuredDrafts)
		setStructuredFieldErrors({})
		setTimestampDrafts(nextTimestampDrafts)
		setTimestampErrors({})
		setGeoPointDrafts(nextGeoPointDrafts)
		setGeoPointErrors({})
	}, [mobileUserDetails, mobileUserFieldTypes])

	const clearStructuredFieldError = (fieldKey) => {
		if (!structuredFieldErrors[fieldKey]) {
			return
		}
		setStructuredFieldErrors((prev) => {
			const { [fieldKey]: _removed, ...rest } = prev
			return rest
		})
	}

	const handleStructuredFieldDraftChange = (fieldKey, value) => {
		setStructuredFieldDrafts((prev) => ({
			...prev,
			[fieldKey]: value,
		}))
		clearStructuredFieldError(fieldKey)
	}

	const handleStructuredFieldCommit = (fieldKey, expectedType) => {
		if (!isAdmin) {
			return
		}
		const rawValue = structuredFieldDrafts[fieldKey]
		const trimmedValue = rawValue?.trim()

		if (!trimmedValue) {
			onMobileFieldChange(fieldKey, null)
			clearStructuredFieldError(fieldKey)
			return
		}

		try {
			const parsedValue = JSON.parse(rawValue)
			if (expectedType === 'array' && !Array.isArray(parsedValue)) {
				setStructuredFieldErrors((prev) => ({
					...prev,
					[fieldKey]: 'Enter a JSON array (e.g. [1, 2, 3]).',
				}))
				return
			}
			if (
				expectedType === 'object' &&
				(parsedValue === null || Array.isArray(parsedValue))
			) {
				setStructuredFieldErrors((prev) => ({
					...prev,
					[fieldKey]: 'Enter a JSON object (e.g. {"key": "value"}).',
				}))
				return
			}
			onMobileFieldChange(fieldKey, parsedValue)
			clearStructuredFieldError(fieldKey)
		} catch (error) {
			setStructuredFieldErrors((prev) => ({
				...prev,
				[fieldKey]: 'Invalid JSON. Fix formatting before saving.',
			}))
		}
	}

	const clearTimestampError = (fieldKey) => {
		if (!timestampErrors[fieldKey]) {
			return
		}
		setTimestampErrors((prev) => {
			const { [fieldKey]: _removed, ...rest } = prev
			return rest
		})
	}

	const handleTimestampDraftChange = (fieldKey, value) => {
		setTimestampDrafts((prev) => ({
			...prev,
			[fieldKey]: value,
		}))
		clearTimestampError(fieldKey)
	}

	const handleTimestampCommit = (fieldKey) => {
		if (!isAdmin) {
			return
		}
		const rawValue = timestampDrafts[fieldKey]
		const trimmedValue = rawValue?.trim()
		const errorMessage =
			'Enter an ISO 8601 date string or JSON with "seconds" and "nanoseconds".'

		if (!trimmedValue) {
			onMobileFieldChange(fieldKey, null)
			clearTimestampError(fieldKey)
			return
		}

		const parsedDate = new Date(trimmedValue)
		if (!Number.isNaN(parsedDate.getTime())) {
			onMobileFieldChange(fieldKey, trimmedValue)
			clearTimestampError(fieldKey)
			return
		}

		try {
			const parsedJson = JSON.parse(trimmedValue)
			if (
				parsedJson &&
				typeof parsedJson === 'object' &&
				!Array.isArray(parsedJson)
			) {
				const seconds = Number(parsedJson.seconds)
				const nanoseconds = Number(parsedJson.nanoseconds ?? 0)
				if (!Number.isNaN(seconds) && !Number.isNaN(nanoseconds)) {
					onMobileFieldChange(fieldKey, {
						seconds,
						nanoseconds,
					})
					clearTimestampError(fieldKey)
					return
				}
			}
		} catch (error) {
			// Swallow JSON parse errors – handled uniformly below
		}

		setTimestampErrors((prev) => ({
			...prev,
			[fieldKey]: errorMessage,
		}))
	}

	const clearGeoPointError = (fieldKey) => {
		if (!geoPointErrors[fieldKey]) {
			return
		}
		setGeoPointErrors((prev) => {
			const { [fieldKey]: _removed, ...rest } = prev
			return rest
		})
	}

	const handleGeoPointDraftChange = (fieldKey, axis, value) => {
		setGeoPointDrafts((prev) => ({
			...prev,
			[fieldKey]: {
				...(prev[fieldKey] || { latitude: '', longitude: '' }),
				[axis]: value,
			},
		}))
		clearGeoPointError(fieldKey)
	}

	const handleGeoPointCommit = (fieldKey) => {
		if (!isAdmin) {
			return
		}
		const draft = geoPointDrafts[fieldKey] || { latitude: '', longitude: '' }
		const latitudeInput = draft.latitude?.trim?.() ?? ''
		const longitudeInput = draft.longitude?.trim?.() ?? ''

		if (!latitudeInput && !longitudeInput) {
			onMobileFieldChange(fieldKey, null)
			clearGeoPointError(fieldKey)
			return
		}

		if (!latitudeInput || !longitudeInput) {
			setGeoPointErrors((prev) => ({
				...prev,
				[fieldKey]: 'Provide both latitude and longitude, or clear the field.',
			}))
			return
		}

		const latitude = Number(latitudeInput)
		const longitude = Number(longitudeInput)
		if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
			setGeoPointErrors((prev) => ({
				...prev,
				[fieldKey]: 'Latitude and longitude must be numeric values.',
			}))
			return
		}

		onMobileFieldChange(fieldKey, { latitude, longitude })
		clearGeoPointError(fieldKey)
	}

	const formatFieldLabel = (key) =>
		key
			.replace(/([A-Z])/g, ' $1')
			.replace(/_/g, ' ')
			.replace(/^./, (match) => match.toUpperCase())

	const renderAdditionalField = (fieldKey, fieldValue) => {
		const fieldConfig = mobileUserFieldTypes?.[fieldKey]
		const fieldType = fieldConfig?.type || typeof fieldValue
		const inputId = `mobile-field-${fieldKey}`
		const commonInputProps = {
			id: inputId,
			className: `${style.modal_form_input} ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`,
			disabled: !isAdmin,
		}

		if (fieldType === 'boolean') {
			return (
				<div className={`${style.modal_form_switch} ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}>
					<Switch
						checked={Boolean(fieldValue)}
						onChange={(checked) => onMobileFieldChange(fieldKey, checked)}
						disabled={!isAdmin}
						className={`${
							Boolean(fieldValue) ? "bg-blue-600" : "bg-gray-200"
						} relative inline-flex h-6 w-11 items-center rounded-full mr-2`}
					>
						<span className='sr-only'>{formatFieldLabel(fieldKey)}</span>
						<span
							aria-hidden='true'
							className={`${
								Boolean(fieldValue) ? "translate-x-6" : "translate-x-1"
							} inline-block h-4 w-4 transform rounded-full bg-white transition`}
						/>
					</Switch>
					<div className='text-sm'>
						{Boolean(fieldValue) ? 'Enabled' : 'Disabled'}
					</div>
				</div>
			)
		}

		if (fieldType === 'number') {
			const displayValue = fieldValue ?? ''
			const formattedDate =
				fieldKey === 'joiningDate' && typeof fieldValue === 'number'
					? new Date(fieldValue * 1000).toLocaleString('en-US')
					: null
			return (
				<div className='flex flex-col gap-1'>
					<input
						{...commonInputProps}
						type='number'
						value={displayValue}
						onChange={(event) => {
							const { value } = event.target
							onMobileFieldChange(
								fieldKey,
								value === '' ? '' : Number(value),
							)
						}}
					/>
					{formattedDate && (
						<div className='text-xs text-slate-600'>
							Readable date: {formattedDate}
						</div>
					)}
				</div>
			)
		}

		if (fieldType === 'timestamp') {
			const draftValue = timestampDrafts[fieldKey] ?? formatTimestampDraftValue(fieldKey, fieldValue)
			const previewDate = (() => {
				if (!draftValue) {
					return null
				}
				const parsed = new Date(draftValue)
				return Number.isNaN(parsed.getTime())
					? null
					: parsed.toLocaleString('en-US')
			})()
			return (
				<div className='flex flex-col gap-1'>
					<input
						{...commonInputProps}
						type='text'
						value={draftValue}
						onChange={(event) => handleTimestampDraftChange(fieldKey, event.target.value)}
						onBlur={() => handleTimestampCommit(fieldKey)}
						placeholder='2024-10-31T12:00:00Z or {"seconds": 1698676800, "nanoseconds": 0}'
					/>
					{previewDate && (
						<div className='text-xs text-slate-600'>Readable date: {previewDate}</div>
					)}
					{timestampErrors[fieldKey] && (
						<div className='text-xs text-red-600'>{timestampErrors[fieldKey]}</div>
					)}
				</div>
			)
		}

		if (fieldType === 'geopoint') {
			const draft = geoPointDrafts[fieldKey] || { latitude: '', longitude: '' }
			return (
				<div className='flex flex-col gap-1'>
					<div className='grid grid-cols-2 gap-2'>
						<input
							{...commonInputProps}
							type='number'
							step='any'
							value={draft.latitude}
							onChange={(event) => handleGeoPointDraftChange(fieldKey, 'latitude', event.target.value)}
							onBlur={() => handleGeoPointCommit(fieldKey)}
							placeholder='Latitude'
						/>
						<input
							{...commonInputProps}
							type='number'
							step='any'
							value={draft.longitude}
							onChange={(event) => handleGeoPointDraftChange(fieldKey, 'longitude', event.target.value)}
							onBlur={() => handleGeoPointCommit(fieldKey)}
							placeholder='Longitude'
						/>
					</div>
					{geoPointErrors[fieldKey] && (
						<div className='text-xs text-red-600'>{geoPointErrors[fieldKey]}</div>
					)}
				</div>
			)
		}

		if (fieldType === 'array' || fieldType === 'object') {
			const serialized =
				structuredFieldDrafts[fieldKey] ??
				JSON.stringify(fieldValue ?? (fieldType === 'array' ? [] : {}), null, 2)
			return (
				<div className='flex flex-col gap-1'>
					<textarea
						{...commonInputProps}
						className={`${commonInputProps.className} min-h-[140px] font-mono text-xs`}
						value={serialized}
						onChange={(event) => handleStructuredFieldDraftChange(fieldKey, event.target.value)}
						onBlur={() => handleStructuredFieldCommit(fieldKey, fieldType)}
					/>
					{structuredFieldErrors[fieldKey] && (
						<div className='text-xs text-red-600'>{structuredFieldErrors[fieldKey]}</div>
					)}
				</div>
			)
		}

		const fallbackValue = fieldValue == null ? '' : String(fieldValue)
		return (
			<input
				{...commonInputProps}
				type='text'
				value={fallbackValue}
				onChange={(event) => onMobileFieldChange(fieldKey, event.target.value)}
			/>
		)
	}

	return (
		<div
			className={style.modal_background}
			onClick={() => setUserEditModal(false)}>
			<div className={style.modal_container}>
				<div
					className={style.modal_wrapper}
					onClick={(e) => e.stopPropagation()}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>User Info</div>
							<button
								onClick={() => setUserEditModal(false)}
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
									defaultValue={userEditing.name || 'Name not set'}
								/>
								<label htmlFor='name' className={style.modal_form_label}>
									User ID
								</label>
								<span className={style.modal_form_input}>{userId}</span>
								{/* Email */}
								<div className={style.modal_form_label}>Email</div>
								<input
									className={style.modal_form_input}
									id='email'
									type='text'
									onChange={onEmailChange}
									defaultValue={userEditing.email}
								/>
								{Object.keys(mobileUserDetails || {}).length > 0 && (
									<Fragment>
										<div className={`${style.modal_form_label} col-span-3 pt-4`}>
											Additional details
										</div>
										{Object.entries(mobileUserDetails).map(([fieldKey, fieldValue]) => (
											<Fragment key={fieldKey}>
												<label
													htmlFor={`mobile-field-${fieldKey}`}
													className={style.modal_form_label}>
													{formatFieldLabel(fieldKey)}
												</label>
												<div className='col-span-2'>
													{renderAdditionalField(fieldKey, fieldValue)}
												</div>
											</Fragment>
										))}
										{!isAdmin && (
											<div className='col-span-3 text-xs text-slate-600'>
												Only admins can edit these values.
											</div>
										)}
									</Fragment>
								)}
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
													onChange={() => onRoleChange("Admin")} // Update user role to "Admin" when this radio button is selected
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
													onChange={() => onRoleChange("Agency")} // Pass "Agency" as the selected role value
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
											    onChange={() => onRoleChange("User")} // Update user role to "User" when this radio button is selected
													className={style.modal_form_radio}
												/>
												User
											</label>
										</div>
										{/* Agency - TODO: dropdown to select/change agency */}
										{userRole === "Agency" && (
											<>
												<div className={style.modal_form_label}>Agency</div>
												<select
														id='agency'
														onChange={onAgencyChange}
														value={selectedAgency || ''}  // Ensure this is never null
														className={`${style.modal_form_input}`}
												>
														<option value="">None</option>
														{agenciesArray.map((agency) => (
																<option value={agency.id} key={agency.id}>
																		{agency.name}
																</option>
														))}
												</select>
											</>
										)}
									</>
								)}
								{mobileFieldFormError && (
									<div className='col-span-3 text-sm text-red-600 text-center'>
										{mobileFieldFormError}
									</div>
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
