/**
 * @fileoverview User account settings section for the profile page.
 *
 * View mode is read-only; one Edit reveals email/password actions and
 * location editors. Logout lives outside this card.
 */
import React, { useRef, useState } from 'react'
import { Button } from '@material-tailwind/react'
import { useTranslation } from 'next-i18next'
import LocationUpdate from '../partials/forms/LocationUpdate'

/**
 * Renders the account settings card (agency, email, password, location).
 *
 * @param {Object} props
 * @param {boolean} props.isAgency
 * @param {Object|Array} props.agency
 * @param {string} props.agencyName
 * @param {string} props.email
 * @param {Object} props.user
 * @param {Object|null} props.userData
 * @param {(data: Object|null) => void} props.setUserData
 * @param {() => void} props.onEditEmail
 * @param {() => void} props.onEditPassword
 * @returns {JSX.Element}
 */
const UserSettingsForm = ({
  isAgency,
  agency,
  agencyName,
  email,
  user,
  userData,
  setUserData,
  onEditEmail,
  onEditPassword,
}) => {
  const { t } = useTranslation('Profile')
  const [isEditing, setIsEditing] = useState(false)
  const locationSaveRef = useRef(null)

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleDone = async () => {
    const save = locationSaveRef.current
    if (save) {
      const ok = await save()
      if (ok === false) return
    }
    setIsEditing(false)
  }

  return (
    <section className="mb-8 p-4 bg-white rounded-lg border border-blue-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-extrabold text-blue-600 tracking-wider">
          {t('account')}
        </h1>
        {isEditing ? (
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="outlined"
              color="red"
              onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button type="button" color="blue" onClick={handleDone}>
              Done
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outlined"
            color="blue"
            className="shrink-0"
            onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {isAgency && (
          <div className="flex justify-between tracking-normal items-center">
            <div className="font-light">
              {Array.isArray(agency) && agency.length > 1
                ? 'Agencies'
                : 'Agency'}
            </div>
            <div className="font-light">{agencyName}</div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-start md:justify-between tracking-normal items-stretch md:items-center gap-2">
          <div className="font-light">
            {t('email')}
          </div>
          <div className="flex gap-2 tracking-normal items-center justify-between">
            <div className="font-light">{email}</div>
            {isEditing && (
              <Button variant="outlined" color="blue" onClick={onEditEmail}>
                {t('editEmail')}
              </Button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-between tracking-normal items-center">
            <div className="font-light">{t('resetPassword')}</div>
            <Button variant="outlined" color="blue" onClick={onEditPassword}>
              {t('editPassword')}
            </Button>
          </div>
        )}

        <LocationUpdate
          user={user}
          userData={userData}
          setUserData={setUserData}
          isEditing={isEditing}
          showFieldActions={false}
          saveRef={locationSaveRef}
        />
      </div>
    </section>
  )
}

export default UserSettingsForm
