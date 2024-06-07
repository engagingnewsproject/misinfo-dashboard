import React, { useState, useEffect, useRef, useTransition } from 'react'
import UpdatePwModal from './modals/UpdatePwModal'
import UpdateEmailModal from './modals/UpdateEmailModal'
import { useAuth } from '../context/AuthContext'
// import { auth } from 'firebase-admin';
import ConfirmModal from './modals/ConfirmModal'
import DeleteModal from './modals/DeleteModal'
import { useRouter } from 'next/router'
import LanguageSwitcher from './LanguageSwitcher'
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { db, auth } from '../config/firebase'
import { State, City } from 'country-state-city'
import Select from 'react-select'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import globalStyles from '../styles/globalStyles'
import LocationUpdate from './partials/forms/LocationUpdate'
import { Button } from '@material-tailwind/react'

const Profile = ({ customClaims }) => {
  const { user, logout, verifyRole, deleteUser } = useAuth()
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
  const [agencyLocationEdit, setAgencyLocationEdit] = useState(false)
  const [isSearchable, setIsSearchable] = useState(true)
  const [errors, setErrors] = useState({})
  const imgPicker = useRef(null)
  const storage = getStorage()
  const [editLogo, setEditLogo] = useState(false)
  const [images, setImages] = useState([])
  const [imageURLs, setImageURLs] = useState([])
  const [agencyUpdate, setAgencyUpdate] = useState(false)
  const [agencyUpdateMessageShow, setAgencyUpdateMessageShow] = useState(false)

  const style = {
    sectionContainer: 'w-full h-full flex flex-col mb-5 overflow-visible',
    sectionWrapper: 'flex flex-col',
    button:
      'bg-blue-600 col-start-3 self-end hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline',
    buttonHollow:
      'bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl',
    input:
      'text-md font-light bg-white rounded-xl p-4 border-none w-full focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none resize-none',
    inputSelect:
      'border-gray-300 col-span-1 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
    buttonCancel:
      ' col-start-3 border-solid border-red-500 self-end hover:bg-blue-700 text-sm text-red-500 font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline',
    fileUploadButton:
      'block flex flex-col text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer',
  }

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

  const getAgencyData = async () => {
    const agencyCollection = collection(db, 'agency')
    const q = query(
      agencyCollection,
      where('agencyUsers', 'array-contains', user['email'])
    )
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const agencyDoc = querySnapshot.docs[0]
      setAgency({ id: agencyDoc.id, ...agencyDoc.data() })
      setAgencyName(agencyDoc.data().name)
      setAgencyState(agencyDoc.data().state)
      setAgencyCity(agencyDoc.data().city)
      // console.log('Agency data fetched:', agencyDoc.data())
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
  }, [isAgency])

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

  const handleLogoEdit = (e) => {
    e.preventDefault()
    setEditLogo(!editLogo)
  }

  const handleImageChange = (e) => {
    const selectedImages = []
    for (let i = 0; i < e.target.files.length; i++) {
      selectedImages.push(e.target.files[i])
    }
    setImages(selectedImages)
    // console.log('Selected images:', selectedImages)
  }

  const handleUpload = async () => {
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
      const urls = await Promise.all(uploadPromises)
      setImageURLs(urls)
      // console.log('Uploaded image URLs:', urls)
      return urls
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

  const handleAgencyNameChange = (e) => {
    e.preventDefault()
    setAgencyName(e.target.value)
  }

  const handleAgencyLocationChange = (e) => {
    e.preventDefault()
    setAgencyLocationEdit(!agencyLocationEdit)
  }

  const handleAgencyStateChange = (e) => {
    setData((data) => ({ ...data, state: e, city: null }))
    setAgencyState(e.name) // Set state name
  }

  const handleAgencyCityChange = (e) => {
    setData((data) => ({ ...data, city: e !== null ? e : null }))
    setAgencyCity(e.name) // Set city name
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const allErrors = {}

    if (!agencyName.trim()) {
      allErrors.name = 'Please enter an agency name.'
    }

    if (agencyState === null && agencyLocationEdit) {
      allErrors.state = 'Please enter a state.'
    }

    if (agencyCity === null && agencyLocationEdit) {
      allErrors.city = 'Please enter a city.'
    }

    if (Object.keys(allErrors).length === 0) {
      const imageURLs = await handleUpload() // Ensure images are uploaded before saving
      await saveAgency(imageURLs)
      // Reset states after submission.
      setImages([])
      setEditLogo(false)
      // Reset the form fields or other dependent states if necessary
      setData({ ...data, state: null, city: null }) // Reset location data if used for form fields
      setAgency({
        ...agency,
        logo: imageURLs.length > 0 ? imageURLs : agency.logo,
      })
      setAgencyUpdate(false) // Allow new updates
      setAgencyUpdateMessageShow(true)
      console.log('Form submitted successfully')

      setTimeout(() => {
        setAgencyUpdateMessageShow(false)
      }, 5000)
    } else {
      setErrors(allErrors)
      console.log('Form submission errors:', allErrors)
    }
  }

  const handleLogout = () => {
    logout().then(() => {
      router.push('/login')
      // console.log('Logged out successfully')
    })
  }

  const handleDelete = async () => {
    const uidToDelete = user.accountId

    if (
      !uidToDelete ||
      typeof uidToDelete !== 'string' ||
      uidToDelete.length > 128
    ) {
      console.error('Invalid UID:', uidToDelete)
      return
    }
    await deleteUser({ uid: uidToDelete })
      .then(() => {
        router.push('/login')
        // console.log('User deleted successfully')
      })
      .catch((error) => {
        console.error('Error deleting user:', error)
      })
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

  const languageToggle = () => (
    <div className="flex justify-between mx-0 my-6 tracking-normal items-center">
      <div className="text-xl font-extrabold text-blue-600">
        {t('selectLanguage')}
      </div>
      <div>
        <LanguageSwitcher />
      </div>
    </div>
  )

  const agencySettings = () => (
    <div className="z-0 flex-col m-6 bg-slate-100">
      <div className="text-xl font-extrabold text-blue-600 tracking-wider">
        Agency Settings
      </div>
      <div className="w-full h-auto">
        <form
          id="agencyDesign"
          className="flex flex-col"
          onSubmit={handleSubmit}>
          <div className="mt-4 mb-4 grid gap-4">
            <div className="grid grid-cols-4 items-center">
              <div className="col-span-1">Agency Name</div>
              <div className="col-span-3">
                <input
                  id="agency_name"
                  onChange={(e) => {
                    handleAgencyNameChange(e)
                  }}
                  placeholder="Agency name"
                  type="text"
                  className={style.input}
                  value={agencyName}
                />
                {errors.name && (
                  <span className="text-red-500 text-xs">{errors.name}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center">
              <div className="col-span-1">Agency Location</div>
              <div className="col-span-3 grid grid-cols-8 items-center bg-white rounded-md px-3">
                <div
                  className={`col-span-8 ${
                    agencyLocationEdit === false
                      ? ' visible relative'
                      : ' hidden absolute'
                  }`}
                  onClick={handleAgencyLocationChange}>
                  <div className={style.input}>{`${agencyCity || ''}, ${
                    agencyState || ''
                  }`}</div>
                </div>
                <Select
                  className={` col-start-1 row-start-1 col-span-3 ${
                    (style.inputSelect,
                    agencyLocationEdit === true
                      ? ' visible relative'
                      : ' hidden absolute ')
                  }`}
                  id="state"
                  type="text"
                  placeholder="State"
                  isSearchable={isSearchable}
                  value={data.state}
                  options={State.getStatesOfCountry(data.country)}
                  getOptionLabel={(options) => options['name']}
                  getOptionValue={(options) => options['name']}
                  label="state"
                  onChange={(state) => {
                    handleAgencyStateChange(state)
                  }}
                />
                {errors.state && data.state === null && (
                  <span className="text-red-500 text-xs col-start-1 col-span-3">
                    {errors.state}
                  </span>
                )}
                <Select
                  className={`${
                    (style.inputSelect,
                    agencyLocationEdit === true
                      ? ' visible relative'
                      : ' hidden absolute')
                  } ml-4 p-3 col-start-4 col-span-3 row-start-1`}
                  id="city"
                  type="text"
                  placeholder="City"
                  value={data.city}
                  options={City.getCitiesOfState(
                    data.state?.countryCode,
                    data.state?.isoCode
                  )}
                  getOptionLabel={(options) => options['name']}
                  getOptionValue={(options) => options['name']}
                  onChange={(city) => {
                    handleAgencyCityChange(city)
                  }}
                />
                {errors.city && data.city === null && (
                  <span className="text-red-500 text-xs col-span-3 col-start-4">
                    {errors.city}
                  </span>
                )}
                <div
                  className={`text-red-500 cursor-pointer col-start-7 row-start-1 col-auto${
                    agencyLocationEdit === true
                      ? ' visible block'
                      : ' hidden absolute'
                  }`}
                  onClick={handleAgencyLocationChange}>
                  Cancel
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center">
              <div className="col-span-1">Agency Logo</div>
              {editLogo ? (
                <div
                  className={`${style.inputSelect} bg-white col-span-3 flex items-center`}>
                  <label>
                    <span className="sr-only">Choose agency logo</span>
                    <input
                      className={`${style.fileUploadButton}`}
                      id="multiple_files"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={imgPicker}
                    />
                    {errors.image && image === null && (
                      <span className="text-red-500">{errors.image}</span>
                    )}
                  </label>
                  <div className="col-span-2">
                    {imageURLs.map((url, i = self.crypto.randomUUID()) => (
                      <Image
                        src={url}
                        key={i}
                        width={100}
                        height={50}
                        className="inline h-auto"
                        alt={`image-upload-${i}`}
                      />
                    ))}
                  </div>
                  <div
                    className="text-red-500 cursor-pointer"
                    onClick={handleLogoEdit}>
                    Cancel
                  </div>
                </div>
              ) : (
                <div
                  className={`${style.inputSelect} bg-white col-span-3`}
                  onClick={handleLogoEdit}>
                  {agency.logo && agency.logo.length > 0 && (
                    <Image
                      src={agency.logo[0]}
                      alt={`${agency.name} logo`}
                      width={70}
                      height={100}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end items-center">
            {agencyUpdateMessageShow && (
              <div className="transition-opacity opacity-100">
                Agency updated
              </div>
            )}
            <Button color="blue" type="submit">
              Update Agency
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  const deleteAccount = () => (
    <div className="self-end m-6">
      <div className="flex justify-between mx-0 md:mx-6 my-6 tracking-normal items-center">
        <div className="font-light mr-4">{t('delete')}</div>
        <button
          onClick={() => setDeleteModal(true)}
          className="bg-sky-100 hover:bg-red-200 text-red-600 font-normal py-2 px-6 border border-red-600 rounded-xl">
          {t('request')}
        </button>
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
        <div className={`${globalStyles.heading.h1.blue} ml-16 p-4 md:ml-0 md:p-0`}>{t('account')}</div>
        {isAgency && (
          <div className="flex justify-between m-6 tracking-normal items-center">
            <div className="font-light">
              {agency.length > 1 ? 'Agencies' : 'Agency'}
            </div>
            <div className="flex gap-2 my-2 tracking-normal items-center">
              <div className="font-light">{agencyName}</div>
            </div>
          </div>
        )}
        <div className="flex flex-col m-6 md:flex-row justify-start md:justify-between tracking-normal items-stretch md:items-center">
          <div className="font-semibold text-sm md:font-light">
            {t('email')}
          </div>
          <div className="flex gap-2 my-2 tracking-normal items-center justify-between">
            <div className="font-light">{user.email}</div>
            <Button
              variant="outlined"
              color="blue"
              onClick={() => setEmailModal(true)}>
              {t('editEmail')}
            </Button>
          </div>
        </div>
        <div className="flex m-6 justify-between tracking-normal items-center">
          <div className="font-light">{t('resetPassword')}</div>
          <Button
            variant="outlined"
            color="blue"
            onClick={() => setOpenModal(true)}>
            {t('editPassword')}
          </Button>
        </div>
        <div className="flex m-6 justify-between tracking-normal items-center">
          <div className="font-light">{t('logout')}</div>
          <Button
            variant="outlined"
            color="blue"
            onClick={() => setLogoutModal(true)}>
            {t('logout')}
          </Button>
        </div>

        <LocationUpdate
          user={user}
          userData={userData}
          setUserData={setUserData}
        />

        {!isAgency && !isAdmin && languageToggle()}
        {isAgency && agencySettings()}
        {deleteAccount()}
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
