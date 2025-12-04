/**
 * @fileoverview useLocalStorage Hook - Custom hook for localStorage operations
 *
 * This hook provides a clean interface for storing and retrieving data from
 * localStorage with JSON serialization, error handling, and automatic expiry.
 * Features include:
 * - JSON serialization/deserialization
 * - Automatic expiry with timestamps
 * - Error handling for storage access
 * - SSR-safe implementation
 *
 * @module hooks/useLocalStorage
 * @requires react
 */

import { useState, useEffect } from 'react'

/**
 * Custom hook for localStorage operations with automatic expiry
 *
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Default value if no stored value exists
 * @param {number} expiryHours - Hours after which the data expires (default: 24)
 * @returns {Array} [storedValue, setValue, removeValue, isExpired]
 */
export function useLocalStorage(key, initialValue, expiryHours = 24) {
  // State to store the current value
  const [storedValue, setStoredValue] = useState(initialValue)
  const [isExpired, setIsExpired] = useState(false)

  // Check if we're in a browser environment (SSR-safe)
  const isClient = typeof window !== 'undefined'

  /**
   * Get value from localStorage with expiry check
   */
  const getValue = () => {
    if (!isClient) return initialValue

    try {
      const item = window.localStorage.getItem(key)
      if (!item) return initialValue

      const parsedItem = JSON.parse(item)

      // Check if the stored data has a timestamp and if it's expired
      if (parsedItem.timestamp) {
        const now = new Date().getTime()
        const expiryTime = parsedItem.timestamp + (expiryHours * 60 * 60 * 1000)

        if (now > expiryTime) {
          // Data is expired, remove it
          window.localStorage.removeItem(key)
          setIsExpired(true)
          return initialValue
        }

        setIsExpired(false)
        return parsedItem.value
      }

      // Legacy data without timestamp, return as-is but consider it fresh
      setIsExpired(false)
      return parsedItem
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }

  /**
   * Set value in localStorage with timestamp
   */
  const setValue = (value) => {
    if (!isClient) return

    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      const dataWithTimestamp = {
        value: valueToStore,
        timestamp: new Date().getTime()
      }

      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(dataWithTimestamp))
      setIsExpired(false)
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  /**
   * Remove value from localStorage
   */
  const removeValue = () => {
    if (!isClient) return

    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
      setIsExpired(false)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }

  /**
   * Check if the stored data is expired without removing it
   */
  const checkExpiry = () => {
    if (!isClient) return false

    try {
      const item = window.localStorage.getItem(key)
      if (!item) return false

      const parsedItem = JSON.parse(item)
      if (parsedItem.timestamp) {
        const now = new Date().getTime()
        const expiryTime = parsedItem.timestamp + (expiryHours * 60 * 60 * 1000)
        return now > expiryTime
      }

      return false
    } catch (error) {
      console.warn(`Error checking expiry for localStorage key "${key}":`, error)
      return false
    }
  }

  // Initialize the value from localStorage on mount
  useEffect(() => {
    const value = getValue()
    setStoredValue(value)
  }, [])

  return [storedValue, setValue, removeValue, isExpired, checkExpiry]
}

export default useLocalStorage