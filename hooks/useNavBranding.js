/**
 * Agency logo + name for the nav brand chrome.
 * Mirrors former Headbar Firestore lookup (agencyId doc, then legacy email query).
 */
import { useEffect, useState } from 'react'
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'

export function useNavBranding() {
	const { user, customClaims } = useAuth()
	const [agencyLogo, setAgencyLogo] = useState('')
	const [agencyName, setAgencyName] = useState('')

	useEffect(() => {
		const applyAgencyDoc = (agencyData) => {
			if (!agencyData) return
			setAgencyName(agencyData.name || '')
			const logo = agencyData.logo
			if (Array.isArray(logo) && logo[0]) {
				setAgencyLogo(logo[0])
			}
		}

		const getData = async () => {
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

		getData()
	}, [customClaims?.agencyId, customClaims?.agency, user?.email])

	return { agencyLogo, agencyName, customClaims }
}

export default useNavBranding
