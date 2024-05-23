// components/LocationUpdate.js
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useTranslation } from 'next-i18next';
import Select from 'react-select';
import { State, City } from 'country-state-city';
import { Button } from '@material-tailwind/react';

const LocationUpdate = ({ user, userData, setUserData }) => {
  const { t } = useTranslation('Profile');

  // USER LOCATION
  const [userLocation, setUserLocation] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showUserMessage, setShowUserMessage] = useState(false);
  const [update, setUpdate] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleSubmit = async (e) => {
    // LOCATION CHANGE FOR USERS
    e.preventDefault(); // prevents the page from refreshing

    const allErrors = {};
    // error logging
    if (!userLocation?.state) {
      console.log('state error');
      allErrors.userState = 'Please enter a state.';
    } else if (!userLocation?.city) {
      console.log('city error');
      allErrors.userCity = 'Please enter a city.';
    } else {
      try {
        // where we update the firestore data
        setUserData({
          state: userLocation.state,
          city: userLocation.city,
        });
        setUpdate(!update);
        // Update Firestore data
        const userDoc = doc(db, 'mobileUsers', user.accountId);
        await updateDoc(userDoc, {
          state: userLocation?.state,
          city: userLocation?.city,
        });
        // Set state or do any necessary actions after successfully updating Firestore
      } catch (error) {
        console.error('Error updating user location:', error);
      }
    }
    // set all errors
    getData();
    setErrors(allErrors);
  };

  const handleUserClickLocationChange = () => {
    // handle when a user clicks the "Change Location" button
    setShowForm(!showForm);
    setUserLocation(null);
  };

  const handleUserStateChange = (e) => {
    // setShowUserMessage(false);
    setUserLocation((data) => ({ ...data, state: e, city: null }));
  };

  const handleUserCityChange = (e) => {
    // setShowUserMessage(false);
    setUserLocation((data) => ({ ...data, city: e !== null ? e : null }));
  };

  const handleUserLocationReset = () => {
    // handle location reset, delete changes for general users
    setShowForm(false);
    // setShowUserMessage(false);
    getData(); // fetch data again
    // reset to default firestore values
    setUserLocation({ state: userData?.state, city: userData?.city });
  };

  // When user location updated we can set the user location change to false and it will close the form block

  useEffect(() => {
    if (update) {
      setShowUserMessage(true);
      setShowForm(false);
    }
    return () => {
      setTimeout(() => {
        setShowUserMessage(false);
      }, 3000);
    };
  }, [update]);

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

  return (
    <div>
      <div className="text-xl font-extrabold text-blue-600">
        {t('editLocation')}
      </div>
      {/* List the user's location information */}
      <div className="flex justify-between mx-0 md:mx-6 my-6 tracking-normal items-center">
        <div className="font-light">City</div>
        {/* check if user data has a value */}
        {userData && userData.city && (
          <div className="font-light">{userData.city.name}</div>
        )}
      </div>
      <div className="flex justify-between mx-0 md:mx-6 my-6 tracking-normal items-center">
        <div className="font-light">State</div>
        {userData && userData.state && (
          <div className="font-light">{userData.state.name}</div>
        )}
      </div>
      {/* show/hide change location fields */}
      <>
        <form
          onSubmit={handleSubmit}
          className={`${
            showForm ? 'flex' : 'hidden'
          } sm:mx-6 flex-col lg:flex-row lg:justify-end gap-4`}>
          {/* Need to wrap any form elements in a form tag */}
          <div className="flex flex-col sm:flex-row lg:flex-auto lg:justify-end">
            {/* These could be changed to the tailwindcss material design select elements */}
            <Select
              className="mb-2 sm:mb-0 lg:max-w-52 border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="state"
              type="text"
              placeholder={t('NewReport:state_text')}
              value={userLocation?.state}
              options={State.getStatesOfCountry('US')}
              getOptionLabel={(options) => {
                return options['name'];
              }}
              getOptionValue={(options) => {
                return options['name'];
              }}
              label="state"
              onChange={handleUserStateChange}
            />
            <Select
              className="sm:pl-2 lg:max-w-52 border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="city"
              type="text"
              placeholder={t('NewReport:city_text')}
              value={userLocation?.city}
              options={City.getCitiesOfState(
                userLocation?.state?.countryCode,
                userLocation?.state?.isoCode
              )}
              getOptionLabel={(options) => {
                return options['name'];
              }}
              getOptionValue={(options) => {
                return options['name'];
              }}
              onChange={handleUserCityChange}
            />
          </div>
          <div className="sm:flex sm:items-start sm:gap-2">
            <Button
              onClick={handleUserLocationReset}
              color="blue"
              fullWidth
              className="mb-2"
              type="reset">
              {t('cancelChanges')}
            </Button>
            <Button
              color="blue"
              fullWidth
              className="lg:text-nowrap"
              type="submit">
              {t('updateLocation')}
            </Button>
          </div>
        </form>
        {/* Change location button */}
        <div className="flex justify-end mx-0 md:mx-6 my-6 tracking-normal items-center">
          {showUserMessage && (
            <p className="text-green-800 transition-opacity opacity-100 mr-4">
              {t('location')}
            </p>
          )}
          {/* Error output */}
          {errors.userState && !userLocation?.state && (
            <div className="flex justify-center mr-4">
              <span className="text-red-500">{errors.userState}</span>
            </div>
          )}
          {errors.userCity && !userLocation?.city && (
            <div className="flex justify-center mr-4">
              <span className="text-red-500">{errors.userCity}</span>
            </div>
          )}
          {/* if form is not visible show this button */}
          {/* {!showForm && ( */}
          <button
            className={`${style.buttonHollow} justify-end`}
            onClick={() => handleUserClickLocationChange()}>
            Change Location
          </button>
          {/* )} */}
        </div>
      </>
    </div>
  );
};

export default LocationUpdate;
