import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../config/firebase'
import { updateDoc, doc } from 'firebase/firestore'
import { useTranslation } from 'next-i18next'
import { State, City } from 'country-state-city'
import FormSelect from '../ui/FormSelect'
import ModalCloseButton from '../ui/ModalCloseButton'
import {
	Button,
	Dialog,
	DialogBody,
	DialogHeader,
	Typography,
} from '@material-tailwind/react'

/**
 * Mount when visible (`{locationModal && <LocationModal ... />}`); Dialog is always open
 * while mounted, matching existing call sites.
 */
const LocationModal = ({ setLocationModal }) => {
	const { t } = useTranslation('Profile')
	const { user } = useAuth()
	const [userLocation, setUserLocation] = useState(null)
	const [errors, setErrors] = useState({})

	const handleClose = () => setLocationModal(false)

	const handleStateChange = (e) => {
		setUserLocation((data) => ({ ...data, state: e, city: null }))
	}

	const handleCityChange = (e) => {
		setUserLocation((data) => ({ ...data, city: e !== null ? e : null }))
	}

	const handleUserLocationChange = (e) => {
		e.preventDefault()
		const allErrors = {}

		if (!userLocation?.state) {
			allErrors.userState = 'Please enter a state.'
			setErrors(allErrors)
			return
		}

		const userDoc = doc(db, 'mobileUsers', user.accountId)
		updateDoc(userDoc, {
			state: userLocation?.state,
			city: userLocation?.city,
		}).then(() => {
			setLocationModal(false)
		})
	}

	return (
		<Dialog
			open
			handler={handleClose}
			size="xs"
			className="location-modal rounded-md"
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
					{t('addLocation')}
				</Typography>
				<ModalCloseButton onClick={handleClose} />
			</DialogHeader>
			<DialogBody>
				<form onSubmit={handleUserLocationChange}>
					<div className="mb-4">
						<FormSelect
							id="state"
							name="state"
							required
							label={t('NewReport:state_text')}
							value={userLocation?.state}
							options={State.getStatesOfCountry('US')}
							getOptionLabel={(options) => options['name']}
							getOptionValue={(options) => options['name']}
							onChange={handleStateChange}
						/>
					</div>
					<div className="mb-0.5">
						<FormSelect
							id="city"
							name="city"
							label={t('NewReport:city_text')}
							value={userLocation?.city}
							options={City.getCitiesOfState(
								userLocation?.state?.countryCode,
								userLocation?.state?.isoCode,
							)}
							getOptionLabel={(options) => options['name']}
							getOptionValue={(options) => options['name']}
							onChange={handleCityChange}
						/>
					</div>
					{errors.userState && !userLocation?.state && (
						<span className="text-red-500">{errors.userState}</span>
					)}

					<div className="mt-6">
						<Button
							disabled={userLocation?.state == null}
							type="submit"
							variant="filled"
							fullWidth>
							{t('updateLocation')}
						</Button>
					</div>
				</form>
			</DialogBody>
		</Dialog>
	)
}

export default LocationModal
