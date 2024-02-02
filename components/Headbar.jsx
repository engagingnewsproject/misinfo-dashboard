import React, { useState, useEffect } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'
import { collection, getDocs, query, where } from '@firebase/firestore'
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
        <div className="w-full lg:w-full lg:max-w-7xl">
            <div className="flex py-4 px-12 md:pl-12 sm:px-3 sm:pl-20 md:px-5 lg:px-20 justify-center md:justify-between items-center">
                <div className="flex">
                {/* TODO: - agency can swap out their logo */}
                    <div className="flex justify-center">
                        {customClaims.agency && agencyLogo ? (
                            <Image src={agencyLogo} width={100} height={100} alt="image" style={{ width: '100%', height: 'auto' }}/>
                         ) : (
                            <div className="w-10 h-10 font-extralight rounded-full tracking-widest flex justify-center text-sm items-center text-white bg-blue-500">M</div>
                        )}
                    </div>
                    <div className="text-md font-semibold px-4 m-auto tracking-wide">
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
                            <>Misinformation</>
                        )}
                    </div>
                </div>
                {(customClaims.admin || customClaims.agency) &&
                <form className="flex relative w-1/4" onChange={handleChange} onSubmit={handleSearch}>
                   
                    <input
                        className="shadow border-none rounded-xl w-full p-3 pr-11 text-xs text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="search"
                        type="text"
                        placeholder="Search"
                        onChange={handleChange}
                        value={search} />
                    <button 
                    className="py-1 px-1 mt-1 mr-1 absolute right-0 top-0 bg-blue-500 text-white rounded-xl" 
                    type='submit'>
                        <AiOutlineSearch size={25}/>
                    </button>
                </form>
                } 
            </div>
        </div>
    )
}

export default Headbar