/**
 * @fileoverview Settings Component - Tagging system and agency management interface
 *
 * This component provides an interface for admins and agency users to manage tagging systems
 * (Topics, Sources, Labels) and agency selection. Features include:
 * - Tag system selection and editing (Topics, Sources, Labels)
 * - Agency and state selection for admins
 * - Dynamic tag document creation for agencies in Firestore
 * - Role-based UI (admin vs agency)
 * - Integration with TagSystem component for tag editing
 * - Responsive and accessible design
 *
 * Integrates with:
 * - TagSystem (for tag editing)
 * - Firebase Firestore for agency/tag data
 * - country-state-city and react-select for location selection
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */
import React, { useState, useEffect } from 'react'
import TagSystem from '../analytics/TagSystem';
import { useAuth } from '../../context/AuthContext'
import globalStyles from '../../styles/globalStyles';
import { collection, query, where, setDoc, getDoc, getDocs, doc } from "firebase/firestore"; 
import { db, auth } from "../../config/firebase"
import {List,ListItem} from "@material-tailwind/react"
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';

export const tagSystems = ['default', 'Topic', 'Source', 'Labels'];

/**
 * Settings Component
 *
 * Renders the settings page for tag system and agency management.
 * Allows admins to select a state and agency, and edit tag systems (Topics, Sources, Labels).
 * Agency users can view and edit their own agency’s tags.
 *
 * @returns {JSX.Element} The rendered settings management interface
 */
const Settings = () => {
  // --- State for modal and tag system selection ---
  const [openModal, setOpenModal] = useState(false) // Controls modal visibility (future use)
  const [tagSystem, setTagSystem] = useState(0) // 0 = main menu, 1 = Topics, 2 = Sources, 3 = Labels

  // --- Auth and user claims ---
  const { user, customClaims, setCustomClaims } = useAuth() // Auth context and role claims

  // --- Agency selection and management ---
  const [agencyID, setAgencyID] = useState() // Selected agency ID (admin or agency user)
  const [agency, setSelectedAgency] = useState() // Selected agency name (admin or agency user)
  const [agencies, setAgencies] = useState([]) // List of agencies for admin selection

  // --- State/city selection for admin filtering ---
  const [stateSelected, setStateSelected] = useState({ country: 'US', state: null, city: null }) // Selected state/city for agency filtering


  /**
   * Initializes default tag documents for a new agency in Firestore.
   * Creates default Topics, Sources, and Labels lists for the agency.
   * @param {string} agencyID - The Firestore document ID of the agency
   * @returns {Promise<void>}
   */
  const setData = async (agencyID) => {
    const defaultTopics = ["Health","Other","Politics","Weather"] // tag system 1
    const defaultSources = ["Newspaper", "Other/Otro","Social","Website"] // tag system 2
    const defaultLabels = ["To Investigate", "Investigated: Flagged", "Investigated: Benign"] // tag system 3

    // create topics collection for the new agency
    setDoc(doc(db, "tags", agencyID), {
        Labels: {
          list: defaultLabels,
          active: defaultLabels
        },
        Source: {
          list: defaultSources,
          active: defaultSources
        },
        Topic: {
          list: defaultTopics,
          active: defaultTopics
        }
        
    })
     
  }

  /**
   * Handles agency selection from the dropdown.
   * Updates agencyID and agency name state.
   * @param {Object} e - The selected agency object from react-select
   */
  const handleAgencyChange = (e) => {
    console.log("Item is " + e)
    console.log("Agency id is " + e.id);
    setAgencyID(e.id)
    setSelectedAgency(e.name)
  }

  /**
   * Handles state selection for admin filtering.
   * Updates stateSelected and fetches agencies in the selected state.
   * @param {Object} e - The selected state object from react-select
   */
  const handleStateChange = (e) => {
    console.log(e)
    setStateSelected(e)
    setAgencyID(null)
    setSelectedAgency(null)

    getDocs(collection(db, "agency")).then((agencyRef)=> {
      try {
        // build an array of agency names
        var arr = []
        agencyRef.forEach((doc) => {
          console.log("doc state is " +doc.data()['state'] )
          // console.log("user location is " +userData?.state?.name )
          if (doc.data()["state"] == e?.name) {
            arr.push({state: doc.data()['state'], name: doc.data()["name"], id: doc.id})
          }
        })
        console.log(arr)
        setAgencies(arr)
      } catch (error) {
        console.log(error)
    }
  })
}

  // Effect: Log when agency changes (admin only, placeholder for future logic)
  useEffect(() => {
    if (customClaims.admin && stateSelected != null) {
      // TODO: fix
      console.log('NEed to update agency ID here')
    }
  }, [agency])
  // Effect: On mount or tagSystem change, determine agency for agency users or prompt admin to select
  useEffect(() => {
    // If current user is an agency, determine which agency
    if (!customClaims.admin) {
      const agencyCollection = collection(db,"agency")

      const q = query(agencyCollection, where('agencyUsers', "array-contains", user.email));
      let agencyId;

      // TODO: FIX THIS
      getDocs(q).then((querySnapshot) => {
        querySnapshot.forEach((doc) => { // Set initial values
          // console.log(doc.id)
          agencyId = doc.id
          setAgencyID(doc.id)
        })
        
    
    })
    }
    // Otherwise, have the admin member select which agency tags they went 
  }, [tagSystem])

  // Effect: When agencyID changes, ensure tag document exists for the agency
  useEffect(() => {
    if (agencyID) {
      const agencyRef = doc(db, 'tags', agencyID);
      getDoc(agencyRef).then((docSnap)=> {
        // if (docSnap.exists()) {
        //   console.log("Document data:", docSnap.data());
        // } else {
        //   // doc.data() will be undefined in this case
        //   console.log("No such document!");
        // }
        if (!docSnap.exists()) {
          
          // docSnap.data() will be undefined in this case, create tags doc for agency
          console.log("No such document!");
          setData(agencyID).then(()=> {
            console.log("Tag doc has been created for the agency.")
          }) 
        }
      })
    }
  }, [agencyID])
  
  return (
    <div>
      {tagSystem == 0 ?
      <div className="z-0 flex-col p-16">
        <div className={globalStyles.heading.h1.blue}>Tagging Systems</div>
        {customClaims.admin && 
        <div>
            <div className={globalStyles.heading.h2.blue}>Agency Location</div>

            <Select
            className="border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="state"
            type="text"
            required
            placeholder="State"

            value={stateSelected.state }
            options={State.getStatesOfCountry('US')}
            getOptionLabel={(options) => {
              return options['name'];
            }}
            getOptionValue={(options) => {
              return options['name'];
            }}
            label="state"
            onChange={handleStateChange}
          />
          <div className={globalStyles.heading.h2.blue}>Agencies</div>

          <Select
            className="border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            options={agencies}
            placeholder="Agency Name"

            getOptionLabel={(options) => {
              return options['name']
            }}
            getOptionValue={(options) => {
              return options['name'];
            }}
            onChange={handleAgencyChange}/>
          {customClaims.admin && <div className={globalStyles.heading.h2.blue}>Tags</div>}
          {agencyID == null &&        
            <div>
                Select an agency to view and edit their tags.
            </div> }
        </div>
        }
        {agencyID && 
      <div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Topic Tags</div>
            <button
                onClick={() => setTagSystem(1)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Topics
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Source Tags</div>
            <button
                onClick={() => setTagSystem(2)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Sources
            </button>
        </div>
        {customClaims.admin &&
          <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Labels</div>
            <button
                onClick={() => setTagSystem(3)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Labels
            </button>
          </div>
        }
        {/* <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Customized Labels</div>
            <button
                onClick={() => setTagSystem(3)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                Edit Labels
            </button>
        </div> */}
      </div> 
      }
      </div>
      
    
    :
        <TagSystem tagSystem={tagSystem} setTagSystem={setTagSystem} agencyID={agencyID} stateSelected={stateSelected} agency={agency} />}
      {/* TODO: add "custom tags section for approval" */}
    </div>

  )
}

export default Settings