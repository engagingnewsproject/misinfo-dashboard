import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchUsersBatch, fetchUserDetailsBatch } from '../utils/firebase-helpers';

/**
 * Custom hook for paginated user fetching with infinite scroll support
 *
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Number of users to fetch per batch (default: 50)
 * @param {string} options.userRole - Filter by user role
 * @param {string} options.agencyId - Filter by agency ID
 * @param {string} options.searchTerm - Search term for filtering
 * @param {string} options.orderField - Field to order by (default: 'joiningDate')
 * @param {string} options.orderDirection - Order direction: 'asc' or 'desc' (default: 'desc')
 * @param {boolean} options.autoLoad - Auto-load first batch on mount (default: true)
 *
 * @returns {Object} Hook state and methods
 */
export function useUsersPagination({
  pageSize = 50,
  userRole = null,
  agencyId = null,
  searchTerm = null,
  orderField = 'joiningDate',
  orderDirection = 'desc',
  autoLoad = true,
} = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  // Keep track of the current filters to detect changes
  const prevFiltersRef = useRef({
    userRole,
    agencyId,
    searchTerm,
    orderField,
    orderDirection,
  });

  /**
   * Loads the next batch of users
   */
  const loadMore = useCallback(async () => {
    // Prevent loading if already loading or no more data
    if (loading || !hasMore) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchUsersBatch({
        pageSize,
        lastDoc,
        userRole,
        agencyId,
        searchTerm,
        orderField,
        orderDirection,
      });

      // Append new users to existing list
      setUsers((prev) => [...prev, ...result.users]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading more users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [
    loading,
    hasMore,
    pageSize,
    lastDoc,
    userRole,
    agencyId,
    searchTerm,
    orderField,
    orderDirection,
  ]);

  /**
   * Resets pagination and loads first batch
   * Useful when filters/search changes
   */
  const reset = useCallback(async () => {
    setUsers([]);
    setLastDoc(null);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);

    try {
      setLoading(true);

      const result = await fetchUsersBatch({
        pageSize,
        lastDoc: null,
        userRole,
        agencyId,
        searchTerm,
        orderField,
        orderDirection,
      });

      setUsers(result.users);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error resetting pagination:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [pageSize, userRole, agencyId, searchTerm, orderField, orderDirection]);

  /**
   * Refreshes the current page (keeps existing users and refetches)
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate how many users we currently have loaded
      const currentCount = users.length;
      const pagesToLoad = Math.ceil(currentCount / pageSize);

      // Reset and load all pages up to current position
      const result = await fetchUsersBatch({
        pageSize: pagesToLoad * pageSize,
        lastDoc: null,
        userRole,
        agencyId,
        searchTerm,
        orderField,
        orderDirection,
      });

      setUsers(result.users);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error refreshing users:', err);
      setError(err.message || 'Failed to refresh users');
    } finally {
      setLoading(false);
    }
  }, [users.length, pageSize, userRole, agencyId, searchTerm, orderField, orderDirection]);

  /**
   * Manually loads first batch (for when autoLoad is false)
   */
  const loadInitial = useCallback(() => {
    if (users.length === 0 && !loading) {
      reset();
    }
  }, [users.length, loading, reset]);

  // Auto-load first batch on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && users.length === 0) {
      loadMore();
    }
  }, []); // Only run on mount

  // Detect filter/search changes and reset pagination
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      prevFilters.userRole !== userRole ||
      prevFilters.agencyId !== agencyId ||
      prevFilters.searchTerm !== searchTerm ||
      prevFilters.orderField !== orderField ||
      prevFilters.orderDirection !== orderDirection;

    if (filtersChanged && users.length > 0) {
      // Filters changed, reset pagination
      reset();
    }

    // Update ref with current filters
    prevFiltersRef.current = {
      userRole,
      agencyId,
      searchTerm,
      orderField,
      orderDirection,
    };
  }, [userRole, agencyId, searchTerm, orderField, orderDirection]);

  return {
    users,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    reset,
    refresh,
    loadInitial,
  };
}

/**
 * Hook for batch fetching user details
 * Useful for fetching additional user information for displayed users
 *
 * @param {Array<string>} userIds - Array of user IDs to fetch details for
 * @returns {Object} User details map and loading state
 */
export function useUserDetailsBatch(userIds) {
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userIds || userIds.length === 0) {
      return;
    }

    let isMounted = true;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const details = await fetchUserDetailsBatch(userIds);

        if (isMounted) {
          setUserDetails(details);
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch user details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(userIds)]); // Use JSON.stringify to properly compare arrays

  return {
    userDetails,
    loading,
    error,
  };
}

export default useUsersPagination;
