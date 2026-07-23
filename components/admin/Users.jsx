/**
 * @fileoverview Users Management Component - Comprehensive user administration interface
 *
 * This component provides a complete user management interface for administrators
 * to view, edit, and manage users across the misinformation dashboard. Key features include:
 * - User listing with infinite scroll and real-time data
 * - Role-based access control (Admin, Agency, User)
 * - User editing with role and agency management
 * - User creation with email invitation system
 * - User deletion with confirmation
 * - Agency association management
 * - User status tracking (banned, disabled)
 * - Real-time data fetching from Firebase Auth and Firestore
 * - Role-based UI rendering (admin vs agency views)
 * - Data validation and error handling
 *
 * The component integrates with multiple modals for different operations:
 * - EditUserModal: Edit existing users
 * - NewUserModal: Create new users
 * - ConfirmModal: Delete confirmation
 *
 * Role-based functionality:
 * - Admins: Full access to all users, can edit roles, assign agencies, delete users
 * - Agency users: Limited view of users within their agency
 * - Real-time updates when user data changes
 *
 * @author Misinformation Dashboard Team
 * @version 1.0.0
 * @since 2024
 */

import React, {
	useState,
	useEffect,
	useContext,
	useMemo,
	useCallback,
	useRef,
} from 'react'
import { useAuth } from '../../context/AuthContext'
import {
	collection,
	getDocs,
	getDoc,
	doc,
	deleteDoc,
	updateDoc,
	setDoc,
	onSnapshot,
	query,
	where,
	addDoc,
	arrayUnion,
	Timestamp,
	GeoPoint,
} from 'firebase/firestore'
import { db, auth } from '../../config/firebase'
import { Tooltip } from 'react-tooltip'
import { IoTrash } from 'react-icons/io5'
import InfiniteScroll from 'react-infinite-scroll-component'
import ConfirmModal from '../modals/common/ConfirmModal'
import EditUserModal from '../modals/admin/EditUserModal'
import NewUserModal from '../modals/admin/NewUserModal'
import RecreateProfileModal from '../modals/admin/RecreateProfileModal'
import { FaPlus } from 'react-icons/fa'
import {
	buildMobileUserProfile,
	defaultDisplayNameFromAuth,
	userRoleFromClaims,
} from '../../utils/mobile-user-profile'
import globalStyles from '../../styles/globalStyles'
import { useUsersPagination } from '../../hooks/useUsersPagination'
import { searchUsers, findMobileUsersByEmail } from '../../utils/firebase-helpers'
import {
	buildActiveReportsQuery,
	fetchExperimentConfig,
	getActiveExperimentId,
} from '../../utils/reports-queries'
import LoadingSpinner from '../ui/LoadingSpinner'
import adminSectionStyles from '../../styles/adminSectionStyles'

const dateOptions = {
	day: '2-digit',
	year: 'numeric',
	month: 'short',
}
const tableHeading = {
	default: 'px-3 py-1 text-sm font-semibold text-left tracking-wide',
	default_center: 'text-center p-2 text-sm font-semibold tracking-wide',
	small: '',
}
const column = {
	data: 'whitespace-normal text-sm px-3 py-1',
	data_center:
		'whitespace-normal md:whitespace-nowrap text-sm px-3 py-1 text-center',
}
const style = adminSectionStyles

/**
 * Retrieves the user's join date based on available data.
 *
 * This function determines the user's join date by checking the `joiningDate` field in the Firestore
 * user document (`firestoreUser`). If the `joiningDate` is present, it is converted to a human-readable
 * format. If the `joiningDate` is not available, the function falls back to using the `creationTime`
 * from the user's Firebase Auth metadata (`authUser`). If neither source provides a date, it returns
 * a default message indicating that no date is available.
 *
 * @param {Object} firestoreUser - The Firestore document data for the user, containing a possible `joiningDate` field.
 * @param {Object} authUser - The Firebase Auth user object, containing metadata like `creationTime`.
 * @returns {string} The user's join date formatted as a human-readable string, or 'No Date' if unavailable.
 */
const getJoinedDate = (firestoreUser, authUser) => {
	if (firestoreUser && firestoreUser.joiningDate) {
		// If Firestore user data exists and has a 'joiningDate', use it
		return new Date(firestoreUser.joiningDate * 1000).toLocaleString(
			'en-US',
			dateOptions,
		)
	} else if (authUser) {
		// Otherwise, use 'metadata.creationTime' from the Auth user
		return new Date(authUser.metadata.creationTime).toLocaleString(
			'en-US',
			dateOptions,
		)
	} else {
		// Fallback if neither is available
		return 'No Date'
	}
}

/** Stable id for a table row (Auth uid or Firestore mobileUsers doc id). */
const getUserRowIdentifier = (row) => row?.uid || row?.mobileUserId || row?.id

/** Returns a new list with the row matching `docId` shallow-merged with `partial`. */
const patchUserRowInList = (prev, docId, partial) => {
	if (!docId || !partial) return prev
	return prev.map((row) =>
		getUserRowIdentifier(row) === docId ? { ...row, ...partial } : row,
	)
}

/**
 * Sorts an array of users by their join date in descending order.
 *
 * This function takes an array of user objects and sorts them based on their `joined` date.
 * The sorting is done in descending order, so users with the most recent join date will appear first.
 * The `joined` date is expected to be a string that can be converted into a Date object.
 *
 * @param {Array<Object>} users - An array of user objects, each containing a `joined` date field.
 * @returns {Array<Object>} The sorted array of users, with the most recently joined users first.
 */
const sortByJoinedDate = (users) => {
	return users.sort((a, b) => new Date(b.joined) - new Date(a.joined))
}

const describeFirestoreField = (fieldValue) => {
	if (fieldValue === undefined) {
		return { value: null, type: 'null', originalValue: null }
	}
	if (fieldValue instanceof Timestamp) {
		return {
			value: fieldValue.toDate().toISOString(),
			type: 'timestamp',
			originalValue: fieldValue,
		}
	}
	if (fieldValue instanceof GeoPoint) {
		return {
			value: {
				latitude: fieldValue.latitude,
				longitude: fieldValue.longitude,
			},
			type: 'geopoint',
			originalValue: fieldValue,
		}
	}
	if (Array.isArray(fieldValue)) {
		return {
			value: fieldValue,
			type: 'array',
			originalValue: fieldValue,
		}
	}
	if (fieldValue === null) {
		return { value: null, type: 'null', originalValue: null }
	}
	const primitiveType = typeof fieldValue
	if (primitiveType === 'object') {
		return {
			value: fieldValue,
			type: 'object',
			originalValue: fieldValue,
		}
	}
	return {
		value: fieldValue,
		type: primitiveType,
		originalValue: fieldValue,
	}
}

const serializeFieldForFirestore = (fieldName, value, metadata) => {
	const fieldType = metadata?.type ?? typeof value

	switch (fieldType) {
		case 'number': {
			if (value === '' || value === null) {
				return null
			}
			const numericValue = Number(value)
			if (Number.isNaN(numericValue)) {
				throw new Error(`Field "${fieldName}" must be a number.`)
			}
			return numericValue
		}
		case 'boolean': {
			if (typeof value === 'boolean') {
				return value
			}
			if (value === '' || value === null) {
				return false
			}
			if (typeof value === 'string') {
				const normalized = value.trim().toLowerCase()
				if (normalized === 'true') {
					return true
				}
				if (normalized === 'false') {
					return false
				}
			}
			return Boolean(value)
		}
		case 'timestamp': {
			if (value === '' || value === null) {
				return null
			}
			if (value instanceof Timestamp) {
				return value
			}
			if (typeof value === 'string') {
				const parsedDate = new Date(value)
				if (Number.isNaN(parsedDate.getTime())) {
					throw new Error(
						`Field "${fieldName}" must be a valid ISO date string (received "${value}").`,
					)
				}
				return Timestamp.fromDate(parsedDate)
			}
			if (value && typeof value === 'object') {
				const seconds = Number(value.seconds)
				const nanoseconds = Number(value.nanoseconds ?? 0)
				if (Number.isNaN(seconds) || Number.isNaN(nanoseconds)) {
					throw new Error(
						`Field "${fieldName}" timestamp JSON must include numeric seconds and nanoseconds.`,
					)
				}
				return new Timestamp(seconds, nanoseconds)
			}
			throw new Error(`Unsupported value provided for timestamp field "${fieldName}".`)
		}
		case 'geopoint': {
			if (!value) {
				return null
			}
			const latitude = Number(value.latitude)
			const longitude = Number(value.longitude)
			if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
				throw new Error(
					`Field "${fieldName}" requires numeric latitude and longitude values.`,
				)
			}
			return new GeoPoint(latitude, longitude)
		}
		case 'array': {
			if (value == null) {
				return null
			}
			if (Array.isArray(value)) {
				return value
			}
			if (typeof value === 'string') {
				try {
					const parsed = JSON.parse(value)
					if (!Array.isArray(parsed)) {
						throw new Error()
					}
					return parsed
				} catch (error) {
					throw new Error(
						`Field "${fieldName}" must be a JSON array when provided as text.`,
					)
				}
			}
			throw new Error(`Unsupported value provided for array field "${fieldName}".`)
		}
		case 'object': {
			if (value == null) {
				return null
			}
			if (typeof value === 'object' && !Array.isArray(value)) {
				return value
			}
			if (typeof value === 'string') {
				try {
					const parsed = JSON.parse(value)
					if (parsed === null || Array.isArray(parsed)) {
						throw new Error()
					}
					return parsed
				} catch (error) {
					throw new Error(
						`Field "${fieldName}" must be valid JSON representing an object.`,
					)
				}
			}
			throw new Error(`Unsupported value provided for object field "${fieldName}".`)
		}
		case 'null': {
			return null
		}
		case 'string': {
			if (value == null) {
				return ''
			}
			return String(value)
		}
		default:
			return value
	}
}

/**
 * Users Component - Comprehensive user management interface
 *
 * This component provides a complete user administration interface with role-based
 * access control. It handles user listing, editing, creation, and deletion with
 * real-time data synchronization between Firebase Auth and Firestore.
 *
 * Key functionality:
 * - Display users in a table with infinite scroll
 * - Role-based UI rendering (admin vs agency views)
 * - User editing with role and agency management
 * - User creation with email invitation system
 * - User deletion with confirmation
 * - Agency association management
 * - Real-time data updates
 * - User status tracking (banned, disabled)
 *
 * Role-based access:
 * - Admins: Full access to all users and operations
 * - Agency users: Limited view of users within their agency
 *
 * @returns {JSX.Element} The Users management component
 */
const Users = () => {
	// Initialize authentication context
	const {
		user,
		addAdminRole,
		addAgencyRole,
		addUserRole,
		sendSignIn,
		customClaims,
		fetchUserRecord,
		authGetUserList,
		getUserByEmail,
		functionsReady,
		refreshCustomClaims,
	} = useAuth()

	// User data management state
	const [userRole, setUserRole] = useState('') // Current user's role being edited
	const [searchTerm, setSearchTerm] = useState('') // Search term for filtering users
	const [roleFilter, setRoleFilter] = useState('all') // Role filter for users
	const [deleteModal, setDeleteModal] = useState(false) // Delete confirmation modal
	const [userEditing, setUserEditing] = useState([]) // User data being edited
	const [name, setName] = useState('') // User name being edited
	const [email, setEmail] = useState('') // User email being edited

	// Agency management state
	const [agencyName, setAgencyName] = useState('') // Agency name for user
	const [agencyId, setAgencyId] = useState('') // Agency ID for user
	const [agenciesArray, setAgenciesArray] = useState([]) // List of all agencies
	const [selectedAgency, setSelectedAgency] = useState('') // Currently selected agency
	const [banned, setBanned] = useState(false) // User banned status
	const [userEditModal, setUserEditModal] = useState(null) // User edit modal state
	const [userId, setUserId] = useState(null) // Current user ID being edited
	const [update, setUpdate] = useState('') // Trigger for data refresh

	const [mobileUserDetails, setMobileUserDetails] = useState({}) // Additional Firestore fields for the user
	const [mobileUserFieldTypes, setMobileUserFieldTypes] = useState({}) // Track original field types for serialization
	const [mobileFieldFormError, setMobileFieldFormError] = useState('') // Validation error surfaced by additional field edits
	
	// New user creation state
	const [newUserModal, setNewUserModal] = useState(false) // New user modal state
	const [data, setData] = useState({ email: '' }) // New user data
	const [newUserEmail, setNewUserEmail] = useState('') // New user email
	const [errors, setErrors] = useState({}) // Form validation errors

	// Recreate missing mobileUsers profile (Auth exists, Firestore doc deleted)
	const [recreateModal, setRecreateModal] = useState(false)
	const [recreateLookupMode, setRecreateLookupMode] = useState(
		/** @type {'uid' | 'email'} */ ('email'),
	)
	const [recreateLookup, setRecreateLookup] = useState('')
	const [recreateLookingUp, setRecreateLookingUp] = useState(false)
	const [recreateResolved, setRecreateResolved] = useState(
		/** @type {null | {
		 *   uid: string
		 *   email: string
		 *   displayName: string
		 *   suggestedRole: string
		 *   docExists: boolean
		 *   creationTime?: string
		 * }} */ (null),
	)
	const [recreateName, setRecreateName] = useState('')
	const [recreateRole, setRecreateRole] = useState('User')
	const [recreateAgency, setRecreateAgency] = useState('')
	const [recreateForce, setRecreateForce] = useState(false)
	const [recreateSubmitting, setRecreateSubmitting] = useState(false)
	const [recreateErrors, setRecreateErrors] = useState(
		/** @type {Record<string, string>} */ ({}),
	)
	const [recreateSuccess, setRecreateSuccess] = useState('')

	// State for agency-specific user management
	const [agencyUsers, setAgencyUsers] = useState([]) // Users filtered by agency
	const [agencyLoading, setAgencyLoading] = useState(false) // Loading state for agency users
	const [agencyClaimsStatus, setAgencyClaimsStatus] = useState(
		/** @type {'ok' | 'pending' | 'missing'} */ ('ok'),
	)
	const agencyClaimsRefreshAttempted = useRef(false)

	// Initialize pagination hook for fetching users in batches
	// For Admin users: fetches all users with pagination
	// For Agency users: we'll handle filtering separately due to complex agency logic
	const {
		users: paginatedUsers,
		loading: isLoading,
		initialLoading,
		error: paginationError,
		hasMore,
		loadMore,
		reset: resetPagination,
		refresh: refreshUsers,
		patchUser: patchPaginatedUser,
	} = useUsersPagination({
		pageSize: 50,
		userRole: roleFilter !== 'all' ? roleFilter : null,
		autoLoad: false, // We'll manually trigger loading after setup
		orderField: 'joiningDate',
		orderDirection: 'desc',
	})
	
	// Auth-enriched list for admin (from enhanceWithAuthDetails)
	const [enhancedPaginatedUsers, setEnhancedPaginatedUsers] = useState([])
	const paginatedUsersRef = useRef(paginatedUsers)
	paginatedUsersRef.current = paginatedUsers
	// Skip update-effect on mount; mount effect already loads data
	const skipUpdateRefreshOnMount = useRef(true)
	/** Cached Auth user map (uid -> record). Fetched once — re-fetching on every page crashed scroll. */
	const authUsersMapRef = useRef(/** @type {Map<string, object> | null} */ (null))
	const authUsersFetchPromiseRef = useRef(/** @type {Promise<Map<string, object>> | null} */ (null))
	/** Server/Auth email search hits; null = not in email-search mode */
	const [remoteSearchHits, setRemoteSearchHits] = useState(
		/** @type {null | Array<object>} */ (null),
	)
	const [remoteSearchLoading, setRemoteSearchLoading] = useState(false)
	const searchActive = !!(searchTerm && searchTerm.trim())
	const emailSearchActive = searchActive && searchTerm.includes('@')

	const getAuthUsersMap = useCallback(async () => {
		if (authUsersMapRef.current) {
			return authUsersMapRef.current
		}
		if (authUsersFetchPromiseRef.current) {
			return authUsersFetchPromiseRef.current
		}
		authUsersFetchPromiseRef.current = (async () => {
			const result = await authGetUserList()
			const map = new Map()
			;(result?.data?.users || []).forEach((authUser) => {
				map.set(authUser.uid, authUser)
			})
			authUsersMapRef.current = map
			return map
		})()
		try {
			return await authUsersFetchPromiseRef.current
		} finally {
			authUsersFetchPromiseRef.current = null
		}
	}, [authGetUserList])

	// Processed users: combines pagination data with auth details and applies search
	const loadedMobileUsers = useMemo(() => {
		if (emailSearchActive) {
			if (remoteSearchHits !== null) {
				return remoteSearchHits
			}
			return []
		}

		const usedEnhanced =
			!!customClaims?.admin &&
			enhancedPaginatedUsers.length === paginatedUsers.length
		const baseUsers = customClaims?.agency
			? agencyUsers
			: usedEnhanced
				? enhancedPaginatedUsers
				: paginatedUsers

		// Name (non-email) search: filter already-loaded rows only
		if (searchActive && !emailSearchActive) {
			return searchUsers(baseUsers, searchTerm)
		}

		return baseUsers
	}, [
		paginatedUsers,
		agencyUsers,
		enhancedPaginatedUsers,
		searchTerm,
		customClaims,
		emailSearchActive,
		searchActive,
		remoteSearchHits,
	])

	/**
	 * Debounced email search against Firestore + Auth (not just loaded pages).
	 */
	useEffect(() => {
		const term = (searchTerm || '').trim()
		if (!term || !term.includes('@')) {
			setRemoteSearchHits(null)
			setRemoteSearchLoading(false)
			return
		}

		let cancelled = false
		setRemoteSearchLoading(true)
		const timer = setTimeout(async () => {
			try {
				const firestoreHits = await findMobileUsersByEmail(term)
				let authUser = null
				if (functionsReady && getUserByEmail) {
					try {
						const result = await getUserByEmail({ email: term })
						authUser = result?.data?.uid ? result.data : null
					} catch (err) {
						console.warn('Email search Auth lookup failed:', err)
					}
				}

				const authMap = authUsersMapRef.current
				const byId = new Map()

				for (const hit of firestoreHits) {
					const auth =
						authMap?.get(hit.id) ||
						(authUser?.uid === hit.id ? authUser : null)
					byId.set(hit.id, {
						...(auth || {}),
						...hit,
						hasFirestoreDoc: true,
						joined: getJoinedDate(hit, auth || null),
						mobileUserId: hit.id,
						disabled: auth?.disabled ?? hit.disabled ?? false,
					})
				}

				// Auth-only user (missing mobileUsers doc) — still show so admin can recreate
				if (authUser?.uid && !byId.has(authUser.uid)) {
					byId.set(authUser.uid, {
						...authUser,
						id: authUser.uid,
						uid: authUser.uid,
						email: authUser.email || term,
						name: authUser.displayName || '',
						hasFirestoreDoc: false,
						joined: getJoinedDate(null, authUser),
						mobileUserId: authUser.uid,
						disabled: !!authUser.disabled,
					})
				}

				const hits = [...byId.values()]
				if (!cancelled) setRemoteSearchHits(hits)
			} catch (error) {
				console.error('Remote email search failed:', error)
				if (!cancelled) setRemoteSearchHits([])
			} finally {
				if (!cancelled) setRemoteSearchLoading(false)
			}
		}, 300)

		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [searchTerm, functionsReady, getUserByEmail])

	/**
	 * Fetches all agency documents from the Firestore 'agency' collection
	 * and stores them in an array with their ID and name.
	 *
	 * This function retrieves all the documents from the 'agency' collection in Firestore.
	 * It then maps each document to an object containing its ID and name. The resulting
	 * array of agencies is stored in the component's state using the `setAgenciesArray` function.
	 *
	 * @returns {Promise<void>} A promise that resolves when the agencies have been fetched
	 * and stored in the `agenciesArray` state.
	 */
	const fetchAgencies = async () => {
		const snapshot = await getDocs(collection(db, 'agency'))
		const agencies = snapshot.docs.map((doc) => ({
			id: doc.id,
			name: doc.data().name,
		}))
		// console.log(agencies);
		setAgenciesArray(agencies)
	}

	/**
	 * Fetches reporter user IDs from active reports for an agency.
	 * Prefer agencyId so the query matches scoped Firestore rules.
	 *
	 * @param {{ agencyId?: string, agencyName?: string }} agency
	 * @returns {Promise<string[]>}
	 */
	const getAgencyUserIds = async ({ agencyId, agencyName } = {}) => {
		const experimentConfig = await fetchExperimentConfig()
		const activeExperimentId = getActiveExperimentId(experimentConfig)
		const reportQuery = buildActiveReportsQuery({
			...(agencyId ? { agencyId } : { agency: agencyName }),
			activeExperimentId,
		})
		const reportSnapshot = await getDocs(reportQuery)
		const userIds = reportSnapshot.docs.map((doc) => doc.data().userID)
		return userIds
	}

	/**
	 * Filters users to those who submitted reports for the given agency.
	 * Prefer claim agencyId (scoped report query); avoid agencyUsers collection queries.
	 *
	 * @param {Array} users
	 * @param {{ agencyId?: string, agencyName?: string }} agency
	 * @returns {Promise<Array>}
	 */
	const filterUsersByAgency = async (users, agency) => {
		const agencyId =
			typeof agency?.agencyId === 'string' ? agency.agencyId.trim() : ''
		const agencyName =
			typeof agency?.agencyName === 'string' ? agency.agencyName.trim() : ''
		if (!agencyId && !agencyName) {
			console.log('No agency found for this user.')
			return []
		}

		const userIds = await getAgencyUserIds({ agencyId, agencyName })
		return users.filter((u) => userIds.includes(u.mobileUserId))
	}

	/**
	 * Fetches the Firestore Auth details of a user by their user ID and determines if the user is disabled.
	 *
	 * This function attempts to fetch the user record associated with the provided user ID.
	 * If the record is successfully retrieved, it checks if the user is disabled. If an error
	 * occurs during the fetch, the function assumes the user is disabled and logs the error.
	 *
	 * @param {string} userId - The unique identifier of the user whose details are being fetched.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if the user is disabled or
	 * if an error occurs during the fetch, and `false` if the user is not disabled.
	 */
	const fetchUserDetails = async (userId) => {
		try {
			// Get Firestore Auth user details
			const userRecord = await fetchUserRecord(userId)
			// console.log("User Data:", userRecord);
			return userRecord.disabled || false // Assuming fetchUserRecord correctly returns the user data
		} catch (error) {
			console.error('Error fetching user data:', userId, error)
			return true // Assume disabled if error
		}
	}

	/**
	 * Asynchronous function to fetch and process user data with pagination.
	 *
	 * This function is responsible for retrieving a list of users, either from Firestore's `mobileUsers`
	 * collection or from Firebase Auth, depending on the user's role (Agency or Admin). It processes
	 * and combines the user data, including additional fields like `joined` and `disabled`.
	 *
	 * For Agency users:
	 * - Fetches users from Firestore's `mobileUsers` collection.
	 * - Filters users by the agency associated with the logged-in user's email.
	 * - Sets the filtered and sorted list of users into the component's state.
	 * - Note: Agency users still load all their users at once due to complex filtering requirements
	 *
	 * For Admin users:
	 * - Uses pagination hook to fetch users in batches (50 at a time)
	 * - Enhances paginated data with Firebase Auth details
	 * - Combines data from both sources for complete user information
	 *
	 * @async
	 * @function
	 * @param {{ agencyId?: string, agencyName?: string }} [agencyOverride]
	 *        Freshly resolved agency values to use instead of React state
	 *        (avoids reading stale agencyId/agencyName right after setState).
	 * @returns {Promise<void>} This function does not return a value, but updates the component's state.
	 *
	 * @throws Will log an error to the console if the data fetching or processing fails.
	 */
	const getData = async (agencyOverride) => {
		try {
			if (customClaims.agency) {
				// Agency user is viewing Users table
				// Note: Agency logic is complex due to cross-collection filtering
				// For now, we still load all agency users at once
				setAgencyLoading(true)

				// Pull firestore `mobileUsers` list of users
				const mobileUsersQuerySnapshot = await getDocs(
					collection(db, 'mobileUsers'),
				)

				const mobileUsersArr = await Promise.all(
					mobileUsersQuerySnapshot.docs.map(async (doc) => {
						const userData = doc.data()
						userData.mobileUserId = doc.id
						userData.disabled = await fetchUserDetails(doc.id)

						// Only set 'joined' if 'joiningDate' exists
						userData.joined = getJoinedDate(userData, null)
						return userData
					}),
				)

				// Prefer explicit override (same tick as setState), then claims, then state
				const filteredUsers = await filterUsersByAgency(mobileUsersArr, {
					agencyId:
						agencyOverride?.agencyId ||
						customClaims?.agencyId ||
						agencyId,
					agencyName:
						agencyOverride?.agencyName ||
						customClaims?.agencyName ||
						agencyName,
				})

				// Ensure filteredUsers is always an array
				setAgencyUsers(sortByJoinedDate(filteredUsers) || [])
				setAgencyLoading(false)
			} else {
				// Admin: replace list (do not append — avoids duplicate rows on refresh)
				await resetPagination()
			}
		} catch (error) {
			console.error('Failed to fetch or process user data:', error)
			setAgencyLoading(false)
		}
	}

	/**
	 * Enhances paginated users with Firebase Auth details for Admin users
	 * This is called after pagination data is loaded to add auth-specific information
	 */
	const enhanceWithAuthDetails = useCallback(
		async (users) => {
			if (!customClaims.admin || users.length === 0) {
				return users
			}

			try {
				const authUsersMap = await getAuthUsersMap()

				// Enhance paginated users with auth details
				return users.map((firestoreUser) => {
					const authUser = authUsersMap.get(firestoreUser.id)
					if (authUser) {
						return {
							...authUser,
							...firestoreUser,
							hasFirestoreDoc: true,
							joined: getJoinedDate(firestoreUser, authUser),
							mobileUserId: firestoreUser.id,
						}
					}
					// User exists in Firestore but not in Auth
					return {
						...firestoreUser,
						hasFirestoreDoc: true,
						joined: getJoinedDate(firestoreUser, null),
						mobileUserId: firestoreUser.id,
					}
				})
			} catch (error) {
				console.error('Failed to enhance users with auth details:', error)
				return users
			}
		},
		[customClaims, getAuthUsersMap],
	)
	
	// For admin, enrich paginated users with Auth details when the list changes (only after Functions is ready)
	useEffect(() => {
		if (!customClaims?.admin || paginatedUsers.length === 0) {
			setEnhancedPaginatedUsers([])
			return
		}
		if (!functionsReady) return
		let cancelled = false
		const list = paginatedUsersRef.current
		enhanceWithAuthDetails(list).then((result) => {
			if (!cancelled) setEnhancedPaginatedUsers(result)
		})
		return () => { cancelled = true }
	}, [paginatedUsers.length, customClaims?.admin, functionsReady, enhanceWithAuthDetails])
	

	/**
	 * Handles the event when the "Add New User" button is clicked, opening the modal to add a new user.
	 *
	 * This function prevents the default form submission behavior when the "Add New User" button is clicked.
	 * It then triggers the state change to open the modal for adding a new user by setting `setNewUserModal` to `true`.
	 *
	 * @param {Event} e - The event object from the form submission.
	 */
	const handleAddNewUserModal = (e) => {
		e.preventDefault()
		setNewUserModal(true)
	}

	/**
	 * Handles the change event for the "New User Email" input field.
	 *
	 * This function updates the `newUserEmail` state with the value entered in the input field.
	 * It also clears any existing email-related error in the `errors` state as soon as the user starts typing,
	 * ensuring that the error message is removed when the user re-enters the input field.
	 *
	 * @param {Event} e - The event object from the input field.
	 */
	const handleNewUserEmail = (e) => {
		setNewUserEmail(e.target.value)
		// Clear the email-related error when the user starts typing
		setErrors((prevErrors) => ({
			...prevErrors,
			email: '', // Clear the email error
		}))
	}

	/**
	 * Handles the submission of the form to add a new user.
	 *
	 * This function is responsible for managing the entire process of adding a new user.
	 * It first prevents the default form submission behavior and clears any existing errors.
	 * The function then validates the new user's email address to ensure it meets the minimum
	 * length requirement (at least 15 characters). If the email is valid, the function attempts
	 * to send a sign-in link to the provided email address.
	 *
	 * After successfully sending the sign-in link, the function adds the new user's email to the
	 * `agencyUsers` array in the corresponding Firestore agency document, provided that the
	 * `agencyId` is valid. If any part of this process fails, the error is caught and handled by
	 * updating the `errors` state with the appropriate message.
	 *
	 * Finally, if all operations succeed, the function triggers a state update to refresh the user list
	 * and closes the modal.
	 *
	 * @param {Event} e - The event object from the form submission.
	 * @returns {Promise<void>} A promise that resolves after the sign-in email is sent, the user's email
	 * is added to the Firestore agency document, and the modal is closed. If an error is encountered,
	 * it is handled and displayed in the form.
	 */
	const handleAddNewUserFormSubmit = async (e) => {
		e.preventDefault()
		try {
			// Clear previous errors
			setErrors({})

			// Validate the email length before sending the sign-in link
			if (newUserEmail.length < 15) {
				setErrors((prevErrors) => ({
					...prevErrors,
					// Error message shown to user
					email: 'Email should be at least 15 characters long',
				}))
				return // Stop the form submission if there's a validation error
			}

			await sendSignIn(newUserEmail)

			// Add the new user's email to the agency's `agencyUsers` array in Firestore
			// Validate agencyId before proceeding
			if (!agencyId || agencyId.trim() === '') {
				throw new Error('Invalid or missing agency ID')
			}
			const agencyRef = doc(db, 'agency', agencyId)
			console.log(agencyRef)
			await updateDoc(agencyRef, {
				agencyUsers: arrayUnion(newUserEmail),
			})

			setUpdate(!update)
			setNewUserModal(false)
		} catch (error) {
			console.error('Error in handleAddNewUserFormSubmit:', error.message)

			// Set the error message in the errors state
			setErrors((prevErrors) => ({
				...prevErrors,
				email: error.message,
			}))
		}
	}

	const resetRecreateModalState = () => {
		setRecreateLookup('')
		setRecreateLookupMode('email')
		setRecreateLookingUp(false)
		setRecreateResolved(null)
		setRecreateName('')
		setRecreateRole('User')
		setRecreateAgency('')
		setRecreateForce(false)
		setRecreateSubmitting(false)
		setRecreateErrors({})
		setRecreateSuccess('')
	}

	const handleOpenRecreateModal = (e) => {
		e.preventDefault()
		resetRecreateModalState()
		setRecreateModal(true)
	}

	const handleCloseRecreateModal = (open) => {
		if (!open) {
			setRecreateModal(false)
			resetRecreateModalState()
		}
	}

	/**
	 * Resolve Auth user by email or UID, then check whether mobileUsers/{uid} exists.
	 */
	const handleRecreateLookup = async () => {
		const term = recreateLookup.trim()
		setRecreateErrors({})
		setRecreateSuccess('')
		setRecreateResolved(null)

		if (!term) {
			setRecreateErrors({
				lookup:
					recreateLookupMode === 'email'
						? 'Enter an Auth email'
						: 'Enter an Auth UID',
			})
			return
		}

		setRecreateLookingUp(true)
		try {
			let authUser = null

			if (recreateLookupMode === 'email') {
				const result = await getUserByEmail({ email: term })
				authUser = result?.data
				if (!authUser?.uid) {
					setRecreateErrors({ lookup: 'No Auth user found for that email' })
					return
				}
			} else {
				authUser = await fetchUserRecord(term)
				if (!authUser?.uid) {
					setRecreateErrors({ lookup: 'No Auth user found for that UID' })
					return
				}
			}

			const mobileSnap = await getDoc(doc(db, 'mobileUsers', authUser.uid))
			const suggestedRole = userRoleFromClaims(authUser.customClaims)
			const displayName = defaultDisplayNameFromAuth(authUser)

			setRecreateResolved({
				uid: authUser.uid,
				email: authUser.email || '',
				displayName,
				suggestedRole,
				docExists: mobileSnap.exists(),
				creationTime: authUser.metadata?.creationTime,
			})
			setRecreateName(displayName)
			setRecreateRole(suggestedRole)
			setRecreateForce(false)
		} catch (error) {
			console.error('Recreate profile lookup failed:', error)
			setRecreateErrors({
				lookup: error?.message || 'Lookup failed',
			})
		} finally {
			setRecreateLookingUp(false)
		}
	}

	/**
	 * Write mobileUsers/{uid} from Auth + form fields (admin-only create allowed by rules).
	 */
	const handleRecreateSubmit = async () => {
		if (!recreateResolved?.uid) {
			setRecreateErrors({ submit: 'Look up an Auth user first' })
			return
		}
		if (!recreateName.trim()) {
			setRecreateErrors({ name: 'Name is required' })
			return
		}
		if (recreateResolved.docExists && !recreateForce) {
			setRecreateErrors({
				submit: 'Document already exists — check overwrite to replace it',
			})
			return
		}

		setRecreateSubmitting(true)
		setRecreateErrors({})
		setRecreateSuccess('')

		try {
			let joiningDate = Math.floor(Date.now() / 1000)
			if (recreateResolved.creationTime) {
				const createdMs = Date.parse(recreateResolved.creationTime)
				if (Number.isFinite(createdMs)) {
					joiningDate = Math.floor(createdMs / 1000)
				}
			}

			const profile = buildMobileUserProfile({
				name: recreateName.trim(),
				email: recreateResolved.email,
				joiningDate,
				userRole: recreateRole,
				agency: recreateRole === 'Agency' ? recreateAgency : '',
				isBanned: false,
				contact: false,
				state: '',
				city: '',
			})

			await setDoc(doc(db, 'mobileUsers', recreateResolved.uid), profile)
			setRecreateSuccess(
				`Created mobileUsers/${recreateResolved.uid}. You can close this dialog.`,
			)
			setRecreateResolved((prev) =>
				prev ? { ...prev, docExists: true } : prev,
			)
			setUpdate(!update)
		} catch (error) {
			console.error('Recreate profile failed:', error)
			setRecreateErrors({
				submit: error?.message || 'Failed to recreate profile',
			})
		} finally {
			setRecreateSubmitting(false)
		}
	}

	/**
	 * useEffect hook that runs once on component mount to fetch relevant data based on the user's role.
	 *
	 * This hook triggers different functions depending on whether the logged-in user is an admin or an agency user.
	 *
	 * - Admin Users: Fetches all agencies and user data.
	 * - Agency Users: Fetches the details of the logged-in user's agency and then retrieves the associated user data.
	 *
	 * The hook runs once on the initial render and checks the user's role (admin or agency) to determine which data to fetch.
	 *
	 * @effect This hook runs once on the initial render and performs the following:
	 * - If the user is an admin, it fetches all agencies and user data.
	 * - If the user is an agency user, it fetches the specific agency details associated with the user's email, stores the agency ID and name, and then fetches the user data related to that agency.
	 */
	useEffect(() => {
		const fetchInitialData = async () => {
			if (customClaims.admin) {
				setAgencyClaimsStatus('ok')
				await fetchAgencies()
				await getData()
			} else if (customClaims.agency) {
				const claimAgencyId =
					typeof customClaims?.agencyId === 'string'
						? customClaims.agencyId
						: ''
				// Agency claim without agencyId: refresh once, then surface missing state.
				if (!claimAgencyId) {
					setAgencyClaimsStatus('pending')
					setAgencyLoading(true)
					if (!agencyClaimsRefreshAttempted.current && refreshCustomClaims) {
						agencyClaimsRefreshAttempted.current = true
						try {
							const next = await refreshCustomClaims()
							if (!next?.agencyId) {
								setAgencyClaimsStatus('missing')
								setAgencyLoading(false)
							}
						} catch {
							setAgencyClaimsStatus('missing')
							setAgencyLoading(false)
						}
					}
					return
				}

				setAgencyClaimsStatus('ok')
				agencyClaimsRefreshAttempted.current = false
				let resolvedName =
					typeof customClaims?.agencyName === 'string'
						? customClaims.agencyName
						: ''
				if (!resolvedName) {
					const agencySnap = await getDoc(doc(db, 'agency', claimAgencyId))
					if (agencySnap.exists()) {
						resolvedName = agencySnap.data()?.name || ''
					}
				}
				setAgencyId(claimAgencyId)
				setAgencyName(resolvedName)
				await getData({
					agencyId: claimAgencyId,
					agencyName: resolvedName,
				})
			}
		}

		fetchInitialData()
	}, [customClaims?.admin, customClaims?.agency, customClaims?.agencyId, customClaims?.agencyName])

	/**
	 * Triggers the delete user modal and sets the user ID for deletion.
	 *
	 * @param {string} userId - The ID of the user to be deleted.
	 */
	const handleMobileUserDelete = async (userId) => {
		setDeleteModal(true)
		setUserId(userId)
	}

	/**
	 * Handles the deletion of a user from the 'mobileUsers' collection in Firestore.
	 *
	 * This function deletes the user document with the given userId and then closes the delete modal.
	 *
	 * @param {Event} e - The event object from the delete action.
	 */
	const handleDelete = async (e) => {
		e.preventDefault()
		const docRef = doc(db, 'mobileUsers', userId)
		await deleteDoc(docRef)
		setDeleteModal(false)
		setUpdate(!update) // Trigger data refresh after deletion
	}

	/**
	 * Opens the EditUserModal and populates it with the user's current data.
	 *
	 * This function sets the user ID, fetches the user data from Firestore, and updates the state
	 * with the user's name, email, role, and agency information. It also determines if the user
	 * is assigned to an agency by performing a case-insensitive email match against the agency's
	 * `agencyUsers` array. The function ensures that the correct agency is selected in the modal
	 * even if there are differences in email capitalization.
	 *
	 * @param {Object} userObj - The object containing user data.
	 * @param {string} userId - The ID of the user to be edited.
	 */
	const handleEditUser = async (userObj, userId) => {
		if (userId == null || String(userId).trim() === '') {
			console.warn('handleEditUser: missing or empty userId', userObj)
			return
		}
		setUserId(userId)
		const userRef = await getDoc(doc(db, 'mobileUsers', userId))
		setUserEditing(userObj)
		toggleUserEditModal(true)

		const firestoreData = userRef.data() || {}
		const {
			name: fetchedName = '',
			email: fetchedEmail = userObj?.email ?? '',
			isBanned: fetchedIsBanned = false,
			userRole: fetchedUserRole = userObj?.userRole ?? 'User',
			...remainingFields
		} = firestoreData

		const { details: additionalDetails, metadata: additionalMetadata } = Object.entries(
			remainingFields,
		).reduce(
			(acc, [key, value]) => {
				const description = describeFirestoreField(value)
				acc.details[key] = description.value
				acc.metadata[key] = {
					type: description.type,
					originalValue: description.originalValue,
				}
				return acc
			},
			{ details: {}, metadata: {} },
		)

		setMobileUserDetails(additionalDetails)
		setMobileUserFieldTypes(additionalMetadata)
		setMobileFieldFormError('')

		setName(fetchedName)
		setEmail(fetchedEmail)
		setBanned(fetchedIsBanned)
		setUserRole(fetchedUserRole)

		// Retrieve the email from the `mobileUsers` document and convert it to lowercase
		const email = fetchedEmail.toLowerCase()

		// Query all agencies and find the one where the email matches case-insensitively
		const agenciesSnapshot = await getDocs(collection(db, 'agency'))
		let userAgencyDoc = null

		agenciesSnapshot.forEach((doc) => {
			const agencyUsers = doc.data().agencyUsers || []
			// Convert each email in agencyUsers to lowercase and check for a match
			if (agencyUsers.some((userEmail) => userEmail.toLowerCase() === email)) {
				userAgencyDoc = doc
			}
		})

		if (userAgencyDoc) {
			const userAgency = userAgencyDoc.id // Get the document ID
			const agencyName = userAgencyDoc.data().name // Get the agency name from the document data

			console.log('userAgency ID --> ', userAgency)
			console.log('agencyName --> ', agencyName)

			setSelectedAgency(userAgency)
			setAgencyName(agencyName)
		} else {
			setSelectedAgency('')
			setAgencyName('')
		}

		// setSelectedAgency(userAgency || '')
		if (!firestoreData?.email) {
			setEmail(userObj?.email ?? '')
		}
}

	/**
	 * Handles changes to dynamic Firestore-backed user fields surfaced in the modal.
	 *
	 * Maintains a controlled object map of additional mobileUsers document fields so
	 * they can be reviewed and edited before persisting.
	 *
	 * @param {string} field - Firestore field name being updated
	 * @param {*} value - New value for the field
	 */
	const handleMobileUserFieldChange = (field, value) => {
		setMobileFieldFormError('')
		setMobileUserDetails((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const toggleUserEditModal = (isOpen) => {
		if (!isOpen) {
			setMobileFieldFormError('')
		}
		setUserEditModal(isOpen)
	}

	/**
	 * Handles the change event for selecting a new agency in the EditUserModal.
	 *
	 * This function updates the selected agency in the state, removes the user's email from any other agencies,
	 * and adds the user's email to the newly selected agency's `agencyUsers` array in Firestore.
	 *
	 * @param {Event} e - The event object from the agency selection dropdown.
	 */
	const handleAgencyChange = async (e) => {
		e.preventDefault()
		const selectedValue = e.target.value
		setSelectedAgency(selectedValue)
		// console.log(selectedAgency.name)
		const selectedAgency = agenciesArray.find(
			(agency) => agency.id === selectedValue,
		)
		// console.log(selectedAgency) // Additional debugging to verify the correct agency is selected

		if (selectedAgency) {
			try {
				// Fetch the current data of the agency document to which the user is being added
				const newDocRef = doc(db, 'agency', selectedAgency.id) // Correctly use agency ID here
				const newDocSnap = await getDoc(newDocRef)
				if (newDocSnap.exists()) {
					const newAgencyData = newDocSnap.data()

					// Check if the user's email is already in the agencyUsers array of the new agency
					const newAgencyUsers = newAgencyData.agencyUsers || []
					if (!newAgencyUsers.includes(email)) {
						// Remove the user's email from any other agencies they are part of first
						const agenciesQuery = query(
							collection(db, 'agency'),
							where('agencyUsers', 'array-contains', email),
						)
						const agenciesQuerySnapshot = await getDocs(agenciesQuery)
						for (const doc of agenciesQuerySnapshot.docs) {
							const docData = doc.data()
							const updatedAgencyUsers = (docData.agencyUsers || []).filter(
								(userEmail) => userEmail !== email,
							)
							await updateDoc(doc.ref, { agencyUsers: updatedAgencyUsers })
						}

						// Append the user's email to the new agency's agencyUsers array
						const updatedNewAgencyUsers = [...newAgencyUsers, email]
						await updateDoc(newDocRef, { agencyUsers: updatedNewAgencyUsers })
						// Refresh Auth claims so rules/queries see the new agencyId
						try {
							await addAgencyRole({
								email,
								agencyId: selectedAgency.id,
							})
						} catch (claimError) {
							console.error(
								'Agency membership updated but claim refresh failed:',
								claimError,
							)
						}
						console.log('User successfully added to the new agency.')
					} else {
						console.log('User already exists in this agency.')
						try {
							await addAgencyRole({
								email,
								agencyId: selectedAgency.id,
							})
						} catch (claimError) {
							console.error(
								'Failed to refresh agency claims for existing membership:',
								claimError,
							)
						}
					}
				} else {
					console.log('Agency document does not exist.')
				}
			} catch (error) {
				console.error('Error updating agency documents:', error)
			}
		} else {
			console.log('Selected agency not found in agenciesArray.')
		}
	}

	/**
	 * Handles the change event for the name input field in the EditUserModal.
	 *
	 * This function prevents the default form submission behavior and updates the `name` state
	 * with the value entered in the input field.
	 *
	 * @param {Event} e - The event object from the input field.
	 */
	const handleNameChange = (e) => {
		e.preventDefault()
		setName(e.target.value)
	}

	/**
	 * Handles the change event for the email input field in the EditUserModal.
	 *
	 * This function prevents the default form submission behavior and updates the `email` state
	 * with the value entered in the input field.
	 *
	 * @param {Event} e - The event object from the input field.
	 */
	const handleEmailChange = (e) => {
		e.preventDefault()
		setEmail(e.target.value)
	}

	/**
	 * Handles the change event for the user role selection in the EditUserModal.
	 *
	 * This function triggers the fetching of agencies and updates the `userRole` state
	 * with the selected role.
	 *
	 * @param {string} role - The selected user role.
	 */
	const handleRoleChange = (role) => {
		fetchAgencies()
		setUserRole(role)
	}

	/**
	 * Handles the change event for the banned status toggle in the EditUserModal.
	 *
	 * This function toggles the `banned` state between true and false based on its previous state.
	 *
	 * @param {Event} e - The event object from the banned status toggle.
	 */
	const handleBannedChange = (e) => {
		setBanned((prevBanned) => !prevBanned) // Use a function to toggle based on previous state
	}

	/**
	 * Adds a user's email to the `agencyUsers` array of the specified agency in Firestore.
	 *
	 * This function checks if the user's email is already in the agency's `agencyUsers` array
	 * to prevent duplicates. If not, it appends the email to the array. This ensures that
	 * users are properly associated with their assigned agencies for role-based access control.
	 *
	 * @param {string} email - The email of the user to add to the agency
	 * @param {string} agencyId - The ID of the agency to which the user should be added
	 * @returns {Promise<void>} Promise that resolves when the user is added to the agency
	 */
	const addUserToAgency = async (email, agencyId) => {
		try {
			const agencyRef = doc(db, 'agency', agencyId)
			const agencySnap = await getDoc(agencyRef)

			if (agencySnap.exists()) {
				const agencyData = agencySnap.data()
				const agencyUsers = agencyData.agencyUsers || []

				// Check if the user's email is already included to prevent duplicates
				if (!agencyUsers.includes(email)) {
					// Update the agency document to include the new user's email
					await updateDoc(agencyRef, {
						agencyUsers: [...agencyUsers, email],
					})
					console.log('User added to agency successfully.')
				} else {
					console.log('User already exists in the agency.')
				}
			} else {
				console.error('Agency document does not exist.')
			}
		} catch (error) {
			console.error('Error adding user to agency:', error)
		}
	}

	/**
	 * Removes a user's email from all agency documents in Firestore where the email is listed in the `agencyUsers` array.
	 *
	 * This function retrieves all agencies where the user's email is listed and removes the email
	 * from the `agencyUsers` array in each of those agency documents.
	 *
	 * @param {string} email - The email of the user to remove from all agencies.
	 */
	const removeUserFromAgencies = async (email) => {
		try {
			// Retrieve all agencies where this user's email is listed in the agencyUsers array
			const queryRef = query(
				collection(db, 'agency'),
				where('agencyUsers', 'array-contains', email),
			)
			const querySnapshot = await getDocs(queryRef)

			// Loop through all agencies and remove the email from the agencyUsers array
			querySnapshot.forEach(async (doc) => {
				const currentUsers = doc.data().agencyUsers || []
				const filteredUsers = currentUsers.filter(
					(userEmail) => userEmail !== email,
				)
				await updateDoc(doc.ref, { agencyUsers: filteredUsers })
			})
		} catch (error) {
			console.error('Error removing user from agencies:', error)
		}
	}

	/**
	 * Handles the form submission to update user data in Firestore.
	 *
	 * This function updates the user's document in the `mobileUsers` collection with the new name, email,
	 * banned status, and user role. It also handles role changes, such as adding or removing admin and agency roles,
	 * and updates the local state to reflect the changes.
	 *
	 * @param {Event} e - The event object from the form submission.
	 */
	const handleFormSubmit = async (e) => {
		e.preventDefault()
		const docRef = doc(db, 'mobileUsers', userId)

		let serializedAdditionalFields = {}
		try {
			serializedAdditionalFields = Object.fromEntries(
				Object.entries(mobileUserDetails).map(([key, value]) => {
					const metadata = mobileUserFieldTypes[key]
					const serializedValue = serializeFieldForFirestore(key, value, metadata)
					return [key, serializedValue]
				}),
			)
		} catch (error) {
			console.error('Failed to serialize additional user fields:', error)
			setMobileFieldFormError(
				error.message || 'Unable to save changes. Please verify all additional field values.',
			)
			return
		}

		try {
			await updateDoc(docRef, {
				...serializedAdditionalFields,
				name: name,
				email: email,
				isBanned: banned,
				userRole: userRole,
			})
		} catch (error) {
			console.error('Failed to update user document:', error)
			setMobileFieldFormError(
				error.message || 'An error occurred while saving user changes.',
			)
			return
		}
		setMobileFieldFormError('')
		console.log('Selected Agency ID:', selectedAgency) // Debug: Check the selected agency ID
		// Check if the user's role has been modified
		if (userRole !== userEditing.userRole) {
			// If the userRole is set to "Admin", call the addAdminRole function
			if (userRole === 'Admin') {
				try {
					// Call the addAdminRole function
					await addAdminRole({ email: email })
				} catch (error) {
					console.error('Error adding admin role:', error)
				}
			} else if (userRole === 'Agency') {
				// Call the addAgencyRole function
				try {
					if (!selectedAgency) {
						throw new Error('Select an agency before assigning the Agency role.')
					}
					// Stamp claims with agencyId first (callable accepts preferred agencyId)
					await addAgencyRole({ email: email, agencyId: selectedAgency })
					// Add user's email to the selected agency's document
					await addUserToAgency(email, selectedAgency) // Ensure `selectedAgency` is the actual document ID of the agency
				} catch (error) {
					console.error('Error adding agency role:', error)
					// Handle error if needed
				}
			} else if (userRole === 'User') {
				try {
					// Switch user's mobileUsers/doc/userRole to "User"
					await addUserRole({ email: email })
					// Call the function to remove user's email from agencyUsers array
					await removeUserFromAgencies(email)
				} catch (error) {
					console.error('Error adding general user role:', error)
					// Handle error if needed
				}
			}
		}

		const optimisticPatch = {
			...serializedAdditionalFields,
			name,
			email,
			isBanned: banned,
			userRole,
		}
		if (customClaims.agency) {
			setAgencyUsers((prev) => patchUserRowInList(prev, userId, optimisticPatch))
		} else if (customClaims.admin) {
			patchPaginatedUser(userId, optimisticPatch)
			setEnhancedPaginatedUsers((prev) =>
				prev.length === 0
					? prev
					: patchUserRowInList(prev, userId, optimisticPatch),
			)
		}

		// Close modal and trigger data refresh
		setUserEditModal(false)
		setUpdate(!update) // This will trigger getData() via useEffect, refreshing the user list
	}

	/**
	 * useEffect hook that triggers the `getData` function whenever the `update` state changes.
	 *
	 * This hook ensures that the `getData` function is called whenever the `update` state is toggled,
	 * allowing the component to re-fetch data and re-render with the latest information.
	 *
	 * @dependency {boolean} update - The state that triggers the data fetching when it changes.
	 */
	useEffect(() => {
		if (skipUpdateRefreshOnMount.current) {
			skipUpdateRefreshOnMount.current = false
			return
		}
		getData()
	}, [update])

	return (
		<div data-component="Users" className={style.section_container}>
			<div className={style.section_wrapper}>
				<div className={style.section_header}>
					<div className={style.section_title}>
						<div className={`${globalStyles.heading.h1.blue} leading-none`}>
							Users
						</div>
						{customClaims.admin ? (
							<span className="text-xs">Admin: All Users</span>
						) : (
							<span className="text-xs">All Agency</span>
						)}
					</div>
					<div className={style.section_filtersWrap}>
						<input
							type="text"
							placeholder="Search users by name or email..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mr-2"
						/>
						{customClaims.admin && (
							<button
								type="button"
								className={style.button}
								onClick={handleOpenRecreateModal}>
								Recreate profile
							</button>
						)}
						<button className={style.button} onClick={handleAddNewUserModal}>
							<FaPlus className="text-[#2E3B4E] mr-2" size={12} />
							Add User
						</button>
					</div>
				</div>
				{/* Error message for pagination issues */}
				{paginationError && (
					<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm mb-2 text-red-700">
						<div className="font-bold">Error:</div>
						<div>{paginationError}</div>
					</div>
				)}
				{agencyClaimsStatus === 'pending' && (
					<div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm mb-2 text-blue-800">
						Loading agency access…
					</div>
				)}
				{agencyClaimsStatus === 'missing' && (
					<div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm mb-2 text-amber-900">
						Agency access is incomplete (missing agency ID on your account).
						Refresh the page, or ask an admin to re-run agency claims backfill.
					</div>
				)}
				{/* Data status legend for admins - shows data consistency issues */}
				{!customClaims.agency && (
					<div className="flex items-center gap-2 p-2 bg-white rounded-lg text-xs mb-2">
						<div className="font-bold">Key: </div>
						<div className="flex gap-1 items-center">
							<div className="bg-red-50 p-1">Red:</div>
							<div>Firestore 'mobileUsers' doc missing</div>
						</div>
						<div className="flex gap-1 items-center">
							<div className="bg-yellow-100 p-1">Yellow:</div>
							<div>User disabled in Firebase Auth</div>
						</div>
					</div>
				)}
				<div className={style.table_main}>
					<div className="flex flex-col h-full">
						<InfiniteScroll
							className="overflow-x-auto"
							height={560}
							dataLength={loadedMobileUsers.length}
							next={() => {
								if (searchActive) return
								loadMore()
							}}
							hasMore={
								hasMore && !customClaims.agency && !searchActive
							}
							loader={
								<div className="text-center py-4">
									<span className="text-gray-500">Loading more users...</span>
								</div>
							}>
							<table className="min-w-full bg-white rounded-md p-1">
								<thead className="border-b dark:border-indigo-100 bg-slate-100">
									<tr>
										<th scope="col" className={tableHeading.default}>
											Name
										</th>
										<th scope="col" className={tableHeading.default_center}>
											Email
										</th>
										<th scope="col" className={tableHeading.default_center}>
											Join Date
										</th>
										{customClaims.admin && (
											<th scope="col" className={tableHeading.default_center}>
												Agency
											</th>
										)}
										{customClaims.admin && (
											<th scope="col" className={tableHeading.default_center}>
												Role
											</th>
										)}
										<th scope="col" className={tableHeading.default_center}>
											Banned
										</th>
										<th scope="col" className={tableHeading.default_center}>
											Disabled
										</th>
										{customClaims.admin && (
											<th
												scope="col"
												colSpan={2}
												className={tableHeading.default_center}>
												Delete
											</th>
										)}
									</tr>
								</thead>
								<tbody>
									{/* Loading state - shows spinner while fetching user data */}
									{initialLoading ||
									(isLoading && loadedMobileUsers.length === 0) ||
									agencyLoading ||
									remoteSearchLoading ? (
										<tr>
											<td colSpan="100%" className="text-center">
												<div className="flex flex-col justify-center items-center gap-2 h-40">
													<LoadingSpinner className="h-10 w-10 text-[#2E3B4E]" />
													<span className="text-sm text-gray-600">Loading users…</span>
												</div>
											</td>
										</tr>
									) : loadedMobileUsers.length === 0 ? (
										<tr>
											<td colSpan="100%" className="text-center">
												<div className="flex justify-center items-center h-32">
													No users found
												</div>
											</td>
										</tr>
									) : (
										// Render user rows with role-based conditional rendering
										loadedMobileUsers.map((userObj, index) => {
											// Extract user ID for operations
											let userId = userObj.mobileUserId ?? userObj.id ?? userObj.uid
											return (
												<tr
													className={`border-b transition duration-300 ease-in-out dark:border-indigo-100 ${!customClaims.agency && !userObj.hasFirestoreDoc && 'bg-red-50'} ${userObj.disabled && 'bg-yellow-100'}`}
													key={userId ?? userObj.email ?? `unknown-${index}`}
													onClick={
														customClaims.admin
															? () => handleEditUser(userObj, userId)
															: undefined
													}>
													{/* User name column */}
													<td scope="row" className={column.data}>
														{userObj.name}
													</td>
													{/* User email column */}
													<td className={column.data_center}>
														{userObj.email}
													</td>
													{/* User join date column */}
													<td className={column.data_center}>
														{userObj.joined}
													</td>
													{/* Agency column - only visible to admins */}
													{customClaims.admin && (
														<td className={column.data_center}>
															{userObj.agencyName}
														</td>
													)}
													{/* User role column - only visible to admins */}
													{customClaims.admin && (
														<td className={column.data_center}>
															{userObj.userRole}
														</td>
													)}
													{/* User banned status column */}
													<td className={column.data_center}>
														{(userObj.isBanned && 'yes') || 'no'}
													</td>
													{/* User disabled status column */}
													<td className={column.data_center}>
														{userObj.disabled ? 'Yes' : 'No'}
													</td>
													{/* Delete action column - only visible to admins */}
													{customClaims.admin && (
														<td
															className={column.data_center}
															onClick={(e) => e.stopPropagation()}>
															<button
																onClick={() => handleMobileUserDelete(userId)}
																className={`${style.table_button} tooltip-delete-user`}>
																<IoTrash
																	size={20}
																	className="ml-4 fill-gray-400 hover:fill-red-600"
																/>
																<Tooltip
																	anchorSelect=".tooltip-delete-user"
																	place="top"
																	delayShow={500}>
																	Delete User
																</Tooltip>
															</button>
														</td>
													)}
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</InfiniteScroll>
						<div className="mt-2 self-end text-xs">
							Total users: {loadedMobileUsers.length}
						</div>
					</div>
				</div>
			</div>
			{/* Delete confirmation modal */}
			{deleteModal && (
				<ConfirmModal
					func={handleDelete}
					title="Are you sure you want to delete this user?"
					subtitle=""
					CTA="Delete"
					closeModal={setDeleteModal}
				/>
			)}
			{/* User editing modal */}
			{userEditModal && (
				<EditUserModal
					mobileUserDetails={mobileUserDetails}
					onMobileFieldChange={handleMobileUserFieldChange}
					mobileUserFieldTypes={mobileUserFieldTypes}
					mobileFieldFormError={mobileFieldFormError}
					// User
					userId={userId}
					userEditing={userEditing}
					// Claims
					customClaims={customClaims}
					// Modal
					setUserEditModal={toggleUserEditModal}
					// Name
					name={name}
					onNameChange={handleNameChange}
					// agency
					agenciesArray={agenciesArray}
					selectedAgency={selectedAgency}
					agencyName={agencyName}
					onAgencyChange={handleAgencyChange}
					// Role
					onRoleChange={handleRoleChange}
					userRole={userRole}
					setUserRole={setUserRole}
					// Email
					email={email}
					onEmailChange={handleEmailChange}
					// Banned
					banned={banned}
					setBanned={setBanned}
					onBannedChange={handleBannedChange}
					// Form submit
					onFormSubmit={handleFormSubmit}
				/>
			)}
			{/* New user creation modal */}
			{newUserModal && (
				<NewUserModal
					setNewUserModal={setNewUserModal}
					// newUserName={newUserName}
					// onNewUserName={handleNewUserName}
					newUserEmail={newUserEmail}
					onNewUserEmail={handleNewUserEmail}
					// onNewAgencyState={handleNewAgencyState}
					// onNewAgencyCity={handleNewAgencyCity}
					onFormSubmit={handleAddNewUserFormSubmit}
					errors={errors}
				/>
			)}
			{recreateModal && customClaims.admin && (
				<RecreateProfileModal
					setOpen={handleCloseRecreateModal}
					lookup={recreateLookup}
					onLookupChange={(e) => {
						setRecreateLookup(e.target.value)
						setRecreateErrors((prev) => ({ ...prev, lookup: '' }))
					}}
					lookupMode={recreateLookupMode}
					onLookupModeChange={setRecreateLookupMode}
					onLookup={handleRecreateLookup}
					lookingUp={recreateLookingUp}
					resolved={recreateResolved}
					name={recreateName}
					onNameChange={(e) => {
						setRecreateName(e.target.value)
						setRecreateErrors((prev) => ({ ...prev, name: '' }))
					}}
					userRole={recreateRole}
					onRoleChange={(e) => setRecreateRole(e.target.value)}
					agency={recreateAgency}
					onAgencyChange={(e) => setRecreateAgency(e.target.value)}
					forceOverwrite={recreateForce}
					onForceOverwriteChange={(e) => setRecreateForce(e.target.checked)}
					onSubmit={handleRecreateSubmit}
					submitting={recreateSubmitting}
					errors={recreateErrors}
					successMessage={recreateSuccess}
				/>
			)}
		</div>
	)
}

export default Users
