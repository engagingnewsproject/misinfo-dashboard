/**
 * @fileoverview User account settings section for the profile page.
 *
 * Email is always read-only (Auth + mobileUsers stay in sync only via admin
 * flows). Password shows a masked FormInput; Edit swaps the mask for
 * "Edit password" so the field can open the change-password modal.
 * Location editors also follow Edit mode.
 */
import React, { useRef, useState } from 'react'
import { Button } from '@material-tailwind/react'
import { useTranslation } from 'next-i18next'
import FormInput from '../ui/FormInput'
import LocationUpdate from '../partials/forms/LocationUpdate'

/** Placeholder mask — Auth never exposes the real password. */
const PASSWORD_MASK = '••••••••••••••••'

/**
 * Renders the account settings card (email, password, location).
 *
 * @param {Object} props
 * @param {string} props.email
 * @param {Object} props.user
 * @param {Object|null} props.userData
 * @param {(data: Object|null) => void} props.setUserData
 * @param {() => void} props.onEditPassword
 * @param {React.ReactNode} [props.pageTitle] - Optional PageTitle rendered at top of the card
 * @returns {JSX.Element}
 */
const UserSettingsForm = ({
  email,
  user,
  userData,
  setUserData,
  onEditPassword,
  pageTitle,
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

  const handlePasswordActivate = (e) => {
    if (!isEditing) return
    // Blur before opening so Dialog close doesn't restore focus here and
    // immediately re-trigger open (onFocus used to cause that loop).
    e?.currentTarget?.blur?.()
    onEditPassword?.()
  }

  return (
    <section
      data-component="UserSettingsForm"
      className="mb-8 rounded-md bg-white p-6 shadow-md">
      {pageTitle ? <div className="mb-4">{pageTitle}</div> : null}

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 w-full min-w-0">
            <FormInput
              id="user_email"
              label={t('email')}
              type="email"
              value={email || ''}
              disabled
            />
          </div>
          <div className="flex-1 w-full min-w-0">
            <FormInput
              id="user_password"
              label={t('password')}
              type={isEditing ? 'text' : 'password'}
              className={`bg-white ${isEditing ? 'cursor-pointer' : ''}`}
              value={isEditing ? t('editPassword') : PASSWORD_MASK}
              readOnly
              required
              onClick={handlePasswordActivate}
            />
          </div>
        </div>

        <LocationUpdate
          user={user}
          userData={userData}
          setUserData={setUserData}
          isEditing={isEditing}
          showFieldActions={false}
          saveRef={locationSaveRef}
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button
              type="button"
              variant="outlined"
              color="red"
              className="w-auto"
              onClick={handleCancel}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              color="blue"
              className="w-auto"
              onClick={handleDone}>
              {t('done')}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outlined"
            color="blue"
            className="w-auto"
            onClick={() => setIsEditing(true)}>
            {t('edit')}
          </Button>
        )}
      </div>
    </section>
  )
}

export default UserSettingsForm
