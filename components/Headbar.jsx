import React, { useState, useEffect } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'
import { GiMagnifyingGlass } from "react-icons/gi";
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from "../config/firebase"
import Image from 'next/image'

const Headbar = ({ search, setSearch}) => {
    const { user, customClaims } = useAuth()
    const [agencyLogo, setAgencyLogo] = useState('')
    const [title,setTitle] = useState('')

    const getData = async () => {
        const agencyCollection = collection(db, 'agency')
		const q = query(agencyCollection, where('agencyUsers', "array-contains", user['email']));
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
            setTitle(doc.data()['name'])
            setAgencyLogo(doc.data()['logo'][0])
        });
	}
    
    const handleSearch = (e) => {
        e.preventDefault()
        if (search.length == 0) return
        // console.log(search)
    }

    const handleChange = (e) => {
        setSearch(e.target.value)
    }
    
    // //
	// Effects
	// //
	useEffect(() => {
        getData()
	}, [])
    return (

            <div className="w-full grid grid-cols-12 pb-5 md:flex md:flex-row md:px-12 md:justify-between md:items-center">
            {/* <div className="grid grid-cols-5 md:grid-cols-12 md:pl-12 lg:px-20"> */}
                <div className="col-start-3 col-span-9 md:col-start-1 flex items-center">
                {/* TODO: - agency can swap out their logo */}
                    <div className="flex justify-center">
                        {customClaims.agency && agencyLogo ? (
                            <Image src={agencyLogo} width={55} height={55} alt="agency logo" className='w-auto'/>
                        ) : (
                            <div className='bg-blue-600 p-3 rounded-full'>
                                <GiMagnifyingGlass className='fill-white' />
                            </div>
                        )}
                    </div>
                    <div className="text-md font-semibold px-4 tracking-wide">
                        {customClaims.admin && (
                            <>
                                Misinformation
                                <div className='text-sm font-normal'>ADMIN DASHBOARD</div>
                            </>
                        )}
                        {customClaims.agency && !customClaims.admin && (
                            <>
                                {title}
                                <div className='text-sm font-normal'>Agency Dashboard</div>
                            </>
                        )}
                        {!customClaims.agency && !customClaims.admin && (
                            <>Truth Sleuth Local</>
                        )}
                    </div>
                </div>
                {(customClaims.admin || customClaims.agency) &&
                <form className="col-start-3 col-span-8 mt-5 flex relative md:w-2/4 lg:w-1/4 lg:max-w-xs" onChange={handleChange} onSubmit={handleSearch}>
                   
                    <input
                        className="shadow border-none rounded-xl w-full p-3 pr-11 text-xs text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="search"
                        type="text"
                        placeholder="Search"
                        onChange={handleChange}
                        value={search} />
                    <button 
                    className="py-1 px-1 mt-1 mr-1 absolute right-0 top-0 bg-blue-600 text-white rounded-xl" 
                    type='submit'>
                        <AiOutlineSearch size={25}/>
                    </button>
                </form>
                } 
            </div>

    )
}

export default Headbar