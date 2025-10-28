import React, { Fragment, useEffect, useMemo, useState } from "react"
import { IoClose } from "react-icons/io5"
import { Switch } from "@headlessui/react"
import Select from "react-select"
import { State, City } from "country-state-city"

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
			"absolute top-8 inset-0 flex justify-center items-start z-[9999] overflow-y-scroll",
		modal_wrapper:
			"flex-col justify-center items-start w-10/12 rounded-2xl py-10 px-10 bg-sky-100 sm:overflow-visible",
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
	const [cityDraft, setCityDraft] = useState('')
	const [stateDraft, setStateDraft] = useState('')
	const [isEditingLocation, setIsEditingLocation] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const [unsavedWarning, setUnsavedWarning] = useState('')
	const [locationError, setLocationError] = useState('')
	const [selectedStateOption, setSelectedStateOption] = useState(null)
	const [selectedCityOption, setSelectedCityOption] = useState(null)

	const stateOptions = useMemo(() => State.getStatesOfCountry('US'), [])
	const cityOptions = useMemo(() => {
		if (!selectedStateOption) return []
		return City.getCitiesOfState(
			selectedStateOption.countryCode,
			selectedStateOption.isoCode,
		)
	}, [selectedStateOption])

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

	// Convert Unix seconds <-> input[type="datetime-local"] value
	const unixSecondsToLocalInput = (secs) => {
		if (secs === undefined || secs === null || Number.isNaN(Number(secs))) return ''
		const d = new Date(Number(secs) * 1000)
		const pad = (n) => String(n).padStart(2, '0')
		const yyyy = d.getFullYear()
		const MM = pad(d.getMonth() + 1)
		const dd = pad(d.getDate())
		const hh = pad(d.getHours())
		const mm = pad(d.getMinutes())
		return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
	}

	const localInputToUnixSeconds = (str) => {
		if (!str) return null
		const ms = new Date(str).getTime()
		return Number.isNaN(ms) ? null : Math.floor(ms / 1000)
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

	// Helper: normalize city/state to string values
	const normalizeTextFrom = (value, preferenceKeys = []) => {
		if (value == null) return ''
		if (typeof value === 'string') return value
		if (typeof value === 'number') return String(value)
		if (Array.isArray(value)) {
			return value.map((v) => normalizeTextFrom(v, preferenceKeys)).filter(Boolean).join(', ')
		}
		if (typeof value === 'object') {
			for (const k of preferenceKeys) {
				if (typeof value[k] === 'string' && value[k].trim()) return value[k]
			}
			// Last resort: try a generic human-friendly field
			if (typeof value.label === 'string') return value.label
			if (typeof value.value === 'string') return value.value
		}
		return ''
	}

	const normalizeCityState = (rawCity, rawState) => {
		const cityText = normalizeTextFrom(rawCity, ['name', 'city', 'text', 'label', 'value'])
		const stateFromTopLevel = normalizeTextFrom(rawState, ['code', 'abbr', 'abbreviation', 'state', 'name', 'text'])
		const stateFromCity =
			rawCity && typeof rawCity === 'object' && !Array.isArray(rawCity)
				? (rawCity.stateCode || rawCity.state || '')
				: ''
		return { city: cityText, state: stateFromTopLevel || stateFromCity }
	}

	// Helper: build an object for a field expected to be an object, preserving prior keys
	const upsertObjectValue = (prev, newText, preferredKeys = [], fallbackKey = 'name') => {
		const base = (prev && typeof prev === 'object' && !Array.isArray(prev)) ? { ...prev } : {}
		if (!newText) return null
		// choose the first matching key present in prev, else preferred list, else fallback
		const keysToTry = [
			...preferredKeys.filter((k) => base.hasOwnProperty(k)),
			...preferredKeys,
			fallbackKey,
		]
		const chosenKey = keysToTry.find(Boolean)
		base[chosenKey] = newText
		return base
	}

	// Helper: update city map (preserve all existing keys like countryCode, latitude, longitude, stateCode)
	const mergeCityMap = (prevCity, { name, stateCode, countryCode, latitude, longitude }) => {
		const base = (prevCity && typeof prevCity === 'object' && !Array.isArray(prevCity)) ? { ...prevCity } : {}
		if (name != null && name !== '') base.name = name
		if (stateCode != null && stateCode !== '') base.stateCode = stateCode
		if (countryCode != null && countryCode !== '') base.countryCode = countryCode
		if (latitude !== undefined) {
			const lat = Number(latitude)
			if (!Number.isNaN(lat)) base.latitude = lat
		}
		if (longitude !== undefined) {
			const lng = Number(longitude)
			if (!Number.isNaN(lng)) base.longitude = lng
		}
		return Object.keys(base).length ? base : null
	}

	// Mark-as-dirty wrappers
	const commitMobileFieldChange = (key, value) => {
		setHasUnsavedChanges(true)
		onMobileFieldChange && onMobileFieldChange(key, value)
	}
	const handleNameLocal = (e) => { setHasUnsavedChanges(true); onNameChange && onNameChange(e) }
	const handleEmailLocal = (e) => { setHasUnsavedChanges(true); onEmailChange && onEmailChange(e) }
	const handleRoleLocal = (role) => { setHasUnsavedChanges(true); onRoleChange && onRoleChange(role) }
	const handleAgencyLocal = (e) => { setHasUnsavedChanges(true); onAgencyChange && onAgencyChange(e) }
	const handleBannedLocal = (checked) => { setHasUnsavedChanges(true); onBannedChange && onBannedChange(checked) }

	// Intercept modal close if there are unsaved changes
	const attemptCloseModal = () => {
		if (isAdmin && hasUnsavedChanges) {
			setUnsavedWarning('Did you save your changes?')
			return
		}
		setUserEditModal(false)
	}

	// Sync dropdown selections with the user's existing location data
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

	useEffect(() => {
		const sourceCity = mobileUserDetails?.city ?? userEditing?.city
		const sourceState = mobileUserDetails?.state ?? userEditing?.state
		const { city, state } = normalizeCityState(sourceCity, sourceState)

		setCityDraft(city)
		setStateDraft(state)

		let nextStateOption = null

		const tryFindState = (matcher) =>
			stateOptions.find((option) => matcher(option)) || null

		if (sourceState && typeof sourceState === 'object' && !Array.isArray(sourceState)) {
			const isoCode = sourceState.isoCode || sourceState.code || sourceState.stateCode
			if (isoCode) {
				nextStateOption = tryFindState((option) => option.isoCode === isoCode)
			}
			if (!nextStateOption && sourceState.name) {
				const target = String(sourceState.name).toLowerCase()
				nextStateOption = tryFindState((option) => option.name.toLowerCase() === target)
			}
		}

		if (!nextStateOption && state) {
			const normalizedState = state.toLowerCase()
			nextStateOption = tryFindState(
				(option) =>
					option.name.toLowerCase() === normalizedState ||
					option.isoCode.toLowerCase() === normalizedState,
			)
		}

		setSelectedStateOption(nextStateOption)

		let nextCityOption = null
		if (nextStateOption) {
			const candidateCities = City.getCitiesOfState(
				nextStateOption.countryCode,
				nextStateOption.isoCode,
			)
			if (sourceCity && typeof sourceCity === 'object' && !Array.isArray(sourceCity)) {
				if (sourceCity.name) {
					const target = String(sourceCity.name).toLowerCase()
					nextCityOption = candidateCities.find((cityOption) => {
						const matchName = cityOption.name.toLowerCase() === target
						const matchStateCode = sourceCity.stateCode
							? cityOption.stateCode === sourceCity.stateCode
							: true
						return matchName && matchStateCode
					})
				}
				if (!nextCityOption && sourceCity.latitude && sourceCity.longitude) {
					const lat = Number(sourceCity.latitude)
					const lng = Number(sourceCity.longitude)
					if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
						nextCityOption = candidateCities.find(
							(cityOption) =>
								Number(cityOption.latitude) === lat &&
								Number(cityOption.longitude) === lng,
						)
					}
				}
			}
			if (!nextCityOption && city) {
				const targetCity = city.toLowerCase()
				nextCityOption = candidateCities.find(
					(cityOption) => cityOption.name.toLowerCase() === targetCity,
				)
			}
		}

		setSelectedCityOption(nextCityOption)
		setLocationError('')
	}, [mobileUserDetails, userEditing, stateOptions])

	const handleLocationSave = () => {
		if (!isAdmin) return

		if (!selectedStateOption || !selectedCityOption) {
			setLocationError('Select both a state and a city.')
			return
		}

		const cityText = selectedCityOption.name?.trim?.() || ''
		const stateText = selectedStateOption.name?.trim?.() || ''

		const cityType = mobileUserFieldTypes?.city?.type
		const stateType = mobileUserFieldTypes?.state?.type

		// Start from the actual current city map only (avoid falling back to any generic originalValue)
		const prevCity = mobileUserDetails?.city

		let nextCityValue = null

		if (cityType === 'object' || typeof prevCity === 'object') {
			// Preferred schema: everything lives under the city map
			nextCityValue = mergeCityMap(prevCity, {
				name: cityText,
				stateCode: selectedCityOption.stateCode || selectedStateOption.isoCode,
				countryCode: selectedCityOption.countryCode || selectedStateOption.countryCode,
				latitude:
					selectedCityOption.latitude != null
						? Number(selectedCityOption.latitude)
						: undefined,
				longitude:
					selectedCityOption.longitude != null
						? Number(selectedCityOption.longitude)
						: undefined,
			})
			commitMobileFieldChange('city', nextCityValue)
		} else if (cityType === 'array') {
			nextCityValue = cityText ? [cityText] : null
			commitMobileFieldChange('city', nextCityValue)
		} else {
			// city is a plain string/number field
			commitMobileFieldChange('city', cityText || null)
		}

		// Only write a separate top-level `state` field if the schema explicitly defines it
		if (stateType) {
			let nextStateValue = stateText || null
			if (stateType === 'object') {
				const prevState = mobileUserDetails?.state
				const statePayload = {
					...(prevState && typeof prevState === 'object' && !Array.isArray(prevState)
						? prevState
						: {}),
					name: selectedStateOption.name,
					countryCode: selectedStateOption.countryCode,
					isoCode: selectedStateOption.isoCode,
				}
				nextStateValue = statePayload
			}
			if (stateType === 'array' && stateText) nextStateValue = [stateText]
			commitMobileFieldChange('state', nextStateValue)
		}

		setLocationError('')
		setIsEditingLocation(false)
	}

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
			commitMobileFieldChange(fieldKey, null)
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
			commitMobileFieldChange(fieldKey, parsedValue)
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
			commitMobileFieldChange(fieldKey, null)
			clearTimestampError(fieldKey)
			return
		}

		const parsedDate = new Date(trimmedValue)
		if (!Number.isNaN(parsedDate.getTime())) {
			commitMobileFieldChange(fieldKey, trimmedValue)
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
					commitMobileFieldChange(fieldKey, {
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
			commitMobileFieldChange(fieldKey, null)
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

		commitMobileFieldChange(fieldKey, { latitude, longitude })
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
						onChange={(checked) => commitMobileFieldChange(fieldKey, checked)}
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
			// Special-case: numeric Unix-seconds timestamp for joiningDate
			if (fieldKey === 'joiningDate') {
				const dateValue = unixSecondsToLocalInput(fieldValue)
				return (
					<input
						{...commonInputProps}
						type='datetime-local'
						value={dateValue}
						onChange={(e) => {
							const secs = localInputToUnixSeconds(e.target.value)
							commitMobileFieldChange(fieldKey, secs)
						}}
					/>
				)
			}

			// Default numeric field
			const displayValue = fieldValue ?? ''
			return (
				<input
					{...commonInputProps}
					type='number'
					value={displayValue}
					onChange={(event) => {
						const { value } = event.target
						commitMobileFieldChange(
							fieldKey,
							value === '' ? '' : Number(value),
						)
					}}
				/>
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
				onChange={(event) => commitMobileFieldChange(fieldKey, event.target.value)}
			/>
		)
	}

	return (
		<div
			className={style.modal_background}
			onClick={attemptCloseModal}>
			<div className={style.modal_container}>
				<div
					className={style.modal_wrapper}
					onClick={(e) => e.stopPropagation()}>
					<div className={style.modal_header_container}>
						<div className={style.modal_header_wrapper}>
							<div className={style.modal_header}>User Info</div>
							<button
								onClick={attemptCloseModal}
								className={style.modal_close}>
								<IoClose size={25} />
							</button>
						</div>
					</div>
					<div>
						<form onSubmit={(e) => { onFormSubmit(e); setHasUnsavedChanges(false); setUnsavedWarning('') }}>
							<div className={style.modal_form_container}>
								{/* Name */}
								<label htmlFor='name' className={style.modal_form_label}>
									Name
								</label>
								<input
									className={style.modal_form_input}
									id='name'
									type='text'
									onChange={handleNameLocal}
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
									onChange={handleEmailLocal}
									defaultValue={userEditing.email}
								/>

								{/* Location (City & State) */}
								<div className='col-span-3 flex items-center justify-between pt-2'>
									<div className={style.modal_form_label}>Location</div>
									{isAdmin && (
										<button
											type='button'
											className='text-blue-600 underline'
											onClick={() => {
												setIsEditingLocation((s) => !s)
												setLocationError('')
											}}
										>
											{isEditingLocation ? 'Cancel' : 'Change Location'}
										</button>
									)}
								</div>

								{/* Show current location when not editing */}
								{!isEditingLocation && (
									<div className='col-span-3 text-sm text-slate-700 pb-1'>
										Current: {cityDraft || '—'}, {stateDraft || '—'}
									</div>
								)}

								<label htmlFor='state' className={style.modal_form_label}>State</label>
								<div className='col-span-2'>
									<Select
										inputId='state'
										className='text-sm'
										classNamePrefix='location-select'
										isDisabled={!isAdmin || !isEditingLocation}
										value={selectedStateOption}
										onChange={(option) => {
											setSelectedStateOption(option || null)
											setSelectedCityOption(null)
											setStateDraft(option?.name || '')
											setCityDraft('')
											setHasUnsavedChanges(true)
											setLocationError('')
										}}
										options={stateOptions}
										getOptionLabel={(option) => option.name}
										getOptionValue={(option) => option.isoCode}
										placeholder='Select a state'
									/>
								</div>

								<label htmlFor='city' className={style.modal_form_label}>City</label>
								<div className='col-span-2'>
									<Select
										inputId='city'
										className='text-sm'
										classNamePrefix='location-select'
										isDisabled={
											!isAdmin || !isEditingLocation || !selectedStateOption
										}
										value={selectedCityOption}
										onChange={(option) => {
											setSelectedCityOption(option || null)
											setCityDraft(option?.name || '')
											setHasUnsavedChanges(true)
											setLocationError('')
										}}
										options={cityOptions}
										getOptionLabel={(option) => option.name}
										getOptionValue={(option) =>
											`${option.name}-${option.stateCode}-${option.latitude}-${option.longitude}`
										}
										placeholder={
											selectedStateOption ? 'Select a city' : 'Select a state first'
										}
									/>
								</div>

								{locationError && (
									<div className='col-span-3 text-sm text-red-600'>{locationError}</div>
								)}

								{/* Save location */}
								{isAdmin && isEditingLocation && (
									<div className='col-span-3 flex justify-end'>
										<button
											type='button'
											className={style.modal_form_button}
											onClick={handleLocationSave}
										>
											Save Location
										</button>
									</div>
								)}

								{Object.keys(mobileUserDetails || {}).length > 0 && (
									<Fragment>
										<div className={`${style.modal_header} col-span-3 pt-4`}>
											Additional details
										</div>
										{Object.entries(mobileUserDetails)
											.filter(([k]) => k !== 'city' && k !== 'state')
											.map(([fieldKey, fieldValue]) => (
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
										checked={banned}
										onChange={(checked) => handleBannedLocal(checked)}
										onClick={() => { setBanned(!banned); setHasUnsavedChanges(true) }}
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
													onChange={() => handleRoleLocal("Admin")}
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
													onChange={() => handleRoleLocal("Agency")}
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
													onChange={() => handleRoleLocal("User")}
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
													onChange={(e) => handleAgencyLocal(e)}
													value={selectedAgency || ''}
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
								{unsavedWarning && (
									<div className='col-span-3 text-sm text-red-600 text-center'>
										{unsavedWarning}
									</div>
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
