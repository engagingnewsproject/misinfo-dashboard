import React, { useState, useEffect } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'
import { collection, getDocs, doc, query, where } from '@firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db, auth } from "../config/firebase"
import { getStorage,ref,getDownloadURL } from "firebase/storage";
import Image from 'next/image'

const Headbar = ({ search, setSearch, customClaims}) => {

    const { user, verifyRole } = useAuth()
    const [userRole, setUserRole] = useState('')
    const [agencyLogo,setAgencyLogo] = useState('')
    const [agencies,setAgencies] = ([])
    const [userId, setUserId] = useState('')
    const storage = getStorage();
    const starsRef = ref(storage, 'agencies/agencyDesign/logo_1692381497502.png');
    getDownloadURL(starsRef)
    .then((url) => {
        setAgencyLogo(url)
    })
    .catch((error) => {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
        case 'storage/object-not-found':
            // File doesn't exist
            break;
        case 'storage/unauthorized':
            // User doesn't have permission to access the object
            break;
        case 'storage/canceled':
            // User canceled the upload
            break;
        case 'storage/unknown':
            // Unknown error occurred, inspect the server response
            break;
        }
    })
    
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

	const getData = async () => {
		const userRoles = collection(db, 'userRoles')
        const snapshot = await getDocs(userRoles)
        console.log(snapshot)
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
        // NEW Work
        // Working on getting all agency users attached to an agency
        // this is something we will have to do as the project moves along.
        // We need to somehow relate users, reports, tags, sources & assets to 
        // agencies. Since they will all use "different apps". Challenging!!!
        auth.onAuthStateChanged((user) => {
            if (user)
            {
                console.log(user)
                setUserId(user.uid)
                const uid = user.uid;
                console.log(userId)
            }
        });
        const agencyCollection = collection(db,'agency')
        const q = query(agencyCollection,where('agencyUsers',"array-contains",userId))
        const agencySnap = await getDocs(q)
        try {
            var arr = []
            agencySnap.forEach((doc) => {
                arr.push({
                    [doc.id]: doc.data(),
                })
            })
            console.log(arr)
            setAgencies(arr)
        } catch (error) {
            console.log(error)
        }
        console.log(agencies)
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
    
	useEffect(() => {
		getData()
	})
    return (
        <div className="w-full">
            <div className="flex py-4 px-12 sm:px-10 justify-between">
                <div className="flex">
                {/* TODO: - agency can swap out their logo */}
                    <div className="flex justify-center">
                        <Image src={agencyLogo} width='100' height='100' alt='alt' />
                        {/* <div className="w-10 h-10 font-extralight rounded-full tracking-widest flex justify-center text-sm items-center text-white bg-blue-500">M</div> */}
                    </div>
                    <div className="text-md font-semibold px-4 m-auto tracking-wide">
                        {userRole !== 'user' && `${userRole.toUpperCase()} `}
                        {userRole == 'user' ? 'Report Misinformation' : 'Misinfo Dashboard'}
                        {userRole ==  'admin' && 
                        <div className='text-sm font-normal'>Hi Talia!</div>
                        }
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