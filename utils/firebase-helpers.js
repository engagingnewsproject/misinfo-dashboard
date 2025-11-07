import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  documentId,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fetches a batch of users from Firestore with pagination support
 *
 * @param {Object} options - Pagination and filter options
 * @param {number} options.pageSize - Number of users to fetch per batch (default: 50)
 * @param {import('firebase/firestore').DocumentSnapshot} options.lastDoc - Last document from previous batch for cursor pagination
 * @param {string} options.userRole - Filter by user role (optional)
 * @param {string} options.agencyId - Filter by agency ID (optional)
 * @param {string} options.searchTerm - Search term for filtering users (optional)
 * @param {string} options.orderField - Field to order by (default: 'joiningDate')
 * @param {string} options.orderDirection - Order direction: 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<{users: Array, lastDoc: import('firebase/firestore').DocumentSnapshot | null, hasMore: boolean}>}
 */
export async function fetchUsersBatch({
  pageSize = 50,
  lastDoc = null,
  userRole = null,
  agencyId = null,
  searchTerm = null,
  orderField = 'joiningDate',
  orderDirection = 'desc',
}) {
  try {
    const mobileUsersRef = collection(db, 'mobileUsers');
    const queryConstraints = [];

    // Add filters
    if (agencyId) {
      queryConstraints.push(where('agency', '==', agencyId));
    }

    if (userRole && userRole !== 'all') {
      queryConstraints.push(where('userRole', '==', userRole));
    }

    // Add search filter (case-insensitive email search)
    // Note: For more advanced search, consider using a search service like Algolia
    if (searchTerm) {
      // Firestore doesn't support case-insensitive search natively
      // This is a basic implementation - for production, use a dedicated search solution
      const lowerSearch = searchTerm.toLowerCase();
      queryConstraints.push(where('email', '>=', lowerSearch));
      queryConstraints.push(where('email', '<=', lowerSearch + '\uf8ff'));
    }

    // Add ordering
    queryConstraints.push(orderBy(orderField, orderDirection));

    // Add pagination
    queryConstraints.push(limit(pageSize + 1)); // Fetch one extra to check if more exist

    // Add cursor for pagination
    if (lastDoc) {
      queryConstraints.push(startAfter(lastDoc));
    }

    const q = query(mobileUsersRef, ...queryConstraints);
    const snapshot = await getDocs(q);

    // Check if there are more documents
    const hasMore = snapshot.docs.length > pageSize;
    const users = snapshot.docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get the last document for the next query (excluding the extra one)
    const newLastDoc = users.length > 0 ? snapshot.docs[pageSize - 1] : null;

    return {
      users,
      lastDoc: hasMore ? newLastDoc : null,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching users batch:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
}

/**
 * Fetches user details in batch to avoid N+1 query problem
 *
 * @param {Array<string>} userIds - Array of user IDs to fetch
 * @returns {Promise<Object>} Map of userId -> user data
 */
export async function fetchUserDetailsBatch(userIds) {
  if (!userIds || userIds.length === 0) {
    return {};
  }

  try {
    // Firestore 'in' queries are limited to 10 items
    // Split into chunks if more than 10 IDs
    const chunks = [];
    const chunkSize = 10;

    for (let i = 0; i < userIds.length; i += chunkSize) {
      chunks.push(userIds.slice(i, i + chunkSize));
    }

    const allUsers = {};

    // Fetch all chunks in parallel
    await Promise.all(
      chunks.map(async (chunk) => {
        const q = query(
          collection(db, 'mobileUsers'),
          where(documentId(), 'in', chunk)
        );
        const snapshot = await getDocs(q);

        snapshot.docs.forEach((doc) => {
          allUsers[doc.id] = {
            id: doc.id,
            ...doc.data(),
          };
        });
      })
    );

    return allUsers;
  } catch (error) {
    console.error('Error fetching user details batch:', error);
    throw new Error(`Failed to fetch user details: ${error.message}`);
  }
}

/**
 * Fetches a single user document
 *
 * @param {string} userId - User ID to fetch
 * @returns {Promise<Object|null>} User data or null if not found
 */
export async function fetchUserDetails(userId) {
  try {
    const userRef = doc(db, 'mobileUsers', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

/**
 * Gets total count of users (approximate for large collections)
 * Note: For large collections, consider caching this value or using aggregation queries
 *
 * @param {Object} filters - Filter options (agencyId, userRole)
 * @returns {Promise<number>} Total user count
 */
export async function getUsersCount(filters = {}) {
  try {
    const mobileUsersRef = collection(db, 'mobileUsers');
    const queryConstraints = [];

    if (filters.agencyId) {
      queryConstraints.push(where('agency', '==', filters.agencyId));
    }

    if (filters.userRole && filters.userRole !== 'all') {
      queryConstraints.push(where('userRole', '==', filters.userRole));
    }

    const q = queryConstraints.length > 0
      ? query(mobileUsersRef, ...queryConstraints)
      : mobileUsersRef;

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting users count:', error);
    return 0;
  }
}

/**
 * Searches users by email or name
 * This is a client-side implementation for now
 * For production, consider using a dedicated search service
 *
 * @param {Array} users - Array of users to search
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered users
 */
export function searchUsers(users, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return users;
  }

  const lowerSearch = searchTerm.toLowerCase().trim();

  return users.filter((user) => {
    const email = user.email?.toLowerCase() || '';
    const name = user.name?.toLowerCase() || '';
    const displayName = user.displayName?.toLowerCase() || '';

    return (
      email.includes(lowerSearch) ||
      name.includes(lowerSearch) ||
      displayName.includes(lowerSearch)
    );
  });
}
