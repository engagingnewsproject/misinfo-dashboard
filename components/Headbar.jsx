import React, { useState, useEffect } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'
import { collection, getDocs } from '@firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db, auth } from "../config/firebase"

const Headbar = ({ search, setSearch, customClaims}) => {
    const { user, verifyRole } = useAuth()
    const [userRole, setUserRole] = useState('')
    
    // Verify user role
    useEffect(() => {
        verifyRole().then((result) => {
            if (result.admin) {
                setUserRole('admin')
            } else if (result.agency) {
                setUserRole('agency')
            } else {
                setUserRole('user')
            }
        })
    }, [])

	// //
	// Data
	// //
	const getData = async () => {
		const userRoles = collection(db, 'userRoles')
		const snapshot = await getDocs(userRoles)
		try {
			var arr = []
			snapshot.forEach((doc) => {
				arr.push({
					[doc.id]: doc.data(),
				})
			})
		} catch (error) {
			console.log(error)
		}

	}
    
    const handleSearch = (e) => {
        e.preventDefault()
        if (search.length == 0) return

        console.log(search)
    }

    const handleChange = (e) => {
        setSearch(e.target.value)
    }
    
    // //
	// Effects
	// //
    // Effect: get data
	useEffect(() => {
		getData()
	})
    return (
        <div className="w-full">
            <div className="flex py-4 px-12 sm:px-10 justify-between">
                <div className="flex">
                {/* TODO:
                - agency can swap out their logo
                 */}
                    <div className="flex justify-center">
                        <div className="w-10 h-10 font-extralight rounded-full tracking-widest flex justify-center text-sm items-center text-white bg-blue-500">M</div>
                    </div>
                    <div className="text-md font-semibold px-4 m-auto tracking-wide">
                        {userRole !== 'user' && `${userRole.toUpperCase()} `}
                        {userRole == 'user' ? 'Report Misinformation' : 'Misinfo Dashboard'}
                    </div>
                </div>
                {(userRole == 'admin' || userRole == 'agency') &&
                <form className="flex relative w-1/4" onChange={handleChange} onSubmit={handleSearch}>
                   
                    <input
                        className="shadow border-none rounded-xl w-full p-3 pr-11 text-xs text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="search"
                        type="text"
                        placeholder="Search"
                        onChange={handleChange}
                        value={search} />
                    <button 
                    className="py-1 px-1 mt-1.5 mr-1 absolute right-0 top-0 bg-blue-500 text-white rounded-xl" 
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