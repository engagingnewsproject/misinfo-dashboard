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

            <div className="grid grid-cols-5 md:grid-cols-12 md:pl-12 lg:px-20">
                <div className="col-start-2 md:col-start-1 col-span-4 flex items-center pt-3">
                {/* TODO: - agency can swap out their logo */}
                    <div className="flex justify-center">
                        {customClaims.agency && agencyLogo ? (
                            <Image src={agencyLogo} width={100} height={100} alt="image" style={{ width: '100%', height: 'auto' }}/>
                         ) : (
                            <Image src="/img/misinformation-app-logo.png" width={45} height={45} alt="image" style={{ width: '100%', height: 'auto' }}/>
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
                            <>Misinformation</>
                        )}
                    </div>
                </div>
                {(customClaims.admin || customClaims.agency) &&
                <form className="flex relative md:w-2/4 lg:w-1/4 lg:max-w-xs" onChange={handleChange} onSubmit={handleSearch}>
                   
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

    )
}

export default Headbar