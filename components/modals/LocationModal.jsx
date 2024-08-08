import React, { useState } from 'react'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'
import { db, auth } from "../../config/firebase"
import {
	collection,
	getDocs,
	getDoc,
	query,
	where,
	updateDoc,
	doc,
} from "firebase/firestore"
import { useTranslation } from 'next-i18next';
import { State, City } from "country-state-city"
import Select from "react-select"

const LocationModal = ({ setLocationModal }) => {
    const {t} = useTranslation("Profile")

    const { user } = useAuth()
    const [updateSuccess, setUpdateSuccess] = useState(false)
    
    const [userData, setUserData] = useState(null)
    const [userLocation, setUserLocation] = useState(null)

    const [errors, setErrors] = useState({})

    // LOCATION CHANGE FOR USERS
    const handleStateChange = (e) => {

      setUserLocation(data=>({...data,state: e, city: null }))     
    }
    const handleCityChange = (e) => {
      setUserLocation((data) => ({ ...data, city: e !== null ? e : null }))
    }

     // handle location change for users
  const handleUserLocationChange = (e) => {
      e.preventDefault()
      // STATE
      const allErrors = {}

      if (!userLocation.state) {
        console.log(userLocation.state)
        console.log("state error")
        allErrors.userState = "Please enter a state."
      }
        //  no errors, update doc
      else {
        const userDoc = doc(db, "mobileUsers", user.accountId)
        updateDoc(userDoc, {
          state: userLocation?.state,
          city: userLocation?.city,
        }).then(() => {
          // update state variables
          setLocationModal(false)
        })
      }
    }

    const style = {
      button:
        "bg-blue-600 col-start-3 self-end hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline",
      input:
        "text-md font-light bg-white rounded-xl p-4 border-none w-full focus:text-gray-700 focus:bg-white focus:border-blue-400 focus:outline-none resize-none",
      inputSelect:
        "border-gray-300 col-span-1 rounded-md w-full h-auto py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline",
      buttonCancel:
        " col-start-3 border-solid border-red-500 self-end hover:bg-blue-700 text-sm text-red-500 font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline",
      fileUploadButton:
        "block flex flex-col text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold  file:bg-sky-100 file:text-blue-500 hover:file:bg-blue-100 file:cursor-pointer",
    }
  
  

    return (
      <div>
      <div className="flex justify-center items-center z-[1200] absolute top-0 left-0 w-full h-full bg-black opacity-60">
      </div>
      <div 
      className="flex justify-center items-center z-[1300] absolute top-0 left-0 w-full h-full"
      onClick={() => setLocationModal(false)}>
          <div className="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10"
          onClick={(e) => {
              e.stopPropagation()
          }}>
              <div className="flex justify-between w-full mb-5">
                  <div className="text-md font-bold text-blue-600 tracking-wide">{t('addLocation')}</div>
                  {/* TODO: Change here */}
                
              </div>
              <form  onSubmit={handleUserLocationChange}>
                  <div className="mb-4">
                    <Select
                    className="border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="state"
                    name='state'
                    type="text"
                    required
                    placeholder={t("NewReport:state_text")}
                    value={userLocation?.state}
                    options={State.getStatesOfCountry("US")}
                    getOptionLabel={(options) => {
                    return options["name"];
                    }}
                    getOptionValue={(options) => {
                    return options["name"];
                    }}                                
                    label="state"
                    onChange={handleStateChange}
                    />
                  </div>
                  <div className="mb-0.5">
                    <Select
                      className="shadow border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="city"
                      type="text"
                      name='city'
                      placeholder={t("NewReport:city_text")}
                      value={userLocation?.city}
                      options={City.getCitiesOfState(
                      userLocation?.state?.countryCode,
                      userLocation?.state?.isoCode
                      )}
                      getOptionLabel={(options) => {
                      return options["name"];
                      }}
                      getOptionValue={(options) => {
                      return options["name"];
                      }}                                 
                      onChange={handleCityChange}
                      />
                  </div>
                  {errors.state && data.state === null &&  (<span className="text-red-500">{errors.state}</span>)} 
                  
                  <div className="mt-6">
                      <button
                          disabled={userLocation?.state == null}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline"
                          type="submit">
                          {t("updateLocation")}
                      </button>
                  </div>
              </form>
          </div>
      </div>
  </div>
    )
}

export default LocationModal