import React from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'

class FirebaseServices {
	constructor() {}

	/**
	 * Fetches a document from a collection by its ID.
	 *
	 * @param {string} collectionName - The name of the Firestore collection.
	 * @param {string} documentId - The ID of the document to fetch.
	 * @returns {Promise<Object>} A promise that resolves to the document data or null if not found.
	 * @throws {Error} Throws an error if the fetch operation fails.
	 */
	async fetchDocumentById(collectionName, documentId) {
		try {
			const docRef = doc(db, collectionName, documentId)
			const docSnap = await getDoc(docRef)

			if (docSnap.exists()) {
				return { id: docSnap.id, ...docSnap.data() }
			} else {
				console.warn(
					`No document found with ID ${documentId} in collection ${collectionName}`,
				)
				return null
			}
		} catch (error) {
			console.error('Error fetching document: ', error)
			throw error
		}
	}

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

	/**
	 * Fetch a single document from a specified collection in Firestore.
	 *
	 * This function fetches a document from the specified collection based on the provided document ID.
	 * Once fetched, it calls the provided callback function with an object containing the success status,
	 * the document snapshot, and a message.
	 *
	 * @param {string} collectionName - The name of the collection to query.
	 * @param {string} documentId - The ID of the document to fetch.
	 * @param {function} callback - A callback function to handle the result.
	 */
	fetchARecordFromCollection = async (collectionName, documentId, callback) => {
		try {
			const docRef = doc(db, collectionName, documentId)
			const docSnapshot = await getDoc(docRef)

			if (docSnapshot.exists()) {
				callback({
					isSuccess: true,
					response: docSnapshot,
					message: 'Document fetched successfully',
				})
			} else {
				callback({
					isSuccess: false,
					response: null,
					message: 'Document not found',
				})
			}
		} catch (error) {
			callback({
				isSuccess: false,
				response: null,
				message: error.message,
			})
		}
	}

	/**
	 * Fetch the agency where the user's email is in the `agencyUsers` array.
	 *
	 * @param {string} email - The email of the user to search for.
	 * @param {function} callback - A callback function to handle the result.
	 */
	fetchAgencyByUserEmail = async (email, callback) => {
		try {
			const agencyQuery = query(
				collection(db, 'agency'),
				where('agencyUsers', 'array-contains', email),
			)

			const querySnapshot = await getDocs(agencyQuery)
			if (!querySnapshot.empty) {
				const agencyDoc = querySnapshot.docs[0] // Assuming the first result is the correct one
				callback({
					isSuccess: true,
					response: agencyDoc,
					message: 'Agency found successfully',
				})
			} else {
				callback({
					isSuccess: false,
					response: null,
					message: 'No agency found for this user',
				})
			}
		} catch (error) {
			callback({
				isSuccess: false,
				response: null,
				message: error.message,
			})
		}
	}

	// Add more Firestore functions here...
}

const firebaseHelper = new FirebaseServices()

export default firebaseHelper
