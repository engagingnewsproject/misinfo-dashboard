import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'
import moment from "moment";
import { db } from '../../config/firebase'
import { Country, State, City }  from 'country-state-city';
import { getDoc, getDocs, doc, setDoc, collection, updateDoc, addDoc } from "firebase/firestore";
import csc from "country-state-city";
import auth from "@firebase/auth";
import Select from "react-select";

// Ref to firebase reports collection
const dbInstance = collection(db, 'reports');

const NewReport = ({ open, onClose }) => {
    if (!open) return null
    const router = useRouter()
    const { user } = useAuth()
    // useStates
    const [data, setData] = useState({country: "US", state: null, city: null})

    const [title, setTitle] = useState('')
    const [link, setLink] = useState('')
    const [secondLink, setSecondLink] = useState('')
    const [detail, setDetail] = useState('')
    // Image upload
    const [images, setImages] = useState([])
    const [imageURLs, setImageURLs] = useState([])
    
    // console.log(Country.getCountryByCode('US'))
    const saveReport = () => {
        addDoc(dbInstance, {
            userID: user.email,
            
            state: data.state.name,
            city: data.city.name,
            // topic: route.params.selectedTopic,
            // hearFrom: route.params.hearFrom,
            title: title,
            link: link,
            secondLink: secondLink,
            images: imageURLs,
            detail: detail,
            createdDate: moment().toDate(),
            isApproved: true,
            read: false
        })
    }

    const handleChange = (e) => {
        console.log(e.target.value)
    }
    
    const handleNewReport = async (e) => {
        e.preventDefault()
        saveReport()
    }
    
    
    // Image upload
    useEffect(() => {
        if (images.length < 1) return
        const newImageURLs = []
        images.forEach(image => newImageURLs.push(URL.createObjectURL(image)))
        setImageURLs(newImageURLs)
    }, [images])
    // Image upload
    function onImageChange(e) {
        setImages([...e.target.files])
    }

    return (
        <div>
            <div className="z-10 fixed top-0 left-0 w-full h-full bg-black bg-opacity-50">
                <div onClick={onClose} className="flex overflow-y-auto justify-center items-center z-20 absolute top-0 left-0 w-full h-full">
                    <div onClick={(e) => {e.stopPropagation()}} className="flex-col justify-center items-center bg-white w-6/12 h-auto rounded-2xl py-10 px-10">
                        <div className="flex justify-between w-full mb-5">
                            <div className="text-md font-bold text-blue-600 tracking-wide">Add New Report</div>
                            <button onClick={onClose} className="text-gray-800">
                                <IoClose size={25}/>
                            </button>
                        </div>
                        <form onChange={handleChange} onSubmit={handleNewReport}>
                            <div className="mb-4">
                                <Select
                                    className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="state"
                                    type="text"
                                    placeholder="State"
                                    value={data.state}
                                    options={State.getStatesOfCountry(data.country)}
                                    getOptionLabel={(options) => {
                                    return options["name"];
                                    }}
                                    getOptionValue={(options) => {
                                    return options["name"];
                                    }}                                
                                    label="state"
                                    onChange={(value => {
                                    setData(data=>({...data, state: value, city: null })) 
                                    })}

                                    />        

                            </div>
                            <div className="mb-0.5">
                                <Select
                                    className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="city"
                                    type="text"
                                    placeholder="City"
                                    value={data.city}
                                    options={City.getCitiesOfState(
                                    data.state?.countryCode,
                                    data.state?.isoCode
                                    )}
                                    getOptionLabel={(options) => {
                                    return options["name"];
                                    }}
                                    getOptionValue={(options) => {
                                    return options["name"];
                                    }}                                 
                                    onChange={(value => {
                                    setData(data=>({...data, city: value})) 
                                    })}
                                
                                    />
                            </div>

                            <div className="mt-4 mb-0.5">
                                <input
                                    className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="title"
                                    type="text"
                                    placeholder="Report Title"
                                    required
                                    onChange={(e) => setTitle(e.target.value)}
                                    value={title}
                                    />
                            </div>
                            <div className="mt-4 mb-0.5">
                                <input
                                    className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="link"
                                    type="text"
                                    placeholder="Link"
                                    required
                                    onChange={(e) => setLink(e.target.value)}
                                    value={link}
                                    />
                            </div>
                            <div className="mt-4 mb-0.5">
                                <input
                                    className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="secondLink"
                                    type="text"
                                    placeholder="Second Link"
                                    onChange={(e) => setSecondLink(e.target.value)}
                                    value={secondLink}
                                    />
                            </div>
                            <div className="mt-4 mb-0.5">
                                <input
                                    className="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="detail"
                                    type="text"
                                    placeholder="Detail"
                                    required
                                    onChange={(e) => setDetail(e.target.value)}
                                    value={detail}
                                    />
                            </div>
                            <div className='mt-4 mb-0.5'>
                                <label className="absolute invisible" for="multiple_files">Upload multiple files</label>
                                <input className="block shadow w-full text-sm rounded-md cursor-pointer text-gray-700 dark:text-gray-400 focus:outline-none dark:placeholder-gray-400" id="multiple_files" type="file" multiple accept="image/*" onChange={onImageChange} multiple />
                                { imageURLs.map(imageSrc => <img src={imageSrc} className="py-3 h-auto shadow" />) }
                            </div>
                            <div className="mt-6">
                                <button
                                    className="w-full bg-blue-500 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default NewReport