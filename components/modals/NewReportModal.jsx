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

const NewReport = ({ setNewReport, addNewReport }) => {
    const router = useRouter()
    const { user } = useAuth()
    // useStates
    const [title, setTitle] = useState('')
    const [link, setLink] = useState('')
    const [secondLink, setSecondLink] = useState('')
    const [detail, setDetial] = useState('')

    // Image upload
    const [images, setImages] = useState([])
    const [imageURLs, setImageURLs] = useState([])
    
    // console.log(Country.getCountryByCode('US'))
    const saveReport = () => {
        addDoc(dbInstance, {
            userID: user.email,
            // state: route.params.selectedState,
            // city: route.params.selectedCity,
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
        // console.log({ ...e, [e.target.id]: e.target.value})
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
            <div class="flex justify-center items-center z-10 absolute top-0 left-0 w-full h-full bg-black opacity-60">
            </div>
            <div class="flex justify-center items-center z-20 absolute top-0 left-0 w-full h-full">
                <div class="flex-col justify-center items-center bg-white w-80 h-auto rounded-2xl py-10 px-10">
                    <div class="flex justify-between w-full mb-5">
                        <div class="text-md font-bold text-blue-600 tracking-wide">Add New Report</div>
                        <button onClick={() => setNewReport(false)} class="text-gray-800">
                            <IoClose size={25}/>
                        </button>
                    </div>
                    <form 
                        onChange={handleChange} 
                        onSubmit={handleNewReport}
                        >
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="title"
                                type="text"
                                placeholder="Report Title"
                                required
                                onChange={(e) => setTitle(e.target.value)}
                                value={title}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="link"
                                type="text"
                                placeholder="Link"
                                required
                                onChange={(e) => setLink(e.target.value)}
                                value={link}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="secondLink"
                                type="text"
                                placeholder="Second Link"
                                onChange={(e) => setSecondLink(e.target.value)}
                                value={secondLink}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="detail"
                                type="text"
                                placeholder="Detail"
                                required
                                onChange={(e) => setDetial(e.target.value)}
                                value={detail}
                                />
                        </div>
                        <div className='mt-4 mb-0.5'>
                            <label class="absolute invisible" for="multiple_files">Upload multiple files</label>
                            <input class="block shadow w-full text-sm rounded-md cursor-pointer text-gray-700 dark:text-gray-400 focus:outline-none dark:placeholder-gray-400" id="multiple_files" type="file" multiple accept="image/*" onChange={onImageChange} multiple />
                            { imageURLs.map(imageSrc => <img src={imageSrc} className="py-3 h-auto shadow" />) }
                        </div>
                        <div class="mt-6">
                            <button
                                class="w-full bg-blue-500 hover:bg-blue-700 text-sm text-white font-semibold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline" type="submit">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )

}

export default NewReport