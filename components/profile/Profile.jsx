/**
 * @fileoverview Profile Component - User profile and agency management interface
 *
 * This component provides a comprehensive profile management interface for users and agencies.
 * Features include:
 * - Viewing and editing user profile information (name, email, password, location)
 * - Agency profile management (name, logo, location)
 * - Image upload and preview for agency logos
 * - Role-based access and UI (admin, agency, user)
 * - Language switching and localization
 * - Account deletion and logout with confirmation modals
 * - Integration with Firebase Auth, Firestore, and Storage
 * - Responsive design and accessibility
 *
 * Integrates with:
 * - UpdatePwModal, UpdateEmailModal, ConfirmModal, DeleteModal
 * - LocationUpdate form
 * - LanguageSwitcher
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React, { useState, useEffect, useRef, useTransition } from 'react'
import UpdatePwModal from '../modals/profile/UpdatePwModal'
import UpdateEmailModal from '../modals/profile/UpdateEmailModal'
import { useAuth } from '../../context/AuthContext'
// import { auth } from 'firebase-admin';
import ConfirmModal from '../modals/common/ConfirmModal'
import DeleteModal from '../modals/common/DeleteModal'
import { useRouter } from 'next/router'
import LanguageSwitcher from '../layout/LanguageSwitcher'
import {
  getDoc,
  updateDoc,
  doc,
} from 'firebase/firestore'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { db, auth, storage } from '../../config/firebase'
import { State, City } from 'country-state-city'
import { useTranslation } from 'next-i18next'
import globalStyles from '../../styles/globalStyles'
import { Button } from '@material-tailwind/react'
import AgencySettingsForm from './AgencySettingsForm'
import UserSettingsForm from './UserSettingsForm'
/**
 * Profile Component
 *
 * Renders the user profile page, allowing users to view and update their personal and agency information.
 * Handles role-based rendering for admins, agencies, and regular users.
 * Provides modals for updating email, password, and confirming account actions.
 *
 * @param {Object} props
 * @param {Object} props.customClaims - Custom claims object for role-based access
 * @returns {JSX.Element} The rendered profile management interface
 */
const Profile = ({ customClaims }) => {
  const { user, logout, verifyRole, disableUser } = useAuth()
  const { t } = useTranslation('Profile')
  const [openModal, setOpenModal] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [logoutModal, setLogoutModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [agency, setAgency] = useState([])
  const [agencyName, setAgencyName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAgency, setIsAgency] = useState(false)
  const router = useRouter()
  const [userRoles, setUserRoles] = useState({})
  const [data, setData] = useState({ country: 'US', state: null, city: null })
  const [userData, setUserData] = useState(null)
  const formRef = useRef()
  const [userLocation, setUserLocation] = useState(null)
  const [userLocationChange, setUserLocationChange] = useState(false)
  const [showUserMessage, setShowUserMessage] = useState(false)
  const [userUpdate, setUserUpdate] = useState(false)
  const [agencyState, setAgencyState] = useState(null)
  const [agencyCity, setAgencyCity] = useState(null)
  const [agencySectionEditing, setAgencySectionEditing] = useState(false)
  const [errors, setErrors] = useState({})
  const imgPicker = useRef(null)
  const [images, setImages] = useState([])
  const [agencyUpdate, setAgencyUpdate] = useState(false)
  const [agencyUpdateMessageShow, setAgencyUpdateMessageShow] = useState(false)

  const style = {
    sectionWrapper: 'flex flex-col',
  }

  /**
   * Fetches the current user's data from the mobileUsers collection.
   */
  const getCurrentUser = async () => {
    try {
      const mobileRef = await getDoc(doc(db, 'mobileUsers', user.accountId))
      setUserData(mobileRef.data())
      setUserLocation({
        state: mobileRef.data()?.state,
        city: mobileRef.data()?.city,
      })
      // console.log('User data fetched:', mobileRef.data())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  /**
   * Fetches the agency data for the current user.
   * Prefer claim agencyId (doc read); avoid agencyUsers collection queries under scoped rules.
   */
  const getAgencyData = async () => {
    try {
      let agencyDocId =
        typeof customClaims?.agencyId === 'string' ? customClaims.agencyId : ''
      if (!agencyDocId) {
        const claims = await verifyRole()
        agencyDocId =
          typeof claims?.agencyId === 'string' ? claims.agencyId : ''
      }
      if (!agencyDocId) {
        console.error('Agency profile: no agencyId on claims')
        return
      }
      const agencySnap = await getDoc(doc(db, 'agency', agencyDocId))
      if (!agencySnap.exists()) return
      setAgency({ id: agencySnap.id, ...agencySnap.data() })
      setAgencyName(agencySnap.data().name)
      setAgencyState(agencySnap.data().state)
      setAgencyCity(agencySnap.data().city)
    } catch (error) {
      console.error('Error fetching agency data:', error)
    }
  }

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (userData) {
      verifyRole().then(async (result) => {
        if (result.admin) {
          setIsAdmin(true)
        } else if (result.agency) {
          setIsAgency(true)
        } else {
          setIsAgency(false)
          setIsAdmin(false)
        }
        // console.log('Role verification result:', result)
      })
    }
  }, [userData])

  useEffect(() => {
    if (isAgency) {
      getAgencyData()
    }
  }, [isAgency, customClaims?.agencyId])

  /**
   * Saves the updated agency data to Firestore.
   * @param {Array<string>} imageURLs - Array of URLs for the new agency logo.
   */
  const saveAgency = async (imageURLs) => {
    const docRef = doc(db, 'agency', agency.id)
    console.log('Saving agency data:', {
      name: agencyName,
      logo: imageURLs,
      state: agencyState,
      city: agencyCity,
    })
    try {
      await updateDoc(docRef, {
        name: agencyName,
        logo: imageURLs.length > 0 ? imageURLs : agency.logo,
        state: agencyState,
        city: agencyCity,
      })
      // console.log('Agency data saved to Firestore')
    } catch (error) {
      console.error('Error saving agency data to Firestore:', error)
    }
  }

  /**
   * Maps saved agency city/state strings to country-state-city select options.
   * @param {string|null} stateName
   * @param {string|null} cityName
   * @param {string} [country='US']
   * @returns {{ state: Object|null, city: Object|null }}
   */
  const resolveAgencyLocationOptions = (
    stateName,
    cityName,
    country = 'US'
  ) => {
    if (!stateName) return { state: null, city: null }

    const targetState = String(stateName).toLowerCase()
    const state =
      State.getStatesOfCountry(country).find(
        (option) =>
          option.name.toLowerCase() === targetState ||
          option.isoCode.toLowerCase() === targetState
      ) || null

    if (!state || !cityName) return { state, city: null }

    const targetCity = String(cityName).toLowerCase()
    const city =
      City.getCitiesOfState(state.countryCode, state.isoCode).find(
        (option) => option.name.toLowerCase() === targetCity
      ) || null

    return { state, city }
  }

  /**
   * Enters agency section edit mode and prefills location selects.
   */
  const handleAgencyEdit = () => {
    const { state, city } = resolveAgencyLocationOptions(
      agencyState || agency?.state,
      agencyCity || agency?.city
    )
    setData({ country: 'US', state, city })
    setAgencySectionEditing(true)
    setErrors({})
  }

  /**
   * Cancels agency section edit and restores saved agency values.
   */
  const handleAgencyCancel = () => {
    setAgencyName(agency?.name || '')
    setAgencyState(agency?.state ?? null)
    setAgencyCity(agency?.city ?? null)
    setData({ country: 'US', state: null, city: null })
    setImages([])
    if (imgPicker.current) imgPicker.current.value = ''
    setErrors({})
    setAgencySectionEditing(false)
  }

  /**
   * Handles image file selection for logo upload.
   * @param {React.ChangeEvent} e - The event object.
   */
  const handleImageChange = (e) => {
    const selectedImages = []
    for (let i = 0; i < e.target.files.length; i++) {
      selectedImages.push(e.target.files[i])
    }
    setImages(selectedImages)
  }

  /**
   * Removes a pending logo image from the selection.
   * @param {number} index
   */
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    if (imgPicker.current) imgPicker.current.value = ''
  }
  
  /**
   * Handles the image upload process.
   * @returns {Promise<Array<string>>} - An array of uploaded image URLs.
   */
  const handleUpload = async () => {
    if (!storage) {
      console.warn('Storage not available'); 
      return []; 
    }
    const uploadPromises = images.map((image) => {
      const storageRef = ref(
        storage,
        `agencies/logo_${agency.id}_${new Date().getTime().toString()}.png`
      )
      const uploadTask = uploadBytesResumable(storageRef, image)
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => reject(error),
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL)
            })
          }
        )
      })
    })

    try {
      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading images:', error)
      return []
    }
  }

  useEffect(() => {
    if (agencyUpdate && Object.keys(errors).length === 0) {
      setAgencyUpdateMessageShow(true)
      // console.log('Agency updated successfully')

      const timeoutId = setTimeout(() => {
        setAgencyUpdateMessageShow(false)
      }, 5000)

      return () => clearTimeout(timeoutId)
    }
  }, [agencyUpdate, errors])

  /**
   * Handles changes in the agency name input field.
   * @param {React.ChangeEvent} e - The event object.
   */
  const handleAgencyNameChange = (e) => {
    e.preventDefault()
    setAgencyName(e.target.value)
  }

  /**
   * Handles changes in the agency state selection.
   * @param {Object} state - The selected state option.
   */
  const handleAgencyStateChange = (state) => {
    setData((data) => ({ ...data, state: state, city: null }))
    setAgencyState(state.name)
  }

  /**
   * Handles changes in the agency city selection.
   * @param {Object} city - The selected city option.
   */
  const handleAgencyCityChange = (city) => {
    setData((data) => ({ ...data, city: city !== null ? city : null }))
    setAgencyCity(city.name)
  }

  /**
   * Handles the form submission for agency updates.
   * @param {React.FormEvent} e - The event object.
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    const allErrors = {}

    if (!agencyName.trim()) {
      allErrors.name = 'Please enter an agency name.'
    }

    if (agencySectionEditing && data.state === null && !agencyState) {
      allErrors.state = 'Please enter a state.'
    }

    if (agencySectionEditing && data.city === null && !agencyCity) {
      allErrors.city = 'Please enter a city.'
    }

    if (Object.keys(allErrors).length === 0) {
      const imageURLs = await handleUpload()
      await saveAgency(imageURLs)
      setImages([])
      setData({ country: 'US', state: null, city: null })
      setAgency({
        ...agency,
        name: agencyName,
        state: agencyState,
        city: agencyCity,
        logo: imageURLs.length > 0 ? imageURLs : agency.logo,
      })
      setAgencySectionEditing(false)
      setAgencyUpdate(false)
      setAgencyUpdateMessageShow(true)
      setTimeout(() => {
        setAgencyUpdateMessageShow(false)
      }, 5000)
    } else {
      setErrors(allErrors)
    }
  }

  /**
   * Handles the logout action.
   */
  const handleLogout = () => {
    logout().then(() => {
      router.push('/login')
      // console.log('Logged out successfully')
    })
  }

  /**
   * Handles the account deletion action.
   */
  const handleDelete = async () => {
    const uidToDelete = user.accountId
    console.log(uidToDelete);
    if (
      !uidToDelete ||
      typeof uidToDelete !== 'string' ||
      uidToDelete.length > 128
    ) {
      console.error('Invalid UID:', uidToDelete)
      return
    }
    // await disableUser({ uid: uidToDelete })
    await disableUser(uidToDelete)
      .then(() => {
        router.push('/login')
        console.log('User has been successfully disabled');
      }).catch(error => {
        console.error('Failed to disable user:', error);
      });
  }

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const idTokenResult = await auth.currentUser.getIdTokenResult()
        setUserRoles(idTokenResult.claims)
        // console.log('User roles fetched:', idTokenResult.claims)
      } catch (error) {
        console.error('Error fetching user roles:', error)
      }
    }

    fetchUserRoles()
  }, [])

  /**
   * Renders the language switcher section.
   * @returns {JSX.Element} The language switcher component.
   */
  const languageToggle = () => (
    <div className="flex justify-between mx-0 my-6 tracking-normal items-center">
      <div className="text-xl font-extrabold text-[#2E3B4E]">
        {t('selectLanguage')}
      </div>
      <div>
        <LanguageSwitcher />
      </div>
    </div>
  )

// todo: change to "Disable account"
  /**
   * Renders logout + delete account actions (outside edit sections).
   * @returns {JSX.Element}
   */
  const accountActions = () => (
    <div className="mb-8 p-4">
      <div className="flex justify-between tracking-normal items-center mb-4">
        <div className="font-light">{t('logout')}</div>
        <Button
          variant="outlined"
          color="blue"
          onClick={() => setLogoutModal(true)}>
          {t('logout')}
        </Button>
      </div>
      <div className="flex justify-between tracking-normal items-center">
        <div className="font-light mr-4">{t('delete')}</div>
        <Button
          onClick={() => setDeleteModal(true)}
          variant="outlined" color="red" type="button">
          {t('request')}
        </Button>
      </div>
    </div>
  )

  return (
    <div
      className={`${
        customClaims === null
          ? globalStyles.page.wrap
          : globalStyles.page.wrap + ' md:p-12'
      }`}>
      <div className={style.sectionWrapper}>
        <UserSettingsForm
          isAgency={isAgency}
          agency={agency}
          agencyName={agencyName}
          email={user.email}
          user={user}
          userData={userData}
          setUserData={setUserData}
          onEditEmail={() => setEmailModal(true)}
          onEditPassword={() => setOpenModal(true)}
        />

        {!isAgency && !isAdmin && languageToggle()}
        {isAgency && (
          <AgencySettingsForm
            agency={agency}
            agencyName={agencyName}
            agencyCity={agencyCity}
            agencyState={agencyState}
            data={data}
            errors={errors}
            images={images}
            imgPicker={imgPicker}
            isEditing={agencySectionEditing}
            agencyUpdateMessageShow={agencyUpdateMessageShow}
            onEdit={handleAgencyEdit}
            onCancel={handleAgencyCancel}
            onSubmit={handleSubmit}
            onNameChange={handleAgencyNameChange}
            onStateChange={handleAgencyStateChange}
            onCityChange={handleAgencyCityChange}
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
          />
        )}
        {accountActions()}
      </div>

      {openModal && <UpdatePwModal setOpenModal={setOpenModal} />}
      {emailModal && <UpdateEmailModal setEmailModal={setEmailModal} />}
      {logoutModal && (
        <ConfirmModal
          func={handleLogout}
          title={t('areyousure')}
          subtitle=""
          CTA={t('logout')}
          closeModal={setLogoutModal}
        />
      )}
      {deleteModal && (
        <DeleteModal
          func={handleDelete}
          title={t('deleteAccount')}
          subtitle=""
          CTA={t('delete')}
          closeModal={setDeleteModal}
        />
      )}
    </div>
  )
}

export default Profile
