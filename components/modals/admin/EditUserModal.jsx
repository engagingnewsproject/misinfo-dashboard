import React, { Fragment, useEffect, useMemo, useState } from "react"
import FormInput from '../../ui/FormInput'
import FormTextarea from '../../ui/FormTextarea'
import FormSelect from '../../ui/FormSelect'
import ModalCloseButton from '../../ui/ModalCloseButton'
import { State, City } from "country-state-city"
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	Switch,
	Typography,
} from '@material-tailwind/react'

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
	// Styles (form layout only — Dialog handles shell)
	const style = {
		modal_form_container:
			"grid justify-center md:gap-5 lg:gap-5 grid-cols-1 md:grid-cols-2 auto-cols-auto",
		modal_form_switch: "flex mb-4 items-center gap-2",
		modal_form_radio_container: "flex gap-4 flex-wrap mb-4",
		modal_form_radio: "mr-1",
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
	// Delay Dialog open one tick: MT Dialog + Floating UI 0.19 logs aria-hidden
	// "not contained inside body" when mounting with open={true} immediately.
	const [dialogOpen, setDialogOpen] = useState(false)

	useEffect(() => {
		const id = window.setTimeout(() => setDialogOpen(true), 0)
		return () => window.clearTimeout(id)
	}, [])

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
		const disabled = !isAdmin

		if (fieldType === 'boolean') {
			return (
				<div>
					<Typography variant="small" className="font-semibold mb-2">
						{formatFieldLabel(fieldKey)}
					</Typography>
					<div className={`${style.modal_form_switch} ${disabled ? 'opacity-60' : ''}`}>
						<Switch
							checked={Boolean(fieldValue)}
							onChange={(e) => commitMobileFieldChange(fieldKey, e.target.checked)}
							disabled={disabled}
							color="blue"
						/>
						<Typography variant="small" className="mb-0">
							{Boolean(fieldValue) ? 'Enabled' : 'Disabled'}
						</Typography>
					</div>
				</div>
			)
		}

		if (fieldType === 'number') {
			if (fieldKey === 'joiningDate') {
				const dateValue = unixSecondsToLocalInput(fieldValue)
				return (
					<FormInput
						id={inputId}
						type="datetime-local"
						label={formatFieldLabel(fieldKey)}
						value={dateValue}
						disabled={disabled}
						onChange={(e) => {
							const secs = localInputToUnixSeconds(e.target.value)
							commitMobileFieldChange(fieldKey, secs)
						}}
					/>
				)
			}

			const displayValue = fieldValue ?? ''
			return (
				<FormInput
					id={inputId}
					type="number"
					label={formatFieldLabel(fieldKey)}
					value={displayValue}
					disabled={disabled}
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
					<FormInput
						id={inputId}
						type='text'
						label='Timestamp (ISO or Firestore JSON)'
						placeholder='2024-10-31T12:00:00Z or {"seconds": 1698676800, "nanoseconds": 0}'
						value={draftValue}
						disabled={disabled}
						onChange={(event) => handleTimestampDraftChange(fieldKey, event.target.value)}
						onBlur={() => handleTimestampCommit(fieldKey)}
					/>
					{previewDate && (
						<Typography variant="small" className="text-slate-600 mb-0">
							Readable date: {previewDate}
						</Typography>
					)}
					{timestampErrors[fieldKey] && (
						<Typography variant="small" className="text-red-600 mb-0">
							{timestampErrors[fieldKey]}
						</Typography>
					)}
				</div>
			)
		}

		if (fieldType === 'geopoint') {
			const draft = geoPointDrafts[fieldKey] || { latitude: '', longitude: '' }
			return (
				<div className='flex flex-col gap-1'>
					<div className='grid grid-cols-2 gap-2'>
						<FormInput
							type='number'
							step='any'
							label='Latitude'
							disabled={disabled}
							id={`${inputId}-latitude`}
							value={draft.latitude}
							onChange={(event) => handleGeoPointDraftChange(fieldKey, 'latitude', event.target.value)}
							onBlur={() => handleGeoPointCommit(fieldKey)}
						/>
						<FormInput
							type='number'
							step='any'
							label='Longitude'
							disabled={disabled}
							id={`${inputId}-longitude`}
							value={draft.longitude}
							onChange={(event) => handleGeoPointDraftChange(fieldKey, 'longitude', event.target.value)}
							onBlur={() => handleGeoPointCommit(fieldKey)}
						/>
					</div>
					{geoPointErrors[fieldKey] && (
						<Typography variant="small" className="text-red-600 mb-0">
							{geoPointErrors[fieldKey]}
						</Typography>
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
					<FormTextarea
						id={inputId}
						label={formatFieldLabel(fieldKey)}
						className="font-mono text-xs"
						disabled={disabled}
						rows={6}
						value={serialized}
						onChange={(event) => handleStructuredFieldDraftChange(fieldKey, event.target.value)}
						onBlur={() => handleStructuredFieldCommit(fieldKey, fieldType)}
					/>
					{structuredFieldErrors[fieldKey] && (
						<Typography variant="small" className="text-red-600 mb-0">
							{structuredFieldErrors[fieldKey]}
						</Typography>
					)}
				</div>
			)
		}

		const fallbackValue = fieldValue == null ? '' : String(fieldValue)
		return (
			<FormInput
				id={inputId}
				type='text'
				label={formatFieldLabel(fieldKey)}
				value={fallbackValue}
				disabled={disabled}
				onChange={(event) => commitMobileFieldChange(fieldKey, event.target.value)}
			/>
		)
	}

	return (
		<Dialog data-component="EditUserModal"
			open={dialogOpen}
			handler={attemptCloseModal}
			size="xl"
			className="edit-user-modal rounded-md"
			dismiss={{
				outsidePress: (event) => {
					const target = event.target
					if (!(target instanceof Element)) return true
					if (
						target.closest(
							'.form-select__menu-portal, .form-select__menu',
						)
					) {
						return false
					}
					return true
				},
			}}>
			<DialogHeader className="justify-between gap-4">
				<Typography variant="h3" color="blue" className="mt-0 mb-0">
					User Info
				</Typography>
				<ModalCloseButton onClick={attemptCloseModal} />
			</DialogHeader>
			<DialogBody className="overflow-y-auto max-h-[calc(100dvh-8rem)]">
				<form onSubmit={(e) => { onFormSubmit(e); setHasUnsavedChanges(false); setUnsavedWarning('') }}>
					<div className={style.modal_form_container}>
						<div className="md:col-span-2">
							<FormInput
								id="name"
								type="text"
								label="Name"
								onChange={handleNameLocal}
								defaultValue={userEditing.name || 'Name not set'}
							/>
						</div>
						<div className="md:col-span-2">
							<FormInput
								id="userId"
								label="User ID"
								value={userId}
								disabled
							/>
						</div>
						<div className="md:col-span-2">
							<FormInput
								id="email"
								type="email"
								label="Email"
								onChange={handleEmailLocal}
								defaultValue={userEditing.email}
							/>
						</div>

						{/* Location (City & State) */}
						<div className='md:col-span-2 flex items-center justify-between pt-2'>
							<Typography variant="h5" color="blue" className="mt-0 mb-0">
								Location
							</Typography>
							{isAdmin && (
								<Button
									type="button"
									variant="text"
									size="sm"
									className="normal-case"
									onClick={() => {
										setIsEditingLocation((s) => !s)
										setLocationError('')
									}}>
									{isEditingLocation ? 'Cancel' : 'Change Location'}
								</Button>
							)}
						</div>

						{!isEditingLocation && (
							<Typography variant="small" className="md:col-span-2 text-slate-700 mb-0">
								Current: {cityDraft || '—'}, {stateDraft || '—'}
							</Typography>
						)}

						<div>
							<FormSelect
								id='state'
								label='State'
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
							/>
						</div>

						<div>
							<FormSelect
								id='city'
								label={
									selectedStateOption ? 'City' : 'Select a state first'
								}
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
							/>
						</div>

						{locationError && (
							<Typography variant="small" className="md:col-span-2 text-red-600 mb-0">
								{locationError}
							</Typography>
						)}

						{isAdmin && isEditingLocation && (
							<div className='md:col-span-2 flex justify-end'>
								<Button type="button" onClick={handleLocationSave}>
									Save Location
								</Button>
							</div>
						)}

						{Object.keys(mobileUserDetails || {}).length > 0 && (
							<Fragment>
								<Typography
									variant="h5"
									color="blue"
									className="md:col-span-2 mt-4 mb-0">
									Additional details
								</Typography>
								{Object.entries(mobileUserDetails)
									.filter(([k]) => k !== 'city' && k !== 'state')
									.map(([fieldKey, fieldValue]) => (
										<div key={fieldKey} className="md:col-span-2">
											{renderAdditionalField(fieldKey, fieldValue)}
										</div>
									))}
								{!isAdmin && (
									<Typography variant="small" className="md:col-span-2 text-slate-600 mb-0">
										Only admins can edit these values.
									</Typography>
								)}
							</Fragment>
						)}

						<div className={style.modal_form_switch}>
							<Typography variant="small" className="font-semibold mb-0 mr-2">
								Banned
							</Typography>
							<Switch
								checked={banned}
								onChange={(e) => {
									const next = e.target.checked
									setBanned(next)
									handleBannedLocal(next)
								}}
								color="red"
							/>
							<Typography variant="small" className="mb-0">
								{banned ? 'Banned' : 'Not banned'}
							</Typography>
						</div>

						{customClaims.admin && (
							<>
								<Typography variant="h5" color="blue" className="md:col-span-2 mt-2 mb-0">
									Permissions
								</Typography>
								<div className={`${style.modal_form_radio_container} md:col-span-2`}>
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
								{userRole === "Agency" && (
									<div className="md:col-span-2">
										<FormSelect
											id="agency"
											label="Agency"
											value={
												agenciesArray.find((a) => a.id === selectedAgency) || null
											}
											options={agenciesArray}
											getOptionLabel={(option) => option.name}
											getOptionValue={(option) => option.id}
											onChange={(option) => {
												handleAgencyLocal({
													preventDefault: () => {},
													target: { value: option?.id || '' },
												})
											}}
											isClearable
										/>
									</div>
								)}
							</>
						)}
						{unsavedWarning && (
							<Typography variant="small" className="md:col-span-2 text-red-600 text-center mb-0">
								{unsavedWarning}
							</Typography>
						)}
						{mobileFieldFormError && (
							<Typography variant="small" className="md:col-span-2 text-red-600 text-center mb-0">
								{mobileFieldFormError}
							</Typography>
						)}
						<div className='md:col-span-2 flex flex-col items-center gap-2 pt-2'>
							<Typography variant="small" className="mb-0">
								Current Role: {userRole}
							</Typography>
							<Button type='submit'>
								Update User
							</Button>
						</div>
					</div>
				</form>
			</DialogBody>
		</Dialog>
	)
}

export default EditUserModal
