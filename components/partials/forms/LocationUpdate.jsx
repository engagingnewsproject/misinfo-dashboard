/**
 * @fileoverview User location update for the profile page.
 *
 * Loads/saves the signed-in user's city and state on mobileUsers, using
 * the shared LocationField UI so it matches Agency Settings.
 */
import React, { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useTranslation } from 'next-i18next'
import LocationField from './LocationField'

/**
 * Manages user location edit state and Firestore persistence.
 *
 * @param {Object} props
 * @param {Object} props.user - Auth user with accountId
 * @param {Object|null} props.userData - Current mobileUsers profile
 * @param {(data: Object|null) => void} props.setUserData
 * @param {boolean} [props.isEditing] - When set, section owns edit mode
 * @param {boolean} [props.showFieldActions=true] - Show per-field Edit/Cancel/Save
 * @param {React.MutableRefObject<(() => Promise<boolean>)|null>} [props.saveRef]
 * @returns {JSX.Element}
 */
const LocationUpdate = ({
  user,
  userData,
  setUserData,
  isEditing: isEditingProp,
  showFieldActions = true,
  saveRef,
}) => {
  const { t } = useTranslation('Profile')
  const isControlled = isEditingProp !== undefined

  const [userLocation, setUserLocation] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showUserMessage, setShowUserMessage] = useState(false)
  const [update, setUpdate] = useState(false)
  const [errors, setErrors] = useState({})

  const isEditing = isControlled ? isEditingProp : showForm

  const seedFromUserData = () => {
    setUserLocation({
      state: userData?.state ?? null,
      city: userData?.city ?? null,
    })
  }

  const getData = async () => {
    try {
      const mobileRef = await getDoc(doc(db, 'mobileUsers', user.accountId))
      const data = mobileRef.data()
      setUserData(data)
      setUserLocation({
        state: data?.state,
        city: data?.city,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()

    // Nothing selected and nothing saved yet — allow Done without writing
    if (!userLocation?.state && !userLocation?.city) {
      if (!userData?.state && !userData?.city) {
        setErrors({})
        return true
      }
    }

    const allErrors = {}
    if (!userLocation?.state) {
      allErrors.state = 'Please enter a state.'
    } else if (!userLocation?.city) {
      allErrors.city = 'Please enter a city.'
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      return false
    }

    try {
      setUserData({
        state: userLocation.state,
        city: userLocation.city,
      })
      setUpdate((prev) => !prev)
      const userDoc = doc(db, 'mobileUsers', user.accountId)
      await updateDoc(userDoc, {
        state: userLocation?.state,
        city: userLocation?.city,
      })
      await getData()
      setErrors({})
      return true
    } catch (error) {
      console.error('Error updating user location:', error)
      return false
    }
  }

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSubmit
      return () => {
        saveRef.current = null
      }
    }
  })

  useEffect(() => {
    if (!isControlled) return
    if (isEditingProp) {
      seedFromUserData()
      setErrors({})
    } else {
      seedFromUserData()
      setErrors({})
    }
  }, [isEditingProp])

  const handleToggleEdit = (e) => {
    e?.preventDefault?.()
    if (showForm) {
      setShowForm(false)
      setErrors({})
      seedFromUserData()
      return
    }
    setShowForm(true)
    seedFromUserData()
  }

  const handleUserStateChange = (state) => {
    setUserLocation((data) => ({ ...data, state, city: null }))
  }

  const handleUserCityChange = (city) => {
    setUserLocation((data) => ({
      ...data,
      city: city !== null ? city : null,
    }))
  }

  useEffect(() => {
    if (update) {
      setShowUserMessage(true)
      if (!isControlled) setShowForm(false)
    }
    return () => {
      setTimeout(() => {
        setShowUserMessage(false)
      }, 3000)
    }
  }, [update, isControlled])

  const cityName = userData?.city?.name || ''
  const stateName = userData?.state?.name || ''

  return (
    <LocationField
      idPrefix="user"
      label={t('editLocation')}
      isEditing={isEditing}
      displayValue={
        cityName || stateName ? `${cityName}, ${stateName}` : ''
      }
      country="US"
      stateValue={userLocation?.state ?? null}
      cityValue={userLocation?.city ?? null}
      errors={errors}
      onToggleEdit={handleToggleEdit}
      onStateChange={handleUserStateChange}
      onCityChange={handleUserCityChange}
      stateLabel={t('NewReport:state_text')}
      cityLabel={t('NewReport:city_text')}
      cancelLabel={t('cancelChanges')}
      showEditButton={showFieldActions}
      showCancelButton={showFieldActions}
      onSave={showFieldActions ? handleSubmit : undefined}
      saveLabel={t('updateLocation')}
      successMessage={showUserMessage ? t('location') : null}
    />
  )
}

export default LocationUpdate
