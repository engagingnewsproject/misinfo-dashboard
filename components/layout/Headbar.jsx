/**
 * @fileoverview Headbar - Application Header Component
 *
 * This component displays the main header bar of the application, including
 * the agency logo, title, and (on mobile) the menu button that opens the nav drawer.
 * It dynamically shows different content based on the user's role (admin, agency, or
 * regular user) and fetches agency-specific branding from Firestore.
 *
 * @module components/Headbar
 */

import React, { useState, useEffect } from 'react'
import { IconButton } from '@material-tailwind/react'
import { AiOutlineSearch } from 'react-icons/ai'
import { GiMagnifyingGlass } from 'react-icons/gi'
import { IoMenu } from 'react-icons/io5'
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { useMobileNav } from '../../context/MobileNavContext'
import { db } from '../../config/firebase'
import Image from 'next/image'

/**
 * Headbar - Main application header component.
 *
 * @param {Object} props
 * @param {string} [props.search] - Current search query value
 * @param {Function} [props.setSearch] - Function to update search query
 * @returns {JSX.Element}
 */
const Headbar = ({ search, setSearch }) => {
	const { user, customClaims } = useAuth()
	const { openDrawer } = useMobileNav()
	const [agencyLogo, setAgencyLogo] = useState('')
	const [title, setTitle] = useState('')

	const getData = async () => {
		const applyAgencyDoc = (agencyData) => {
			if (!agencyData) return
			setTitle(agencyData.name || '')
			const logo = agencyData.logo
			if (Array.isArray(logo) && logo[0]) {
				setAgencyLogo(logo[0])
			}
		}

		try {
			if (customClaims?.agencyId) {
				const agencySnap = await getDoc(doc(db, 'agency', customClaims.agencyId))
				if (agencySnap.exists()) {
					applyAgencyDoc(agencySnap.data())
					return
				}
			}

			if (customClaims?.agency && !customClaims?.agencyId) {
				return
			}

			if (!user?.email) return
			const agencyCollection = collection(db, 'agency')
			const q = query(
				agencyCollection,
				where('agencyUsers', 'array-contains', user.email),
			)
			const querySnapshot = await getDocs(q)
			querySnapshot.forEach((agencyDoc) => {
				applyAgencyDoc(agencyDoc.data())
			})
		} catch (error) {
			console.error(error)
		}
	}

	const handleSearch = (e) => {
		e.preventDefault()
		if (search.length == 0) return
	}

	const handleChange = (e) => {
		setSearch(e.target.value)
	}

	useEffect(() => {
		getData()
	}, [customClaims?.agencyId, user?.email])

	const renderTitle = () => {
		if (customClaims.admin) {
			return (
				<>
					Truth Sleuth Local
					<div className="text-sm font-normal">ADMIN DASHBOARD</div>
				</>
			)
		} else if (customClaims.agency && !customClaims.admin) {
			return (
				<>
					{title}
					<div className="text-sm font-normal">Agency Dashboard</div>
				</>
			)
		} else {
			return <>Truth Sleuth Local</>
		}
	}

	const renderLogo = () => {
		if (customClaims.agency && agencyLogo) {
			return (
				<Image
					src={agencyLogo}
					width={55}
					height={55}
					alt="agency logo"
					className="h-[40px] w-[40px] md:h-[55px] md:w-[55px] object-contain"
				/>
			)
		}
		return (
			<div className="bg-brand p-2.5 md:p-3 rounded-full shrink-0">
				<GiMagnifyingGlass className="fill-white" />
			</div>
		)
	}

	return (
		<div
			data-component="Headbar"
			className="w-full flex flex-row items-center gap-1 pb-5 px-3 sm:px-4 md:px-12 md:justify-between">
			<div className="flex items-center min-w-0 flex-1">
				{typeof openDrawer === 'function' && (
					<IconButton
						variant="text"
						onClick={openDrawer}
						className="sm:hidden shrink-0 text-brand hover:bg-brand/10 mr-1"
						aria-label="Open menu">
						<IoMenu size={36} />
					</IconButton>
				)}

				<div className="flex justify-center shrink-0">{renderLogo()}</div>

				<div className="text-md font-semibold px-3 md:px-4 tracking-wide min-w-0 truncate">
					{renderTitle()}
				</div>
			</div>

			{/* Search functionality (currently disabled) */}
			{/* {(customClaims.admin || customClaims.agency) &&
            <form className="mt-5 flex relative md:w-2/4 lg:w-1/4 lg:max-w-xs" onChange={handleChange} onSubmit={handleSearch}>
                <input
                    className="shadow border-none rounded-md w-full p-3 pr-11 text-xs text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="search"
                    type="text"
                    placeholder="Search"
                    onChange={handleChange}
                    value={search} />
                <button
                className="py-1 px-1 mt-1 mr-1 absolute right-0 top-0 bg-blue-600 text-white rounded-md"
                type='submit'>
                    <AiOutlineSearch size={25}/>
                </button>
            </form>
            }  */}
		</div>
	)
}

export default Headbar
