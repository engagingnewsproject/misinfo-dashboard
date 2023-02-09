import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { IoClose } from "react-icons/io5"
import { useAuth } from '../../context/AuthContext'
import luxon from "Luxon"
import { db } from '../../config/firebase'
import { Country, State, City }  from 'country-state-city';
import { getDoc, getDocs, doc, setDoc, collection, updateDoc } from "firebase/firestore";
import csc from "country-state-city";
import auth from "@firebase/auth";
import Select from "react-select";


const NewReport = ({ setNewReport, addNewReport }) => {
    const userId = localStorage.getItem("userId")
    const [update, setUpdate] = useState("")
    const router = useRouter()
    const [info, setInfo] = useState({})
    const { reportId } = router.query

    const getData = async () => {
        const infoRef = await getDoc(doc(db, "reports",  reportId))
        setInfo(infoRef.data())
    }

    const handleChange = (e) => {
        setData({ ...data, [e.target.id]: e.target.value})
    }

    const handleNewReport = async (e) => {
        e.preventDefault()
        addNewReport(data)
        setNewReport(false)
    }

    const countries = csc.getAllCountries();

    const updatedStates = () => {
        csc.getStatesOfCountry("United States").map((state) => ({ label: state.name, value: state.id, ...state }));   
    }

    const updatedCities = (stateId) =>
    csc
      .getCitiesOfState(stateId)
      .map((city) => ({ label: city.name, value: city.id, ...city }));


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
                    <form onChange={handleChange} onSubmit={handleNewReport}>
                        <div class="mb-4">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="state"
                                type="text"
                                placeholder="State"
                                required
                                value={data.state}
                                />
                        </div>
                        <div class="mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="city"
                                type="text"
                                placeholder="City"
                                required
                                value={data.city}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="topic"
                                type="text"
                                placeholder="Report Topic"
                                required
                                value={data.topic}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="hearFrom"
                                type="text"
                                placeholder="Source"
                                required
                                value={data.hearFrom}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="title"
                                type="text"
                                placeholder="Report Title"
                                required
                                value={data.title}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="link"
                                type="text"
                                placeholder="Link"
                                required
                                value={data.link}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="secondLink"
                                type="text"
                                placeholder="Second Link"
                                value={data.secondLink}
                                />
                        </div>
                        <div class="mt-4 mb-0.5">
                            <input
                                class="shadow border-white rounded-md w-full py-3 px-3 text-sm text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="detail"
                                type="text"
                                placeholder="Detail"
                                required
                                value={data.detail}
                                />
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