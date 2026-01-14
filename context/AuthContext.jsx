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

import { createContext, useContext, useEffect, useState } from 'react'
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

import {
  httpsCallable,
} from "firebase/functions";
import { auth, app, db, functions } from '../config/firebase'
import { getDoc, doc, setDoc } from "firebase/firestore";
import moment from 'moment'

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
    const [userRole, setUserRole] = useState('user')
    const [customClaims, setCustomClaims] = useState({agency: false, admin: false})

    /**
     * Effect hook to monitor authentication state changes.
     * 
     * This effect sets up a listener for Firebase authentication state changes.
     * When a user signs in, it fetches their location data, sets up user state,
     * and verifies their custom claims for role-based access control.
     */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch location data for user identification
                const ref = await getDoc(doc(db, "locations", "Texas"))
                const localId = ref.data()['Austin']
                
                setUser({
                    uid: localId, // Local identifier for user tracking
                    accountId: user.uid,
                    displayName: user.displayName,
                    email: user.email
                })
                localStorage.setItem("userId", localId)
                
                // Verify user's custom claims for role-based access
                user.getIdTokenResult(true)
                    .then((idTokenResult) => {
                        // Set custom claims based on user's role
                        if (!!idTokenResult.claims.admin) {
                            setCustomClaims({admin: true})
                        } else if (!!idTokenResult.claims.agency) {
                            setCustomClaims({agency: true})
                        } else {
                            setCustomClaims({agency: false, admin: false})
                        }
                    })
                    .catch((error) => {
                        console.log("Error fetching custom claims:", error);
                    });
              
            } else {
                // Clear user state when signed out
                setUser(null)
                setCustomClaims({agency: false, admin: false})
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Firebase Cloud Functions for user management
    const addAdminRole = httpsCallable(functions,'addAdminRole')
    const addAgencyRole = httpsCallable(functions, 'addAgencyRole')
    const viewRole = httpsCallable(functions, 'viewRole')
    const addUserRole = httpsCallable(functions, 'addUserRole')
    const getUserByEmail = httpsCallable(functions,'getUserByEmail')
    const deleteUser = httpsCallable(functions,'deleteUser')
    const disableUser = httpsCallable(functions,'disableUser')
    const getUserRecord = httpsCallable(functions, 'getUserRecord');
    const authGetUserList = httpsCallable(functions, 'authGetUserList')
  
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
            const result = await getUserRecord({ uid });
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
            const actionCodeSettings = {
                'url': 'https://truthsleuthlocal.netlify.app/login',
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
     * Verifies the current user's role claims.
     * 
     * @returns {Promise<Object>} User's custom claims
     * @throws {Error} When token verification fails
     * @example
     * const claims = await verifyRole();
     */
    const verifyRole = async () => {
        try {
            const idTokenResult = await auth.currentUser.getIdTokenResult()
            return idTokenResult.claims
        } catch (error) {
            console.log("Error verifying role:", error)
            throw error;
        }
    }
    
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
        return deleteUser(user)
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
            const result = await disableUser({ uid: userId });
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
        // Determine the base URL based on the environment
        const isLocalhost = window.location.hostname === 'localhost'
        const baseUrl = isLocalhost
            ? 'http://localhost:3000/signup'
            : 'https://truthsleuthlocal.netlify.app/signup'

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
            customClaims, 
            setCustomClaims, 
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
            addAdminRole, 
            addAgencyRole, 
            verifyRole, 
            viewRole, 
            addUserRole, 
            getUserByEmail, 
            deleteUser, 
            disableUser: disableUserFunction, 
            fetchUserRecord, 
            getUserRecord, 
            authGetUserList 
        }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}