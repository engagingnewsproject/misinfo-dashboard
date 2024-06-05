import React, { useState, useEffect, useRef, useTransition } from 'react';
import UpdatePwModal from './modals/UpdatePwModal';
import UpdateEmailModal from './modals/UpdateEmailModal';
import { useAuth } from '../context/AuthContext';
// import { auth } from 'firebase-admin';
import ConfirmModal from './modals/ConfirmModal';
import DeleteModal from './modals/DeleteModal';
import { useRouter } from 'next/router';
import LanguageSwitcher from './LanguageSwitcher';
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db, auth } from '../config/firebase';
import { State, City } from 'country-state-city';
import Select from 'react-select';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import globalStyles from '../styles/globalStyles';
import LocationUpdate from './partials/forms/LocationUpdate';
import { Button } from '@material-tailwind/react';
// Profile page that allows user to edit password or logout of their account
const Profile = ({ customClaims }) => {
  const {
    user,
    logout,
    verifyRole,
    changeRole,
    addAdminRole,
    addAgencyRole,
    viewRole,
    deleteUser,
  } = useAuth();
  const { t } = useTranslation('Profile');
  const [openModal, setOpenModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [agency, setAgency] = useState([]);
  const [agencyName, setAgencyName] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgency, setIsAgency] = useState(false);
  const router = useRouter();
  const [userRoles, setUserRoles] = useState({});

  // country state city
  const [data, setData] = useState({ country: 'US', state: null, city: null });

  // USER DATA
  const [userData, setUserData] = useState(null);
  // USER LOCATION
  const formRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationChange, setUserLocationChange] = useState(false);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [userUpdate, setUserUpdate] = useState(false);
  // AGENCY LOCATION
  const [agencyState, setAgencyState] = useState(null);
  const [agencyCity, setAgencyCity] = useState(null);
  const [agencyLocationEdit, setAgencyLocationEdit] = useState(false);
  const [agencyLocation, setAgencyLocation] = useState([]);
  const [isSearchable, setIsSearchable] = useState(true);
  const [errors, setErrors] = useState({});
  // AGENCY LOGO IMAGE
  const imgPicker = useRef(null);
  const storage = getStorage();
  const [editLogo, setEditLogo] = useState(false);
  const [images, setImages] = useState([]);
  const [imageURLs, setImageURLs] = useState([]);
  const [agencyLogo, setAgencyLogo] = useState([]);
  const [agencyUpdate, setAgencyUpdate] = useState(false);
  const [agencyUpdateMessageShow, setAgencyUpdateMessageShow] = useState(false);
  const [changedFields,setChangedFields] = useState({});
  
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
  };

  // GET DATA
  // Needs to be defined before any useEffect hooks
  const getData = async () => {
    try {
      // Fetch mobile user data
      const mobileRef = await getDoc(doc(db, 'mobileUsers', user.accountId));
      // Update state after fetching data
      setUserData(mobileRef.data());
      // not really needed, we can extract what we need from above line (TODO)
      setUserLocation({ state: userData?.state, city: userData?.city });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    // Then in our effect we can get the data when the component loads
    getData();

    // Verify role
    verifyRole().then(async (result) => {
      // console.log(result)
      if (result.admin) {
        setIsAdmin(true);
      } else if (result.agency) {
        setIsAgency(true);
        const agencyCollection = collection(db, 'agency');
        const q = query(
          agencyCollection,
          where('agencyUsers', 'array-contains', user['email'])
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            // Set initial values
            // console.log(doc.data())
            setAgency(doc.data());
            setAgencyId(doc.id);
            setAgencyName(doc.data()['name']);
            setAgencyState(doc.data()['state']);
            setAgencyCity(doc.data()['city']);
            setAgencyLogo(doc.data()['logo']);
          });
        }
      } else {
        setIsAgency(false);
        setIsAdmin(false);
      }
    });
  }, []); // this useEffect call will run on page load, since it has no arguments in the []. If arguments are present in the [], effect will only activate if the values in the list change.

  // SAVE AGENCY
  const saveAgency = (imageURLs) => {
    const updatedFields = {
      ...(changedFields.name && { name: agencyName }),
      ...(changedFields.logo && { logo: imageURLs }),
      ...(changedFields.state && { state: data.state.name }),
      ...(changedFields.city && { city: data.city == null ? 'N/A' : data.city.name })
    };

    const docRef = doc(db, 'agency', agencyId);
    updateDoc(docRef, updatedFields).then(() => {
      setAgencyUpdate(true);
    });
  };
  
  const handleFieldChange = (field, value) => {
    setChangedFields((prev) => ({ ...prev, [field]: value }));
  };
  
  // IMAGE UPLOAD
  const handleLogoEdit = (e) => {
    e.preventDefault();
    setEditLogo(!editLogo);
  };

  const handleImageChange = (e) => {
    for (let i = 0; i < e.target.files.length; i++) {
      const newImage = e.target.files[i];
      // console.log(newImage)
      setImages((prevState) => [...prevState, newImage]);
      setAgencyUpdate(!agencyUpdate);
    }
    handleFieldChange('logo', true); // Indicate logo has changed
  };

  const handleUpload = () => {
    // Image upload to firebase
    const promises = images.map((image) => {
      const storageRef = ref(
        storage,
        `agencies/logo_${agencyId}_${new Date().getTime().toString()}.png`
      );
      const uploadTask = uploadBytesResumable(storageRef, image);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // console.log(snapshot)
          },
          (error) => {
            console.log(error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              setImageURLs((prev) => [...prev, downloadURL]);
              resolve(downloadURL);
            });
          }
        );
      });
    });

    return Promise.all(promises);
  };

  // Agency updated message
  useEffect(() => {
    if (agencyUpdate && Object.keys(errors).length === 0) {
      setAgencyUpdateMessageShow(true);
      console.log(
        'Agency updated. MESSAGE SHOULD SHOW',
        agencyUpdateMessageShow
      );

      // Hide the message after 5 seconds
      const timeoutId = setTimeout(() => {
        setAgencyUpdateMessageShow(false);
      }, 5000);

      // Clean up the timeout to prevent memory leaks
      return () => clearTimeout(timeoutId);
    }
  }, [agencyUpdate, errors]);

  // AGENCY NAME CHANGE
  const handleAgencyNameChange = (e) => {
    e.preventDefault();
    handleFieldChange('name', e.target.value);
    setAgencyName(e.target.value);
  };
  // AGENCY LOCATION CHANGE
  const handleAgencyLocationChange = (e) => {
    e.preventDefault();
    setAgencyLocationEdit(!agencyLocationEdit);
  };
  const handleAgencyStateChange = (e) => {
    // location STATE
    setData((data) => ({ ...data, state: e, city: null }));
  };
  const handleAgencyCityChange = (e) => {
    setData((data) => ({ ...data, city: e !== null ? e : null }));
  };

  // AGENCY FORM SUMBMISSION
  const handleSubmitClick = async (e) => {
    e.preventDefault();
    const allErrors = {};
    const updatePayload = {};

    // Validate agency name
    if (agencyName === '') {
      allErrors.name = 'Please enter an agency name.';
    } else if (changedFields.name) {
      updatePayload.name = agencyName;
    }

    // Validate state
    if (!data.state || agency['state'] === '') {
      allErrors.state = 'Please enter a state.';
    } else if (changedFields.state) {
      updatePayload.state = data.state.name;
    }

    // Validate city
    if (!data.city || agency['city'] === '') {
      const stateCities = City.getCitiesOfState(
        data.state?.countryCode,
        data.state?.isoCode
      );
      if (stateCities.length === 0) {
        delete allErrors.city;
      } else {
        allErrors.city = 'Please enter a city.';
      }
    } else if (changedFields.city) {
      updatePayload.city = data.city.name;
    }

    // Set errors if any
    setErrors(allErrors);

    if (Object.keys(allErrors).length === 0) {
      // Handle image upload if logo has changed
      if (changedFields.logo) {
        try {
          const uploadedImageURLs = await handleUpload();
          updatePayload.logo = uploadedImageURLs;
        } catch (error) {
          console.error('Error uploading images:', error);
        }
      }

      // Proceed to save the agency data
      saveAgency(updatePayload);
      setAgencyUpdate(true);
    }
  };


  // LOGOUT
  const handleLogout = () => {
    logout().then(() => {
      router.push('/login');
    });
  };
  // Delete
  const handleDelete = async () => {
    const uidToDelete = user.accountId;

    // Validate UID
    if (
      !uidToDelete ||
      typeof uidToDelete !== 'string' ||
      uidToDelete.length > 128
    ) {
      console.error('Invalid UID:', uidToDelete);
      return; // Abort deletion
    }
    await deleteUser({ uid: uidToDelete })
      .then(() => {
        console.log('User deletion successful');
        router.push('/login');
      })
      .catch((error) => {
        console.error('Error deleting user:', error);
      });
  };

  useEffect(() => {
    // Get data once we know if the user is an agency or not
    if (user) {
      getData();
    }
  }, [isAgency]);

  useEffect(() => {
    if (agency['name'] !== agencyName) {
      setAgencyName(agencyName);
    } else {
      setAgencyName(agency['name']);
    }
    if (agency['city'] !== agencyCity || agency['state'] == agencyState) {
      setAgencyLocation(agency['city'] + ', ' + agency['state']);
    }
    // getData()
  }, [agencyUpdate]);

  useEffect(() => {
    if (agencyUpdate) {
      handleUpload();
    }
  }, [agencyUpdate]);

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        // console.log(idTokenResult)
        setUserRoles(idTokenResult.claims);
      } catch (error) {
        console.error('Error fetching user roles:', error);
      }
    };

    fetchUserRoles();
  }, []);

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
    <div className="z-0 flex-col pt-10 bg-slate-100">
      <div className="text-xl font-extrabold text-blue-600 tracking-wider">
        Agency Settings
      </div>
      <div className="w-full h-auto">
        <form id="agencyDesign" className="flex flex-col" onSubmit={handleSubmitClick}>
          <div className="mt-4 mb-4 grid gap-4">
            <div className="grid grid-cols-4 items-center">
              <div className="col-span-1">Agency Name</div>
              <div className="col-span-3">
                <input
                  id="agency_name"
                  onChange={(e) => {
                    handleAgencyNameChange(e);
                    handleFieldChange('name', e.target.value);
                  }}
                  placeholder="Agency name"
                  type="text"
                  className={style.input}
                  defaultValue={agencyName}
                />
                {agencyName === '' && (
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
                  <div
                    className={
                      style.input
                    }>{`${agency['city']}, ${agency['state']}`}</div>
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
                  getOptionLabel={(options) => {
                    return options['name'];
                  }}
                  getOptionValue={(options) => {
                    return options['name'];
                  }}
                  label="state"
                  onChange={(state) => {
                    handleAgencyStateChange(state);
                    handleFieldChange('state', state);
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
                  getOptionLabel={(options) => {
                    return options['name'];
                  }}
                  getOptionValue={(options) => {
                    return options['name'];
                  }}
                  onChange={(city) => {
                    handleAgencyCityChange(city);
                    handleFieldChange('city', city);
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
                    {errors.images && images === null && (
                      <span className="text-red-500">{errors.images}</span>
                    )}
                  </label>
                  <div className="col-span-2">
                    {imageURLs.map((url, i = self.crypto.randomUUID()) => (
                      <Image
                        src={url}
                        key={i}
                        width={100}
                        height={50}
                        className="inline w-auto"
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
                  {agencyLogo.map((image, i) => {
                    return (
                      <div className="flex mr-2" key={i}>
                        <Image
                          src={image}
                          width={70}
                          height={100}
                          className="w-auto"
                          alt="image"
                        />
                      </div>
                    );
                  })}
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
            <Button
              color="blue"
              onClick={handleSubmitClick}
              type="submit">
              Update Agency
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
  
  const deleteAccount = () => (
    <div className="self-end">
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
        <div className={globalStyles.heading.h1.blue}>{t('account')}</div>
        {isAgency && ( // agency user will see the agency row
          <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">
              {agency.length > 1 ? 'Agencies' : 'Agency'}
            </div>
            <div className="flex gap-2 my-2 tracking-normal items-center">
              <div className="font-light">{agencyName}</div>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-start md:justify-between mx-0 md:mx-6 my-6 tracking-normal items-stretch md:items-center">
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
        <div className="flex justify-between mx-0 md:mx-6 my-6 tracking-normal items-center">
          <div className="font-light">{t('resetPassword')}</div>
          <Button
            variant="outlined"
            color="blue"
            onClick={() => setOpenModal(true)}>
            {t('editPassword')}
          </Button>
        </div>
        <div className="flex justify-between mx-0 md:mx-6 my-6 tracking-normal items-center">
          <div className="font-light">{t('logout')}</div>
          <Button
            variant="outlined"
            color="blue"
            onClick={() => setLogoutModal(true)}>
            {t('logout')}
          </Button>
        </div>

        {/* User Location Edit*/}
        <LocationUpdate
          user={user}
          userData={userData}
          setUserData={setUserData}
        />

        {/* Language toggle*/}
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
  );
};

export default Profile;
