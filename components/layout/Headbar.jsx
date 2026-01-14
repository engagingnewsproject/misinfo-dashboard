/**
 * @fileoverview Headbar - Application Header Component
 * 
 * This component displays the main header bar of the application, including
 * the agency logo, title, and search functionality. It dynamically shows
 * different content based on the user's role (admin, agency, or regular user)
 * and fetches agency-specific branding from Firestore.
 * 
 * @module components/Headbar
 * @requires react
 * @requires react-icons/ai
 * @requires react-icons/gi
 * @requires firebase/firestore
 * @requires ../context/AuthContext
 * @requires ../config/firebase
 * @requires next/image
 */

import React, { useState, useEffect } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'
import { GiMagnifyingGlass } from "react-icons/gi";
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { db } from "../../config/firebase"
import Image from 'next/image'

/**
 * Headbar - Main application header component.
 * 
 * This component renders the top navigation bar with agency branding,
 * user role-specific titles, and search functionality. It automatically
 * fetches agency information for agency users and displays appropriate
 * branding and titles based on user permissions.
 * 
 * @param {Object} props - Component props
 * @param {string} props.search - Current search query value
 * @param {Function} props.setSearch - Function to update search query
 * @returns {JSX.Element} Header bar with branding and navigation
 * @example
 * <Headbar 
 *   search="query"
 *   setSearch={setSearchQuery}
 * />
 */
const Headbar = ({ search, setSearch}) => {
    const { user, customClaims } = useAuth()
    const [agencyLogo, setAgencyLogo] = useState('')
    const [title, setTitle] = useState('')

    /**
     * Fetches agency data from Firestore for the current user.
     * 
     * This function queries the 'agency' collection to find the agency
     * that the current user belongs to, then sets the agency name and
     * logo for display in the header.
     * 
     * @returns {Promise<void>} Resolves when agency data is fetched and set
     * @throws {Error} When Firestore query fails
     */
    const getData = async () => {
        const agencyCollection = collection(db, 'agency')
        const q = query(agencyCollection, where('agencyUsers', "array-contains", user['email']));
        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
            setTitle(doc.data()['name'])
            setAgencyLogo(doc.data()['logo'][0])
        });
    }
    
    /**
     * Handles search form submission.
     * 
     * @param {Event} e - Form submission event
     */
    const handleSearch = (e) => {
        e.preventDefault()
        if (search.length == 0) return
        // TODO: Implement search functionality
        // console.log(search)
    }

    /**
     * Handles search input changes.
     * 
     * @param {Event} e - Input change event
     */
    const handleChange = (e) => {
        setSearch(e.target.value)
    }
    
    /**
     * Effect hook to fetch agency data when component mounts.
     * 
     * This effect runs once when the component is first rendered
     * to load the user's agency information for display.
     */
    useEffect(() => {
        getData()
    }, [])

    /**
     * Renders the appropriate title and subtitle based on user role.
     * 
     * @returns {JSX.Element} Role-specific title and subtitle
     */
    const renderTitle = () => {
        if (customClaims.admin) {
            return (
                <>
                    Truth Sleuth Local
                    <div className='text-sm font-normal'>ADMIN DASHBOARD</div>
                </>
            )
        } else if (customClaims.agency && !customClaims.admin) {
            return (
                <>
                    {title}
                    <div className='text-sm font-normal'>Agency Dashboard</div>
                </>
            )
        } else {
            return <>Truth Sleuth Local</>
        }
    }

    /**
     * Renders the appropriate logo based on user role and agency data.
     * 
     * @returns {JSX.Element} Agency logo or default icon
     */
    const renderLogo = () => {
        if (customClaims.agency && agencyLogo) {
            return (
                <Image 
                    src={agencyLogo} 
                    width={55} 
                    height={55} 
                    alt="agency logo" 
                    className='w-auto'
                />
            )
        } else {
            return (
                <div className='bg-blue-600 p-3 rounded-full'>
                    <GiMagnifyingGlass className='fill-white' />
                </div>
            )
        }
    }

    return (
        <div className="w-full grid grid-cols-12 pb-5 md:flex md:flex-row md:px-12 md:justify-between md:items-center">
            {/* Main header content with logo and title */}
            <div className="col-start-3 col-span-9 md:col-start-1 flex items-center">
                {/* Agency logo or default icon */}
                <div className="flex justify-center">
                    {renderLogo()}
                </div>
                
                {/* Application title and subtitle */}
                <div className="text-md font-semibold px-4 tracking-wide">
                    {renderTitle()}
                </div>
            </div>
            
            {/* Search functionality (currently disabled) */}
            {/* {(customClaims.admin || customClaims.agency) &&
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
            }  */}
        </div>
    )
}

export default Headbar