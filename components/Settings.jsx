import React, { useState, useEffect } from 'react'
import TagSystem from './TagSystem';
import { useAuth } from '../context/AuthContext'
import globalStyles from '../styles/globalStyles';
import { collection, query, where, setDoc, getDoc, getDocs, doc } from "firebase/firestore"; 
import { db, auth } from "../config/firebase"
import {List,ListItem} from "@material-tailwind/react"
import Select from 'react-select';

export const tagSystems = ['default', 'Topic', 'Source', 'Labels'];

const Settings = () => {
  const [openModal, setOpenModal] = useState(false)
  const [tagSystem, setTagSystem] = useState(0)
  const {user, customClaims, setCustomClaims} = useAuth()


  // agency id of logged in agency or selected agency
  const [agencyID, setAgencyID] = useState()
  const [agency, setSelectedAgency] = useState()

  // list of agencies for admin to choose from
  const [agencies, setAgencies] = useState([])
  const [stateSelected, setStateSelected] = useState({ country: 'US', state: null, city: null })

  

  const setData = async(agencyID) => {
    const defaultTopics = ["Health","Other","Politics","Weather"] // tag system 1
    const defaultSources = ["Newspaper", "Other/Otro","Social","Website"] // tag system 2
    const defaultLabels = ["Important", "Flagged"] // tag system 3

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

  const handleAgencyChange= (name, id) => {
    setAgencyID(id)
  }

  const handleStateChange = (eD) => {
    console.log(e)
    setStateSelected(e)

    getDocs(collection(db, "agency")).then((agencyRef)=> {
      try {
        // build an array of agency names
        var arr = []
        agencyRef.forEach((doc) => {
          // console.log("doc state is " +doc.data()['state'] )
          // console.log("user location is " +userData?.state?.name )
          if (doc.data()["state"] == e?.state?.name) {
            arr.push({state: doc.data()["name"], id: doc.id})
          }
        })
        setAgencies(arr)
      } catch (error) {
        console.log(error)
    }
  })
}

  useEffect(()=> {
    if (customClaims.admin && stateSelected != null) {
      // TODO: fix
      console.log('NEed to update agency ID here')
    }
  }, [agency])
  useEffect(()=> {
    // If current user is an agency, determine which agency
    if (!customClaims.admin) {
      const agencyCollection = collection(db,"agency")

      const q = query(agencyCollection, where('agencyUsers', "array-contains", user.email));
      let agencyId;

      // TODO: FIX THIS
      getDocs(q).then((querySnapshot) => {
        querySnapshot.forEach((doc) => { // Set initial values
          console.log(doc.id)
          agencyId = doc.id
          setAgencyID(doc.id)
        })
        
    
    })
    }
    // Otherwise, have the admin member select which agency tags they went 
  }, [tagSystem])

  useEffect(()=> {
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
        {/* {customClaims.admin && 
        <div>
            <Select
            className="border-white rounded-md w-full text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="state"
            type="text"
            required
            placeholder={"State"}
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
          <List>
            {agencies.length == 0 && t("noAgencies")}
            {agencies.map((agency, id) => (
              <ListItem
                id='agency'
                key={id}
                selected={id === agencyID}
                value={agency}
                onClick={() => handleAgencyChange(agency, id)}>
                {agency}
              </ListItem>
            ))}
                    
          </List>
        </div>
        } */}

        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Topic Tags</div>
            <button
                onClick={() => setTagSystem(1)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {customClaims.admin ? `View ` : `Edit `}Topics
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Source Tags</div>
            <button
                onClick={() => setTagSystem(2)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {customClaims.admin ? `View ` : `Edit `}Sources
            </button>
        </div>
        <div className="flex justify-between mx-6 my-6 tracking-normal items-center">
            <div className="font-light">Customized Labels</div>
            <button
                onClick={() => setTagSystem(3)}
                className="bg-sky-100 hover:bg-blue-200 text-blue-600 font-normal py-2 px-6 border border-blue-600 rounded-xl">
                {customClaims.admin ? `View ` : `Edit `}Labels
            </button>
        </div>
      </div> :
        <TagSystem tagSystem={tagSystem} setTagSystem={setTagSystem} agencyID={agencyID} />}
      {/* TODO: add "custom tags section for approval" */}
    </div>

  )
}

export default Settings