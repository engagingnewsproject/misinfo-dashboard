/**
 * @fileoverview AuthContext - Firebase Authentication Context Provider
 * 
 * This file provides a React Context for managing user authentication state,
 * including login, signup, logout, password management, and role-based access control.
 * It integrates with Firebase Auth and Firestore to handle user authentication
 * and authorization throughout the application.
 * 
 * @module context/AuthContext
 * @requires firebase/auth
 * @requires firebase/functions
 * @requires firebase/firestore
 * @requires react
 */

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    reauthenticateWithCredential,
    updatePassword,
    updateEmail,
    signOut,
    sendPasswordResetEmail,
    deleteUser,
    sendSignInLinkToEmail,
    sendEmailVerification,
    EmailAuthProvider
} from 'firebase/auth'

import { httpsCallable } from 'firebase/functions'
import { auth, app, db } from '../config/firebase'
import { getDoc, doc, setDoc } from "firebase/firestore";
import moment from 'moment'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/**
 * Authentication Context for managing user state and authentication operations.
 * 
 * @type {React.Context<Object>}
 */
const AuthContext = createContext({})

/**
 * Custom hook to access the authentication context.
 * 
 * @returns {Object} The authentication context containing user state and auth functions
 * @throws {Error} When used outside of AuthContextProvider
 * @example
 * const { user, login, logout } = useAuth();
 */
export const useAuth = () => useContext(AuthContext)

/**
 * AuthContextProvider - Main authentication context provider component.
 * 
 * This component manages the global authentication state and provides
 * authentication functions to all child components. It handles user
 * authentication state changes, role verification, and provides
 * methods for login, signup, logout, and user management.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped
 * @returns {JSX.Element} Context provider with authentication state and functions
 * @example
 * <AuthContextProvider>
 *   <App />
 * </AuthContextProvider>
 */
export const AuthContextProvider = ({children}) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    /** False until the first ID-token claims read finishes (or sign-out clears them). */
    const [claimsReady, setClaimsReady] = useState(false)
    const [userRole, setUserRole] = useState('user')
    const [customClaims, setCustomClaims] = useState({
        agency: false,
        admin: false,
        agencyId: null,
        agencyName: null,
    })

    /**
     * Normalizes Auth token claims into the shape the app consumes.
     *
     * @param {Record<string, unknown>|undefined|null} claims
     * @returns {{admin: boolean, agency: boolean, agencyId: string|null, agencyName: string|null}}
     */
    const normalizeCustomClaims = (claims) => {
        if (claims?.admin) {
            return {
                admin: true,
                agency: false,
                agencyId: null,
                agencyName: null,
            }
        }
        if (claims?.agency) {
            return {
                admin: false,
                agency: true,
                agencyId:
                    typeof claims.agencyId === 'string' && claims.agencyId
                        ? claims.agencyId
                        : null,
                agencyName:
                    typeof claims.agencyName === 'string' && claims.agencyName
                        ? claims.agencyName
                        : null,
            }
        }
        return {
            admin: false,
            agency: false,
            agencyId: null,
            agencyName: null,
        }
    }

    // Functions instance created on the client so callables work (avoids null during SSR).
    // If the SDK throws "Service functions is not available" (e.g. in some Next.js/build envs), we degrade gracefully.
    const [functionsInstance, setFunctionsInstance] = useState(null)
    useEffect(() => {
        if (typeof window === 'undefined') return
        let cancelled = false
        const init = () => {
            import('firebase/functions')
                .then(({ getFunctions }) => {
                    if (cancelled) return
                    try {
                        const fn = getFunctions(app, 'us-central1')
                        setFunctionsInstance(fn)
                    } catch (e) {
                        setFunctionsInstance(null)
                        if (process.env.NODE_ENV === 'development') {
                            console.warn(
                                'Cloud Functions client unavailable (e.g. "Service functions is not available"). Admin features that use callables will be limited.',
                            )
                        }
                    }
                })
                .catch(() => {
                    if (!cancelled) setFunctionsInstance(null)
                })
        }
        const id = setTimeout(init, 0)
        return () => {
            cancelled = true
            clearTimeout(id)
        }
    }, [])

    /**
     * Effect hook to monitor authentication state changes.
     *
     * Sets React `user` as soon as Firebase Auth reports a session (so route
     * guards do not bounce a successful login). Location id and custom claims
     * are loaded afterward without blocking that initial setUser.
     */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Set auth user immediately so login → /dashboard is not bounced by
                // ProtectedRoute while Firestore/App Check are still warming up.
                const cachedLocalId =
                    typeof window !== 'undefined'
                        ? localStorage.getItem('userId')
                        : null
                setUser({
                    uid: cachedLocalId || user.uid,
                    accountId: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                })
                setClaimsReady(false)
                setLoading(false)

                // Custom claims (includes agencyId) — non-blocking
                user.getIdTokenResult(true)
                    .then((idTokenResult) => {
                        setCustomClaims(normalizeCustomClaims(idTokenResult.claims))
                    })
                    .catch((error) => {
                        console.log('Error fetching custom claims:', error)
                    })
                    .finally(() => {
                        setClaimsReady(true)
                    })

                // Local tracking id from locations/Texas — non-blocking
                getDoc(doc(db, 'locations', 'Texas'))
                    .then((ref) => {
                        const localId = ref.data()?.['Austin']
                        if (!localId) return
                        localStorage.setItem('userId', localId)
                        setUser((prev) =>
                            prev && prev.accountId === user.uid
                                ? { ...prev, uid: localId }
                                : prev,
                        )
                    })
                    .catch((error) => {
                        console.log('Error fetching location id:', error)
                    })
            } else {
                setUser(null)
                setCustomClaims(normalizeCustomClaims(null))
                setClaimsReady(true)
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [])

    // Firebase Cloud Functions for user management - only when functions is available (browser); null during SSR/build
    const noopCallable = () => Promise.reject(new Error('Functions not available'))
    const callables = useMemo(() => {
        if (!functionsInstance) {
            return {
                addAdminRole: noopCallable,
                addAgencyRole: noopCallable,
                backfillAgencyClaims: noopCallable,
                viewRole: noopCallable,
                addUserRole: noopCallable,
                getUserByEmail: noopCallable,
                deleteUser: noopCallable,
                disableUser: noopCallable,
                getUserRecord: noopCallable,
                authGetUserList: noopCallable,
            }
        }
        return {
            addAdminRole: httpsCallable(functionsInstance, 'addAdminRole'),
            addAgencyRole: httpsCallable(functionsInstance, 'addAgencyRole'),
            backfillAgencyClaims: httpsCallable(
                functionsInstance,
                'backfillAgencyClaims',
            ),
            viewRole: httpsCallable(functionsInstance, 'viewRole'),
            addUserRole: httpsCallable(functionsInstance, 'addUserRole'),
            getUserByEmail: httpsCallable(functionsInstance, 'getUserByEmail'),
            deleteUser: httpsCallable(functionsInstance, 'deleteUser'),
            disableUser: httpsCallable(functionsInstance, 'disableUser'),
            getUserRecord: httpsCallable(functionsInstance, 'getUserRecord'),
            authGetUserList: httpsCallable(functionsInstance, 'authGetUserList'),
        }
    }, [functionsInstance])
    /**
     * Fetches a user record from Firebase Auth by UID.
     * 
     * @param {string} uid - The user's unique identifier
     * @returns {Promise<Object>} User record data or disabled status
     * @throws {Error} When the function call fails
     * @example
     * const userRecord = await fetchUserRecord('user123');
     */
    const fetchUserRecord = async (uid) => {
        try {
            const result = await callables.getUserRecord({ uid });
            return result.data;
        } catch (error) {
            console.log(`Error fetching Auth user record uid: ${uid}`, error);
            // User not found or deleted, treat as disabled
            if (error.code === 'functions/not-found') {
                return { disabled: true };
            } else {
                throw error;
            }
        }
    }
  
    /**
     * Sends email verification to the specified user.
     * 
     * @param {Object} user - Firebase user object
     * @returns {Promise<boolean>} True if email verification was sent successfully
     * @throws {Error} When email verification fails
     * @example
     * await verifyEmail(currentUser);
     */
    const verifyEmail = (user) => {
        return new Promise((resolve, reject) => {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://truthsleuthlocal.netlify.app';
            const actionCodeSettings = {
                'url': `${baseUrl}/login`,
                'handleCodeInApp': true,
            };

            sendEmailVerification(user, actionCodeSettings)
                .then(() => {
                    resolve(true); // Email sent successfully
                })
                .catch((error) => {
                    reject(error); // Email sending failed
                });
        });
    }

    /**
     * Creates a new user account with email verification.
     * 
     * @param {string} name - User's display name
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @param {string} state - User's state
     * @param {string} city - User's city
     * @returns {Promise<Object>} User credential object
     * @throws {Error} When user creation or email verification fails
     * @example
     * const userCredential = await signup('John Doe', 'john@example.com', 'password123', 'Texas', 'Austin');
     */
    const signup = (name, email, password, state, city) => {
        return new Promise((resolve, reject) => {
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Perform email verification after user creation
                    verifyEmail(userCredential.user)
                        .then((verified) => {
                            if (verified) {
                                console.log("Email verification sent successfully")
                                resolve(userCredential)
                            } else {
                                reject(new Error("Email verification failed"))
                            }
                        })
                        .catch((error) => {
                            reject(error)
                        })
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    /**
     * Signs in a user with email and password.
     * 
     * @param {string} email - User's email address
     * @param {string} password - User's password
     * @returns {Promise<Object>} User credential object
     * @throws {Error} When authentication fails
     * @example
     * const userCredential = await login('user@example.com', 'password123');
     */
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    }

    /**
     * Signs out the current user and clears local state.
     * 
     * @returns {Promise<void>} Resolves when sign out is complete
     * @example
     * await logout();
     */
    const logout = async () => {
        setUser(null)
        return signOut(auth);
    }

    /**
     * Force-refreshes the ID token and syncs customClaims (including agencyId).
     * Use when agency is true but agencyId is still missing after login/promotion.
     *
     * @returns {Promise<{admin: boolean, agency: boolean, agencyId: string|null, agencyName: string|null}>}
     */
    const refreshCustomClaims = useCallback(async () => {
        if (!auth.currentUser) {
            const cleared = normalizeCustomClaims(null)
            setCustomClaims(cleared)
            return cleared
        }
        const idTokenResult = await auth.currentUser.getIdTokenResult(true)
        const next = normalizeCustomClaims(idTokenResult.claims)
        setCustomClaims(next)
        return next
    }, [])

    /**
     * Verifies the current user's role claims.
     * 
     * @returns {Promise<Object>} User's custom claims
     * @throws {Error} When token verification fails
     * @example
     * const claims = await verifyRole();
     */
    const verifyRole = useCallback(async () => {
        try {
            const idTokenResult = await auth.currentUser.getIdTokenResult()
            return idTokenResult.claims
        } catch (error) {
            console.log("Error verifying role:", error)
            throw error;
        }
    }, [])
    
    /**
     * Sends a password reset email to the specified address.
     * 
     * @param {string} email - Email address to send reset link to
     * @returns {Promise<void>} Resolves when email is sent
     * @throws {Error} When email sending fails
     * @example
     * await resetPassword('user@example.com');
     */
    const resetPassword = (email) => {
        return sendPasswordResetEmail(auth, email)
    }

    /**
     * Deletes a user account.
     * 
     * @param {Object} user - Firebase user object to delete
     * @returns {Promise<void>} Resolves when user is deleted
     * @throws {Error} When user deletion fails
     * @example
     * await deleteAdminUser(currentUser);
     */
    const deleteAdminUser = (user) => {
        return callables.deleteUser({ uid: user.uid })
    }

    /**
     * Disables a user account via Cloud Function.
     * 
     * @param {string} userId - The user ID to disable
     * @returns {Promise<Object>} Result of the disable operation
     * @throws {Error} When user disabling fails
     * @example
     * const result = await disableUserFunction('user123');
     */
    const disableUserFunction = async (userId) => {
        try {
            const result = await callables.disableUser({ uid: userId });
            console.log('User disabled:', result.data.message);
            return result.data;
        } catch (error) {
            console.error('Error disabling user:', error);
            throw error;
        }
    }

    /**
     * Updates the current user's password.
     * 
     * @param {Object} auth - Firebase auth instance
     * @param {string} currentPassword - Current password for reauthentication
     * @param {string} newPassword - New password to set
     * @returns {Promise<void>} Resolves when password is updated
     * @throws {Error} When password update fails
     * @example
     * await updateUserPassword(auth, 'oldpass', 'newpass');
     */
    const updateUserPassword = (auth, currentPassword, newPassword) => {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        return new Promise((resolve, reject) => {
            reauthenticateWithCredential(auth.currentUser, credential).then(() => {
                resolve(updatePassword(auth.currentUser, newPassword))
            }).catch((error) => {
                reject(error)
            })
        })
    }

    /**
     * Updates the current user's email address.
     * 
     * @param {Object} auth - Firebase auth instance
     * @param {string} currentPassword - Current password for reauthentication
     * @param {string} newEmail - New email address
     * @returns {Promise<void>} Resolves when email is updated
     * @throws {Error} When email update fails
     * @example
     * await updateUserEmail(auth, 'password', 'newemail@example.com');
     */
    const updateUserEmail = (auth, currentPassword, newEmail) => {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        return new Promise((resolve, reject) => {
            reauthenticateWithCredential(auth.currentUser, credential).then(() => {
                resolve(updateEmail(auth.currentUser, newEmail))
            }).catch((error) => {
                reject(error)
            })
        })
    }

    /**
     * Sets a new password for the current user.
     * 
     * @param {string} newPassword - New password to set
     * @returns {Promise<void>} Resolves when password is set
     * @throws {Error} When password setting fails
     * @example
     * await setPassword('newpassword123');
     */
    const setPassword = async (newPassword) => {
        try {
            await updatePassword(auth.currentUser, newPassword);
            auth.currentUser.getIdToken(true)
            console.log("Password updated successfully")
        } catch (err) {
            console.log("Error setting password:", err)
            throw err;
        }
    }
    
    /**
     * Sends a sign-in link to the specified email address.
     * 
     * @param {string} email - Email address to send sign-in link to
     * @returns {Promise<void>} Resolves when email is sent
     * @throws {Error} When email sending fails
     * @example
     * await sendSignIn('user@example.com');
     */
    const sendSignIn = async (email) => {
        // Continue URL for email action links: current origin in browser, else configured app URL
        const origin =
            typeof window !== 'undefined' && window.location?.origin
                ? window.location.origin
                : (process.env.NEXT_PUBLIC_APP_URL || 'https://truthsleuthlocal.netlify.app')
        const baseUrl = `${origin.replace(/\/$/, '')}/signup`

        const actionCodeSettings = {
            url: baseUrl,
            handleCodeInApp: true,
        }
        
        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings)
            // Save the email locally for later use
            window.localStorage.setItem('emailForSignIn', email)
            console.log("Sign-in link sent to:", email);
        } catch (error) {
            const errorMessage = error.message
            console.error("Error sending sign-in link:", errorMessage);
            throw error;
        }
    }
 
    return (
        <AuthContext.Provider value={{
            user,
            loading,
            claimsReady,
            customClaims,
            setCustomClaims,
            functionsReady: !!functionsInstance,
            login,
            signup,
            logout,
            resetPassword,
            deleteAdminUser,
            updateUserPassword,
            updateUserEmail,
            setPassword,
            verifyEmail,
            sendSignIn,
            addAdminRole: callables.addAdminRole,
            addAgencyRole: callables.addAgencyRole,
            backfillAgencyClaims: callables.backfillAgencyClaims,
            verifyRole,
            refreshCustomClaims,
            viewRole: callables.viewRole,
            addUserRole: callables.addUserRole,
            getUserByEmail: callables.getUserByEmail,
            deleteUser: callables.deleteUser,
            disableUser: disableUserFunction,
            fetchUserRecord,
            getUserRecord: callables.getUserRecord,
            authGetUserList: callables.authGetUserList,
        }}>
            {loading ? (
                <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#D3D3D3] gap-3">
                    <LoadingSpinner className="h-12 w-12 text-[#2E3B4E]" />
                    <p className="text-sm text-gray-600">Loading…</p>
                </div>
            ) : children}
        </AuthContext.Provider>
    )
}