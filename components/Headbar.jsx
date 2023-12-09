import React, { useState, useEffect } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'
import { collection, getDocs, doc, query, where } from '@firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db, auth } from "../config/firebase"
import { getStorage,ref,getDownloadURL } from "firebase/storage";
import Image from 'next/image'

const Headbar = ({ search, setSearch}) => {
    const { user, verifyRole, customClaims, setCustomClaims } = useAuth()
    const [userRole, setUserRole] = useState('')
    const [agency,setAgency] = useState('')
    const [agencyLogo, setAgencyLogo] = useState('')
    const [title,setTitle] = useState('')
    const [userId, setUserId] = useState('')
    
    // Verify user role
    // useEffect(() => {
    //     verifyRole().then((result) => {
    //         if (result.admin) {
    //             setUserRole('admin')
    //         } else if (result.agency) {
    //             setUserRole('agency')
    //         } else {
    //             setUserRole('user')
    //         }
    //     })
    // }, [])

    const getData = async () => {
        const agencyCollection = collection(db, 'agency')
		const q = query(agencyCollection, where('agencyUsers', "array-contains", user['email']));
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
            setAgency(doc.data())
            // setAgencyId(doc.id)
            setAgencyLogo(doc.data()['logo'][0])
        });
        
        if (!customClaims) {
            setTitle('Misinfo Dashboard')
            // console.log('user')
        } else if (customClaims.admin) {
            setTitle('Misinfo Admin Dashboard')
            // console.log('admin')
        } else if (customClaims.agency) {
            setTitle(`${agency['name']} Dashboard`)
        }
		// const userRoles = collection(db, 'userRoles')
        // const snapshot = await getDocs(userRoles)
		// try {
		// 	var arr = []
		// 	snapshot.forEach((doc) => {
		// 		arr.push({
		// 			[doc.id]: doc.data(),
        //         })
        //         console.log(doc.data())
		// 	})
		// } catch (error) {
		// 	console.log(error)
        // }
        // NEW Work
        // Working on getting all agency users attached to an agency
        // this is something we will have to do as the project moves along.
        // We need to somehow relate users, reports, tags, sources & assets to 
        // agencies. Since they will all use "different apps". Challenging!!!
        // auth.onAuthStateChanged((user) => {
        //     if (user)
        //     {
        //         setUserId(user.uid)
        //         const uid = user.uid;
        //     }
        // });
        // const agencyCollection = collection(db,'agency')
        // const q = query(agencyCollection,where('agencyUsers',"array-contains",userId))
        // const agencySnap = await getDocs(q)
        // try {
        //     var arr = []
        //     agencySnap.forEach((doc) => {
        //         arr.push({
        //             [doc.id]: doc.data(),
        //         })
        //     })
        //     setAgencies(arr)
        // } catch (error) {
        //     console.log(error)
        // }
        // END // NEW Work
        // END // NEW Work
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
	}, [])
    return (
        <div className="w-full">
            <div className="flex py-4 px-12 sm:px-10 justify-between items-center">
                <div className="flex">
                {/* TODO: - agency can swap out their logo */}
                    <div className="flex justify-center">
                        {customClaims.agency && agencyLogo ? (
                            <Image src={agencyLogo} width={100} height={100} alt="image"/>
                         ) : (
                            <div className="w-10 h-10 font-extralight rounded-full tracking-widest flex justify-center text-sm items-center text-white bg-blue-500">M</div>
                        )}
                    </div>
                    <div className="text-md font-semibold px-4 m-auto tracking-wide">
                        {title}
                        {customClaims.admin && 
                        <div className='text-sm font-normal'>Hi Talia!</div>
                        }
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