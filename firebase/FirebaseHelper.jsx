import React from 'react'
import { collection, getDocs, where } from 'firebase/firestore'
import { db } from '../config/firebase'

class FirebaseServices {
	constructor() {}

	fetchAllRecordsOfCollection = async (collectionName) => {
		try {
			const querySnapshot = await getDocs(collection(db, collectionName))
			const records = []
			querySnapshot.forEach((doc) => {
				records.push({ id: doc.id, ...doc.data() })
			})
			return records
		} catch (error) {
			console.error('Error fetching records: ', error)
			throw error
		}
	}

  // Add more Firestore functions here...
}

const firebaseHelper = new FirebaseServices()

export default firebaseHelper
